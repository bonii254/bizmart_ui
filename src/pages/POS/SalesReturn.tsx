import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Spinner,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Container,
  Badge,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  Alert,
} from "reactstrap";
import { toast } from "react-toastify";

import { useCustomers } from "../../Components/Hooks/useCustomers";
import { useCustomerInvoices } from "../../Components/Hooks/useReport2";
import { useSalesReturnMutation } from "../../Components/Hooks/usePOS";
import { useSalesPerItemReport } from "../../Components/Hooks/useReports";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { useBanks } from "../../Components/Hooks/useBanks";
import { useReasonCodes } from "../../Components/Hooks/useReasonCode";
import { CreateSalesReturnRequest, SalesReturnLineRequest } from "../../types/POS";
import { CustomerInvoice } from "../../types/reports2";
import { StockItem } from "../../types/stockitem";
import { Bank } from "../../types/bank";
import { Warehouse } from "../../types/warehouse";
import { formatCurrency } from "../../utils/qzConfig";
import { handleBackendErrors } from "../../helpers/form_utils";
import { getLoggedinUser } from "../../helpers/api_helper";

const BRAND_PURPLE = "#042e6d";
const BRAND_PURPLE_SUBTLE = "rgba(4, 46, 109, 0.08)";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "CREDIT", label: "Credit" },
];

