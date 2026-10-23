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
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  Alert,
} from "reactstrap";
import { toast } from "react-toastify";

import { useCustomers, useCustomerPaymentMutation } from "../../Components/Hooks/useCustomers"; 
import { useBanks } from "../../Components/Hooks/useBanks";
import { useCustomerInvoices } from "../../Components/Hooks/useReport2";
import { CreateCustomerPaymentRequest } from "../../types/customer";
import { CustomerInvoice } from "../../types/reports2";
import { Bank } from "../../types/bank";
import { formatCurrency } from "../../utils/qzConfig";
import { handleBackendErrors } from "../../helpers/form_utils";
import { getLoggedinUser } from "../../helpers/api_helper";

const BRAND_PURPLE = "#042e6d";
const BRAND_PURPLE_SUBTLE = "rgba(4, 46, 109, 0.08)";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "CREDIT", label: "Credit" },
];

export const CustomerPayment: React.FC = () => {
  const { processCustomerPayment, isPosting } = useCustomerPaymentMutation();
  const { data: user } = getLoggedinUser();
  const operatorId = user?.operatorId;

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>("");
  const [bankId, setBankId] = useState<string>("");
  const [paymentMethodCode, setPaymentMethodCode] = useState<string>("CASH");
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [invoiceId, setInvoiceId] = useState<string>("");

  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");

  // Queries
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers();
  const { data: banksList = [], isLoading: isBanksLoading } = useBanks();

  const customersList = useMemo(() => {
    return Array.isArray(customersData) ? customersData : customersData ?? [];
  }, [customersData]);

  // Fetch Customer Invoices filtered by customerId
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

  // Selected Customer Details
  const selectedCustomer = useMemo(() => {
    return customersList.find((c: any) => String(c.customerId) === String(customerId));
  }, [customersList, customerId]);

  // Filtered Invoices based on search input
  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.toLowerCase();
    return invoicesList.filter((inv) => {
      const invNum = (inv.invoiceNumber ?? "").toLowerCase();
      const whCode = (inv.warehouseCode ?? "").toLowerCase();
      return invNum.includes(query) || whCode.includes(query);
    });
  }, [invoicesList, invoiceSearch]);

  // Set default customer and bank on load
  useEffect(() => {
    if (customersList.length > 0 && !customerId) {
      setCustomerId(String(customersList[0].customerId));
    }
  }, [customersList, customerId]);

  useEffect(() => {
    if (banksList.length > 0 && !bankId) {
      const defaultBank = banksList.find((b: Bank) => (b.bankName ?? "").toUpperCase().includes("CASH")) || banksList[0];
      if (defaultBank) setBankId(String(defaultBank.bankId));
    }
  }, [banksList, bankId]);

  // Reset selected invoice when customer changes
  useEffect(() => {
    setInvoiceId("");
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

  const handleClearForm = () => {
    setAmount("");
    setReference("");
    setInvoiceId("");
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error("Please select a valid customer.");
      return;
    }

    if (!bankId) {
      toast.error("Please select a valid bank account.");
      return;
    }

    if (!operatorId) {
      toast.error("Operator session is invalid. Please log in again.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    if (!reference.trim()) {
      toast.error("Please enter a payment reference.");
      return;
    }

    const payload: CreateCustomerPaymentRequest = {
      customerId,
      operatorId,
      bankId,
      amount: parsedAmount,
      paymentMethodCode,
      reference: reference.trim(),
      invoiceId: invoiceId.trim() || "00000000-0000-0000-0000-000000000000",
    };

    try {
      await processCustomerPayment(payload);
      handleClearForm();
    } catch (err: unknown) {
      handleBackendErrors(err, () => {}, setGlobalError);
    }
  };

  document.title = "Customer Payments | Velzon Corporate Terminal";

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

          <Form onSubmit={handleSubmitPayment}>
            <Row className="g-3">
              {/* Left Column: Customer Invoices */}
              <Col lg={7} xl={8}>
                <Card className="card-height-100 border-0 shadow-sm mb-0">
                  <CardHeader className="align-items-center d-flex bg-transparent border-bottom py-3">
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-0 fs-14 fw-semibold text-dark">Customer Invoices</h5>
                    </div>
                    <div className="flex-shrink-0" style={{ width: "220px" }}>
                      <Input
                        type="text"
                        placeholder="Quick search invoice..."
                        bsSize="sm"
                        className="form-control form-control-sm fs-11"
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                      />
                    </div>
                  </CardHeader>

                  <CardBody className="p-3" style={{ minHeight: "420px", maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                    {!customerId ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted py-5">
                        <i className="ri-user-search-line display-5 text-muted mb-2 opacity-50"></i>
                        <span className="fs-13 fw-medium">Select a customer to view invoices</span>
                      </div>
                    ) : isInvoicesLoading ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5">
                        <Spinner size="sm" color="primary" className="mb-2" />
                        <span className="text-muted fs-12">Loading customer invoices...</span>
                      </div>
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
                              const isSelected = invoiceId === inv.invoiceId;
                              return (
                                <tr
                                  key={inv.invoiceId}
                                  className={`cursor-pointer ${isSelected ? "table-primary" : ""}`}
                                  onClick={() => setInvoiceId(inv.invoiceId)}
                                >
                                  <td className="text-center">
                                    <Input
                                      type="radio"
                                      name="selectedInvoice"
                                      checked={isSelected}
                                      onChange={() => setInvoiceId(inv.invoiceId)}
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
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5 text-muted">
                        <i className="ri-inbox-line display-5 opacity-50 mb-2"></i>
                        <span className="fs-13 fw-medium">No customer invoices found</span>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>

              {/* Right Column: Payment Form & Details */}
              <Col lg={5} xl={4}>
                <Card className="card-height-100 border-0 shadow-sm mb-0">
                  <CardHeader className="align-items-center d-flex bg-transparent border-bottom py-3">
                    <h5 className="card-title mb-0 fs-14 fw-semibold text-dark">Payment Details</h5>
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

                    {/* Payment Methods */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Payment Method</label>
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

                    {/* Bank Selection */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Bank Account</label>
                      {isBanksLoading ? (
                        <Spinner size="sm" color="primary" />
                      ) : (
                        <Input
                          type="select"
                          className="form-select form-select-sm fs-12"
                          value={bankId}
                          onChange={(e) => setBankId(e.target.value)}
                        >
                          <option value="" disabled>Select Bank</option>
                          {banksList.map((b: Bank) => (
                            <option key={b.bankId} value={b.bankId}>
                              {b.bankName} - {b.accountNumber}
                            </option>
                          ))}
                        </Input>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Amount</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        bsSize="sm"
                        className="form-control form-control-sm fs-13 fw-bold text-end font-monospace"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>

                    {/* Reference */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Payment Reference</label>
                      <Input
                        type="text"
                        placeholder="e.g. CUST-TXN-1002"
                        bsSize="sm"
                        className="form-control form-control-sm fs-12"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                      />
                    </div>

                    {/* Selected Invoice ID Display */}
                    <div className="mb-2">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Selected Invoice</label>
                      <Input
                        type="text"
                        readOnly
                        placeholder="Click an invoice on the left"
                        bsSize="sm"
                        className="form-control form-control-sm fs-11 font-monospace bg-light"
                        value={invoicesList.find(
                          (inv) => inv.invoiceId === invoiceId
                        )?.invoiceNumber || invoiceId || ""}
                      />
                    </div>
                  </CardBody>

                  <div className="p-3 bg-white border-top">
                    <Button
                      type="submit"
                      className="w-100 border-0 rounded py-2 shadow-sm d-flex justify-content-between align-items-center px-3"
                      style={{
                        backgroundColor: isPosting ? "#a3b4cc" : BRAND_PURPLE,
                      }}
                      disabled={isPosting}
                    >
                      <span className="fs-13 fw-semibold text-white">
                        {isPosting ? "Processing Payment..." : "Submit Customer Payment"}
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

export default CustomerPayment;