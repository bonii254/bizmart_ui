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

import {
  useSalesTransactions,
  useSaleDetails,
} from "../../Components/Hooks/usePOS";

import {
  SalesTransaction,
  SalesTransactionQueryParams,
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

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Memoize API Query Parameters
  const queryParams: SalesTransactionQueryParams = useMemo(() => {
    return {
      ...(startDate && { fromDate: startDate }),
      ...(endDate && { toDate: endDate }),
    };
  }, [startDate, endDate]);

  const { data: salesResponse, isLoading, refetch } = useSalesTransactions(queryParams);
  const { data: saleDetailData, isLoading: isDetailLoading } = useSaleDetails(selectedSaleId);

  const salesList: SalesTransaction[] = useMemo(() => {
    if (!salesResponse) return [];
    if (Array.isArray(salesResponse.data)) return salesResponse.data;
    return [];
  }, [salesResponse]);

  const activeTransaction: any = useMemo(() => {
    if (!saleDetailData) return null;
    return saleDetailData;
  }, [saleDetailData]);

  const filteredSales = useMemo(() => {
    return salesList.filter((sale: SalesTransaction) => {
      const matchesSearch =
        sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.operator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.warehouse_code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPayment =
        paymentFilter === "ALL" || sale.payment_method_code?.toUpperCase() === paymentFilter.toUpperCase();

      // Client-Side Date Range Filter
      let matchesDate = true;
      if (sale.sold_at) {
        const saleDate = new Date(sale.sold_at).getTime();
        if (startDate) {
          const start = new Date(startDate).setHours(0, 0, 0, 0);
          if (saleDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate).setHours(23, 59, 59, 999);
          if (saleDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [salesList, searchTerm, paymentFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  const kpis = useMemo(() => {
    const list = filteredSales;
    const totalRev = list.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const totalTxns = list.length;
    const avgTicket = totalTxns > 0 ? totalRev / totalTxns : 0;
    const totalPaid = list.reduce((acc, curr) => acc + (curr.paid || 0), 0);

    return { totalRev, totalTxns, avgTicket, totalPaid };
  }, [filteredSales]);

  const toggleModal = () => {
    if (isDetailModalOpen) {
      setSelectedSaleId(null);
    }
    setIsDetailModalOpen(!isDetailModalOpen);
  };

  const handleViewReceipt = (invoiceId: string) => {
    setSelectedSaleId(invoiceId);
    setIsDetailModalOpen(true);
  };

  const handleExportExcel = () => {
    const headers = [
      "Invoice Number",
      "Sold At Date",
      "Warehouse Code",
      "Customer Name",
      "Operator Name",
      "Payment Method",
      "Bank Name",
      "Payment Ref",
      "Total Amount (Ksh)",
      "Paid Amount (Ksh)",
    ];

    const rows = filteredSales.map((sale) => [
      `"${sale.invoice_number || ""}"`,
      `"${sale.sold_at ? new Date(sale.sold_at).toLocaleString() : "N/A"}"`,
      `"${sale.warehouse_code || ""}"`,
      `"${sale.customer_name || "Walk-In Customer"}"`,
      `"${sale.operator_name || "SYS_POS"}"`,
      `"${sale.payment_method_code || ""}"`,
      `"${sale.bank_name || ""}"`,
      `"${sale.payment_reference || ""}"`,
      `"${formatCurrency(sale.total || 0)}"`,
      `"${formatCurrency(sale.paid || 0)}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Transactions_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReceipt = async () => {
    if (!activeTransaction) return;
    setIsPrinting(true);
    try {
      await connectToQZ();

      const receiptPayload: ReceiptData = {
        companyName: "FRESHA ENTERPRISES",
        storeName: activeTransaction.warehouseCode || "MAIN WAREHOUSE",
        receiptNo: activeTransaction.documentNumber || activeTransaction.invoice_number || "N/A",
        date: activeTransaction.postedAt
          ? new Date(activeTransaction.postedAt).toLocaleString()
          : new Date().toLocaleString(),
        cashier: activeTransaction.operatorName || "SYS_POS",
        customerName: activeTransaction.customerName || "Walk-In Customer",
        items: (activeTransaction.lines || activeTransaction.items || []).map((item: any) => ({
          name: item.description || item.stockItemName || "Item",
          qty: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          discount: item.discount ?? 0,
          taxRate: item.taxRate ?? 0,
          taxAmount: item.taxAmount ?? 0,
          total: item.lineTotal || (item.quantity * item.unitPrice) || 0,
        })),
        subtotal: activeTransaction.subTotal || activeTransaction.total || 0,
        discountTotal: activeTransaction.discountTotal ?? 0,
        taxTotal: activeTransaction.taxTotal || 0,
        grandTotal: activeTransaction.total || activeTransaction.grandTotal || 0,
        paymentMethod: activeTransaction.paymentMethodCode || "CASH",
        amountTendered: activeTransaction.paidAmount || activeTransaction.paid || 0,
        changeAmount: activeTransaction.changeAmount || 0,
      };

      const escposCommands = generateESCPOSText(receiptPayload);
      const printerConfig = qz.configs.create(null);
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
                    sales ledger, cash register audit, and transaction history
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Total Sales Revenue</p>
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Total Transactions</p>
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
                      <p className="text-uppercase fw-semibold fs-11 text-muted mb-1">Total Settlement Paid</p>
                      <h4 className="fs-18 fw-bold mb-0 text-primary">{formatCurrency(kpis.totalPaid)}</h4>
                    </div>
                    <div className="avatar-sm rounded bg-warning-subtle text-warning d-flex align-items-center justify-content-center">
                      <i className="ri-bank-card-line fs-20"></i>
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
                    placeholder="Search invoice no, customer, operator, warehouse..."
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
                    value={paymentFilter}
                    onChange={(e) => {
                      setPaymentFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="CASH">Cash</option>
                    <option value="MOBILE">Mobile Money</option>
                    <option value="CARD">Card</option>
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

          {/* ERP Sales Transactions Table */}
          <Card className="border-0 shadow-sm">
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="table-hover table-nowrap align-middle mb-0 fs-12">
                  <thead className="table-light text-muted text-uppercase fs-11">
                    <tr>
                      <th style={{ width: "12%" }}>Invoice #</th>
                      <th style={{ width: "15%" }}>Sold Date</th>
                      <th style={{ width: "10%" }}>Warehouse</th>
                      <th style={{ width: "18%" }}>Customer</th>
                      <th style={{ width: "13%" }}>Operator</th>
                      <th style={{ width: "12%" }}>Payment Method</th>
                      <th style={{ width: "10%" }} className="text-end">Total</th>
                      <th style={{ width: "10%" }} className="text-end">Paid</th>
                      <th style={{ width: "5%" }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5">
                          <Spinner size="sm" color="primary" className="me-2" />
                          <span className="text-muted">Fetching sales transactions...</span>
                        </td>
                      </tr>
                    ) : paginatedSales.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5 text-muted">
                          <i className="ri-inbox-archive-line display-6 d-block mb-2 text-muted opacity-50"></i>
                          No sales transactions match your criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedSales.map((sale: SalesTransaction) => (
                        <tr key={sale.invoice_id}>
                          <td>
                            <button
                              type="button"
                              className="btn btn-link p-0 fw-semibold text-primary font-monospace text-decoration-underline border-0 bg-transparent"
                              onClick={() => handleViewReceipt(sale.invoice_id)}
                              title="Click to view detailed receipt"
                            >
                              {sale.invoice_number}
                            </button>
                          </td>
                          <td className="text-muted fs-11">
                            {sale.sold_at ? new Date(sale.sold_at).toLocaleString() : "N/A"}
                          </td>
                          <td className="font-monospace text-dark">{sale.warehouse_code}</td>
                          <td>
                            <div className="fw-medium text-dark">{sale.customer_name || "Walk-In Customer"}</div>
                          </td>
                          <td className="text-muted font-monospace">{sale.operator_name || "SYS_POS"}</td>
                          <td>
                            <Badge color="light" className="text-dark border font-monospace fs-10">
                              <i className="ri-wallet-3-line me-1 text-primary"></i>
                              {sale.payment_method_code}
                            </Badge>
                          </td>
                          <td className="text-end fw-bold text-dark">
                            {formatCurrency(sale.total || 0)}
                          </td>
                          <td className="text-end fw-semibold text-success font-monospace">
                            {formatCurrency(sale.paid || 0)}
                          </td>
                          <td className="text-center">
                            <Button
                              color="light"
                              size="sm"
                              className="btn-icon waves-effect fs-12 border-0"
                              onClick={() => handleViewReceipt(sale.invoice_id)}
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

              {/* Pagination Controls */}
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
              <p className="text-muted fs-12 mb-0">Loading detailed transaction ledger...</p>
            </div>
          ) : activeTransaction ? (
            <div>
              {/* Receipt Metadata Grid */}
              <Row className="mb-3 p-3 bg-light-subtle rounded border border-light-subtle fs-12">
                <Col md={3} xs={6} className="mb-2 mb-md-0">
                  <span className="text-muted d-block fs-11">Document Number</span>
                  <span className="fw-semibold text-primary font-monospace">
                    {activeTransaction.documentNumber || activeTransaction.invoice_number}
                  </span>
                </Col>
                <Col md={3} xs={6} className="mb-2 mb-md-0">
                  <span className="text-muted d-block fs-11">Customer</span>
                  <span className="fw-semibold text-dark">
                    {activeTransaction.customerName || "Walk-In Customer"}
                  </span>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block fs-11">Posted At</span>
                  <span className="fw-semibold text-dark">
                    {activeTransaction.postedAt ? new Date(activeTransaction.postedAt).toLocaleString() : "N/A"}
                  </span>
                </Col>
                <Col md={3} xs={6}>
                  <span className="text-muted d-block fs-11">Grand Total</span>
                  <span className="fw-semibold text-success font-monospace">
                    {formatCurrency(activeTransaction.total || 0)}
                  </span>
                </Col>
              </Row>

              {/* ERP Financial Summary */}
              <Row className="justify-content-end">
                <Col md={6}>
                  <div className="p-3 bg-light rounded fs-12">
                    <div className="d-flex justify-content-between fw-bold fs-14 text-dark mb-1">
                      <span>Total Amount:</span>
                      <span className="text-success">{formatCurrency(activeTransaction.total || 0)}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              Receipt details currently unavailable.
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