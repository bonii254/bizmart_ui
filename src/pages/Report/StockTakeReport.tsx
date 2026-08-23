import React, { useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Table,
  Badge,
  Button,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Pagination,
  PaginationItem,
  PaginationLink,
} from "reactstrap";

import { useStockTakeTransactions } from "../../Components/Hooks/useReports";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { useOperators } from "../../Components/Hooks/useUsers";

import {
  StockTakeBrowseQueryParams,
  StockTakeTransaction,
} from "../../types/reports";

// Currency Formatter Utility
const formatCurrency = (amount: number): string => {
  return `KES ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Explicit Accumulator Interface for Type Safety
interface StockTakeMetrics {
  totalLines: number;
  totalSystemQty: number;
  totalCountedQty: number;
  netVarianceQty: number;
  netVarianceValue: number;
}

const StockTakeReport: React.FC = () => {
  document.title = "Stock Take Audit & Discrepancy Report | Enterprise ERP";

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [operatorFilter, setOperatorFilter] = useState<string>("");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [selectedRecord, setSelectedRecord] = useState<StockTakeTransaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Fetch Dropdown Lookup Data
  const { data: warehousesData, isLoading: isWarehousesLoading } = useWarehouses();
  const { data: operatorsResponse, isLoading: isOperatorsLoading } = useOperators();

  const warehouseOptions = useMemo(() => {
    if (!warehousesData) return [];
    if (Array.isArray(warehousesData)) return warehousesData;
    if (Array.isArray((warehousesData as any)?.data)) return (warehousesData as any).data;
    return [];
  }, [warehousesData]);

  const operatorOptions = useMemo(() => {
    if (!operatorsResponse) return [];
    if (Array.isArray((operatorsResponse as any)?.data)) return (operatorsResponse as any).data;
    if (Array.isArray(operatorsResponse)) return operatorsResponse;
    return [];
  }, [operatorsResponse]);

  // Memoize API Query Parameters
  const queryParams: StockTakeBrowseQueryParams = useMemo(() => {
    return {
      ...(startDate && { fromDate: startDate }),
      ...(endDate && { toDate: endDate }),
      ...(warehouseFilter && { WarehouseId: warehouseFilter }),
      ...(operatorFilter && { operatorId: operatorFilter }),
    };
  }, [startDate, endDate, warehouseFilter, operatorFilter]);

  const { data: responseData, isLoading, refetch } = useStockTakeTransactions(queryParams);

  const transactionsList: StockTakeTransaction[] = useMemo(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    return [];
  }, [responseData]);

  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((item: StockTakeTransaction) => {
      const matchesSearch =
        item.stockTakeNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.operatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.remarks?.toLowerCase().includes(searchTerm.toLowerCase());

      // Client-Side Date Range Filter
      let matchesDate = true;
      if (item.transactionDate) {
        const txnDate = new Date(item.transactionDate).getTime();
        if (startDate) {
          const start = new Date(startDate).setHours(0, 0, 0, 0);
          if (txnDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate).setHours(23, 59, 59, 999);
          if (txnDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [transactionsList, searchTerm, startDate, endDate]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const kpis = useMemo(() => {
    return filteredTransactions.reduce<StockTakeMetrics>(
      (acc, curr) => {
        const sysQty = curr.systemQuantity ?? 0;
        const countQty = curr.countedQuantity ?? 0;
        const varQty = curr.varianceQuantity ?? (countQty - sysQty);
        const varVal = curr.varianceValue ?? (varQty * (curr.unitCost ?? 0));

        acc.totalLines += 1;
        acc.totalSystemQty += sysQty;
        acc.totalCountedQty += countQty;
        acc.netVarianceQty += varQty;
        acc.netVarianceValue += varVal;

        return acc;
      },
      {
        totalLines: 0,
        totalSystemQty: 0,
        totalCountedQty: 0,
        netVarianceQty: 0,
        netVarianceValue: 0,
      }
    );
  }, [filteredTransactions]);

  const toggleModal = () => {
    if (isDetailModalOpen) {
      setSelectedRecord(null);
    }
    setIsDetailModalOpen(!isDetailModalOpen);
  };

  const handleViewDetail = (record: StockTakeTransaction) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleExportExcel = () => {
    const headers = [
      "Stock Take No",
      "Transaction Date",
      "Warehouse",
      "Operator",
      "Item Code",
      "Item Name",
      "System Qty",
      "Counted Qty",
      "Variance Qty",
      "Unit Cost (KES)",
      "Variance Value (KES)",
      "Remarks",
    ];

    const rows = filteredTransactions.map((item) => [
      `"${item.stockTakeNo || ""}"`,
      `"${item.transactionDate ? new Date(item.transactionDate).toLocaleString() : "N/A"}"`,
      `"${item.warehouseName || item.warehouseId || ""}"`,
      `"${item.operatorName || item.operatorId || "SYS_AUDIT"}"`,
      `"${item.itemCode || ""}"`,
      `"${(item.itemName || "").replace(/"/g, '""')}"`,
      item.systemQuantity ?? 0,
      item.countedQuantity ?? 0,
      item.varianceQuantity ?? 0,
      `"${formatCurrency(item.unitCost ?? 0)}"`,
      `"${formatCurrency(item.varianceValue ?? 0)}"`,
      `"${(item.remarks || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `StockTake_Transactions_Export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setWarehouseFilter("");
    setOperatorFilter("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Header Action Bar */}
          <Row className="mb-3 align-items-center">
            <Col md={6}>
              <div className="d-flex align-items-center gap-2">
                <div className="avatar-sm bg-primary-subtle text-primary rounded p-2 d-flex align-items-center justify-content-center">
                  <i className="ri-scales-3-line fs-20"></i>
                </div>
                <div>
                  <h5 className="fs-16 mb-0 fw-bold text-dark">
                    Stock Take Audit & Discrepancy Report
                  </h5>
                  <p className="text-muted mb-0 fs-12">
                    physical inventory counting variances, stock ledger, and audit history
                  </p>
                </div>
              </div>
            </Col>
            <Col md={6} className="text-md-end mt-2 mt-md-0">
              <div className="d-flex align-items-center justify-content-md-end gap-2">
                <Button color="light" className="btn-sm border text-muted" onClick={() => refetch()}>
                  <i className="ri-refresh-line me-1"></i> Refresh
                </Button>
                <Button
                  color="success"
                  className="btn-sm d-flex align-items-center gap-1"
                  onClick={handleExportExcel}
                  disabled={!filteredTransactions.length}
                >
                  <i className="ri-file-excel-2-line fs-13"></i> Export to Excel
                </Button>
              </div>
            </Col>
          </Row>

          {/* KPI Summary Ribbon */}
          <Row className="g-3 mb-3">
            <Col xl={3} md={6}>
              <Card className="border-0 shadow-sm bg-white mb-0">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Audited Line Items</p>
                      <h4 className="fs-18 fw-bold mb-0 text-dark">
                        {kpis.totalLines.toLocaleString()}
                      </h4>
                    </div>
                    <div className="avatar-sm rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center">
                      <i className="ri-list-check-2 fs-20"></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col xl={3} md={6}>
              <Card className="border-0 shadow-sm bg-white mb-0">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">System vs Counted Qty</p>
                      <h4 className="fs-18 fw-bold mb-0 text-dark">
                        {kpis.totalCountedQty.toLocaleString()}{" "}
                        <span className="text-muted fs-12 fw-normal">
                          / {kpis.totalSystemQty.toLocaleString()}
                        </span>
                      </h4>
                    </div>
                    <div className="avatar-sm rounded bg-info-subtle text-info d-flex align-items-center justify-content-center">
                      <i className="ri-database-2-line fs-20"></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col xl={3} md={6}>
              <Card className="border-0 shadow-sm bg-white mb-0">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Net Variance Qty</p>
                      <h4
                        className={`fs-18 fw-bold mb-0 ${
                          kpis.netVarianceQty < 0
                            ? "text-danger"
                            : kpis.netVarianceQty > 0
                            ? "text-success"
                            : "text-dark"
                        }`}
                      >
                        {kpis.netVarianceQty > 0 ? `+${kpis.netVarianceQty}` : kpis.netVarianceQty}
                      </h4>
                    </div>
                    <div className="avatar-sm rounded bg-warning-subtle text-warning d-flex align-items-center justify-content-center">
                      <i className="ri-exchange-line fs-20"></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col xl={3} md={6}>
              <Card className="border-0 shadow-sm bg-white mb-0">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Net Financial Impact</p>
                      <h4
                        className={`fs-18 fw-bold mb-0 ${
                          kpis.netVarianceValue < 0 ? "text-danger" : "text-success"
                        }`}
                      >
                        {formatCurrency(kpis.netVarianceValue)}
                      </h4>
                    </div>
                    <div
                      className={`avatar-sm rounded d-flex align-items-center justify-content-center ${
                        kpis.netVarianceValue < 0
                          ? "bg-danger-subtle text-danger"
                          : "bg-success-subtle text-success"
                      }`}
                    >
                      <i className="ri-money-dollar-circle-line fs-20"></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Filter Toolbar */}
          <Card className="border-0 shadow-sm mb-3">
            <CardBody className="p-3">
              <Row className="g-2">
                <Col lg={3} md={6}>
                  <Input
                    type="text"
                    className="form-control bg-light border-light-subtle fs-12"
                    placeholder="Search item, code, stocktake no..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </Col>
                <Col lg={2} md={3}>
                  <Input
                    type="date"
                    className="form-control bg-light border-light-subtle fs-12 text-muted"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    title="From Date"
                  />
                </Col>
                <Col lg={2} md={3}>
                  <Input
                    type="date"
                    className="form-control bg-light border-light-subtle fs-12 text-muted"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    title="To Date"
                  />
                </Col>

                {/* Warehouse Select Dropdown */}
                <Col lg={2} md={3}>
                  <Input
                    type="select"
                    className="form-select bg-light border-light-subtle fs-12 text-muted"
                    value={warehouseFilter}
                    onChange={(e) => {
                      setWarehouseFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Warehouses</option>
                    {isWarehousesLoading ? (
                      <option disabled>Loading warehouses...</option>
                    ) : (
                      warehouseOptions.map((wh: any) => {
                        const whId = wh.warehouseId;
                        const whName = wh.warehouseName;
                        return (
                          <option key={whId} value={whId}>
                            {whName}
                          </option>
                        );
                      })
                    )}
                  </Input>
                </Col>

                {/* Operator Select Dropdown */}
                <Col lg={2} md={3}>
                  <Input
                    type="select"
                    className="form-select bg-light border-light-subtle fs-12 text-muted"
                    value={operatorFilter}
                    onChange={(e) => {
                      setOperatorFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Operators</option>
                    {isOperatorsLoading ? (
                      <option disabled>Loading operators...</option>
                    ) : (
                      operatorOptions.map((op: any) => {
                        const opId =  op.operatorId;
                        const opName = op.displayName;
                        return (
                          <option key={opId} value={opId}>
                            {opName}
                          </option>
                        );
                      })
                    )}
                  </Input>
                </Col>

                <Col lg={1} md={12}>
                  <Button
                    color="soft-secondary"
                    className="w-100 btn-sm text-dark fs-12"
                    onClick={handleResetFilters}
                  >
                    Reset
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* ERP Stock Take Transactions Table */}
          <Card className="border-0 shadow-sm">
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="table-hover table-nowrap align-middle mb-0 fs-12">
                  <thead className="table-light text-muted text-uppercase fs-11">
                    <tr>
                      <th style={{ width: "12%" }}>Stock Take #</th>
                      <th style={{ width: "12%" }}>Txn Date</th>
                      <th style={{ width: "12%" }}>Warehouse</th>
                      <th style={{ width: "18%" }}>Stock Item</th>
                      <th style={{ width: "11%" }}>Operator</th>
                      <th style={{ width: "8%" }} className="text-end">System Qty</th>
                      <th style={{ width: "8%" }} className="text-end">Counted Qty</th>
                      <th style={{ width: "8%" }} className="text-end">Variance</th>
                      <th style={{ width: "10%" }} className="text-end">Variance Val</th>
                      <th style={{ width: "5%" }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="text-center py-5">
                          <Spinner size="sm" color="primary" className="me-2" />
                          <span className="text-muted">Fetching stocktake transactions...</span>
                        </td>
                      </tr>
                    ) : paginatedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-5 text-muted">
                          <i className="ri-inbox-archive-line display-6 d-block mb-2 text-muted opacity-50"></i>
                          No stocktake audit records match your criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedTransactions.map((item: StockTakeTransaction, idx: number) => {
                        const sysQty = item.systemQuantity ?? 0;
                        const countQty = item.countedQuantity ?? 0;
                        const varQty = item.varianceQuantity ?? (countQty - sysQty);
                        const unitCost = item.unitCost ?? 0;
                        const varValue = item.varianceValue ?? (varQty * unitCost);

                        return (
                          <tr key={item.id || `${item.stockTakeNo}-${idx}`}>
                            <td>
                              <button
                                type="button"
                                className="btn btn-link p-0 fw-semibold text-primary font-monospace text-decoration-underline border-0 bg-transparent"
                                onClick={() => handleViewDetail(item)}
                                title="Click to view line detail"
                              >
                                {item.stockTakeNo || "N/A"}
                              </button>
                            </td>
                            <td className="text-muted fs-11">
                              {item.transactionDate
                                ? new Date(item.transactionDate).toLocaleString()
                                : "N/A"}
                            </td>
                            <td className="font-monospace text-dark">
                              {item.warehouseName || item.warehouseId || "MAIN_WH"}
                            </td>
                            <td>
                              <div className="fw-medium text-dark">{item.itemName || "Unmapped Item"}</div>
                              <small className="text-muted font-monospace">{item.itemCode || "NO-CODE"}</small>
                            </td>
                            <td className="text-muted font-monospace">
                              {item.operatorName || item.operatorId || "SYS_AUDIT"}
                            </td>
                            <td className="text-end font-monospace text-dark">{sysQty.toLocaleString()}</td>
                            <td className="text-end font-monospace fw-semibold text-dark">
                              {countQty.toLocaleString()}
                            </td>
                            <td className="text-end font-monospace">
                              <Badge
                                color={
                                  varQty === 0
                                    ? "light"
                                    : varQty < 0
                                    ? "danger-subtle"
                                    : "success-subtle"
                                }
                                className={`font-monospace fs-10 ${
                                  varQty === 0
                                    ? "text-dark"
                                    : varQty < 0
                                    ? "text-danger"
                                    : "text-success"
                                }`}
                              >
                                {varQty > 0 ? `+${varQty}` : varQty}
                              </Badge>
                            </td>
                            <td
                              className={`text-end font-monospace fw-bold ${
                                varValue < 0
                                  ? "text-danger"
                                  : varValue > 0
                                  ? "text-success"
                                  : "text-dark"
                              }`}
                            >
                              {formatCurrency(varValue)}
                            </td>
                            <td className="text-center">
                              <Button
                                color="light"
                                size="sm"
                                className="btn-icon waves-effect fs-12 border-0"
                                onClick={() => handleViewDetail(item)}
                                title="View Item Discrepancy Detail"
                              >
                                <i className="ri-eye-line text-muted"></i>
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {filteredTransactions.length > 0 && (
                <div className="p-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted fs-12">Rows per page:</span>
                    <Input
                      type="select"
                      className="form-select form-select-sm bg-light border-light-subtle w-auto fs-12"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </Input>
                    <span className="text-muted fs-12 ms-2">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{" "}
                      {filteredTransactions.length} entries
                    </span>
                  </div>

                  <Pagination className="pagination-sm mb-0">
                    <PaginationItem disabled={currentPage === 1}>
                      <PaginationLink
                        previous
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                      .map((p) => (
                        <PaginationItem active={p === currentPage} key={p}>
                          <PaginationLink onClick={() => setCurrentPage(p)}>{p}</PaginationLink>
                        </PaginationItem>
                      ))}
                    <PaginationItem disabled={currentPage === totalPages}>
                      <PaginationLink
                        next
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      />
                    </PaginationItem>
                  </Pagination>
                </div>
              )}
            </CardBody>
          </Card>
        </Container>
      </div>

      {/* Itemized Audit Discrepancy Detail Modal */}
      <Modal isOpen={isDetailModalOpen} toggle={toggleModal} centered size="lg">
        <ModalHeader toggle={toggleModal} className="bg-light p-3">
          <div className="d-flex align-items-center gap-2">
            <i className="ri-file-list-3-line fs-18 text-primary"></i>
            <span className="fw-bold fs-14">Stock Take Audit Discrepancy Detail</span>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {selectedRecord ? (
            <div>
              {/* Metadata Grid */}
              <Row className="mb-3 p-3 bg-light-subtle rounded border border-light-subtle fs-12">
                <Col md={3} xs={6} className="mb-2 mb-md-0">
                  <span className="text-muted d-block fs-11">Stock Take Ref</span>
                  <span className="fw-semibold text-primary font-monospace">
                    {selectedRecord.stockTakeNo || "N/A"}
                  </span>
                </Col>
                <Col md={3} xs={6} className="mb-2 mb-md-0">
                  <span className="text-muted d-block fs-11">Warehouse</span>
                  <span className="fw-semibold text-dark">
                    {selectedRecord.warehouseName || selectedRecord.warehouseId || "N/A"}
                  </span>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block fs-11">Transaction Date</span>
                  <span className="fw-semibold text-dark">
                    {selectedRecord.transactionDate
                      ? new Date(selectedRecord.transactionDate).toLocaleString()
                      : "N/A"}
                  </span>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block fs-11">Operator</span>
                  <span className="fw-semibold text-dark font-monospace">
                    {selectedRecord.operatorName || selectedRecord.operatorId || "SYS_AUDIT"}
                  </span>
                </Col>
              </Row>

              {/* Item Quantification Audit Table */}
              <div className="table-responsive mb-3">
                <Table className="table-bordered align-middle mb-0 fs-12">
                  <thead className="table-light text-uppercase fs-11 text-muted">
                    <tr>
                      <th>Stock Item Code</th>
                      <th>Description</th>
                      <th className="text-end">System Qty</th>
                      <th className="text-end">Counted Qty</th>
                      <th className="text-end">Variance Qty</th>
                      <th className="text-end">Unit Cost</th>
                      <th className="text-end">Impact Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-monospace fw-semibold">{selectedRecord.itemCode || "NO-CODE"}</td>
                      <td className="fw-medium text-dark">{selectedRecord.itemName || "Unmapped Item"}</td>
                      <td className="text-end font-monospace">{(selectedRecord.systemQuantity ?? 0).toLocaleString()}</td>
                      <td className="text-end font-monospace fw-semibold">{(selectedRecord.countedQuantity ?? 0).toLocaleString()}</td>
                      <td className="text-end font-monospace fw-bold">
                        <span
                          className={
                            (selectedRecord.varianceQuantity ?? 0) < 0
                              ? "text-danger"
                              : (selectedRecord.varianceQuantity ?? 0) > 0
                              ? "text-success"
                              : "text-dark"
                          }
                        >
                          {selectedRecord.varianceQuantity ?? 0}
                        </span>
                      </td>
                      <td className="text-end font-monospace">{formatCurrency(selectedRecord.unitCost ?? 0)}</td>
                      <td className="text-end font-monospace fw-bold">
                        {formatCurrency(selectedRecord.varianceValue ?? 0)}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              {/* Audit Remarks Box */}
              <div className="p-3 bg-light rounded fs-12">
                <span className="fw-semibold text-muted d-block mb-1 fs-11 text-uppercase">Audit Remarks / Justification</span>
                <p className="mb-0 text-dark font-monospace">
                  {selectedRecord.remarks || "No specific auditor remarks logged for this line entry."}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">Transaction details currently unavailable.</div>
          )}
        </ModalBody>
        <ModalFooter className="bg-light p-2">
          <Button color="light" className="btn-sm border" onClick={toggleModal}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default StockTakeReport;