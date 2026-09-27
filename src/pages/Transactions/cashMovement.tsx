import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Spinner,
  Alert,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { toast } from "react-toastify";

import { useCashMovementMutation } from "../../Components/Hooks/useTransactions";
import { useBanks } from "../../Components/Hooks/useBanks";
import { getLoggedinUser } from "../../helpers/api_helper";
import {
  CashMovementType,
  CreateCashMovementRequest,
  CashMovementResultData,
} from "../../types/transactions";
import { Bank } from "../../types/bank";

const BRAND_PRIMARY = "#042e6d";

export const CashMovement: React.FC = () => {
  const { createCashMovement, isPosting } = useCashMovementMutation();
  // Fetch banks using the strongly typed useBanks hook
  const { data: banksList = [], isLoading: isBanksLoading } = useBanks();

  // Extract current logged-in user details
  const { data: user } = getLoggedinUser();
  const operatorId = user?.operatorId || "";
  const operatorName = user?.userName || user?.displayname || "Authenticated Operator";
  const operatorRole = user?.roleCode;

  // Form State
  const [movementType, setMovementType] = useState<CashMovementType>("Payment");
  const [bankId, setBankId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [reference, setPaymentReference] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Success Modal State
  const [successData, setSuccessData] = useState<CashMovementResultData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Auto-select the first active bank when the bank list is loaded
  useEffect(() => {
    if (banksList.length > 0 && !bankId) {
      const activeBanks = banksList.filter((b) => b.isActive !== false);
      const initialBank = activeBanks.length > 0 ? activeBanks[0] : banksList[0];
      if (initialBank?.bankId) {
        setBankId(String(initialBank.bankId));
      }
    }
  }, [banksList, bankId]);

  // Auto-dismiss form error alert after 5 seconds
  useEffect(() => {
    if (formError) {
      const timer = setTimeout(() => {
        setFormError(null);
      }, 5000);

      return () => clearTimeout(timer); // Cleanup timer if component unmounts or formError changes
    }
  }, [formError]);

  const handleClearForm = () => {
    setAmount("");
    setPaymentReference("");
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!operatorId) {
      const msg = "Operator session is invalid. Please re-authenticate.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (!bankId) {
      const msg = "Please select a target bank/account.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const msg = "Please enter a valid amount greater than zero.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (!reference.trim()) {
      const msg = "Please provide a transaction reference or document code.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const payload: CreateCashMovementRequest = {
      movementType,
      operatorId,
      bankId,
      amount: parsedAmount,
      reference: reference.trim(),
    };

    try {
      const result = await createCashMovement(payload);
      setSuccessData(result);
      setIsModalOpen(true);
      handleClearForm();
    } catch (err: any) {
      const apiMessage =
        err.response?.data?.message || err.message || "Failed to process cash movement.";
      setFormError(apiMessage);
    }
  };

  const selectedBank = banksList.find((b: Bank) => String(b.bankId) === String(bankId));

  document.title = "Cash Movements | Treasury & Banking";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Full-width Layout Container */}
          <Row>
            <Col xs={12}>
              <Card className="shadow-sm border-0 rounded-3">
                <CardHeader className="bg-white border-bottom py-3 px-4">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <h5 className="card-title mb-0 fs-15 fw-semibold text-dark">
                        Cash Movement Entry
                      </h5>
                      <p className="text-muted fs-12 mb-0">
                        Record and post cash deposits or withdrawals against authorized bank accounts.
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge
                        color={movementType === "Payment" ? "soft-success" : "soft-danger"}
                        className="fs-12 px-3 py-1.5 text-uppercase fw-semibold"
                      >
                        <i
                          className={`me-1 align-middle ${
                            movementType === "Payment"
                              ? "ri-arrow-down-circle-line"
                              : "ri-arrow-up-circle-line"
                          }`}
                        ></i>
                        {movementType} Mode
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <Form onSubmit={handleSubmit}>
                  <CardBody className="p-4">
                    {formError && (
                      <Alert color="danger" className="alert-dismissible fade show fs-13 mb-4">
                        <i className="ri-error-warning-line me-2 align-middle"></i>
                        {formError}
                      </Alert>
                    )}

                    {/* Active Operator Session Strip */}
                    <div className="bg-light rounded-3 p-3 mb-4 border border-light-subtle d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="avatar-xs rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-12"
                          style={{ backgroundColor: BRAND_PRIMARY }}
                        >
                          {operatorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-muted fs-11 d-block lh-1 mb-1">
                            Active Operator Session
                          </span>
                          <h6 className="fs-13 fw-semibold text-dark mb-0">{operatorName}</h6>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-white text-dark border border-light-subtle font-monospace fs-11 px-2.5 py-1">
                          OPERATOR role: {operatorRole || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Full-width Horizontal Grid Form Fields */}
                    <Row className="g-3">
                      {/* Movement Type Switcher */}
                      <Col md={6} xl={3}>
                        <FormGroup className="mb-0">
                          <Label className="fs-12 fw-medium text-dark mb-2">
                            Movement Type <span className="text-danger">*</span>
                          </Label>
                          <Row className="g-2">
                            <Col xs={6}>
                              <div
                                onClick={() => setMovementType("Payment")}
                                className={`p-2 rounded border text-center cursor-pointer transition-all user-select-none fs-12 ${
                                  movementType === "Payment"
                                    ? "border-success bg-success-subtle text-success fw-semibold"
                                    : "border-light-subtle bg-white text-muted"
                                }`}
                              >
                                <i className="ri-arrow-down-circle-line me-1 align-middle"></i>
                                Payment
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div
                                onClick={() => setMovementType("Withdrawal")}
                                className={`p-2 rounded border text-center cursor-pointer transition-all user-select-none fs-12 ${
                                  movementType === "Withdrawal"
                                    ? "border-danger bg-danger-subtle text-danger fw-semibold"
                                    : "border-light-subtle bg-white text-muted"
                                }`}
                              >
                                <i className="ri-arrow-up-circle-line me-1 align-middle"></i>
                                Withdraw
                              </div>
                            </Col>
                          </Row>
                        </FormGroup>
                      </Col>

                      {/* Target Bank Dropdown */}
                      <Col md={6} xl={3}>
                        <FormGroup className="mb-0">
                          <Label htmlFor="bankSelect" className="fs-12 fw-medium text-dark mb-1">
                            Target Bank / Account <span className="text-danger">*</span>
                          </Label>
                          {isBanksLoading ? (
                            <div className="d-flex align-items-center gap-2 py-2">
                              <Spinner size="sm" color="primary" />
                              <span className="fs-12 text-muted">Loading banks...</span>
                            </div>
                          ) : (
                            <Input
                              id="bankSelect"
                              type="select"
                              className="form-select fs-13"
                              value={bankId}
                              onChange={(e) => setBankId(e.target.value)}
                            >
                              <option value="" disabled>
                                -- Select Bank Account --
                              </option>
                              {banksList
                                .filter((bank: Bank) => bank.isActive !== false)
                                .map((bank: Bank) => (
                                  <option key={bank.bankId} value={bank.bankId}>
                                    {bank.bankName} (
                                    [{bank.currencyCode || "KES"}]
                                  </option>
                                ))}
                            </Input>
                          )}
                        </FormGroup>
                      </Col>

                      {/* Amount Input */}
                      <Col md={6} xl={3}>
                        <FormGroup className="mb-0">
                          <Label htmlFor="amountInput" className="fs-12 fw-medium text-dark mb-1">
                            Transaction Amount <span className="text-danger">*</span>
                          </Label>
                          <div className="input-group">
                            <span className="input-group-text bg-light text-muted fs-13 font-monospace">
                              {selectedBank?.currencyCode || "KES"}
                            </span>
                            <Input
                              id="amountInput"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="form-control fs-13 fw-semibold font-monospace"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                          </div>
                        </FormGroup>
                      </Col>

                      {/* Reference Code Input */}
                      <Col md={6} xl={3}>
                        <FormGroup className="mb-0">
                          <Label
                            htmlFor="referenceInput"
                            className="fs-12 fw-medium text-dark mb-1"
                          >
                            Payment Reference / Receipt No <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="referenceInput"
                            type="text"
                            placeholder="e.g. CSH-DEP-10023 or M-Pesa Ref"
                            className="form-control fs-13"
                            value={reference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="bg-light-subtle py-3 px-4 border-top border-light-subtle">
                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <Button
                        type="button"
                        color="light"
                        className="px-4 fs-13"
                        onClick={handleClearForm}
                        disabled={isPosting}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        className="px-4 fs-13 fw-medium text-white shadow-sm"
                        style={{ backgroundColor: BRAND_PRIMARY, borderColor: BRAND_PRIMARY }}
                        disabled={isPosting}
                      >
                        {isPosting ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="ri-check-double-line me-1 align-middle"></i>
                            Post {movementType}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Form>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(false)} centered size="md">
        <ModalHeader toggle={() => setIsModalOpen(false)} className="bg-light py-3">
          <div className="d-flex align-items-center gap-2">
            <i className="ri-checkbox-circle-fill text-success fs-18"></i>
            <span className="fs-15 fw-semibold text-dark">Transaction Confirmed</span>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {successData && (
            <div className="text-center">
              <div className="avatar-sm rounded-circle bg-success-subtle text-success mx-auto d-flex align-items-center justify-content-center mb-3">
                <i className="ri-file-list-3-line fs-24"></i>
              </div>
              <h5 className="fs-16 fw-semibold text-dark mb-1">Cash Movement Posted</h5>
              <p className="text-muted fs-12 mb-4">
                The transaction record has been committed to the ledger.
              </p>

              <div className="p-3 bg-light rounded-3 border border-light-subtle text-start fs-13">
                <div className="d-flex justify-content-between py-1.5 border-bottom border-light-subtle">
                  <span className="text-muted">Document Number:</span>
                  <span className="fw-bold font-monospace text-dark">
                    {successData.documentNumber}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-1.5 border-bottom border-light-subtle">
                  <span className="text-muted">Bank Account:</span>
                  <span className="fw-semibold text-dark">
                    {selectedBank
                      ? `${selectedBank.bankName} (${selectedBank.accountNumber})`
                      : "N/A"}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-1.5 border-bottom border-light-subtle">
                  <span className="text-muted">Movement Type:</span>
                  <span
                    className={`fw-semibold ${
                      movementType === "Payment" ? "text-success" : "text-danger"
                    }`}
                  >
                    {movementType}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-1.5 border-bottom border-light-subtle">
                  <span className="text-muted">Total Amount:</span>
                  <span className="fw-bold text-dark font-monospace">
                    {selectedBank?.currencyCode || "KES"}{" "}
                    {(successData.total || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-1.5">
                  <span className="text-muted">Posted Date:</span>
                  <span className="text-dark font-monospace fs-12">
                    {new Date(successData.postedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="bg-light py-2 px-3">
          <Button
            color="primary"
            className="w-100 fs-13"
            style={{ backgroundColor: BRAND_PRIMARY, borderColor: BRAND_PRIMARY }}
            onClick={() => setIsModalOpen(false)}
          >
            Done
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default CashMovement;