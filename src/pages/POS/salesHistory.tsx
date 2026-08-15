import React, { useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
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

import qz from "qz-tray";

// Import hooks and types from POS module
import {
  useSales,
  useSaleDetails,
} from "../../Components/Hooks/usePOS";

import {
  POSHeader,
  POSLineItem,
} from "../../types/POS";

// Import QZ Tray utilities & receipt generator
import {
  connectToQZ,
  generateESCPOSText,
  formatCurrency,
  ReceiptData,
} from "../../utils/qzConfig";

const SalesHistory: React.FC = () => {
  document.title = "Sales History & Transaction Audit | Enterprise ERP";

  // State Management
  const [page] = useState<number>(1);
  const [perPage] = useState<number>(500); // Fetch bulk records for client-side date & status slicing
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  
  // Date Filtering State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Drill-down Detail Modal State
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // TanStack Query Hooks Binding
  const { data: salesData, isLoading, refetch } = useSales(page, perPage);
  const { data: saleDetailData, isLoading: isDetailLoading } = useSaleDetails(selectedSaleId);

  // Standardize sales list payload extraction
  const salesList: POSHeader[] = useMemo(() => {
    if (!salesData) return [];
    if (Array.isArray(salesData)) return salesData;
    return salesData.sales || [];
  }, [salesData]);

  // Extract detailed sale receipt payload
  const activeTransaction: POSHeader | null = useMemo(() => {
    if (!saleDetailData) return null;
    return saleDetailData || (saleDetailData as unknown as POSHeader) || null;
  }, [saleDetailData]);

  // Filtered dataset matching POSHeader structure and date parameters
  const filteredSales = useMemo(() => {
    return salesList.filter((sale: POSHeader) => {
      const matchesSearch =
        sale.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.cashierId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || sale.status?.toUpperCase() === statusFilter.toUpperCase();

      const matchesPayment =
        paymentFilter === "ALL" || sale.paymentMethod?.toUpperCase() === paymentFilter.toUpperCase();

      // Date Range Filter
      let matchesDate = true;
      if (sale.postedAt) {
        const saleDate = new Date(sale.postedAt).getTime();
        if (startDate) {
          const start = new Date(startDate).setHours(0, 0, 0, 0);
          if (saleDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate).setHours(23, 59, 59, 999);
          if (saleDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [salesList, searchTerm, statusFilter, paymentFilter, startDate, endDate]);

  // Paginated dataset
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  // Executive KPI summary metrics
  const kpis = useMemo(() => {
    const list = filteredSales;
    const totalRev = list.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
    const totalTxns = list.length;
    const avgTicket = totalTxns > 0 ? totalRev / totalTxns : 0;
    const refundCount = list.filter((s) => s.status?.toUpperCase() === "REFUNDED").length;

    return { totalRev, totalTxns, avgTicket, refundCount };
  }, [filteredSales]);

  const toggleModal = () => {
    if (isDetailModalOpen) {
      setSelectedSaleId(null);
    }
    setIsDetailModalOpen(!isDetailModalOpen);
  };

  const handleViewReceipt = (transactionId: string) => {
    setSelectedSaleId(transactionId);
    setIsDetailModalOpen(true);
  };

  // Export dataset directly to Excel (.xlsx / CSV binary wrapper)
  const handleExportExcel = () => {
    const headers = [
      "Receipt Number",
      "Posted Date",
      "Customer",
      "Cashier ID",
      "Payment Method",
      "Items Count",
      "Grand Total (Ksh)",
      "Status",
    ];

    const rows = filteredSales.map((sale) => [
      `"${sale.receiptNumber || ""}"`,
      `"${sale.postedAt ? new Date(sale.postedAt).toLocaleString() : "N/A"}"`,
      `"${sale.customerName || "Walk-In Customer"}"`,
      `"${sale.cashierId || "SYS_POS"}"`,
      `"${sale.paymentMethod || ""}"`,
      sale.items?.length || 0,
      `"${formatCurrency(sale.grandTotal || 0)}"`,
      `"${sale.status || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print receipt via QZ Tray with ESC/POS formatting
  const handlePrintReceipt = async () => {
    if (!activeTransaction) return;
    setIsPrinting(true);
    try {
      await connectToQZ();

      const receiptPayload: ReceiptData = {
        companyName: "FRESHA ENTERPRISES",
        storeName: "MAIN WAREHOUSE",
        receiptNo: activeTransaction.receiptNumber || "N/A",
        date: activeTransaction.postedAt
          ? new Date(activeTransaction.postedAt).toLocaleString()
          : new Date().toLocaleString(),
        cashier: activeTransaction.cashierId || "SYS_POS",
        customerName: activeTransaction.customerName || "Walk-In Customer",
        items: (activeTransaction.items || []).map((item) => ({
          name: item.stockItemName || "Item",
          qty: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          discount: item.discount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          total: item.lineTotal || 0,
        })),
        subtotal: activeTransaction.subTotal || 0,
        discountTotal: activeTransaction.discountTotal,
        taxTotal: activeTransaction.taxTotal || 0,
        grandTotal: activeTransaction.grandTotal || 0,
        paymentMethod: activeTransaction.paymentMethod || "CASH",
        amountTendered: activeTransaction.amountPaid,
        changeAmount: activeTransaction.changeAmount,
      };

      const escposCommands = generateESCPOSText(receiptPayload);
      const printerConfig = qz.configs.create(null); // Uses default receipt printer
      await qz.print(printerConfig, [escposCommands]);
    } catch (err) {
      console.error("QZ Tray Print Error:", err);
      alert("Failed to send print job to QZ Tray thermal printer. Ensure QZ Tray is running.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
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
                  <i className="ri-history-line fs-20"></i>
                </div>
                <div>
                  <h5 className="fs-16 mb-0 fw-bold text-dark">Sales Transaction Journal</h5>
                  <p className="text-muted mb-0 fs-12">
                    sales ledger, cash register audit, and receipt details
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Total Journal Revenue</p>
                      <h4 className="fs-18 fw-bold mb-0 text-dark">
                        {formatCurrency(kpis.totalRev)}
                      </h4>
                    </div>
                    <div className="avatar-sm rounded bg-success-subtle text-success d-flex align-items-center justify-content-center">
                      <i className="ri-money-dollar-circle-line fs-20"></i>
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Completed Receipts</p>
                      <h4 className="fs-18 fw-bold mb-0 text-dark">{kpis.totalTxns}</h4>
                    </div>
                    <div className="avatar-sm rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center">
                      <i className="ri-shopping-bag-3-line fs-20"></i>
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Average Basket Size</p>
                      <h4 className="fs-18 fw-bold mb-0 text-dark">
                        {formatCurrency(kpis.avgTicket)}
                      </h4>
                    </div>
                    <div className="avatar-sm rounded bg-info-subtle text-info d-flex align-items-center justify-content-center">
                      <i className="ri-bar-chart-grouped-line fs-20"></i>
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Refunds / Voids</p>
                      <h4 className="fs-18 fw-bold mb-0 text-danger">{kpis.refundCount}</h4>
                    </div>
                    <div className="avatar-sm rounded bg-danger-subtle text-danger d-flex align-items-center justify-content-center">
                      <i className="ri-refund-2-line fs-20"></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Filter & Search Toolbar with Date Picker */}
          <Card className="border-0 shadow-sm mb-3">
            <CardBody className="p-3">
              <Row className="g-2">
                <Col lg={3} md={6}>
                  <Input
                    type="text"
                    className="form-control bg-light border-light-subtle fs-12"
                    placeholder="Search receipt no, customer, cashier..."
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
                    title="Start Date"
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
                    title="End Date"
                  />
                </Col>
                <Col lg={2} md={3}>
                  <Input
                    type="select"
                    className="form-select bg-light border-light-subtle fs-12 text-muted"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="POSTED">Posted / Completed</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="VOIDED">Voided</option>
                    <option value="PENDING">Pending</option>
                  </Input>
                </Col>
                <Col lg={2} md={3}>
                  <Input
                    type="select"
                    className="form-select bg-light border-light-subtle fs-12 text-muted"
                    value={paymentFilter}
                    onChange={(e) => {
                      setPaymentFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ALL">All Payment Channels</option>
                    <option value="CASH">Cash</option>
                    <option value="MOBILE_MONEY">Mobile Money (M-Pesa)</option>
                    <option value="CARD">Card</option>
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

          {/* Main ERP Sales Ledger Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-transparent border-bottom p-3 d-flex align-items-center justify-content-between">
              <h6 className="card-title mb-0 fs-13 fw-semibold text-dark">
                Transaction Records ({filteredSales.length})
              </h6>
              <span className="badge bg-light text-muted font-monospace fs-11">
                Real-Time Synchronized
              </span>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="table-hover table-nowrap align-middle mb-0 fs-12">
                  <thead className="table-light text-muted text-uppercase fs-11">
                    <tr>
                      <th style={{ width: "12%" }}>Receipt #</th>
                      <th style={{ width: "15%" }}>Posted Date</th>
                      <th style={{ width: "20%" }}>Customer</th>
                      <th style={{ width: "13%" }}>Cashier ID</th>
                      <th style={{ width: "12%" }}>Payment Method</th>
                      <th style={{ width: "8%" }} className="text-center">Items</th>
                      <th style={{ width: "10%" }} className="text-end">Grand Total</th>
                      <th style={{ width: "10%" }} className="text-center">Status</th>
                      <th style={{ width: "5%" }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5">
                          <Spinner size="sm" color="primary" className="me-2" />
                          <span className="text-muted">Fetching sales transaction ledger...</span>
                        </td>
                      </tr>
                    ) : paginatedSales.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5 text-muted">
                          <i className="ri-inbox-archive-line display-6 d-block mb-2 text-muted opacity-50"></i>
                          No sales transaction logs match your criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedSales.map((sale: POSHeader, idx: number) => (
                        <tr key={sale.transactionId || idx}>
                          <td>
                            <button
                              type="button"
                              className="btn btn-link p-0 fw-semibold text-primary font-monospace text-decoration-underline border-0 bg-transparent"
                              onClick={() => handleViewReceipt(sale.transactionId)}
                              title="Click to view detailed receipt"
                            >
                              {sale.receiptNumber}
                            </button>
                          </td>
                          <td className="text-muted fs-11">
                            {sale.postedAt ? new Date(sale.postedAt).toLocaleString() : "N/A"}
                          </td>
                          <td>
                            <div className="fw-medium text-dark">{sale.customerName || "Walk-In Customer"}</div>
                          </td>
                          <td className="text-muted font-monospace">{sale.cashierId || "SYS_POS"}</td>
                          <td>
                            <Badge color="light" className="text-dark border font-monospace fs-10">
                              <i className="ri-wallet-3-line me-1 text-primary"></i>
                              {sale.paymentMethod}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light-subtle text-dark border">
                              {sale.items?.length ?? 0}
                            </span>
                          </td>
                          <td className="text-end fw-bold text-dark">
                            {formatCurrency(sale.grandTotal || 0)}
                          </td>
                          <td className="text-center">
                            <Badge
                              color={
                                sale.status?.toUpperCase() === "POSTED" || sale.status?.toUpperCase() === "COMPLETED"
                                  ? "success-subtle"
                                  : sale.status?.toUpperCase() === "REFUNDED"
                                  ? "danger-subtle"
                                  : "warning-subtle"
                              }
                              className={`text-${
                                sale.status?.toUpperCase() === "POSTED" || sale.status?.toUpperCase() === "COMPLETED"
                                  ? "success"
                                  : sale.status?.toUpperCase() === "REFUNDED"
                                  ? "danger"
                                  : "warning"
                              } rounded-pill fs-10`}
                            >
                              {sale.status}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button
                              color="light"
                              size="sm"
                              className="btn-icon waves-effect fs-12 border-0"
                              onClick={() => handleViewReceipt(sale.transactionId)}
                              title="View Itemized Receipt"
                            >
                              <i className="ri-eye-line text-muted"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination Controls Footer */}
              {filteredSales.length > 0 && (
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
                      {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} entries
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

      {/* Transaction Itemized Receipt Modal */}
      <Modal isOpen={isDetailModalOpen} toggle={toggleModal} centered size="lg">
        <ModalHeader toggle={toggleModal} className="bg-light p-3">
          <div className="d-flex align-items-center gap-2">
            <i className="ri-receipt-line fs-18 text-primary"></i>
            <span className="fw-bold fs-14">
              Transaction Receipt Details
            </span>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {isDetailLoading ? (
            <div className="text-center py-5">
              <Spinner color="primary" className="mb-2" />
              <p className="text-muted fs-12 mb-0">Loading itemized receipt ledger...</p>
            </div>
          ) : activeTransaction ? (
            <div>
              {/* Receipt Metadata Grid */}
              <Row className="mb-3 p-3 bg-light-subtle rounded border border-light-subtle fs-12">
                <Col md={3} xs={6} className="mb-2 mb-md-0">
                  <span className="text-muted d-block fs-11">Receipt Number</span>
                  <span className="fw-semibold text-primary font-monospace">{activeTransaction.receiptNumber}</span>
                </Col>
                <Col md={3} xs={6} className="mb-2 mb-md-0">
                  <span className="text-muted d-block fs-11">Customer</span>
                  <span className="fw-semibold text-dark">{activeTransaction.customerName || "Walk-In Customer"}</span>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block fs-11">Cashier ID</span>
                  <span className="fw-semibold text-dark">{activeTransaction.cashierId}</span>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block fs-11">Payment Method</span>
                  <span className="fw-semibold text-dark">{activeTransaction.paymentMethod}</span>
                </Col>
              </Row>

              {/* Itemized Stock Lines Table */}
              <h6 className="fs-12 text-uppercase fw-semibold text-muted mb-2">Itemized Breakdown</h6>
              <Table responsive className="align-middle fs-12 border mb-3">
                <thead className="table-light text-muted fs-11">
                  <tr>
                    <th>Stock Code</th>
                    <th>Product Name</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Unit Price</th>
                    <th className="text-end">Tax</th>
                    <th className="text-end">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTransaction.items && activeTransaction.items.length > 0 ? (
                    activeTransaction.items.map((item: POSLineItem, i: number) => (
                      <tr key={item.stockItemId || i}>
                        <td className="font-monospace text-primary">{item.stockItemCode}</td>
                        <td className="fw-medium text-dark">{item.stockItemName}</td>
                        <td className="text-center">{item.quantity} {item.uom || "pcs"}</td>
                        <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-end text-muted">{formatCurrency(item.taxAmount || 0)}</td>
                        <td className="text-end fw-semibold">{formatCurrency(item.lineTotal)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-3">
                        No line item details found for this receipt.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* ERP Financial Ledger Summary */}
              <Row className="justify-content-end">
                <Col md={6}>
                  <div className="p-3 bg-light rounded fs-12">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Subtotal:</span>
                      <span className="fw-medium">{formatCurrency(activeTransaction.subTotal || 0)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Tax Total (VAT):</span>
                      <span className="fw-medium">{formatCurrency(activeTransaction.taxTotal || 0)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Discount Total:</span>
                      <span className="text-danger">-{formatCurrency(activeTransaction.discountTotal || 0)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between fw-bold fs-14 text-dark mb-1">
                      <span>Grand Total:</span>
                      <span className="text-success">{formatCurrency(activeTransaction.grandTotal || 0)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted fs-11">
                      <span>Amount Tendered / Paid:</span>
                      <span>{formatCurrency(activeTransaction.amountPaid || 0)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted fs-11">
                      <span>Change Given:</span>
                      <span>{formatCurrency(activeTransaction.changeAmount || 0)}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              Receipt information is currently unavailable.
            </div>
          )}
        </ModalBody>
        <ModalFooter className="bg-light p-2">
          <Button color="light" className="btn-sm border" onClick={toggleModal}>
            Close
          </Button>
          <Button
            color="primary"
            className="btn-sm d-flex align-items-center gap-1"
            onClick={handlePrintReceipt}
            disabled={isPrinting || !activeTransaction}
          >
            {isPrinting ? <Spinner size="sm" /> : <i className="ri-printer-line fs-13"></i>} Print Receipt (QZ Tray)
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default SalesHistory;