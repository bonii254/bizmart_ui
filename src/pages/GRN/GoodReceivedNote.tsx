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
  Table,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  Alert,
} from "reactstrap";
import { toast } from "react-toastify";

import { 
  CreateGoodsReceiptPayload, 
  GoodsReceiptLinePayload, 
  GoodsReceiptCreatedData 
} from "../../types/grn";
import { useGoodsReceiptMutation } from "../../Components/Hooks/useGrn";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { useItemWarehouseStock } from "../../Components/Hooks/useWarehouseStock";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { useSuppliers } from "../../Components/Hooks/useSuppliers";
import { usePrinters } from "../../Components/Hooks/useQZPrinter"; 
import { ItemWarehouseStock } from "../../types/warehouseStock";
import { useCompanies } from "../../Components/Hooks/useCompanies"
import { handleBackendErrors } from "../../helpers/form_utils";
import { getLoggedinUser } from "../../helpers/api_helper";

import { printGRNReceipt } from "../../utils/printerUtil"; 

const BRAND_PURPLE = "#042e6d";

type ExtendedGRNLineItem = {
  itemId: string;
  itemCode: string;
  description: string;
  baseUom: string;
  altUom?: string | null;
  conversionFactor: number;
  enteredQty: number;
  selectedUom: string;
  unitPrice: number;
  lineTotal: number;
};

