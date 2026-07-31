import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Table,
  Button,
  FormFeedback,
  Alert,
  Spinner,
  Badge
} from "reactstrap";

import { useGRN } from "../../Components/Hooks/useGrn";
import { useCoolers } from "../../Components/Hooks/useCoolers";
import { useStockItems } from "../../Components/Hooks/useStockItems"; 
import { handleBackendErrors } from "../../helpers/form_utils";

import type { SupplierReceiptPayload, SupplierReceiptLine } from "../../types/grn";
import type { Warehouse } from "../../types/cooler";

interface StockItemLookup {
  id: string;
  name: string;
  code: string;
}

interface SupplierReceiptFormProps {
  availableStockItems?: StockItemLookup[]; 
  onSuccessCallback?: () => void;
}

const SupplierReceiptForm = ({
  availableStockItems,
  onSuccessCallback,
}: SupplierReceiptFormProps) => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouseId ?? "");

  useEffect(() => {
    if (warehouseId) {
      setSelectedWarehouseId(warehouseId);
    }
  }, [warehouseId]);

  const { submitReceipt, isProcessing } = useGRN(selectedWarehouseId);

  const { data: coolersData, isLoading: isLoadingCoolers } = useCoolers(true);
  const { 
    data: stockItemsData, isLoading: isLoadingStockItems 
  } = useStockItems(undefined, true);

  const operationalWarehouses: Warehouse[] = (
    coolersData?.warehouses || []
  ).filter((w) => w.warehouse_code !== "GIT");

  const activeWarehouse = operationalWarehouses.find(
    (w: Warehouse) => w.id === selectedWarehouseId
  );

  const structuralStockPool = Array.isArray(availableStockItems)
    ? availableStockItems
    : Array.isArray(stockItemsData?.catalog)
      ? stockItemsData.catalog
      : [];

  const [supplierInvoiceOrGrn, setSupplierInvoiceOrGrn] = useState<string>("");
  const [receiptLines, setReceiptLines] = useState<SupplierReceiptLine[]>([
  { stock_item_id: "", qty_received: "0.00", unit_cost: "0.00" },
  ]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedWarehouseId(e.target.value);
  };

  const handleAddLine = () => {
    setReceiptLines([
      ...receiptLines,
      { stock_item_id: "", qty_received: "0.00", unit_cost: "0.00" },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (receiptLines.length === 1) return;
    const updated = [...receiptLines];
    updated.splice(index, 1);
    setReceiptLines(updated);
  };

  const handleLineChange = (
    index: number,
    field: keyof SupplierReceiptLine,
    value: string
  ) => {
    const updated = [...receiptLines];
    updated[index] = { ...updated[index], [field]: value };
    setReceiptLines(updated);
  };

  const calculateTotalValue = (): number => {
    const lines = Array.isArray(receiptLines) ? receiptLines : [];
    return lines.reduce((acc, item) => {
      const qty = parseFloat(item.qty_received) || 0;
      const cost = parseFloat(item.unit_cost) || 0;
      return acc + qty * cost;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);

    if (!selectedWarehouseId) {
      setGlobalError(
        "Operational execution failed: No target destination warehouse selected.");
      return;
    }

    const payload: SupplierReceiptPayload = {
      supplier_invoice_or_grn: supplierInvoiceOrGrn,
      receipt_lines: receiptLines,
    };

    try {
      await submitReceipt(payload);
      setSupplierInvoiceOrGrn("");
      setReceiptLines([{ stock_item_id: "", qty_received: "0.00", unit_cost: "0.00" }]);
      
      if (onSuccessCallback) {
        onSuccessCallback();
      } else {
        navigate(-1);
      }
    } catch (err: any) {
      handleBackendErrors(err, setFieldErrors, setGlobalError);
    }
  };

  if (isLoadingCoolers || isLoadingStockItems) {
    return (
      <div className="page-content text-center p-5">
        <Spinner color="primary" className="mb-2" />
        <p className="text-muted">Resolving cross-layer registry keys and access contexts...</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="align-items-center d-flex card-header-custom">
                  <h4 className="card-title mb-0 flex-grow-1 text-uppercase text-primary fw-bold">
                    <i className="ri-file-add-line align-middle me-2"></i>
                    Process Goods Received Note (GRN)
                  </h4>
                  <div className="flex-shrink-0 d-flex gap-2 align-items-center">
                    <span className="badge bg-soft-info text-info fs-12 fw-medium">
                      Active Node ID: {activeWarehouse?.warehouse_code || selectedWarehouseId || "Not Assigned"}
                    </span>
                    {activeWarehouse && (
                      <Badge color="soft-success" className="fs-12 text-uppercase">
                        Unit: {activeWarehouse.name} ({activeWarehouse.type  || "Store"})
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardBody>
                  {globalError && (
                    <Alert color="danger" className="alert-dismissible fade show fw-medium mb-4">
                      <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
                      {globalError}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit} autoComplete="off">
                    <Row className="mb-4">
                      {/* Operational Dropdown Layer */}
                      <Col md={6}>
                        <FormGroup>
                          <Label for="warehouseSelect" className="fw-semibold text-primary">
                            Target Recipient Warehouse / Cooler <span className="text-danger">*</span>
                          </Label>
                          <div className="form-icon">
                            <Input
                              type="select"
                              id="warehouseSelect"
                              className="form-control-icon"
                              value={selectedWarehouseId}
                              onChange={handleWarehouseChange}
                              required
                            >
                              <option value="">-- Choose Warehouse Facility --</option>
                              {operationalWarehouses.map((w: Warehouse) => (
                                <option key={w.id} value={w.id}>
                                  {w.name} {w.type ? `[${w.route}]` : ""}
                                </option>
                              ))}
                            </Input>
                            <i className="ri-building-4-line text-primary"></i>
                          </div>
                        </FormGroup>
                      </Col>

                      <Col md={6}>
                        <FormGroup>
                          <Label for="supplierInvoiceOrGrn" className="fw-semibold">
                            Supplier Invoice # / GRN Reference Code <span className="text-danger">*</span>
                          </Label>
                          <div className="form-icon">
                            <Input
                              type="text"
                              id="supplierInvoiceOrGrn"
                              className={`form-control-icon Ksh{fieldErrors.supplier_invoice_or_grn ? "is-invalid" : ""}`}
                              placeholder="e.g., INV-2026-99381A"
                              value={supplierInvoiceOrGrn}
                              onChange={(e) => setSupplierInvoiceOrGrn(e.target.value)}
                              required
                            />
                            <i className="ri-git-repository-private-line"></i>
                            <FormFeedback>{fieldErrors.supplier_invoice_or_grn}</FormFeedback>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>

                    <h5 className="fs-14 mb-3 fw-bold text-muted text-uppercase">Receipt Line Items</h5>
                    <div className="table-responsive table-card mb-4">
                      <Table className="align-middle table-nowrap table-borderless mb-0">
                        <thead className="table-light text-muted">
                          <tr>
                            <th scope="col" style={{ width: "45%" }}>Stock Item Selection</th>
                            <th scope="col" style={{ width: "20%" }}>Quantity Received</th>
                            <th scope="col" style={{ width: "20%" }}>Unit Cost (Ksh)</th>
                            <th scope="col" style={{ width: "10%" }} className="text-end">Subtotal Value</th>
                            <th scope="col" style={{ width: "5%" }} className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(Array.isArray(receiptLines) ? receiptLines : []).map((line, index) => {
                            const currentSubtotal = (parseFloat(line.qty_received) || 0) * (parseFloat(line.unit_cost) || 0);
                            
                            const stockItemError = fieldErrors[`receipt_lines.${index}.stock_item_id`] || fieldErrors[`receipt_lines[${index}].stock_item_id`];
                            const qtyError = fieldErrors[`receipt_lines.${index}.qty_received`] || fieldErrors[`receipt_lines[${index}].qty_received`];
                            const costError = fieldErrors[`receipt_lines.${index}.unit_cost`] || fieldErrors[`receipt_lines[${index}].unit_cost`];

                            return (
                              <tr key={index} className="border-bottom border-light">
                                <td>
                                  <Input
                                    type="select"
                                    value={line.stock_item_id}
                                    onChange={(e) => handleLineChange(index, "stock_item_id", e.target.value)}
                                    className={stockItemError ? "is-invalid" : ""}
                                    required
                                  >
                                    <option value="">-- Choose Stock Item --</option>
                                    {structuralStockPool.map((item: any) => {
                                      const itemId = item?.id;
                                      const itemCode = item?.stock_code || item?.code || "";
                                      const itemDesc = item?.description || item?.name || "";
                                      
                                      return (
                                        <option key={itemId} value={itemId}>
                                          {itemDesc} {itemCode ? `(${itemCode})` : ""}
                                        </option>
                                      );
                                    })}
                                  </Input>
                                  <FormFeedback>{stockItemError}</FormFeedback>
                                </td>
                                <td>
                                  <Input
                                    type="number"
                                    step="0.0001"
                                    min="0.0001"
                                    value={line.qty_received}
                                    onChange={(e) => handleLineChange(index, "qty_received", e.target.value)}
                                    placeholder="0.0000"
                                    className={qtyError ? "is-invalid" : ""}
                                    required
                                  />
                                  <FormFeedback>{qtyError}</FormFeedback>
                                </td>
                                <td>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.00"
                                    value={line.unit_cost}
                                    onChange={(e) => handleLineChange(index, "unit_cost", e.target.value)}
                                    placeholder="0.00"
                                    className={costError ? "is-invalid" : ""}
                                    required
                                  />
                                  <FormFeedback>{costError}</FormFeedback>
                                </td>
                                <td className="text-end fw-semibold text-dark">
                                  Ksh{currentSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="text-center">
                                  <Button
                                    type="button"
                                    color="soft-danger"
                                    className="btn-icon btn-sm"
                                    onClick={() => handleRemoveLine(index)}
                                    disabled={receiptLines.length === 1}
                                  >
                                    <i className="ri-delete-bin-fill fs-14"></i>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>

                    <Row className="align-items-center mb-4">
                      <Col xs={6}>
                        <Button type="button" color="soft-secondary" className="btn-sm fw-medium" onClick={handleAddLine}>
                          <i className="ri-add-line align-middle me-1"></i> Add Another Line Item
                        </Button>
                      </Col>
                      <Col xs={6} className="text-end">
                        <div className="border-top border-top-dashed p-2">
                          <span className="text-muted fw-bold me-3 text-uppercase fs-12">Estimated Net Valuation:</span>
                          <span className="fs-16 fw-bold text-success">
                            Ksh{calculateTotalValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </Col>
                    </Row>

                    <hr className="my-4" />

                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <Button type="button" color="light" disabled={isProcessing} className="w-sm" onClick={() => navigate(-1)}>
                        Cancel
                      </Button>
                      <Button type="submit" color="primary" disabled={isProcessing} className="btn-load w-md">
                        {isProcessing ? (
                          <span className="d-flex align-items-center justify-content-center">
                            <Spinner size="sm" className="me-2" /> Processing Layers...
                          </span>
                        ) : (
                          <>
                            <i className="ri-check-double-line align-middle me-1"></i> Commit Ledger & FIFO
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SupplierReceiptForm;