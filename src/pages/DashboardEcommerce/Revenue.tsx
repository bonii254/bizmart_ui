import React, { useState, useMemo, useEffect } from "react";
import { Card, CardBody, CardHeader, Col, Row, Spinner } from "reactstrap";
import CountUp from "react-countup";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { useSalesGrossProfitReport } from "../../Components/Hooks/useReports";
import { SalesGrossProfitItem } from "../../types/reports";

type PeriodType = "month" | "halfyear" | "year" | "all";

const roundToTwoDecimals = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

const Revenue: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("all");

  // Force ApexCharts to recalculate dimensions on resize / breakpoint transition
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);
    return () => clearTimeout(timer);
  }, [period]);

  const { queryParams, startMonth, endMonth } = useMemo(() => {
    const now = dayjs();

    if (period === "month") {
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

    return {
      queryParams: { fromDate: "", toDate: "" },
      startMonth: null,
      endMonth: null,
    };
  }, [period]);

  const { data, isLoading, isError } = useSalesGrossProfitReport(queryParams);

  const reportItems = useMemo<SalesGrossProfitItem[]>(() => {
    if (Array.isArray(data)) return data;
    const raw = data as any;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }, [data]);

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

  const grossMarginPercent = useMemo(() => {
    if (totals.totalSales === 0) return 0.0;
    return roundToTwoDecimals((totals.totalProfit / totals.totalSales) * 100);
  }, [totals]);

  const { chartSeries, categories } = useMemo(() => {
    const monthlyAggregates: Record<
      string,
      { sales: number; cost: number; profit: number }
    > = {};

    let actualStartMonth = startMonth;
    let actualEndMonth = endMonth;

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

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      height: 320,
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
        columnWidth: "40%",
        borderRadius: 4,
      },
    },
    fill: {
      opacity: [0.85, 0.85, 1],
    },
    colors: ["#3577f1", "#f06548", "#0ab39c"],
    labels: categories,
    xaxis: {
      type: "category",
      categories: categories,
      labels: { style: { colors: "#878a99", fontSize: "11px" } },
    },
    yaxis: {
      labels: {
        formatter: (val?: number) => {
          if (val === undefined || val === null || isNaN(val)) return "0.00";
          return val.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });
        },
        style: { colors: "#878a99", fontSize: "11px" },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val?: number) => {
          if (val === undefined || val === null || isNaN(val)) return "Ksh 0.00";
          return `Ksh ${val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
    },
    grid: {
      borderColor: "#f1f1f1",
      padding: { left: 10, right: 10 },
    },
  };

  return (
    <Card className="card-height-100 border-0 shadow-sm d-flex flex-column mb-0 w-100">
      <CardHeader className="border-0 align-items-center d-flex flex-wrap gap-2 py-3">
        <h4 className="card-title mb-0 flex-grow-1 text-truncate fs-15 fw-semibold">
          Sales & Gross Profit Analysis
        </h4>
        <div className="d-flex gap-1 flex-wrap">
          <button
            type="button"
            className={`btn btn-xs px-2 py-1 ${
              period === "all" ? "btn-primary" : "btn-soft-secondary text-dark"
            }`}
            onClick={() => setPeriod("all")}
          >
            ALL
          </button>
          <button
            type="button"
            className={`btn btn-xs px-2 py-1 ${
              period === "month" ? "btn-primary" : "btn-soft-secondary text-dark"
            }`}
            onClick={() => setPeriod("month")}
          >
            1M
          </button>
          <button
            type="button"
            className={`btn btn-xs px-2 py-1 ${
              period === "halfyear" ? "btn-primary" : "btn-soft-secondary text-dark"
            }`}
            onClick={() => setPeriod("halfyear")}
          >
            6M
          </button>
          <button
            type="button"
            className={`btn btn-xs px-2 py-1 ${
              period === "year" ? "btn-primary" : "btn-soft-secondary text-dark"
            }`}
            onClick={() => setPeriod("year")}
          >
            1Y
          </button>
        </div>
      </CardHeader>

      <CardHeader className="p-0 border-0 bg-light-subtle">
        <Row className="g-0 text-center">
          <Col xs={6} sm={3}>
            <div className="p-2 p-sm-3 border border-dashed border-start-0 border-top-0">
              <h5 className="mb-1 text-primary text-truncate fs-14 fs-sm-15">
                Ksh{" "}
                <CountUp
                  start={0}
                  end={totals.totalSales}
                  decimals={2}
                  separator=","
                  duration={1.2}
                />
              </h5>
              <p className="text-muted mb-0 text-truncate fs-11">Total Sales</p>
            </div>
          </Col>
          <Col xs={6} sm={3}>
            <div className="p-2 p-sm-3 border border-dashed border-start-0 border-top-0">
              <h5 className="mb-1 text-danger text-truncate fs-14 fs-sm-15">
                Ksh{" "}
                <CountUp
                  start={0}
                  end={totals.totalCost}
                  decimals={2}
                  separator=","
                  duration={1.2}
                />
              </h5>
              <p className="text-muted mb-0 text-truncate fs-11">Total Cost</p>
            </div>
          </Col>
          <Col xs={6} sm={3}>
            <div className="p-2 p-sm-3 border border-dashed border-start-0 border-top-0">
              <h5 className="mb-1 text-success text-truncate fs-14 fs-sm-15">
                Ksh{" "}
                <CountUp
                  start={0}
                  end={totals.totalProfit}
                  decimals={2}
                  separator=","
                  duration={1.2}
                />
              </h5>
              <p className="text-muted mb-0 text-truncate fs-11">Gross Profit</p>
            </div>
          </Col>
          <Col xs={6} sm={3}>
            <div className="p-2 p-sm-3 border border-dashed border-start-0 border-end-0 border-top-0">
              <h5 className="mb-1 text-info text-truncate fs-14 fs-sm-15">
                <CountUp
                  start={0}
                  end={grossMarginPercent}
                  decimals={2}
                  duration={1.2}
                  suffix="%"
                />
              </h5>
              <p className="text-muted mb-0 text-truncate fs-11">Gross Margin %</p>
            </div>
          </Col>
        </Row>
      </CardHeader>

      <CardBody className="p-0 pb-2 flex-grow-1 d-flex align-items-center position-relative min-w-0">
        {isLoading ? (
          <div
            className="d-flex justify-content-center align-items-center w-100"
            style={{ height: "310px" }}
          >
            <Spinner color="primary" />
          </div>
        ) : isError ? (
          <div className="text-center text-danger p-4 w-100">
            Failed to load sales report data.
          </div>
        ) : (
          <div className="w-100 overflow-hidden dir-ltr position-relative" style={{ minWidth: 0 }}>
            <Chart
              options={chartOptions}
              series={chartSeries}
              type="line"
              height={310}
              width="100%"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default Revenue;