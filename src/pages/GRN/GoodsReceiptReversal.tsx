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
} from "reactstrap";
import { toast } from "react-toastify";

import { useSuppliers } from "../../Components/Hooks/useSuppliers";
import { useSupplierInvoices } from "../../Components/Hooks/useReport2";
import { SupplierInvoice } from "../../types/reports2";
import { useInventoryTransactions } from "../../Components/Hooks/useReports";
import { useGoodsReceiptReversalMutation } from "../../Components/Hooks/useGrn";
import { InventoryTransaction } from "../../types/reports";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { useReasonCodes } from "../../Components/Hooks/useReasonCode";
import { CreateGoodsReceiptReversalRequest, GoodsReceiptReversalLineRequest } from "../../types/grn";
import { StockItem } from "../../types/stockitem";
import { formatCurrency } from "../../utils/qzConfig";
import { handleBackendErrors } from "../../helpers/form_utils";
import { getLoggedinUser } from "../../helpers/api_helper";

const BRAND_PURPLE = "#042e6d";

export const GoodsReceiptReversal: React.FC = () => {
  const { reverseGoodsReceipt, isReversing } = useGoodsReceiptReversalMutation();
  const { data: user } = getLoggedinUser();
  const operatorId = user?.operatorId || "";

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string>("");
  const [selectedGrnId, setSelectedGrnId] = useState<string>("");
  const [reasonCode, setReasonCode] = useState<string>("");
  
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [grnSearch, setGrnSearch] = useState<string>("");
  
  // Reversal item quantity map tracked by item_code (number or empty string for clean typing)
  const [reversalQuantities, setReversalQuantities] = useState<Record<string, number | "">>({});

  // Queries
  const { data: suppliersList = [], isLoading: isSuppliersLoading } = useSuppliers();
  const { data: stockItemsList = [] } = useStockItems();
  const { data: reasonCodesList = [] } = useReasonCodes();

  // Fetch supplier invoices (GRNs) filtered by selected supplierId
  const { data: grnResponse, isLoading: isGrnsLoading } = useSupplierInvoices(
    supplierId || null
  );

  const grnList = useMemo<SupplierInvoice[]>(() => {
    if (!grnResponse) return [];
    if (Array.isArray(grnResponse)) return grnResponse;
    const raw = grnResponse as any;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  }, [grnResponse]);

  // Selected Supplier Details
  const selectedSupplier = useMemo(() => {
    return suppliersList.find((s: any) => String(s.supplierId) === String(supplierId));
  }, [suppliersList, supplierId]);

  // Selected GRN Details
  const selectedGrn = useMemo(() => {
    return grnList.find((g) => String(g.goodsReceiptId) === String(selectedGrnId));
  }, [grnList, selectedGrnId]);

  // Fetch Inventory Transactions (Line items) without query param constraints and filter client-side
  const { data: txTransactions = [], isLoading: isTxLoading } = useInventoryTransactions();

  const grnLines = useMemo(() => {
    if (!selectedGrn || !txTransactions) return [];
    return txTransactions.filter(
      (tx: InventoryTransaction) => 
        tx.transaction_type === "goods_receipt" &&
        String(tx.reference_number).trim().toUpperCase() === String(selectedGrn.goodsReceiptNumber).trim().toUpperCase()
    );
  }, [selectedGrn, txTransactions]);

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

  // Set default supplier on load
  useEffect(() => {
    if (suppliersList.length > 0 && !supplierId) {
      setSupplierId(String(suppliersList[0].supplierId));
    }
  }, [suppliersList, supplierId]);

  // Reset selected GRN when supplier changes
  useEffect(() => {
    setSelectedGrnId("");
    setReversalQuantities({});
  }, [supplierId]);

  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.toLowerCase();
    return suppliersList.filter((s: any) => {
      const nameMatch = (s.supplierName ?? "").toLowerCase().includes(query);
      const codeMatch = (s.supplierCode ?? "").toLowerCase().includes(query);
      const phoneMatch = (s.phone ?? "").includes(query);
      return nameMatch || codeMatch || phoneMatch;
    });
  }, [suppliersList, supplierSearch]);

  // Filtered GRNs
  const filteredGrns = useMemo(() => {
    const query = grnSearch.toLowerCase();
    return grnList.filter((grn) => {
      const grnNum = (grn.goodsReceiptNumber ?? "").toLowerCase();
      const whCode = (grn.warehouseCode ?? "").toLowerCase();
      return grnNum.includes(query) || whCode.includes(query);
    });
  }, [grnList, grnSearch]);

  const handleQuantityChange = (key: string, val: string, maxQty: number) => {
    if (val === "") {
      setReversalQuantities((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    const validQty = Math.max(0, Math.min(parsed, maxQty));
    setReversalQuantities((prev) => ({
      ...prev,
      [key]: validQty,
    }));
  };

  const reversalLines: GoodsReceiptReversalLineRequest[] = useMemo(() => {
    return grnLines
      .filter((line: InventoryTransaction) => {
        const code = String(line.item_code || "").trim();
        const qty = reversalQuantities[code];
        return typeof qty === "number" && qty > 0;
      })
      .map((line: InventoryTransaction) => {
        const code = String(line.item_code || "").trim();
        const resolvedItemId = itemCodeToIdMap.get(code.toUpperCase()) || "";
        return {
          itemId: resolvedItemId,
          quantity: Number(reversalQuantities[code]),
          unitPrice: Number(line.unit_cost || 0),
          uomCode: line.stock_uom || "EA",
        };
      });
  }, [grnLines, reversalQuantities, itemCodeToIdMap]);

  // Calculate total reversal amount
  const reversalTotal = useMemo(() => {
    return reversalLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }, [reversalLines]);

  const handleClearForm = () => {
    setSelectedGrnId("");
    setReasonCode("");
    setReversalQuantities({});
  };

  const handleSubmitReversal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGrnId) {
      toast.error("Please select a source Goods Receipt Note (GRN).");
      return;
    }

    if (!operatorId) {
      toast.error("Operator session is invalid. Please log in again.");
      return;
    }

    if (reversalLines.length === 0) {
      toast.error("Please specify quantities for items to reverse.");
      return;
    }

    const missingIdItem = reversalLines.find((l) => !l.itemId);
    if (missingIdItem) {
      toast.error("Could not map one or more item codes to valid item IDs. Please check stock catalog.");
      return;
    }

    if (!reasonCode) {
      toast.error("Please select a reversal reason code.");
      return;
    }

    const payload: CreateGoodsReceiptReversalRequest = {
      sourceGoodsReceiptId: selectedGrnId,
      operatorId,
      reasonCode,
      lines: reversalLines,
    };

    try {
      await reverseGoodsReceipt({ id: selectedGrnId, data: payload });
      handleClearForm();
    } catch (err: unknown) {
      handleBackendErrors(err, () => {}, setGlobalError);
    }
  };

  document.title = "Goods Receipt Reversals | Velzon Corporate Terminal";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>

          <Form onSubmit={handleSubmitReversal}>
            <Row className="g-3">
              {/* Left Column: GRN Selection & Line Items */}
              <Col lg={7} xl={8}>
                {/* GRN Selector Card */}
                <Card className="border-0 shadow-sm mb-3">
                  <CardHeader className="align-items-center d-flex bg-transparent border-bottom py-3">
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-0 fs-14 fw-semibold text-dark">Select Goods Receipt Note (GRN)</h5>
                    </div>
                    <div className="flex-shrink-0" style={{ width: "240px" }}>
                      <Input
                        type="text"
                        placeholder="Filter GRN or warehouse..."
                        bsSize="sm"
                        className="form-control form-control-sm fs-11"
                        value={grnSearch}
                        onChange={(e) => setGrnSearch(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardBody className="p-3" style={{ maxHeight: "220px", overflowY: "auto" }}>
                    {!supplierId ? (
                      <div className="text-center py-4 text-muted fs-12">Please select a supplier from the right panel first</div>
                    ) : isGrnsLoading ? (
                      <div className="text-center py-4"><Spinner size="sm" color="primary" /></div>
                    ) : filteredGrns.length > 0 ? (
                      <div className="table-responsive table-card">
                        <table className="table table-sm table-nowrap table-bordered table-striped align-middle fs-11 mb-0">
                          <thead className="table-light text-muted">
                            <tr>
                              <th>Select</th>
                              <th>Date</th>
                              <th>GRN #</th>
                              <th>Warehouse</th>
                              <th className="text-end">Total</th>
                              <th className="text-end">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredGrns.map((grn) => {
                              const isSelected = selectedGrnId === grn.goodsReceiptId;
                              return (
                                <tr
                                  key={grn.goodsReceiptId}
                                  className={`cursor-pointer ${isSelected ? "table-primary" : ""}`}
                                  onClick={() => {
                                    setSelectedGrnId(grn.goodsReceiptId);
                                    setReversalQuantities({});
                                  }}
                                >
                                  <td className="text-center">
                                    <Input
                                      type="radio"
                                      name="sourceGrn"
                                      checked={isSelected}
                                      onChange={() => {
                                        setSelectedGrnId(grn.goodsReceiptId);
                                        setReversalQuantities({});
                                      }}
                                    />
                                  </td>
                                  <td>{grn.receivedAt ? new Date(grn.receivedAt).toLocaleDateString() : "-"}</td>
                                  <td className="font-monospace fw-semibold text-primary">{grn.goodsReceiptNumber}</td>
                                  <td>{grn.warehouseCode}</td>
                                  <td className="text-end font-monospace">{formatCurrency(grn.invoiceTotal)}</td>
                                  <td className="text-end font-monospace fw-semibold">{formatCurrency(grn.invoiceBalance)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted fs-12">No active Goods Receipts found for this supplier</div>
                    )}
                  </CardBody>
                </Card>

                {/* Reversal Line Items Card */}
                <Card className="border-0 shadow-sm mb-0">
                  <CardHeader className="align-items-center d-flex bg-transparent border-bottom py-3">
                    <h5 className="card-title mb-0 fs-14 fw-semibold text-dark">GRN Line Items (Select Reversal Quantities)</h5>
                  </CardHeader>
                  <CardBody className="p-3" style={{ minHeight: "260px", maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
                    {!selectedGrnId ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted py-5">
                        <i className="ri-file-search-line display-5 text-muted mb-2 opacity-50"></i>
                        <span className="fs-13 fw-medium">Please select a source GRN above</span>
                      </div>
                    ) : isTxLoading ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5">
                        <Spinner size="sm" color="primary" className="mb-2" />
                        <span className="text-muted fs-12">Loading GRN items...</span>
                      </div>
                    ) : grnLines.length > 0 ? (
                      <div className="table-responsive table-card">
                        <table className="table table-sm table-nowrap table-bordered table-striped align-middle fs-11 mb-0">
                          <thead className="table-light text-muted">
                            <tr>
                              <th>Item Code</th>
                              <th>Description</th>
                              <th className="text-end">Received Qty</th>
                              <th className="text-end">Unit Cost</th>
                              <th className="text-center" style={{ width: "120px" }}>Reverse Qty</th>
                              <th className="text-end">Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grnLines.map((line: InventoryTransaction, idx: number) => {
                              const itemCode = String(line.item_code || "").trim();
                              const maxQty = Number(line.quantity || 0);
                              const unitCost = Number(line.unit_cost || 0);
                              const revQty = reversalQuantities[itemCode] ?? "";
                              const numericQty = typeof revQty === "number" ? revQty : 0;
                              const lineSubtotal = numericQty * unitCost;

                              return (
                                <tr key={itemCode || idx}>
                                  <td className="font-monospace">{itemCode}</td>
                                  <td>{line.description}</td>
                                  <td className="text-end font-monospace">{maxQty}</td>
                                  <td className="text-end font-monospace">{formatCurrency(unitCost)}</td>
                                  <td className="text-center">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={maxQty}
                                      bsSize="sm"
                                      className="form-control form-control-sm text-center font-monospace fs-11 py-0.5"
                                      value={revQty}
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
                      <div className="text-center py-5 text-muted fs-12">No inventory line items found for this GRN</div>
                    )}
                  </CardBody>
                </Card>
              </Col>

              {/* Right Column: Reversal Details & Supplier Selector */}
              <Col lg={5} xl={4}>
                <Card className="card-height-100 border-0 shadow-sm mb-0">
                  <CardHeader className="align-items-center d-flex bg-transparent border-bottom py-3">
                    <h5 className="card-title mb-0 fs-14 fw-semibold text-dark">Reversal Details</h5>
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
                              filteredSuppliers.map((s: any) => (
                                <div
                                  key={s.supplierId}
                                  className="p-2 rounded fs-12 cursor-pointer hover-bg-light"
                                  onClick={() => {
                                    setSupplierId(s.supplierId);
                                    setIsSupplierDropdownOpen(false);
                                  }}
                                >
                                  <span className="fw-medium text-dark d-block">{s.supplierName}</span>
                                  <span className="text-muted fs-11">Terms: {s.paymentTermsDays ?? 0} Days</span>
                                </div>
                              ))
                            )}
                          </div>
                        </DropdownMenu>
                      </Dropdown>
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

                    {/* Reversal Total Display */}
                    <div className="p-3 bg-light rounded border border-light mt-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fs-12 fw-semibold text-muted">Total Reversal Amount:</span>
                        <h4 className="mb-0 fw-bold text-dark fs-18 font-monospace">
                          {formatCurrency(reversalTotal)}
                        </h4>
                      </div>
                    </div>
                  </CardBody>

                  <div className="p-3 bg-white border-top">
                    <Button
                      type="submit"
                      className="w-100 border-0 rounded py-2 shadow-sm d-flex justify-content-between align-items-center px-3"
                      style={{
                        backgroundColor: isReversing ? "#a3b4cc" : BRAND_PURPLE,
                      }}
                      disabled={isReversing || reversalLines.length === 0}
                    >
                      <span className="fs-13 fw-semibold text-white">
                        {isReversing ? "Processing Reversal..." : "Submit GRN Reversal"}
                      </span>
                      {!isReversing && <i className="ri-send-plane-fill fs-15 text-white opacity-75"></i>}
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

export default GoodsReceiptReversal;