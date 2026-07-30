import React, { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Badge,
  Spinner,
  UncontrolledTooltip,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { useWarehouseSummaryReport } from "../../Components/Hooks/useReports";
import { useCoolers } from "../../Components/Hooks/useCoolers";
import { WarehouseSummaryItem } from "../../types/reports";

const WarehouseSummaryReport: React.FC = () => {
  document.title = "Warehouse Summary Report | Velzon - Admin & Dashboard";

  // State
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Hooks
  const { data: coolersData, isLoading: isLoadingCoolers } = useCoolers(true);
  const {
    data: summaryData,
    isLoading: isLoadingReport,
    isError,
    refetch,
  } = useWarehouseSummaryReport(
    selectedWarehouseId ? { warehouse_id: selectedWarehouseId } : undefined
  );

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num)
      ? "ksh 0.00"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "Ksh",
        }).format(num);
  };

  const formatNumber = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num) ? "0" : new Intl.NumberFormat("en-US").format(num);
  };

  const getBadgeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "MAIN_STORE":
      case "MAIN":
        return "success";
      case "COOLER":
        return "info";
      case "IN_TRANSIT":
      case "TRANSIT":
        return "warning";
      default:
        return "primary";
    }
  };

  // Filter dataset by search input
  const filteredDataset = useMemo(() => {
    if (!summaryData?.dataset) return [];
    return summaryData.dataset.filter((item: WarehouseSummaryItem) => {
      const matchCode = item.warehouse_code
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchName = item.warehouse_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchType = item.warehouse_type
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchCode || matchName || matchType;
    });
  }, [summaryData, searchTerm]);

  const metrics = useMemo(() => {
    if (!summaryData?.dataset) {
      return { totalValuation: 0, totalUnits: 0, totalWarehouses: 0, totalSKUs: 0 };
    }
    return summaryData.dataset.reduce(
      (acc, curr) => {
        acc.totalValuation += parseFloat(curr.total_value_balance || "0");
        acc.totalUnits += parseFloat(curr.total_physical_units || "0");
        acc.totalSKUs += curr.distinct_skus || 0;
        acc.totalWarehouses += 1;
        return acc;
      },
      { totalValuation: 0, totalUnits: 0, totalWarehouses: 0, totalSKUs: 0 }
    );
  }, [summaryData]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Warehouse Summary" pageTitle="Reports" />

          <Row>
            <Col xl={3} md={6}>
              <Card className="card-animate border-start border-start-4 border-primary">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                      <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                        Total Valuation
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-end justify-content-between mt-3">
                    <div>
                      <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                        {formatCurrency(metrics.totalValuation.toString())}
                      </h4>
                      <span className="badge bg-soft-success text-success mb-0">
                        Asset Valuation
                      </span>
                    </div>
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-soft-light text-success rounded fs-3">
                        <i className="ri-money-dollar-circle-line"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="card-animate border-start border-start-4 border-success">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                      <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                        Physical Stock Units
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-end justify-content-between mt-3">
                    <div>
                      <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                        {formatNumber(metrics.totalUnits.toString())}
                      </h4>
                      <span className="badge bg-soft-info text-info mb-0">
                        Across All Locations
                      </span>
                    </div>
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-soft-success text-success rounded fs-3">
                        <i className="ri-inbox-archive-line"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="card-animate border-start border-start-4 border-info">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                      <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                        Active Locations
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-end justify-content-between mt-3">
                    <div>
                      <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                        {metrics.totalWarehouses}
                      </h4>
                      <span className="badge bg-soft-warning text-warning mb-0">
                        Tracked Sites
                      </span>
                    </div>
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-soft-info text-info rounded fs-3">
                        <i className="ri-building-line"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="card-animate border-start border-start-4 border-warning">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                      <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                        Total Distinct SKUs
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-end justify-content-between mt-3">
                    <div>
                      <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                        {metrics.totalSKUs}
                      </h4>
                      <span className="badge bg-soft-primary text-primary mb-0">
                        Product Lines
                      </span>
                    </div>
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-soft-warning text-warning rounded fs-3">
                        <i className="ri-product-hunt-line"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Main Content Table Card */}
          <Row>
            <Col lg={12}>
              <Card id="warehouseSummaryCard">
                <CardHeader className="border-0">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <h5 className="card-title mb-0">
                        Location Base Capital Balance Sheet
                      </h5>
                      <p className="text-muted mb-0 fs-12">
                        {summaryData?.description ||
                          "Real-time summary of physical asset valuations across facilities."}
                      </p>
                    </div>

                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      {/* Search Bar */}
                      <div className="search-box">
                        <input
                          type="text"
                          className="form-control search"
                          placeholder="Search warehouse..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="ri-search-line search-icon"></i>
                      </div>

                      {/* Warehouse Selector Filter */}
                      <div style={{ minWidth: "200px" }}>
                        <select
                          className="form-select"
                          value={selectedWarehouseId}
                          onChange={(e) => setSelectedWarehouseId(e.target.value)}
                          disabled={isLoadingCoolers}
                        >
                          <option value="">All Locations</option>
                          {coolersData?.warehouses.map ((cooler: any) => (
                            <option key={cooler.id} value={cooler.id}>
                              {cooler.name || cooler.code}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Refresh Button */}
                      <button
                        type="button"
                        className="btn btn-soft-secondary btn-icon waves-effect waves-light"
                        onClick={() => refetch()}
                        id="btn-refresh-report"
                      >
                        <i className="ri-refresh-line"></i>
                      </button>
                      <UncontrolledTooltip target="btn-refresh-report">
                        Refresh Dataset
                      </UncontrolledTooltip>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="pt-0">
                  {isLoadingReport ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2 text-muted">Loading warehouse valuation data...</p>
                    </div>
                  ) : isError ? (
                    <div className="text-center py-5 text-danger">
                      <i className="ri-error-warning-line display-5"></i>
                      <h5 className="mt-2">Failed to load report</h5>
                      <p className="text-muted">
                        An error occurred while communicating with the reporting API.
                      </p>
                      <button className="btn btn-primary btn-sm" onClick={() => refetch()}>
                        Retry
                      </button>
                    </div>
                  ) : filteredDataset.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="ri-inbox-archive-line display-5 text-muted"></i>
                      <h5 className="mt-2">No Records Found</h5>
                      <p className="text-muted">
                        No warehouse data matches the selected criteria.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive table-card mb-1">
                      <Table className="align-middle table-nowrap" id="warehouseTable">
                        <thead className="table-light text-muted">
                          <tr>
                            <th>Location Code</th>
                            <th>Warehouse Name</th>
                            <th>Type</th>
                            <th className="text-start">Distinct SKUs</th>
                            <th className="text-start">Total Units On Hand</th>
                            <th className="text-start">Total Asset Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDataset.map((row: WarehouseSummaryItem, index: number) => (
                            <tr key={row.warehouse_code || index}>
                              <td>
                                <span className="fw-semibold text-primary">
                                  {row.warehouse_code}
                                </span>
                              </td>
                              <td className="fw-medium">{row.warehouse_name}</td>
                              <td>
                                <Badge color={getBadgeColor(row.warehouse_type)} className="text-uppercase">
                                  {row.warehouse_type}
                                </Badge>
                              </td>
                              <td className="text-start">
                                <span className="badge bg-soft-secondary text-dark">
                                  {row.distinct_skus} SKUs
                                </span>
                              </td>
                              <td className="text-start fw-medium">
                                {formatNumber(row.total_physical_units)}
                              </td>
                              <td className="text-start fw-bold text-success">
                                {formatCurrency(row.total_value_balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light fw-bold">
                          <tr>
                            <td colSpan={3}>Summary Total</td>
                            <td className="text-start ">{metrics.totalSKUs} SKUs</td>
                            <td className="text-start">{formatNumber(metrics.totalUnits.toString())}</td>
                            <td className="text-start text-success">
                              {formatCurrency(metrics.totalValuation.toString())}
                            </td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  )}

                  {summaryData?.generated_at && (
                    <div className="d-flex justify-content-between align-items-center mt-3 text-muted fs-12">
                      <div>
                        Generated At:{" "}
                        <span className="fw-semibold">
                          {new Date(summaryData.generated_at).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        Showing <b>{filteredDataset.length}</b> entries
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default WarehouseSummaryReport;