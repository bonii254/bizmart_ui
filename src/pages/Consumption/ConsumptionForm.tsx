import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Button,
  FormFeedback,
  Alert,
  Spinner,
  Badge,
  Table
} from "reactstrap";

import { useConsumption } from "../../Components/Hooks/useConsumption";
import { useStockItems } from "../../Components/Hooks/useStockItems"; 
import { useCoolers } from "../../Components/Hooks/useCoolers";
import { useAssignments } from "../../Components/Hooks/useAssignments";
import { useWarehouseStock } from "../../Components/Hooks/useWarehouseStock"; // Integrated from above stock logic
import { handleBackendErrors } from "../../helpers/form_utils";
import { StockItem } from "../../types/stockitem";

interface MachineConsumptionFormProps {
  availableStockItems?: StockItem[]; 
  onSuccessCallback?: () => void;
}

const MachineConsumptionForm = ({
  availableStockItems,
  onSuccessCallback,
}: MachineConsumptionFormProps) => {
  const navigate = useNavigate();

  const { logConsumption, isProcessing } = useConsumption();
  const { activeAssignment, isLoading: isLoadingAssignment } = useAssignments();
  const { data: stockItemsData, isLoading: isLoadingStockItems } = useStockItems(undefined, true);
  const { data: coolersData, isLoading: isLoadingCoolers } = useCoolers(true);

  const [stockItemId, setStockItemId] = useState<string>("");
  const [qtyConsumed, setQtyConsumed] = useState<string>("0.00");
  const [isMeteredAsset, setIsMeteredAsset] = useState<boolean>(false);
  const [runtimeStart, setRuntimeStart] = useState<string>("0.0");
  const [runtimeStop, setRuntimeStop] = useState<string>("0.0");
  const [notes, setNotes] = useState<string>("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Integrated Hook: Fetches stock balances filtered by the active terminal assignment's warehouse location
  const { balances, isLoading: isLoadingBalances } = useWarehouseStock(activeAssignment?.warehouse_id || undefined);

  const structuralStockPool = Array.isArray(availableStockItems)
    ? availableStockItems
    : Array.isArray(stockItemsData?.catalog)
      ? stockItemsData.catalog
      : [];

  const selectedItem = structuralStockPool.find((item: any) => item.id === stockItemId);

  // Dynamic Lookup: Isolates the specific ledger record for the currently selected stock item
  const currentStockBalance = useMemo(() => {
    if (!stockItemId || !balances) return null;
    return balances.find((b: any) => b.stock_item?.id === stockItemId || b.stock_item_id === stockItemId);
  }, [balances, stockItemId]);

  const dynamicUom = selectedItem?.uom || "Units";
  const activeCoolerName = activeAssignment?.warehouse_name;
  const assignedAttendant = activeAssignment?.user_name;

  const calculateRuntimeDelta = (): number => {
    if (!isMeteredAsset) return 0;
    const start = parseFloat(runtimeStart) || 0;
    const stop = parseFloat(runtimeStop) || 0;
    return stop >= start ? stop - start : 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);

    if (isMeteredAsset && parseFloat(runtimeStop) < parseFloat(runtimeStart)) {
      setGlobalError("Meter Range Error: Current running hours cannot be less than previous running hours.");
      return;
    }

    const payload = {
      stock_item_id: stockItemId,
      qty_consumed: qtyConsumed,
      is_metered_asset: isMeteredAsset,
      runtime_start: isMeteredAsset && runtimeStart ? runtimeStart : null,
      runtime_stop: isMeteredAsset && runtimeStop ? runtimeStop : null,
      notes: notes || null,
    };

    try {
      await logConsumption(payload);
      
      setStockItemId("");
      setQtyConsumed("0.00");
      setIsMeteredAsset(false);
      setRuntimeStart("0.0");
      setRuntimeStop("0.0");
      setNotes("");

      if (onSuccessCallback) {
        onSuccessCallback();
      } else {
        navigate(-1);
      }
    } catch (err: any) {
      handleBackendErrors(err, setFieldErrors, setGlobalError);
    }
  };

  if (isLoadingStockItems || isLoadingCoolers || isLoadingAssignment) {
    return (
      <div className="page-content text-center p-5">
        <Spinner color="danger" className="mb-2" />
        <p className="text-muted fw-semibold">Resolving warehouse catalog contexts & terminal session routes...</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          
          <Row className="mb-4 align-items-center">
            <Col xs={12}>
              <div className="d-flex align-items-center justify-content-between pb-3 border-bottom">
                <div>
                  <h4 className="text-uppercase fw-bold text-dark mb-1">
                    <i className="ri-building-4-line text-danger me-2"></i>
                    {activeCoolerName}
                  </h4>
                  <p className="text-muted mb-0 fs-13">
                    Terminal Log &amp; Material Consumption Register
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Badge color="soft-success" className="fs-12 text-uppercase py-2 px-3 d-flex align-items-center gap-1">
                    <span className="badge-bubble bg-success"></span>
                    Shift Status: Active
                  </Badge>
                  <Badge color="soft-primary" className="fs-12 text-uppercase py-2 px-3">
                    <i className="ri-user-2-line me-1"></i> Operator: {assignedAttendant}
                  </Badge>
                </div>
              </div>
            </Col>
          </Row>

          <Form onSubmit={handleSubmit} autoComplete="off">
            <Row>
              
              <Col lg={9}>
                <Card className="border shadow-none">
                  <CardHeader className="card-header-custom border-bottom bg-light py-3">
                    <h5 className="card-title mb-0 text-uppercase fw-bold text-primary fs-13">
                      <i className="ri-survey-line align-middle me-2"></i>
                      Consumption Data Entry
                    </h5>
                  </CardHeader>

                  <CardBody className="p-4">
                    {globalError && (
                      <Alert color="danger" className="alert-dismissible fade show fw-medium mb-4">
                        <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
                        {globalError}
                      </Alert>
                    )}

                    <Row className="g-4">
                      <Col md={7}>
                        <FormGroup className="mb-0">
                          <Label for="stockItemId" className="fw-bold text-muted fs-11 text-uppercase">
                            Resource / Stock Item Selection <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="select"
                            id="stockItemId"
                            value={stockItemId}
                            onChange={(e) => setStockItemId(e.target.value)}
                            className={`form-control-lg ${fieldErrors.stock_item_id ? "is-invalid" : ""}`}
                            required
                          >
                            <option value="">-- Search and Select Master Catalog Item --</option>
                            {structuralStockPool.map((item: any) => {
                              const itemId = item?.id;
                              const itemCode = item?.stock_code || item?.code || "";
                              const itemDesc = item?.description || item?.name || "";
                              return (
                                <option key={itemId} value={itemId}>
                                  {itemDesc} {itemCode ? `[Code: ${itemCode}]` : ""}
                                </option>
                              );
                            })}
                          </Input>
                          <FormFeedback>{fieldErrors.stock_item_id}</FormFeedback>
                        </FormGroup>
                      </Col>

                      <Col md={5}>
                        <FormGroup className="mb-0">
                          <Label for="qtyConsumed" className="fw-bold text-muted fs-11 text-uppercase">
                            Quantity Consumed ({dynamicUom}) <span className="text-danger">*</span>
                          </Label>
                          <div className="input-group input-group-lg">
                            <Input
                              type="number"
                              id="qtyConsumed"
                              step="0.0001"
                              min="0.0001"
                              placeholder="0.0000"
                              value={qtyConsumed}
                              onChange={(e) => setQtyConsumed(e.target.value)}
                              className={fieldErrors.qty_consumed ? "is-invalid" : ""}
                              required
                            />
                            <span className="input-group-text bg-soft-secondary text-primary fw-bold min-width-80 text-center justify-content-center">
                              {dynamicUom}
                            </span>
                            <FormFeedback>{fieldErrors.qty_consumed}</FormFeedback>
                          </div>
                        </FormGroup>
                      </Col>

                      <Col md={12}>
                        <div className="p-3 bg-light rounded border border-light d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="mb-1 fw-bold fs-13 text-dark">Track Runtime Engine Metrics</h6>
                            <p className="text-muted mb-0 fs-12">Activate to log generator running hours and calculate system engine work periods.</p>
                          </div>
                          <FormGroup switch className="mb-0 fs-16">
                            <Input
                              type="switch"
                              id="isMeteredAsset"
                              checked={isMeteredAsset}
                              onChange={(e) => setIsMeteredAsset(e.target.checked)}
                              className="cursor-pointer"
                            />
                          </FormGroup>
                        </div>
                      </Col>

                      {isMeteredAsset && (
                        <Col md={12}>
                          <div className="p-4 rounded border border-dashed bg-light-subtle">
                            <h6 className="fs-12 text-uppercase text-muted fw-bold mb-3 d-flex align-items-center">
                              <i className="ri-dashboard-3-line align-middle me-2 text-danger"></i> Running Hours Register
                            </h6>
                            <Row className="g-3">
                              <Col md={4}>
                                <FormGroup className="mb-0">
                                  <Label for="runtimeStart" className="fw-semibold text-muted fs-12">
                                    Start Hours (Previous Node State)
                                  </Label>
                                  <Input
                                    type="number"
                                    id="runtimeStart"
                                    step="0.1"
                                    min="0.0"
                                    placeholder="0.0"
                                    value={runtimeStart}
                                    onChange={(e) => setRuntimeStart(e.target.value)}
                                    className={fieldErrors.runtime_start ? "is-invalid" : ""}
                                    required={isMeteredAsset}
                                  />
                                  <FormFeedback>{fieldErrors.runtime_start}</FormFeedback>
                                </FormGroup>
                              </Col>

                              <Col md={4}>
                                <FormGroup className="mb-0">
                                  <Label for="runtimeStop" className="fw-semibold text-muted fs-12">
                                    Stop Hours (Current Log State)
                                  </Label>
                                  <Input
                                    type="number"
                                    id="runtimeStop"
                                    step="0.1"
                                    min="0.0"
                                    placeholder="0.0"
                                    value={runtimeStop}
                                    onChange={(e) => setRuntimeStop(e.target.value)}
                                    className={fieldErrors.runtime_stop ? "is-invalid" : ""}
                                    required={isMeteredAsset}
                                  />
                                  <FormFeedback>{fieldErrors.runtime_stop}</FormFeedback>
                                </FormGroup>
                              </Col>

                              <Col md={4} className="d-flex align-items-end">
                                {parseFloat(runtimeStop) >= parseFloat(runtimeStart) && (
                                  <div className="w-100 p-2 bg-soft-success text-success border border-soft-success rounded text-center">
                                    <span className="fs-11 text-muted d-block text-uppercase fw-bold">Delta Duration</span>
                                    <span className="fs-18 fw-bold">
                                      {calculateRuntimeDelta().toFixed(1)} <small className="fs-11">Hrs</small>
                                    </span>
                                  </div>
                                )}
                              </Col>
                            </Row>
                          </div>
                        </Col>
                      )}

                      <Col md={12}>
                        <FormGroup className="mb-0">
                          <Label for="notes" className="fw-bold text-muted fs-11 text-uppercase">
                            Operational Audit &amp; Shift Remarks
                          </Label>
                          <Input
                            type="textarea"
                            id="notes"
                            rows="4"
                            placeholder="Please state load variants, shift occurrences, thermal ranges or specific machine behavior observed during run duration..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className={fieldErrors.notes ? "is-invalid" : ""}
                          />
                          <FormFeedback>{fieldErrors.notes}</FormFeedback>
                        </FormGroup>
                      </Col>
                    </Row>

                    <hr className="my-4 border-light" />

                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <Button
                        type="button"
                        color="light"
                        disabled={isProcessing}
                        className="btn-lg px-4"
                        onClick={() => navigate(-1)}
                      >
                        Cancel
                      </Button>
                      
                      <Button
                        type="submit"
                        color="danger"
                        disabled={isProcessing}
                        className="btn-lg px-4"
                      >
                        {isProcessing ? <Spinner size="sm" className="me-2" /> : "Log Consumption"}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Complementary Sidebar Panel: Renders real-time warehouse stock ledger information */}
              <Col lg={3}>
                <Card className="border shadow-none">
                  <CardHeader className="bg-light py-3 border-bottom">
                    <h5 className="card-title mb-0 text-uppercase fw-bold text-dark fs-12">
                      <i className="ri-database-2-line align-middle me-2 text-info fs-14"></i>
                      Live Warehouse Stock
                    </h5>
                  </CardHeader>
                  <CardBody className="p-3">
                    {isLoadingBalances ? (
                      <div className="text-center py-4 text-muted fs-12">
                        <Spinner size="sm" color="primary" className="me-2" />
                        Fetching ledger balances...
                      </div>
                    ) : !stockItemId ? (
                      <div className="text-center py-4 text-muted fs-12 border border-dashed rounded p-3 bg-light-subtle">
                        Select a resource SKU profile above to evaluate physical stock availability.
                      </div>
                    ) : currentStockBalance ? (
                      <div>
                        <div className="mb-3">
                          <span className="text-muted fs-11 text-uppercase d-block fw-semibold">Quantity On Hand</span>
                          <span className="fs-22 fw-bold text-dark">
                            {parseFloat(currentStockBalance.qty_on_hand).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          </span>
                          <span className="badge bg-light text-primary border ms-2 fs-11">{dynamicUom}</span>
                        </div>
                        
                        <div className="pt-2 border-top">
                          <Row className="g-2 text-center">
                            <Col xs={6} className="border-end">
                              <span className="text-muted fs-10 text-uppercase d-block">Unit Cost</span>
                              <span className="fw-semibold text-dark fs-12">
                                KES {parseFloat(currentStockBalance.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </Col>
                            <Col xs={6}>
                              <span className="text-muted fs-10 text-uppercase d-block">Total Value</span>
                              <span className="fw-semibold text-primary fs-12">
                                KES {parseFloat(currentStockBalance.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </Col>
                          </Row>
                        </div>

                        {parseFloat(currentStockBalance.qty_on_hand) <= 0 && (
                          <Alert color="danger" className="mt-3 py-2 px-3 fs-11 mb-0 border-0 shadow-none">
                            <i className="ri-error-warning-line me-1 fw-bold"></i> Stock Depleted: Consuming this resource will drive ledger positions negative.
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-warning fs-12 border border-dashed border-warning rounded p-3 bg-warning-subtle">
                        <i className="ri-alert-line d-block fs-18 mb-1"></i>
                        No explicit stock ledger linkage established for this item at the current location.
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>

            </Row>
          </Form>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default MachineConsumptionForm;