export const GoodsReceivedNote: React.FC = () => {
  const { createGoodsReceipt, isPosting } = useGoodsReceiptMutation();
  const { data: warehousesData, isLoading: isWarehousesLoading } = useWarehouses();
  const { data: suppliersData, isLoading: isSuppliersLoading } = useSuppliers();
  const { data: catalogResponse, isLoading: isStockLoading } = useStockItems();
  const { data: printersList, isLoading: isPrintersLoading } = usePrinters();
  const { data: companiesData } = useCompanies();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const { data: user } = getLoggedinUser();
  const operatorId = user?.operatorId;
  const operatorName = user?.userName;
  
  const [companyName, setCompanyName] = useState<string>("")

  const warehousesList = useMemo(() => Array.isArray(warehousesData) ? warehousesData : warehousesData ?? [], [warehousesData]);
  const suppliersList = useMemo(() => Array.isArray(suppliersData) ? suppliersData : suppliersData ?? [], [suppliersData]);
  const stockItemsList = useMemo(() => catalogResponse ?? [], [catalogResponse]);

  const [warehouseId, setWarehouseId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [lines, setLines] = useState<ExtendedGRNLineItem[]>([]);
  
  const [selectedPrinter, setSelectedPrinter] = useState<string>("EXPORT_PDF");

  const [catalogSearch, setCatalogSearch] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");

  const { stockItems: warehouseStockItems = [], isLoading: isWarehouseStockLoading } = useItemWarehouseStock({
    warehouseId: warehouseId || undefined,
  });

  const companiesList = useMemo(() => {
      return Array.isArray(companiesData) ? companiesData : companiesData || [];
    }, [companiesData]);

  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  useEffect(() => {
      if (companiesList.length > 0 ){
        const firstCompany = companiesList[0];
        setCompanyName(firstCompany.companyName);
      }
    }, [companiesList, companyName])

  useEffect(() => {
    if (warehousesList.length > 0 && !warehouseId) {
      setWarehouseId(warehousesList[0].warehouseId);
    }
  }, [warehousesList, warehouseId]);

  const selectedSupplier = useMemo(() => 
    suppliersList.find((s: any) => String(s.id ?? s.supplierId) === String(supplierId)), 
  [suppliersList, supplierId]);

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearch.toLowerCase();
    return suppliersList.filter((s: any) => {
      const name = (s.name ?? s.supplierName ?? s.companyName ?? "").toLowerCase();
      const code = (s.code ?? s.supplierCode ?? "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [suppliersList, supplierSearch]);

  const validWarehouseItemIds = useMemo(() => {
    if (
      !warehouseStockItems || !Array.isArray(warehouseStockItems
      )) return new Set<string>();
    return new Set(warehouseStockItems.map((ws: ItemWarehouseStock) => String(ws.itemId)));
  }, [warehouseStockItems]);

  // Filter master catalog by selected warehouse assignment and search query
  const filteredCatalog = useMemo(() => {
    const query = catalogSearch.toLowerCase();
    return stockItemsList.filter((item) => {
      const itemIdStr = String(item.itemId);
      
      // Filter out items not assigned to the selected warehouse
      if (warehouseId && !validWarehouseItemIds.has(itemIdStr)) {
        return false;
      }

      return (
        item.description.toLowerCase().includes(query) || 
        item.itemCode.toLowerCase().includes(query)
      );
    });
  }, [stockItemsList, catalogSearch, warehouseId, validWarehouseItemIds]);

  const handleAddLineItem = (item: any) => {
    const existing = lines.find((l) => l.itemId === item.itemId);
    if (existing) {
      handleLineUpdate(item.itemId, "enteredQty", existing.enteredQty + 1);
      return;
    }

    const conversionFactor = item.alternateConversionFactor ?? 1;
    const baseUom = item.stockUom ?? "EA";
    
    const newLine: ExtendedGRNLineItem = {
      itemId: item.itemId,
      itemCode: item.itemCode,
      description: item.description,
      baseUom: baseUom,
      altUom: item.alternateUom,
      conversionFactor: conversionFactor,
      enteredQty: 1,
      selectedUom: baseUom, 
      unitPrice: item.sellingPrice ?? 0, 
      lineTotal: item.sellingPrice ?? 0,
    };

    setLines((prev) => [...prev, newLine]);
  };

  const handleLineUpdate = (itemId: string, field: keyof ExtendedGRNLineItem, value: any) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.itemId !== itemId) return line;

        const updated = { ...line, [field]: value };
        const enteredQty = field === "enteredQty" ? Math.max(0.0001, Number(value)) : line.enteredQty;
        const selectedUom = field === "selectedUom" ? value : line.selectedUom;
        const unitPrice = field === "unitPrice" ? Math.max(0, Number(value)) : line.unitPrice;

        const isAltUom = selectedUom === line.altUom;
        const resolvedBaseQty = isAltUom ? enteredQty * line.conversionFactor : enteredQty;
        const lineTotal = Number((resolvedBaseQty * unitPrice).toFixed(2));

        return { ...updated, enteredQty, selectedUom, unitPrice, lineTotal };
      })
    );
  };

  const handleRemoveLineItem = (itemId: string) => {
    setLines((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const totals = useMemo(() => {
    return lines.reduce((acc, item) => {
      const isAltUom = item.selectedUom === item.altUom;
      const resolvedBaseQty = isAltUom ? item.enteredQty * item.conversionFactor : item.enteredQty;
      acc.grandTotal += item.lineTotal;
      acc.totalBaseUnits += resolvedBaseQty;
      return acc;
    }, { grandTotal: 0, totalBaseUnits: 0 });
  }, [lines]);

  const handleSubmitGRN = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !warehouseId) {
      toast.error("Please select both a Receiving Warehouse and a Supplier.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Please add items from the catalog.");
      return;
    }

    const payload: CreateGoodsReceiptPayload = {
      warehouseId,
      supplierId,
      operatorId,
      lines: lines.map((line): GoodsReceiptLinePayload => {
        const isAltUom = line.selectedUom === line.altUom;
        const resolvedQuantity = isAltUom ? line.enteredQty * line.conversionFactor : line.enteredQty;
        return {
          itemId: line.itemId,
          quantity: resolvedQuantity, 
          unitPrice: Number(line.unitPrice),
          uomCode: line.baseUom,
        };
      }),
    };

    try {
      const responseData: GoodsReceiptCreatedData = await createGoodsReceipt(payload);
      
      const supplierName = selectedSupplier?.supplierName ?? "Unknown Supplier";
      const selectedWarehouse = warehousesList.find((w: any) => String(w.id ?? w.warehouseId) === String(warehouseId));
      const warehouseName = selectedWarehouse?.warehouseName ?? "Main Store";

      await printGRNReceipt(
        responseData,
        lines,
        supplierName,
        warehouseName,
        selectedPrinter,
        companyName,
        operatorName,
      );

      setLines([]);
      setSupplierId("");
    } catch (err: unknown) {
      handleBackendErrors(err, () => {}, setGlobalError);
    }
  };

  const isMasterCatalogLoading = isStockLoading || isWarehouseStockLoading;

  document.title = `${companyName} Goods Received Note `;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid className="px-lg-4">
          {globalError && (
            <Alert color="danger" className="mb-3 border-0 shadow-sm" toggle={() => setGlobalError(null)}>
              <i className="ri-error-warning-line me-2 align-middle fs-16"></i>{globalError}
            </Alert>
          )}

          <Form onSubmit={handleSubmitGRN}>
            <Card className="shadow-sm border-0 mb-3">
              <CardHeader className="bg-white border-bottom py-3 px-3 px-lg-4">
                <Row className="g-3 align-items-center justify-content-between">
                  <Col xl={3} lg={4} md={12}>
                    <h5 className="card-title mb-0 fs-15 fw-semibold text-dark">
                      Goods Receipt (GRN)
                    </h5>
                  </Col>

                  <Col xl={9} lg={8} md={12}>
                    <div className="d-flex align-items-center gap-2 justify-content-lg-end flex-wrap">
                      <div className="flex-grow-1 flex-lg-grow-0" style={{ minWidth: "220px" }}>
                        {isWarehousesLoading ? (
                          <Spinner size="sm" color="primary" />
                        ) : (
                          <Input
                            type="select"
                            className="form-select form-select-sm fs-12 fw-medium border-primary-subtle"
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            required
                          >
                            <option value="" disabled>Receiving Warehouse *</option>
                            {warehousesList.map((wh: any) => (
                              <option key={wh.id ?? wh.warehouseId} value={wh.id ?? wh.warehouseId}>
                                🏬 {wh.warehouseName ?? wh.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      </div>

                      <div className="flex-grow-1 flex-lg-grow-0" style={{ minWidth: "240px", position: "relative", zIndex: 1050 }}>
                        <Dropdown isOpen={isSupplierDropdownOpen} toggle={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)} className="w-100">
                          <DropdownToggle tag="div" className="d-flex justify-content-between align-items-center py-1.5 px-2 bg-light rounded cursor-pointer border border-primary-subtle">
                            <div className="d-flex align-items-center gap-1.5">
                              <i className="ri-truck-line text-muted fs-13"></i>
                              <span className="mb-0 fs-12 fw-medium text-dark text-truncate" style={{ maxWidth: "160px" }}>
                                {selectedSupplier ? ( selectedSupplier.supplierName) : "Select Supplier *"}
                              </span>
                            </div>
                            <i className="ri-arrow-down-s-line text-muted fs-12"></i>
                          </DropdownToggle>
                          <DropdownMenu className="p-2 shadow-lg w-100 border-0 rounded-3" style={{ minWidth: "260px" }}>
                            <Input
                              type="text"
                              placeholder="Search supplier..."
                              bsSize="sm"
                              className="mb-2 fs-12 shadow-none"
                              value={supplierSearch}
                              onChange={(e) => setSupplierSearch(e.target.value)}
                            />
                            <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                              {filteredSuppliers.map((sup: any) => {
                                const sId = String(sup.id ?? sup.supplierId);
                                const sName = sup.name ?? sup.supplierName ?? sup.companyName;
                                return (
                                  <div
                                    key={sId}
                                    className="p-2 rounded fs-12 cursor-pointer hover-bg-light d-flex justify-content-between"
                                    onClick={() => {
                                      setSupplierId(sId);
                                      setIsSupplierDropdownOpen(false);
                                    }}
                                  >
                                    <span className="fw-medium text-dark">{sName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardHeader>
            </Card>

            <Row className="g-3">
              <Col lg={4} xl={4}>
                <Card className="shadow-sm border-0 mb-0 d-flex flex-column" style={{ height: "calc(100vh - 190px)" }}>
                  <CardHeader className="border-bottom py-2.5 px-3 bg-white">
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control form-control-sm fs-12 ps-4"
                        placeholder="Search master catalog..."
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                      />
                      <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-13"></i>
                    </div>
                  </CardHeader>

                  <CardBody className="p-2 overflow-y-auto flex-grow-1 bg-light-subtle">
                    {isMasterCatalogLoading ? (
                      <div className="text-center py-5"><Spinner size="sm" color="primary" /></div>
                    ) : filteredCatalog.length > 0 ? (
                      <div className="d-flex flex-column gap-1.5">
                        {filteredCatalog.map((item) => {
                          const isAdded = lines.some((l) => l.itemId === item.itemId);
                          return (
                            <div
                              key={item.itemId}
                              onClick={() => handleAddLineItem(item)}
                              className={`p-2 rounded-2 border cursor-pointer transition-all bg-white hover-shadow-sm d-flex justify-content-between ${
                                isAdded ? "border-primary shadow-xs" : "border-light-subtle"
                              }`}
                            >
                              <div>
                                <span className="badge bg-light text-muted border font-monospace fs-10 px-1 py-0.5 mb-1 me-1">{item.itemCode}</span>
                                {item.alternateUom && <span className="badge bg-info-subtle text-info fs-10 px-1 py-0.5 mb-1">Dual UOM</span>}
                                <h6 className="fs-12 fw-semibold text-dark mb-0">{item.description}</h6>
                              </div>
                              <div className="text-end">
                                <span className="badge bg-primary-subtle text-primary fs-10">{item.stockUom}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-5 text-muted fs-13">No items found for this warehouse</div>
                    )}
                  </CardBody>
                </Card>
              </Col>

              <Col lg={8} xl={8}>
                <Card className="shadow-sm border-0 mb-0 d-flex flex-column" style={{ height: "calc(100vh - 190px)" }}>
                  <CardHeader className="border-bottom py-2.5 px-3 bg-white d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0 fs-15 fw-semibold text-dark">Receiving Lines</h5>
                    {lines.length > 0 && (
                      <span className="text-danger fs-12 fw-medium cursor-pointer" onClick={() => setLines([])}>Clear Lines</span>
                    )}
                  </CardHeader>

                  <CardBody className="p-0 overflow-y-auto flex-grow-1">
                    {lines.length === 0 ? (
                      <div className="text-center p-5 text-muted">
                        <i className="ri-shopping-cart-2-line display-5 mb-2 opacity-50"></i>
                        <span className="fs-13 fw-medium d-block">No stock received yet.</span>
                      </div>
                    ) : (
                      <Table responsive className="mb-0 fs-12 border-0 align-middle">
                        <thead className="table-light fs-11 text-muted text-uppercase sticky-top">
                          <tr>
                            <th style={{ width: "30%" }}>Item Description</th>
                            <th style={{ width: "25%" }}>Entered Qty & UOM</th>
                            <th style={{ width: "15%" }}>Base Qty (<span className="text-primary">Converted</span>)</th>
                            <th style={{ width: "15%" }}>Unit Cost</th>
                            <th style={{ width: "10%" }}>Total</th>
                            <th style={{ width: "5%" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((line) => {
                            const isAltSelected = line.selectedUom === line.altUom;
                            const resolvedBaseQty = isAltSelected ? line.enteredQty * line.conversionFactor : line.enteredQty;

                            return (
                              <tr key={line.itemId}>
                                <td>
                                  <div className="fw-semibold text-dark font-monospace">{line.itemCode}</div>
                                  <div className="text-muted fs-11 text-truncate" style={{ maxWidth: "180px" }}>{line.description}</div>
                                </td>

                                <td>
                                  <div className="d-flex align-items-center gap-1 mb-1">
                                    <Input
                                      type="number" bsSize="sm" min="0.0001" step="any"
                                      className="form-control text-end font-monospace shadow-none"
                                      value={line.enteredQty}
                                      onChange={(e) => handleLineUpdate(line.itemId, "enteredQty", e.target.value)}
                                      style={{ width: "70px" }}
                                    />
                                    <Input
                                      type="select" bsSize="sm"
                                      className="form-select fs-11 shadow-none"
                                      value={line.selectedUom}
                                      onChange={(e) => handleLineUpdate(line.itemId, "selectedUom", e.target.value)}
                                      style={{ width: "80px" }}
                                    >
                                      <option value={line.baseUom}>{line.baseUom}</option>
                                      {line.altUom && <option value={line.altUom}>{line.altUom}</option>}
                                    </Input>
                                  </div>
                                  {isAltSelected && (
                                    <span className="fs-10 text-muted">Factor: 1 {line.altUom} = {line.conversionFactor} {line.baseUom}</span>
                                  )}
                                </td>

                                <td>
                                  <div className="fw-bold font-monospace text-primary fs-12">
                                    {resolvedBaseQty.toLocaleString()} {line.baseUom}
                                  </div>
                                  <span className="fs-10 text-muted">Sent to ledger</span>
                                </td>

                                <td>
                                  <Input
                                    type="number" bsSize="sm" min="0" step="any"
                                    className="form-control font-monospace text-end shadow-none"
                                    value={line.unitPrice}
                                    onChange={(e) => handleLineUpdate(line.itemId, "unitPrice", e.target.value)}
                                  />
                                </td>

                                <td>
                                  <div className="fw-bold text-dark font-monospace">
                                    {line.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </div>
                                </td>

                                <td className="text-center">
                                  <i
                                    className="ri-delete-bin-line text-danger cursor-pointer fs-14"
                                    onClick={() => handleRemoveLineItem(line.itemId)}
                                  ></i>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    )}
                  </CardBody>

                  <div className="p-3 bg-white border-top flex-shrink-0">
                    <Row className="align-items-center g-2">
                      <Col xs={5}>
                        <div className="d-flex gap-4 text-muted fs-11">
                          <div>Lines: <strong className="text-dark">{lines.length}</strong></div>
                          <div>Base Ledger Units: <strong className="text-dark font-monospace">{totals.totalBaseUnits.toLocaleString()}</strong></div>
                        </div>
                      </Col>

                      <Col xs={7} className="d-flex align-items-center justify-content-end gap-3">
                        <div className="text-end">
                          <span className="fs-11 text-muted d-block">Document Value</span>
                          <h4 className="mb-0 fw-bold text-dark fs-16 font-monospace">
                            {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </h4>
                        </div>

                        <div style={{ width: "170px" }}>
                          {isPrintersLoading ? (
                            <Spinner size="sm" color="primary" />
                          ) : (
                            <Input
                              type="select"
                              bsSize="sm"
                              className="form-select form-select-sm fs-12 border-primary-subtle shadow-none"
                              value={selectedPrinter}
                              onChange={(e) => setSelectedPrinter(e.target.value)}
                            >
                              <option value="EXPORT_PDF">Export to PDF</option>
                              {printersList?.map((printer: string) => (
                                <option key={printer} value={printer}>{printer}</option>
                              ))}
                            </Input>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="border-0 rounded py-2 px-3 shadow-sm d-flex align-items-center gap-2"
                          style={{ backgroundColor: isPosting || lines.length === 0 || !supplierId ? "#a3b4cc" : BRAND_PURPLE }}
                          disabled={isPosting || lines.length === 0 || !supplierId}
                        >
                          {isPosting ? <Spinner size="sm" /> : (
                            <>
                              <i className={selectedPrinter === "EXPORT_PDF" ? "ri-file-pdf-line text-white" : "ri-printer-line text-white"}></i> 
                              <span className="fs-12 fw-semibold text-white">
                                {selectedPrinter === "EXPORT_PDF" ? "Post & Export PDF" : "Post & Print"}
                              </span>
                            </>
                          )}
                        </Button>
                      </Col>
                    </Row>
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

export default GoodsReceivedNote;