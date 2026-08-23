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

import { useInventoryTransactions } from "../../Components/Hooks/useReports";
import {
  InventoryTransaction,
  InventoryTransactionQueryParams,
  InventoryTransactionType,
} from "../../types/reports";

const formatCurrency = (val?: number) => {
  const amount = typeof val === "number" ? val : 0;
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
};

const InventoryTransactions: React.FC = () => {
  document.title = "Inventory Ledger & Movement Audit | Enterprise ERP";

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [selectedTxn, setSelectedTxn] = useState<InventoryTransaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // API Query Parameters
  const queryParams: InventoryTransactionQueryParams = useMemo(() => {
    return {
      ...(startDate && { fromDate: startDate }),
      ...(endDate && { toDate: endDate }),
    };
  }, [startDate, endDate]);

  const { data: rawResponse, isLoading, refetch } = useInventoryTransactions(queryParams);

  // Safely extract transaction array regardless of API response wrapping
  const transactionsList: InventoryTransaction[] = useMemo(() => {
    if (!rawResponse) return [];
    if (Array.isArray(rawResponse)) return rawResponse;
    if (Array.isArray((rawResponse as any).data)) return (rawResponse as any).data;
    return [];
  }, [rawResponse]);

  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((txn: InventoryTransaction) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        txn.reference_number?.toLowerCase().includes(searchLower) ||
        txn.item_code?.toLowerCase().includes(searchLower) ||
        txn.description?.toLowerCase().includes(searchLower) ||
        txn.warehouse_code?.toLowerCase().includes(searchLower) ||
        txn.transaction_id?.toLowerCase().includes(searchLower);

      const matchesType =
        typeFilter === "ALL" ||
        txn.transaction_type?.toLowerCase() === typeFilter.toLowerCase();

      let matchesDate = true;
      if (txn.posted_at) {
        const postedDate = new Date(txn.posted_at).getTime();
        if (startDate) {
          const start = new Date(startDate).setHours(0, 0, 0, 0);
          if (postedDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate).setHours(23, 59, 59, 999);
          if (postedDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactionsList, searchTerm, typeFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const kpis = useMemo(() => {
    const list = filteredTransactions;
    const totalTxns = list.length;
    const totalReceivedQty = list
      .filter((t) => (t.quantity || 0) > 0)
      .reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const totalIssuedQty = Math.abs(
      list
        .filter((t) => (t.quantity || 0) < 0)
        .reduce((acc, curr) => acc + (curr.quantity || 0), 0)
    );
    const netValueMovement = list.reduce(
      (acc, curr) => acc + (curr.quantity || 0) * (curr.unit_cost || 0),
      0
    );

    return { totalTxns, totalReceivedQty, totalIssuedQty, netValueMovement };
  }, [filteredTransactions]);

  const toggleModal = () => {
    if (isDetailModalOpen) {
      setSelectedTxn(null);
    }
    setIsDetailModalOpen(!isDetailModalOpen);
  };

  const handleViewDetails = (txn: InventoryTransaction) => {
    setSelectedTxn(txn);
    setIsDetailModalOpen(true);
  };

  const getTypeBadge = (type?: InventoryTransactionType) => {
    const safeType = type ? String(type).toLowerCase() : "";
    switch (safeType) {
      case "goods_receipt":
        return (
          <Badge color="success-subtle" className="text-success border border-success-subtle font-monospace fs-10">
            GOODS RECEIPT
          </Badge>
        );
      case "sale":
        return (
          <Badge color="danger-subtle" className="text-danger border border-danger-subtle font-monospace fs-10">
            SALE ISSUE
          </Badge>
        );
      case "stock_take":
        return (
          <Badge color="warning-subtle" className="text-warning border border-warning-subtle font-monospace fs-10">
            STOCK TAKE
          </Badge>
        );
      default:
        return (
          <Badge color="secondary-subtle" className="text-secondary border font-monospace fs-10">
            {(type || "N/A").toUpperCase()}
          </Badge>
        );
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "Transaction ID",
      "Reference #",
      "Posted Date",
      "Transaction Type",
      "Warehouse Code",
      "Item Code",
      "Description",
      "UOM",
      "Quantity",
      "Unit Cost (Ksh)",
      "Total Value (Ksh)",
    ];

    const rows = filteredTransactions.map((txn) => [
      `"${txn.transaction_id || ""}"`,
      `"${txn.reference_number || ""}"`,
      `"${txn.posted_at ? new Date(txn.posted_at).toLocaleString() : "N/A"}"`,
      `"${txn.transaction_type || ""}"`,
      `"${txn.warehouse_code || ""}"`,
      `"${txn.item_code || ""}"`,
      `"${txn.description || ""}"`,
      `"${txn.stock_uom || ""}"`,
      `"${txn.quantity ?? 0}"`,
      `"${formatCurrency(txn.unit_cost || 0)}"`,
      `"${formatCurrency((txn.quantity || 0) * (txn.unit_cost || 0))}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Transactions_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
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
                  <i className="ri-exchange-box-line fs-20"></i>
                </div>
                <div>
                  <h5 className="fs-16 mb-0 fw-bold text-dark">Inventory Transaction Journal</h5>
                  <p className="text-muted mb-0 fs-12">
                    stock ledger, goods receipts, stock counts, and sales movements
                  </p>
                </div>
              </div>
            </Col>
            <Col md={6} className="text-md-end mt-2 mt-md-0">
              <div className="d-flex align-items-center justify-content-md-end gap-2">
                <Button color="light" className="btn-sm border text-muted" onClick={() => refetch()}>
                  <i className="ri-refresh-line me-1"></i> Refresh
                </Button>
                <Button color="success" className="btn-sm d-flex align-items-center gap-1" onClick={handleExportExcel}>
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Total Journal Postings</p>
                      <h4 className="fs-18 fw-bold mb-0 text-dark">{kpis.totalTxns}</h4>
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Total Stock Received</p>
                      <h4 className="fs-18 fw-bold mb-0 text-success">
                        +{kpis.totalReceivedQty.toLocaleString()}
                      </h4>
                    </div>
                    <div className="avatar-sm rounded bg-success-subtle text-success d-flex align-items-center justify-content-center">
                      <i className="ri-arrow-down-circle-line fs-20"></i>
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Total Stock Issued</p>
                      <h4 className="fs-18 fw-bold mb-0 text-danger">
                        -{kpis.totalIssuedQty.toLocaleString()}
                      </h4>
                    </div>
                    <div className="avatar-sm rounded bg-danger-subtle text-danger d-flex align-items-center justify-content-center">
                      <i className="ri-arrow-up-circle-line fs-20"></i>
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Net Valuation Impact</p>
                      <h4 className={`fs-18 fw-bold mb-0 ${kpis.netValueMovement >= 0 ? "text-success" : "text-danger"}`}>
                        {formatCurrency(kpis.netValueMovement)}
                      </h4>
                    </div>
                    <div className="avatar-sm rounded bg-info-subtle text-info d-flex align-items-center justify-content-center">
                      <i className="ri-coins-line fs-20"></i>
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
                <Col lg={4} md={6}>
                  <Input
                    type="text"
                    className="form-control bg-light border-light-subtle fs-12"
                    placeholder="Search ref #, item code, description, warehouse..."
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
                <Col lg={3} md={6}>
                  <Input
                    type="select"
                    className="form-select bg-light border-light-subtle fs-12 text-muted"
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ALL">All Transaction Types</option>
                    <option value="goods_receipt">Goods Receipts</option>
                    <option value="sale">Sales Issues</option>
                    <option value="stock_take">Stock Take</option>
                  </Input>
                </Col>
                <Col lg={1} md={6}>
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

          {/* ERP Inventory Transactions Table */}
          <Card className="border-0 shadow-sm">
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="table-hover table-nowrap align-middle mb-0 fs-12">
                  <thead className="table-light text-muted text-uppercase fs-11">
                    <tr>
                      <th style={{ width: "12%" }}>Reference #</th>
                      <th style={{ width: "14%" }}>Posted Date</th>
                      <th style={{ width: "12%" }}>Type</th>
                      <th style={{ width: "8%" }}>Warehouse</th>
                      <th style={{ width: "12%" }}>Item Code</th>
                      <th style={{ width: "18%" }}>Description</th>
                      <th style={{ width: "6%" }}>UOM</th>
                      <th style={{ width: "8%" }} className="text-end">Quantity</th>
                      <th style={{ width: "10%" }} className="text-end">Unit Cost</th>
                      <th style={{ width: "5%" }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="text-center py-5">
                          <Spinner size="sm" color="primary" className="me-2" />
                          <span className="text-muted">Fetching inventory transactions...</span>
                        </td>
                      </tr>
                    ) : paginatedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-5 text-muted">
                          <i className="ri-inbox-archive-line display-6 d-block mb-2 text-muted opacity-50"></i>
                          No inventory transactions match your criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedTransactions.map((txn: InventoryTransaction, idx: number) => {
                        const qty = txn.quantity ?? 0;
                        return (
                          <tr key={txn.transaction_id || `txn-${idx}`}>
                            <td>
                              <button
                                type="button"
                                className="btn btn-link p-0 fw-semibold text-primary font-monospace text-decoration-underline border-0 bg-transparent"
                                onClick={() => handleViewDetails(txn)}
                                title="Click to view detailed entry"
                              >
                                {txn.reference_number || "N/A"}
                              </button>
                            </td>
                            <td className="text-muted fs-11">
                              {txn.posted_at ? new Date(txn.posted_at).toLocaleString() : "N/A"}
                            </td>
                            <td>{getTypeBadge(txn.transaction_type)}</td>
                            <td className="font-monospace text-dark">{txn.warehouse_code || "N/A"}</td>
                            <td className="fw-medium font-monospace text-dark">{txn.item_code || "N/A"}</td>
                            <td className="text-dark">{txn.description || "N/A"}</td>
                            <td>
                              <Badge color="light" className="text-dark border font-monospace fs-10">
                                {txn.stock_uom || "N/A"}
                              </Badge>
                            </td>
                            <td className={`text-end fw-bold font-monospace ${qty > 0 ? "text-success" : qty < 0 ? "text-danger" : "text-muted"}`}>
                              {qty > 0 ? `+${qty}` : qty}
                            </td>
                            <td className="text-end fw-semibold text-dark font-monospace">
                              {formatCurrency(txn.unit_cost)}
                            </td>
                            <td className="text-center">
                              <Button
                                color="light"
                                size="sm"
                                className="btn-icon waves-effect fs-12 border-0"
                                onClick={() => handleViewDetails(txn)}
                                title="View Transaction Record"
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
                      {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} entries
                    </span>
                  </div>

                  <Pagination className="pagination-sm mb-0">
                    <PaginationItem disabled={currentPage === 1}>
                      <PaginationLink previous onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                      .map((p) => (
                        <PaginationItem active={p === currentPage} key={p}>
                          <PaginationLink onClick={() => setCurrentPage(p)}>{p}</PaginationLink>
                        </PaginationItem>
                      ))}
                    <PaginationItem disabled={currentPage === totalPages}>
                      <PaginationLink next onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} />
                    </PaginationItem>
                  </Pagination>
                </div>
              )}
            </CardBody>
          </Card>
        </Container>
      </div>

      {/* Transaction Detail Audit Modal */}
      <Modal isOpen={isDetailModalOpen} toggle={toggleModal} centered size="lg">
        <ModalHeader toggle={toggleModal} className="bg-light p-3">
          <div className="d-flex align-items-center gap-2">
            <i className="ri-file-text-line fs-18 text-primary"></i>
            <span className="fw-bold fs-14">Inventory Ledger Entry Details</span>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {selectedTxn ? (
            <div>
              <Row className="mb-3 p-3 bg-light-subtle rounded border border-light-subtle fs-12 g-3">
                <Col md={4} xs={6}>
                  <span className="text-muted d-block fs-11">Transaction ID</span>
                  <span className="fw-semibold text-dark font-monospace fs-11">{selectedTxn.transaction_id || "N/A"}</span>
                </Col>
                <Col md={4} xs={6}>
                  <span className="text-muted d-block fs-11">Reference Number</span>
                  <span className="fw-semibold text-primary font-monospace">{selectedTxn.reference_number || "N/A"}</span>
                </Col>
                <Col md={4} xs={6}>
                  <span className="text-muted d-block fs-11">Transaction Type</span>
                  <span>{getTypeBadge(selectedTxn.transaction_type)}</span>
                </Col>
                <Col md={4} xs={6}>
                  <span className="text-muted d-block fs-11">Warehouse</span>
                  <span className="fw-semibold text-dark font-monospace">{selectedTxn.warehouse_code || "N/A"}</span>
                </Col>
                <Col md={4} xs={6}>
                  <span className="text-muted d-block fs-11">Posted Timestamp</span>
                  <span className="fw-semibold text-dark">
                    {selectedTxn.posted_at ? new Date(selectedTxn.posted_at).toLocaleString() : "N/A"}
                  </span>
                </Col>
                <Col md={4} xs={6}>
                  <span className="text-muted d-block fs-11">Stock UOM</span>
                  <span className="fw-semibold text-dark">{selectedTxn.stock_uom || "N/A"}</span>
                </Col>
              </Row>

              <Table className="table border align-middle mb-3 fs-12">
                <thead className="table-light">
                  <tr>
                    <th>Item Code</th>
                    <th>Description</th>
                    <th className="text-end">Quantity</th>
                    <th className="text-end">Unit Cost</th>
                    <th className="text-end">Total Valuation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-monospace fw-semibold">{selectedTxn.item_code || "N/A"}</td>
                    <td>{selectedTxn.description || "N/A"}</td>
                    <td className={`text-end fw-bold font-monospace ${(selectedTxn.quantity || 0) > 0 ? "text-success" : "text-danger"}`}>
                      {selectedTxn.quantity ?? 0}
                    </td>
                    <td className="text-end font-monospace">{formatCurrency(selectedTxn.unit_cost)}</td>
                    <td className="text-end font-monospace fw-bold text-dark">
                      {formatCurrency((selectedTxn.quantity || 0) * (selectedTxn.unit_cost || 0))}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">Transaction entry details unavailable.</div>
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

export default InventoryTransactions;