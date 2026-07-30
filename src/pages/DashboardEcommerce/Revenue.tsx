import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { RevenueCharts } from "./DashboardEcommerceCharts";
import CountUp from "react-countup";

const PayrollRevenue = () => {
  // 1. Master Data (12 Full Months)
  const masterData = {
    gross: [45, 52, 49, 60, 55, 65, 58, 62, 70, 68, 72, 80],
    net: [32, 38, 35, 45, 40, 48, 42, 46, 52, 50, 54, 60],
    deductions: [13, 14, 14, 15, 15, 17, 16, 16, 18, 18, 18, 20],
  };

  const [chartSeries, setChartSeries] = useState<any>([]);
  const [period, setPeriod] = useState("year"); // Default to 1Y

  // 2. Logic to filter data based on period
  useEffect(() => {
    let filterCount = 12; // Default for 'all' and 'year'
    
    if (period === "month") filterCount = 1;
    if (period === "halfyear") filterCount = 6;

    // Slice the last N months from the master data
    setChartSeries([
      {
        name: "Total Gross Pay",
        type: "column",
        data: masterData.gross.slice(-filterCount),
      },
      {
        name: "Net Disbursement",
        type: "column",
        data: masterData.net.slice(-filterCount),
      },
      {
        name: "Statutory Deductions",
        type: "line",
        data: masterData.deductions.slice(-filterCount),
      },
    ]);
  }, [period]);

  return (
    <React.Fragment>
      <Card>
        <CardHeader className="border-0 align-items-center d-flex">
          <h4 className="card-title mb-0 flex-grow-1">Payroll Expenditure Analysis</h4>
          <div className="d-flex gap-1">
            <button 
                type="button" 
                className={`btn btn-sm ${period === "all" ? "btn-primary" : "btn-soft-secondary"}`} 
                onClick={() => setPeriod("all")}
            >ALL</button>
            <button 
                type="button" 
                className={`btn btn-sm ${period === "month" ? "btn-primary" : "btn-soft-secondary"}`} 
                onClick={() => setPeriod("month")}
            >1M</button>
            <button 
                type="button" 
                className={`btn btn-sm ${period === "halfyear" ? "btn-primary" : "btn-soft-secondary"}`} 
                onClick={() => setPeriod("halfyear")}
            >6M</button>
            <button 
                type="button" 
                className={`btn btn-sm ${period === "year" ? "btn-primary" : "btn-soft-secondary"}`} 
                onClick={() => setPeriod("year")}
            >1Y</button>
          </div>
        </CardHeader>

        <CardHeader className="p-0 border-0 bg-light-subtle">
          <Row className="g-0 text-center">
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1 text-primary">
                  Kes <CountUp start={0} end={8.52} decimals={2} suffix="M" duration={2} />
                </h5>
                <p className="text-muted mb-0">Total Gross Pay</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1 text-success">
                  Kes <CountUp start={0} end={6.14} decimals={2} suffix="M" duration={2} />
                </h5>
                <p className="text-muted mb-0">Net Disbursement</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1 text-danger">
                  Kes <CountUp start={0} end={2.38} decimals={2} suffix="M" duration={2} />
                </h5>
                <p className="text-muted mb-0">Statutory Deductions</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0 border-end-0">
                <h5 className="mb-1 text-info">
                  <CountUp start={0} end={12.5} decimals={1} duration={2} suffix="%" />
                </h5>
                <p className="text-muted mb-0">Employer Liabilities</p>
              </div>
            </Col>
          </Row>
        </CardHeader>

        <CardBody className="p-0 pb-2">
          <div className="w-100">
            <div dir="ltr">
              <RevenueCharts
                series={chartSeries}
                dataColors='["--vz-primary", "--vz-success", "--vz-danger"]'
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </React.Fragment>
  );
};

export default PayrollRevenue;