export const SalesReturn: React.FC = () => {
  const { processSalesReturn, isPosting } = useSalesReturnMutation();
  const { data: user } = getLoggedinUser();
  const operatorId = user?.operatorId || "";

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [refundBankId, setRefundBankId] = useState<string>("");
  const [paymentMethodCode, setPaymentMethodCode] = useState<string>("CASH");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [reasonCode, setReasonCode] = useState<string>("");
  
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState<string>("");
  
  // Return items quantity map tracked by itemCode (string or empty string for clean typing)
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number | "">>({});

  // Queries
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers();
  const { data: stockItemsList = [] } = useStockItems();
  const { data: warehousesData = [] } = useWarehouses();
  const { data: banksList = [] } = useBanks();
  const { data: reasonCodesList = [] } = useReasonCodes();

  const customersList = useMemo(() => {
    return Array.isArray(customersData) ? customersData : customersData ?? [];
  }, [customersData]);

  // Fetch customer invoices filtered by selected customerId
  const { data: invoicesData, isLoading: isInvoicesLoading } = useCustomerInvoices(
    customerId || null
  );

  const invoicesList = useMemo<CustomerInvoice[]>(() => {
    if (!invoicesData) return [];
    if (Array.isArray(invoicesData)) return invoicesData;
    const raw = invoicesData as any;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  }, [invoicesData]);

  const warehousesList = useMemo(() => {
    return Array.isArray(warehousesData) ? warehousesData : (warehousesData as any)?.warehouses ?? [];
  }, [warehousesData]);

  // Selected Customer Details
  const selectedCustomer = useMemo(() => {
    return customersList.find((c: any) => String(c.customerId) === String(customerId));
  }, [customersList, customerId]);

  // Build a fast lookup map for item code -> itemId from stock catalog
  const itemCodeToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    stockItemsList.forEach((si: StockItem) => {
      if (si.itemCode && si.itemId) {
        map.set(String(si.itemCode).trim().toUpperCase(), si.itemId);
      }
    });
    return map;
  }, [stockItemsList]);

  // Selected Invoice Details
  const selectedInvoice = useMemo(() => {
    return invoicesList.find((inv) => String(inv.invoiceId) === String(selectedInvoiceId));
  }, [invoicesList, selectedInvoiceId]);

  // Fetch Invoice Line Items using Sales Per Item Report filtered by invoice number
  const { data: reportItems = [], isLoading: isReportLoading } = useSalesPerItemReport({
    invoice_number: selectedInvoice?.invoiceNumber || undefined,
  } as any);

  const invoiceLines = useMemo(() => {
    if (!selectedInvoice || !reportItems) return [];
    return reportItems.filter(
      (item: any) => 
        String(item.invoiceNumber || item.invoice_number) === String(selectedInvoice.invoiceNumber)
    );
  }, [selectedInvoice, reportItems]);

  // Background Mapping: Automatically resolve Warehouse ID from selected invoice warehouse code
  const resolvedWarehouseId = useMemo(() => {
    if (!selectedInvoice || warehousesList.length === 0) return "";
    const matchedWh = warehousesList.find(
      (w: Warehouse) => 
        String(w.warehouseCode).toUpperCase() === String(selectedInvoice.warehouseCode).toUpperCase() ||
        String(w.warehouseName).toUpperCase() === String(selectedInvoice.warehouseCode).toUpperCase()
    );
    return matchedWh ? matchedWh.warehouseId : warehousesList[0]?.warehouseId || "";
  }, [selectedInvoice, warehousesList]);

  // Set default customer and bank on load
  useEffect(() => {
    if (customersList.length > 0 && !customerId) {
      setCustomerId(String(customersList[0].customerId));
    }
  }, [customersList, customerId]);

  useEffect(() => {
    if (banksList.length > 0 && !refundBankId) {
      const defaultBank = banksList.find((b: Bank) => (b.bankName ?? "").toUpperCase().includes("CASH")) || banksList[0];
      if (defaultBank) setRefundBankId(String(defaultBank.bankId));
    }
  }, [banksList, refundBankId]);

  // Reset selected invoice when customer changes
  useEffect(() => {
    setSelectedInvoiceId("");
    setReturnQuantities({});
  }, [customerId]);

  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.toLowerCase();
    return customersList.filter((c: any) => {
      const nameMatch = (c.customerName ?? "").toLowerCase().includes(query);
      const codeMatch = (c.customerCode ?? "").toLowerCase().includes(query);
      const phoneMatch = (c.phone ?? "").includes(query);
      return nameMatch || codeMatch || phoneMatch;
    });
  }, [customersList, customerSearch]);

  // Filtered Invoices (disallows selecting already returned/settled SR invoices or zero balances)
  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.toLowerCase();
    return invoicesList.filter((inv) => {
      const invNum = (inv.invoiceNumber ?? "").toLowerCase();
      const whCode = (inv.warehouseCode ?? "").toLowerCase();
      const matchesSearch = invNum.includes(query) || whCode.includes(query);
      
      const isReturnSlip = inv.invoiceNumber?.toUpperCase().startsWith("SR");
      const isFullySettled = (inv.invoiceBalance ?? 0) <= 0 && inv.invoiceTotal <= (inv.returnedAmount || 0);

      return matchesSearch && !isReturnSlip && !isFullySettled;
    });
  }, [invoicesList, invoiceSearch]);

  const handleQuantityChange = (key: string, val: string, maxQty: number) => {
    if (val === "") {
      setReturnQuantities((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    const validQty = Math.max(0, Math.min(parsed, maxQty));
    setReturnQuantities((prev) => ({
      ...prev,
      [key]: validQty,
    }));
  };

  const returnLines: SalesReturnLineRequest[] = useMemo(() => {
    return invoiceLines
      .filter((line: any) => {
        const code = String(line.itemCode || line.item_code || "").trim();
        const qty = returnQuantities[code];
        return typeof qty === "number" && qty > 0;
      })
      .map((line: any) => {
        const code = String(line.itemCode || line.item_code || "").trim();
        const resolvedItemId = line.itemId || line.item_id || itemCodeToIdMap.get(code.toUpperCase()) || "";
        return {
          itemId: resolvedItemId,
          quantity: Number(returnQuantities[code]),
          unitPrice: Number(line.unitPrice || line.unit_price || 0),
          uomCode: line.stockUom || line.stock_uom || "EA",
        };
      });
  }, [invoiceLines, returnQuantities, itemCodeToIdMap]);

  // Calculate gross return amount
  const rawReturnTotal = useMemo(() => {
    return returnLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }, [returnLines]);

  // Enforce rule: if original invoice was on credit and not yet paid (initialPayment === 0 or allocatedPayment === 0), limit cash refund
  const returnTotal = useMemo(() => {
    if (!selectedInvoice) return rawReturnTotal;
    const paidSoFar = (selectedInvoice.initialPayment || 0) + (selectedInvoice.allocatedPayment || 0);
    // If invoice was purely on credit with zero cash paid initially, prevent cash refund (or cap to what was actually paid)
    if (paymentMethodCode === "CASH" && paidSoFar <= 0) {
      return 0; // Or restrict refund type to credit note adjustment
    }
    return Math.min(rawReturnTotal, Math.max(0, paidSoFar));
  }, [rawReturnTotal, selectedInvoice, paymentMethodCode]);

  const handleClearForm = () => {
    setSelectedInvoiceId("");
    setPaymentReference("");
    setReasonCode("");
    setReturnQuantities({});
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoiceId) {
      toast.error("Please select a source invoice.");
      return;
    }

    if (!resolvedWarehouseId) {
      toast.error("Could not resolve warehouse for the selected invoice.");
      return;
    }

    if (!operatorId) {
      toast.error("Operator session is invalid. Please log in again.");
      return;
    }

    if (!refundBankId) {
      toast.error("Please select a refund bank account.");
      return;
    }

    if (returnLines.length === 0) {
      toast.error("Please specify quantities for items to return.");
      return;
    }

    // Check if trying to claim cash refund on unpaid credit sale
    if (selectedInvoice && paymentMethodCode === "CASH") {
      const paidSoFar = (selectedInvoice.initialPayment || 0) + (selectedInvoice.allocatedPayment || 0);
      if (paidSoFar <= 0) {
        toast.error("Cannot issue a cash refund for an unpaid credit sale. Please select Credit return method.");
        return;
      }
    }

    const missingIdItem = returnLines.find((l) => !l.itemId);
    if (missingIdItem) {
      toast.error("Could not map one or more item codes to valid item IDs. Please check catalog.");
      return;
    }

    if (!paymentReference.trim()) {
      toast.error("Please enter a payment reference.");
      return;
    }

    if (!reasonCode) {
      toast.error("Please select a return reason code.");
      return;
    }

    const payload: CreateSalesReturnRequest = {
      sourceInvoiceId: selectedInvoiceId,
      warehouseId: resolvedWarehouseId,
      operatorId,
      refundBankId,
      paymentMethodCode,
      paymentReference: paymentReference.trim(),
      reasonCode,
      lines: returnLines,
    };

    try {
      await processSalesReturn(payload);
      handleClearForm();
    } catch (err: unknown) {
      handleBackendErrors(err, () => {}, setGlobalError);
    }
  };

  document.title = "Sales Returns | Velzon Corporate Terminal";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {globalError && (
            <Alert color="danger" className="alert-dismissible fade show mb-3" role="alert">
              <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
              {globalError}
            </Alert>
          )}

          <Form onSubmit={handleSubmitReturn}>
            <Row className="g-3">
              {/* Left Column: Invoice Selection & Return Items */}
              <Col lg={7} xl={8}>
                {/* Invoice Selector Card */}
                <Card className="border-0 shadow-sm mb-3">
                  <CardHeader className="align-items-center d-flex bg-transparent border-bottom py-3">
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-0 fs-14 fw-semibold text-dark">Select Customer Invoice</h5>
                    </div>
                    <div className="flex-shrink-0" style={{ width: "240px" }}>
                      <Input
                        type="text"
                        placeholder="Filter invoice or warehouse..."
                        bsSize="sm"
                        className="form-control form-control-sm fs-11"
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardBody className="p-3" style={{ maxHeight: "220px", overflowY: "auto" }}>
                    {!customerId ? (
                      <div className="text-center py-4 text-muted fs-12">Please select a customer from the right panel first</div>
                    ) : isInvoicesLoading ? (
                      <div className="text-center py-4"><Spinner size="sm" color="primary" /></div>
                    ) : filteredInvoices.length > 0 ? (
                      <div className="table-responsive table-card">
                        <table className="table table-sm table-nowrap table-bordered table-striped align-middle fs-11 mb-0">
                          <thead className="table-light text-muted">
                            <tr>
                              <th>Select</th>
                              <th>Date</th>
                              <th>Invoice #</th>
                              <th>Warehouse</th>
                              <th className="text-end">Total</th>
                              <th className="text-end">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInvoices.map((inv) => {
                              const isSelected = selectedInvoiceId === inv.invoiceId;
                              return (
                                <tr
                                  key={inv.invoiceId}
                                  className={`cursor-pointer ${isSelected ? "table-primary" : ""}`}
                                  onClick={() => {
                                    setSelectedInvoiceId(inv.invoiceId);
                                    setReturnQuantities({});
                                  }}
                                >
                                  <td className="text-center">
                                    <Input
                                      type="radio"
                                      name="sourceInvoice"
                                      checked={isSelected}
                                      onChange={() => {
                                        setSelectedInvoiceId(inv.invoiceId);
                                        setReturnQuantities({});
                                      }}
                                    />
                                  </td>
                                  <td>{inv.soldAt ? new Date(inv.soldAt).toLocaleDateString() : "-"}</td>
                                  <td className="font-monospace fw-semibold text-primary">{inv.invoiceNumber}</td>
                                  <td>{inv.warehouseCode}</td>
                                  <td className="text-end font-monospace">{formatCurrency(inv.invoiceTotal)}</td>
                                  <td className="text-end font-monospace fw-semibold">{formatCurrency(inv.invoiceBalance)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted fs-12">No active invoices available for return</div>
                    )}
                  </CardBody>
                </Card>

                {/* Return Items Card */}
                <Card className="border-0 shadow-sm mb-0">
                  <CardHeader className="align-items-center d-flex bg-transparent border-bottom py-3">
                    <h5 className="card-title mb-0 fs-14 fw-semibold text-dark">Invoice Line Items (Select Return Quantities)</h5>
                  </CardHeader>
                  <CardBody className="p-3" style={{ minHeight: "260px", maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
                    {!selectedInvoiceId ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted py-5">
                        <i className="ri-file-search-line display-5 text-muted mb-2 opacity-50"></i>
                        <span className="fs-13 fw-medium">Please select a source invoice above</span>
                      </div>
                    ) : isReportLoading ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5">
                        <Spinner size="sm" color="primary" className="mb-2" />
                        <span className="text-muted fs-12">Loading invoice items...</span>
                      </div>
                    ) : invoiceLines.length > 0 ? (
                      <div className="table-responsive table-card">
                        <table className="table table-sm table-nowrap table-bordered table-striped align-middle fs-11 mb-0">
                          <thead className="table-light text-muted">
                            <tr>
                              <th>Item Code</th>
                              <th>Description</th>
                              <th className="text-end">Sold Qty</th>
                              <th className="text-end">Unit Price</th>
                              <th className="text-center" style={{ width: "120px" }}>Return Qty</th>
                              <th className="text-end">Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoiceLines.map((line: any, idx: number) => {
                              const itemCode = String(line.itemCode || line.item_code || "").trim();
                              const maxQty = Number(line.quantity || 0);
                              const unitPrice = Number(line.unitPrice || line.unit_price || 0);
                              const returnQty = returnQuantities[itemCode] ?? "";
                              const numericQty = typeof returnQty === "number" ? returnQty : 0;
                              const lineSubtotal = numericQty * unitPrice;

                              return (
                                <tr key={itemCode || idx}>
                                  <td className="font-monospace">{itemCode}</td>
                                  <td>{line.description}</td>
                                  <td className="text-end font-monospace">{maxQty}</td>
                                  <td className="text-end font-monospace">{formatCurrency(unitPrice)}</td>
                                  <td className="text-center">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={maxQty}
                                      bsSize="sm"
                                      className="form-control form-control-sm text-center font-monospace fs-11 py-0.5"
                                      value={returnQty}
                                      onChange={(e) => handleQuantityChange(itemCode, e.target.value, maxQty)}
                                    />
                                  </td>
                                  <td className="text-end font-monospace fw-semibold">{formatCurrency(lineSubtotal)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-5 text-muted fs-12">No items found in this invoice</div>
                    )}
                  </CardBody>
                </Card>
              </Col>

              {/* Right Column: Return Details & Customer Selector */}
              <Col lg={5} xl={4}>
                <Card className="card-height-100 border-0 shadow-sm mb-0">
                  <CardHeader className="align-items-center d-flex bg-transparent border-bottom py-3">
                    <h5 className="card-title mb-0 fs-14 fw-semibold text-dark">Return Details</h5>
                  </CardHeader>

                  <CardBody className="p-3" style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                    {/* Customer Selector Dropdown */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Customer</label>
                      <Dropdown isOpen={isCustomerDropdownOpen} toggle={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)} className="w-100">
                        <DropdownToggle tag="div" className="d-flex justify-content-between align-items-center p-2 bg-light rounded cursor-pointer border border-light">
                          <span className="fs-12 fw-medium text-dark text-truncate">
                            {selectedCustomer?.customerName ?? "Select Customer"}
                          </span>
                          <i className="ri-arrow-down-s-line text-muted"></i>
                        </DropdownToggle>
                        <DropdownMenu className="p-2 shadow-lg w-100 border-0 rounded-3">
                          <Input
                            type="text"
                            placeholder="Search customer..."
                            bsSize="sm"
                            className="mb-2 fs-12 shadow-none border-light bg-light"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                          />
                          <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                            {isCustomersLoading ? (
                              <div className="text-center py-2"><Spinner size="sm" color="primary" /></div>
                            ) : (
                              filteredCustomers.map((c: any) => (
                                <div
                                  key={c.customerId}
                                  className="p-2 rounded fs-12 cursor-pointer hover-bg-light"
                                  onClick={() => {
                                    setCustomerId(c.customerId);
                                    setIsCustomerDropdownOpen(false);
                                  }}
                                >
                                  <span className="fw-medium text-dark d-block">{c.customerName}</span>
                                  <span className="text-muted fs-11">Limit: {formatCurrency(c.creditLimit ?? 0)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </DropdownMenu>
                      </Dropdown>
                    </div>

                    {/* Payment Method Code: CASH or CREDIT */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Refund Payment Method</label>
                      <div className="d-flex gap-2">
                        {PAYMENT_METHODS.map((pm) => (
                          <div
                            key={pm.id}
                            className="flex-grow-1 text-center py-2 rounded cursor-pointer border fw-semibold fs-12 transition-all"
                            onClick={() => setPaymentMethodCode(pm.id)}
                            style={{
                              backgroundColor: paymentMethodCode === pm.id ? BRAND_PURPLE_SUBTLE : "#fff",
                              color: paymentMethodCode === pm.id ? BRAND_PURPLE : "#495057",
                              borderColor: paymentMethodCode === pm.id ? BRAND_PURPLE : "#dee2e6",
                            }}
                          >
                            {pm.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Refund Bank Selection */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Refund Bank Account</label>
                      <Input
                        type="select"
                        className="form-select form-select-sm fs-12"
                        value={refundBankId}
                        onChange={(e) => setRefundBankId(e.target.value)}
                      >
                        <option value="" disabled>Select Bank</option>
                        {banksList.map((b: Bank) => (
                          <option key={b.bankId} value={b.bankId}>
                            {b.bankName} - {b.accountNumber}
                          </option>
                        ))}
                      </Input>
                    </div>

                    {/* Reason Code Selection */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Reason Code</label>
                      <Input
                        type="select"
                        className="form-select form-select-sm fs-12"
                        value={reasonCode}
                        onChange={(e) => setReasonCode(e.target.value)}
                      >
                        <option value="" disabled>Select Reason Code</option>
                        {reasonCodesList.map((rc: any) => (
                          <option key={rc.reasonCode} value={rc.reasonCode}>
                            {rc.reasonCode} - {rc.description}
                          </option>
                        ))}
                      </Input>
                    </div>

                    {/* Payment Reference */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Payment Reference</label>
                      <Input
                        type="text"
                        placeholder="e.g. SR0000001"
                        bsSize="sm"
                        className="form-control form-control-sm fs-12"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                      />
                    </div>

                    {/* Return Total Display */}
                    <div className="p-3 bg-light rounded border border-light mt-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fs-12 fw-semibold text-muted">Total Refund Amount:</span>
                        <h4 className="mb-0 fw-bold text-dark fs-18 font-monospace">
                          {formatCurrency(returnTotal)}
                        </h4>
                      </div>
                    </div>
                  </CardBody>

                  <div className="p-3 bg-white border-top">
                    <Button
                      type="submit"
                      className="w-100 border-0 rounded py-2 shadow-sm d-flex justify-content-between align-items-center px-3"
                      style={{
                        backgroundColor: isPosting ? "#a3b4cc" : BRAND_PURPLE,
                      }}
                      disabled={isPosting || returnLines.length === 0}
                    >
                      <span className="fs-13 fw-semibold text-white">
                        {isPosting ? "Processing Return..." : "Submit Sales Return"}
                      </span>
                      {!isPosting && <i className="ri-send-plane-fill fs-15 text-white opacity-75"></i>}
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SalesReturn;