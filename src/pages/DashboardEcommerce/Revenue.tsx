import React, { useState, useMemo, useEffect } from "react";
import { Card, CardBody, CardHeader, Col, Row, Spinner } from "reactstrap";
import CountUp from "react-countup";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { useSalesGrossProfitReport } from "../../Components/Hooks/useReports";
import {
  SalesGrossProfitItem,
  SalesGrossProfitQueryParams,
} from "../../types/reports";

type PeriodType = "month" | "halfyear" | "year" | "all";

// Helper utility to enforce exactly 2 decimal places in financial calculations
const roundToTwoDecimals = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

const Revenue: React.FC = () => {
  // 1. Default period set to "all"
  const [period, setPeriod] = useState<PeriodType>("all");

  // 2. Force ApexCharts to recalculate dimensions after DOM layout settles
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 3. Compute dynamic period date boundaries
  const { queryParams, startMonth, endMonth } = useMemo(() => {
    const now = dayjs();

    if (period === "month") {
      // 1M: Strictly current month
      const start = now.startOf("month");
      const end = now.endOf("month");
      return {
        queryParams: {
          fromDate: start.format("YYYY-MM-DD"),
          toDate: end.format("YYYY-MM-DD"),
        },
        startMonth: start,
        endMonth: start,
      };
    }

    if (period === "halfyear") {
      // 6M: Last 6 months ending in current month
      const start = now.subtract(5, "month").startOf("month");
      const end = now.endOf("month");
      return {
        queryParams: {
          fromDate: start.format("YYYY-MM-DD"),
          toDate: end.format("YYYY-MM-DD"),
        },
        startMonth: start,
        endMonth: now.startOf("month"),
      };
    }

    if (period === "year") {
      // 1Y: Rolling 12 months
      const start = now.subtract(11, "month").startOf("month");
      const end = now.endOf("month");
      return {
        queryParams: {
          fromDate: start.format("YYYY-MM-DD"),
          toDate: end.format("YYYY-MM-DD"),
        },
        startMonth: start,
        endMonth: now.startOf("month"),
      };
    }

    // Default "ALL" period fetches full unconstrained dataset range
    return {
      queryParams: { fromDate: "", toDate: "" },
      startMonth: null,
      endMonth: null,
    };
  }, [period]);

  // 4. Fetch report data using custom React Query hook
  const { data, isLoading, isError } = useSalesGrossProfitReport(queryParams);

  // Safely extract report items array across possible response wrappers
  const reportItems = useMemo<SalesGrossProfitItem[]>(() => {
    if (Array.isArray(data)) return data;
    const raw = data as any;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }, [data]);

  // 5. Secondary client-side guard filter for strict range adherence
  const filteredData = useMemo(() => {
    if (!reportItems.length) return [];
    if (period === "all" || !queryParams.fromDate || !queryParams.toDate) {
      return reportItems;
    }

    const start = dayjs(queryParams.fromDate).startOf("day");
    const end = dayjs(queryParams.toDate).endOf("day");

    return reportItems.filter((item: SalesGrossProfitItem) => {
      if (!item.sold_at) return false;
      const soldDate = dayjs(item.sold_at);
      return (
        soldDate.isValid() &&
        (soldDate.isAfter(start) || soldDate.isSame(start)) &&
        (soldDate.isBefore(end) || soldDate.isSame(end))
      );
    });
  }, [reportItems, period, queryParams]);

  // 6. Grand summations for summary KPI cards
  const totals = useMemo(() => {
    const rawTotals = filteredData.reduce(
      (acc, item) => {
        const sales = item.sales_value || 0;
        const cost = item.cost_value || 0;
        const profit = item.gross_profit ?? (sales - cost);

        acc.totalSales += sales;
        acc.totalCost += cost;
        acc.totalProfit += profit;
        return acc;
      },
      { totalSales: 0, totalCost: 0, totalProfit: 0 }
    );

    return {
      totalSales: roundToTwoDecimals(rawTotals.totalSales),
      totalCost: roundToTwoDecimals(rawTotals.totalCost),
      totalProfit: roundToTwoDecimals(rawTotals.totalProfit),
    };
  }, [filteredData]);

  // Overall Gross Margin %
  const grossMarginPercent = useMemo(() => {
    if (totals.totalSales === 0) return 0.0;
    return roundToTwoDecimals((totals.totalProfit / totals.totalSales) * 100);
  }, [totals]);

  // 7. Aggregate transactions into dynamic monthly sequence
  const { chartSeries, categories } = useMemo(() => {
    const monthlyAggregates: Record<
      string,
      { sales: number; cost: number; profit: number }
    > = {};

    let actualStartMonth = startMonth;
    let actualEndMonth = endMonth;

    // Determine boundaries dynamically for "ALL" selection
    if (period === "all" && filteredData.length > 0) {
      let minDate = dayjs(filteredData[0].sold_at);
      let maxDate = dayjs(filteredData[0].sold_at);

      filteredData.forEach((item) => {
        if (!item.sold_at) return;
        const d = dayjs(item.sold_at);
        if (d.isValid()) {
          if (d.isBefore(minDate)) minDate = d;
          if (d.isAfter(maxDate)) maxDate = d;
        }
      });

      actualStartMonth = minDate.startOf("month");
      actualEndMonth = maxDate.startOf("month");
    }

    // Step 7a: Pre-fill zero baselines for all months in the calculated sequence
    if (
      actualStartMonth &&
      actualEndMonth &&
      actualStartMonth.isValid() &&
      actualEndMonth.isValid()
    ) {
      let current = actualStartMonth;
      while (
        current.isBefore(actualEndMonth) ||
        current.isSame(actualEndMonth, "month")
      ) {
        const key = current.format("YYYY-MM");
        monthlyAggregates[key] = { sales: 0, cost: 0, profit: 0 };
        current = current.add(1, "month");
      }
    }

    // Step 7b: Accumulate sales, cost, and profit into corresponding month keys
    filteredData.forEach((item: SalesGrossProfitItem) => {
      if (!item.sold_at) return;
      const date = dayjs(item.sold_at);
      if (!date.isValid()) return;

      const yearMonthKey = date.format("YYYY-MM");

      if (!monthlyAggregates[yearMonthKey]) {
        monthlyAggregates[yearMonthKey] = { sales: 0, cost: 0, profit: 0 };
      }

      const sales = item.sales_value || 0;
      const cost = item.cost_value || 0;
      const profit = item.gross_profit ?? (sales - cost);

      monthlyAggregates[yearMonthKey].sales += sales;
      monthlyAggregates[yearMonthKey].cost += cost;
      monthlyAggregates[yearMonthKey].profit += profit;
    });

    const sortedKeys = Object.keys(monthlyAggregates).sort();

    // Step 7c: Format category labels using explicit "YYYY-MM-01" to avoid timezone date shifts
    const formattedCategories = sortedKeys.map((key) =>
      dayjs(`${key}-01`).format("MMM YY")
    );

    const salesData = sortedKeys.map((k) =>
      roundToTwoDecimals(monthlyAggregates[k].sales)
    );
    const costData = sortedKeys.map((k) =>
      roundToTwoDecimals(monthlyAggregates[k].cost)
    );
    const profitData = sortedKeys.map((k) =>
      roundToTwoDecimals(monthlyAggregates[k].profit)
    );

    return {
      categories: formattedCategories,
      chartSeries: [
        {
          name: "Sales Value",
          type: "column",
          data: salesData,
        },
        {
          name: "Cost Value",
          type: "column",
          data: costData,
        },
        {
          name: "Gross Profit",
          type: "line",
          data: profitData,
        },
      ],
    };
  }, [filteredData, period, startMonth, endMonth]);

  // 8. ApexCharts options with defensive null/undefined formatters
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      height: 350,
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
      redrawOnParentResize: true,
    },
    stroke: {
      width: [0, 0, 3],
      curve: "smooth",
    },
    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 4,
      },
    },
    fill: {
      opacity: [0.85, 0.85, 1],
    },
    colors: ["#3b82f6", "#ef4444", "#10b981"],
    labels: categories,
    xaxis: {
      type: "category",
      categories: categories,
      labels: {
        style: { colors: "#878a99" },
      },
    },
    yaxis: {
      labels: {
        formatter: (val?: number) => {
          if (val === undefined || val === null || isNaN(val)) return "0.00";
          return val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
        style: { colors: "#878a99" },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val?: number) => {
          if (val === undefined || val === null || isNaN(val)) return "Kes 0.00";
          return `Kes ${val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
    grid: {
      borderColor: "#f1f1f1",
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          legend: {
            position: "bottom",
            horizontalAlign: "center",
          },
        },
      },
    ],
  };

  return (
    <React.Fragment>
      <Card className="card-height-100 overflow-hidden mb-0">
        {/* Card Header & Period Filter Actions */}
        <CardHeader className="border-0 align-items-center d-flex flex-wrap gap-2">
          <h4 className="card-title mb-0 flex-grow-1 text-truncate">
            Sales & Gross Profit Analysis
          </h4>
          <div className="d-flex gap-1 flex-wrap">
            <button
              type="button"
              className={`btn btn-sm ${
                period === "all" ? "btn-primary" : "btn-soft-secondary"
              }`}
              onClick={() => setPeriod("all")}
            >
              ALL
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                period === "month" ? "btn-primary" : "btn-soft-secondary"
              }`}
              onClick={() => setPeriod("month")}
            >
              1M
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                period === "halfyear" ? "btn-primary" : "btn-soft-secondary"
              }`}
              onClick={() => setPeriod("halfyear")}
            >
              6M
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                period === "year" ? "btn-primary" : "btn-soft-secondary"
              }`}
              onClick={() => setPeriod("year")}
            >
              1Y
            </button>
          </div>
        </CardHeader>

        {/* Header Summary KPI Badges */}
        <CardHeader className="p-0 border-0 bg-light-subtle">
          <Row className="g-0 text-center">
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1 text-primary text-truncate">
                  Kes{" "}
                  <CountUp
                    start={0}
                    end={totals.totalSales}
                    decimals={2}
                    decimal="."
                    separator=","
                    duration={1.2}
                  />
                </h5>
                <p className="text-muted mb-0 text-truncate">Total Sales</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1 text-danger text-truncate">
                  Kes{" "}
                  <CountUp
                    start={0}
                    end={totals.totalCost}
                    decimals={2}
                    decimal="."
                    separator=","
                    duration={1.2}
                  />
                </h5>
                <p className="text-muted mb-0 text-truncate">Total Cost</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1 text-success text-truncate">
                  Kes{" "}
                  <CountUp
                    start={0}
                    end={totals.totalProfit}
                    decimals={2}
                    decimal="."
                    separator=","
                    duration={1.2}
                  />
                </h5>
                <p className="text-muted mb-0 text-truncate">Gross Profit</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0 border-end-0">
                <h5 className="mb-1 text-info text-truncate">
                  <CountUp
                    start={0}
                    end={grossMarginPercent}
                    decimals={2}
                    decimal="."
                    duration={1.2}
                    suffix="%"
                  />
                </h5>
                <p className="text-muted mb-0 text-truncate">Gross Margin %</p>
              </div>
            </Col>
          </Row>
        </CardHeader>

        {/* Chart Canvas Area */}
        <CardBody className="p-0 pb-2 overflow-hidden">
          {isLoading ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "350px" }}
            >
              <Spinner color="primary" />
            </div>
          ) : isError ? (
            <div className="text-center text-danger p-4">
              Failed to load sales report data.
            </div>
          ) : (
            <div
              className="w-100 overflow-hidden dir-ltr"
              style={{ minHeight: "350px", minWidth: 0, position: "relative" }}
            >
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="line"
                height={350}
                width="100%"
              />
            </div>
          )}
        </CardBody>
      </Card>
    </React.Fragment>
  );
};

export default Revenue;