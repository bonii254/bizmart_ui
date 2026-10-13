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

import { useSuppliers } from "../../Components/Hooks/useSuppliers";
import { useBanks } from "../../Components/Hooks/useBanks";
import { 
  useSupplierStatement 
} from "../../Components/Hooks/useReport2";
import { 
  useSupplierPaymentMutation 
} from "../../Components/Hooks/useSuppliers";
import { 
  CreateSupplierPaymentRequest 
} from "../../types/supplier";
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

export const SupplierPayment: React.FC = () => {
  const { processSupplierPayment, isPosting } = useSupplierPaymentMutation();
  const { data: user } = getLoggedinUser();
  const operatorId = user?.operatorId;

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string>("");
  const [bankId, setBankId] = useState<string>("");
  const [paymentMethodCode, setPaymentMethodCode] = useState<string>("CASH");
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [goodsReceiptId, setGoodsReceiptId] = useState<string>("");

  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  // Queries
  const { data: suppliersList = [], isLoading: isSuppliersLoading } = useSuppliers();
  const { data: banksList = [], isLoading: isBanksLoading } = useBanks();

  // Supplier Statement & Ledger Info
  const { data: statementData, isLoading: isStatementLoading } = useSupplierStatement({
    supplierId: supplierId || "",
  });

  const statementItems = useMemo(() => {
    if (!statementData) return [];
    return Array.isArray(statementData) ? statementData : statementData.data ?? [];
  }, [statementData]);

  // Selected Supplier Details
  const selectedSupplier = useMemo(() => {
    return suppliersList.find((s) => String(s.supplierId) === String(supplierId));
  }, [suppliersList, supplierId]);

  // Set default supplier and bank on load
  useEffect(() => {
    if (suppliersList.length > 0 && !supplierId) {
      setSupplierId(String(suppliersList[0].supplierId));
    }
  }, [suppliersList, supplierId]);

  useEffect(() => {
    if (banksList.length > 0 && !bankId) {
      const defaultBank = banksList.find((b: Bank) => (b.bankName ?? "").toUpperCase().includes("CASH")) || banksList[0];
      if (defaultBank) setBankId(String(defaultBank.bankId));
    }
  }, [banksList, bankId]);

  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.toLowerCase();
    return suppliersList.filter((s) => {
      const nameMatch = (s.supplierName ?? "").toLowerCase().includes(query);
      const codeMatch = (s.supplierCode ?? "").toLowerCase().includes(query);
      return nameMatch || codeMatch;
    });
  }, [suppliersList, supplierSearch]);

  const handleClearForm = () => {
    setAmount("");
    setReference("");
    setGoodsReceiptId("");
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error("Please select a valid supplier.");
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

    const payload: CreateSupplierPaymentRequest = {
      supplierId,
      operatorId,
      bankId,
      amount: parsedAmount,
      paymentMethodCode,
      reference: reference.trim(),
      goodsReceiptId: goodsReceiptId.trim() || "00000000-0000-0000-0000-000000000000",
    };

    try {
      await processSupplierPayment(payload);
      handleClearForm();
    } catch (err: unknown) {
      handleBackendErrors(err, () => {}, setGlobalError);
    }
  };

  document.title = "Supplier Payments | Velzon Corporate Terminal";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Form onSubmit={handleSubmitPayment}>
            <Row className="g-3">
              {/* Left Column: Supplier Statement / Invoices Ledger */}
              <Col lg={7} xl={8}>
                <Card className="card-height-100 border-0 shadow-sm mb-0">
                  <CardHeader className="align-items-center d-flex bg-transparent border-bottom py-3">
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-0 fs-14 fw-semibold text-dark">Supplier Activity & Goods Receipts</h5>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="badge bg-light text-muted fs-11 border">Terms: {selectedSupplier?.paymentTermsDays ?? 0} Days</span>
                    </div>
                  </CardHeader>

                  <CardBody className="p-3" style={{ minHeight: "420px", maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                    {!supplierId ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted py-5">
                        <i className="ri-user-search-line display-5 text-muted mb-2 opacity-50"></i>
                        <span className="fs-13 fw-medium">Select a supplier to view history</span>
                      </div>
                    ) : isStatementLoading ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5">
                        <Spinner size="sm" color="primary" className="mb-2" />
                        <span className="text-muted fs-12">Loading supplier statement...</span>
                      </div>
                    ) : statementItems.length > 0 ? (
                      <div className="table-responsive table-card">
                        <table className="table table-sm table-nowrap table-bordered table-striped align-middle fs-11 mb-0">
                          <thead className="table-light text-muted">
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Doc #</th>
                              <th className="text-start">Debit</th>
                              <th className="text-start">Credit</th>
                              <th className="text-start">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statementItems.map((item: any, idx: number) => (
                              <tr key={idx} className="cursor-pointer" onClick={() => item.document_number && setGoodsReceiptId(item.document_number)}>
                                <td>{item.posted_at ? new Date(item.posted_at).toLocaleDateString() : "-"}</td>
                                <td><Badge color="subtle-secondary" className="text-dark border">{item.transaction_type}</Badge></td>
                                <td className="font-monospace text-primary">{item.document_number}</td>
                                <td className="text-start font-monospace">{formatCurrency(item.debit)}</td>
                                <td className="text-start font-monospace">{formatCurrency(item.credit)}</td>
                                <td className="text-start font-monospace fw-semibold">{formatCurrency(item.running_balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5 text-muted">
                        <i className="ri-inbox-line display-5 opacity-50 mb-2"></i>
                        <span className="fs-13 fw-medium">No recent statement records found</span>
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
                    {/* Supplier Selector Dropdown */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Supplier</label>
                      <Dropdown isOpen={isSupplierDropdownOpen} toggle={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)} className="w-100">
                        <DropdownToggle tag="div" className="d-flex justify-content-between align-items-center p-2 bg-light rounded cursor-pointer border border-light">
                          <span className="fs-12 fw-medium text-dark text-truncate">
                            {selectedSupplier?.supplierName ?? "Select Supplier"}
                          </span>
                          <i className="ri-arrow-down-s-line text-muted"></i>
                        </DropdownToggle>
                        <DropdownMenu className="p-2 shadow-lg w-100 border-0 rounded-3">
                          <Input
                            type="text"
                            placeholder="Search supplier..."
                            bsSize="sm"
                            className="mb-2 fs-12 shadow-none border-light bg-light"
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                          />
                          <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                            {isSuppliersLoading ? (
                              <div className="text-center py-2"><Spinner size="sm" color="primary" /></div>
                            ) : (
                              filteredSuppliers.map((s) => (
                                <div
                                  key={s.supplierId}
                                  className="p-2 rounded fs-12 cursor-pointer hover-bg-light"
                                  onClick={() => {
                                    setSupplierId(s.supplierId);
                                    setIsSupplierDropdownOpen(false);
                                  }}
                                >
                                  <span className="fw-medium text-dark d-block">{s.supplierName}</span>
                                  <span className="text-muted fs-11">{s.phone}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </DropdownMenu>
                      </Dropdown>
                    </div>

                    {/* Restricted Payment Methods: CASH or CREDIT */}
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
                        placeholder="e.g. TXN-98432"
                        bsSize="sm"
                        className="form-control form-control-sm fs-12"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                      />
                    </div>

                    {/* Goods Receipt ID */}
                    <div className="mb-2">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Goods Receipt ID</label>
                      <Input
                        type="text"
                        placeholder="Optional GUID or Doc Ref"
                        bsSize="sm"
                        className="form-control form-control-sm fs-12 font-monospace"
                        value={goodsReceiptId}
                        onChange={(e) => setGoodsReceiptId(e.target.value)}
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
                        {isPosting ? "Processing Payment..." : "Submit Payment"}
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

export default SupplierPayment;