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
  Table,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
} from "reactstrap";
import { toast } from "react-toastify";

// Hooks & Types
import { GRNPayload, GRNLineItem } from "../../types/grn";
import { useGRNMutation } from "../../Components/Hooks/useGrn";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { useWarehouseStock } from "../../Components/Hooks/useWarehouseStock";
import { useSuppliers } from "../../Components/Hooks/useSuppliers";

// Visual Theme Palette
const BRAND_PURPLE = "#042e6d";
const BRAND_PURPLE_SUBTLE = "rgba(4, 46, 109, 0.08)";
const DEFAULT_TAX_RATE = 16;

type ExtendedGRNLineItem = GRNLineItem & {
  enteredQty: number;
  selectedUom: string;
  altUom?: string;
  conversionFactor: number;
};

export const GoodsReceivedNote: React.FC = () => {
  // TanStack Query Hooks
  const { createGRN, isPosting } = useGRNMutation();
  const { data: warehousesData, isLoading: isWarehousesLoading } = useWarehouses(true);
  const { data: suppliersData, isLoading: isSuppliersLoading } = useSuppliers(1, 100);

  // Normalize Warehouses List
  const warehousesList = useMemo(() => {
    if (!warehousesData) return [];
    return Array.isArray(warehousesData) ? warehousesData : warehousesData.warehouses ?? [];
  }, [warehousesData]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (warehousesList.length > 0 && !selectedWarehouseId) {
      const firstWh = warehousesList[0];
      setSelectedWarehouseId(firstWh.id ?? firstWh.warehouseId);
    }
  }, [warehousesList, selectedWarehouseId]);

  // Warehouse Stock Inventory Query
  const { balances: stockBalances = [], isLoading: isStockLoading } = useWarehouseStock(selectedWarehouseId);

  // Normalize Suppliers List
  const suppliersList = useMemo(() => {
    if (!suppliersData) return [];
    return Array.isArray(suppliersData) ? suppliersData : suppliersData.suppliers ?? [];
  }, [suppliersData]);

  // GRN Header State
  const [supplierId, setSupplierId] = useState<string>("");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>("");
  const [documentNumber, setDocumentNumber] = useState<string>(
    `GRN-${Math.floor(100000 + Math.random() * 900000)}`
  );

  // Search & Line Items State
  const [catalogSearch, setCatalogSearch] = useState("");
  const [lines, setLines] = useState<ExtendedGRNLineItem[]>([]);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");

  // Selected Supplier Lookup
  const selectedSupplier = useMemo(() => {
    return suppliersList.find((s: any) => String(s.id ?? s.supplierId) === String(supplierId));
  }, [suppliersList, supplierId]);

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearch.toLowerCase();
    return suppliersList.filter((s: any) => {
      const name = (s.name ?? s.supplierName ?? s.companyName ?? "").toLowerCase();
      const code = (s.code ?? s.supplierCode ?? "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [suppliersList, supplierSearch]);

  // Catalog Filtering for Stock Picker
  const filteredStockBalances = useMemo(() => {
    if (!Array.isArray(stockBalances)) return [];
    const query = catalogSearch.toLowerCase();
    return stockBalances.filter((stock: any) => {
      const itemName = stock.stockItem?.description ?? stock.description ?? stock.stock_item?.description ?? "";
      const itemCode = stock.stockItem?.itemCode ?? stock.stockCode ?? stock.stock_item?.stock_code ?? "";
      return itemName.toLowerCase().includes(query) || itemCode.toLowerCase().includes(query);
    });
  }, [stockBalances, catalogSearch]);

  // Fast Add Stock Item to GRN Grid
  const handleAddLineItem = (stock: any) => {
    const itemId = String(stock.stockItemId ?? stock.stockItem?.id ?? stock.id);
    const existing = lines.find((l) => l.stockItemId === itemId);

    if (existing) {
      handleLineUpdate(itemId, "enteredQty", existing.enteredQty + 1);
      return;
    }

    const itemCode = stock.stockItem?.itemCode ?? stock.stockCode ?? stock.stock_code ?? "STK";
    const itemName = stock.stockItem?.description ?? stock.description ?? "Stock Item";
    const baseUom = stock.uom ?? stock.unitOfMeasure ?? stock.stockItem?.uom ?? "EA";
    const altUom = stock.altUom ?? stock.stockItem?.altUom ?? undefined;
    const factor = Number(stock.conversionFactor ?? stock.stockItem?.conversionFactor ?? 1);
    const defaultCost = Number(stock.unitCost ?? stock.sellingPrice ?? stock.unit_cost ?? 0);

    const enteredQty = 1;
    const activeUom = altUom || baseUom;
    const effectiveFactor = activeUom === baseUom ? 1 : factor;
    const calculatedBaseQty = enteredQty * effectiveFactor;
    const taxRate = DEFAULT_TAX_RATE;

    const subtotal = calculatedBaseQty * defaultCost;
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const lineTotal = Number((subtotal + taxAmount).toFixed(2));

    const newLine: ExtendedGRNLineItem = {
      stockItemId: itemId,
      stockItemCode: itemCode,
      stockItemName: itemName,
      uom: baseUom,
      altUom: altUom,
      selectedUom: activeUom,
      conversionFactor: factor,
      enteredQty: enteredQty,
      quantity: calculatedBaseQty,
      unitPrice: defaultCost,
      taxRate,
      taxAmount,
      lineTotal,
    };

    setLines((prev) => [...prev, newLine]);
  };

  // SYSPRO Dual UOM & Line Calculation Handler
  const handleLineUpdate = (
    stockItemId: string,
    field: keyof ExtendedGRNLineItem,
    value: any
  ) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.stockItemId !== stockItemId) return line;

        const updated = { ...line, [field]: value };

        let enteredQty = field === "enteredQty" ? Math.max(0.0001, Number(value)) : line.enteredQty;
        let selectedUom = field === "selectedUom" ? value : line.selectedUom;
        let factor = field === "conversionFactor" ? Math.max(0.0001, Number(value)) : line.conversionFactor;
        let unitPrice = field === "unitPrice" ? Math.max(0, Number(value)) : line.unitPrice;
        let taxRate = field === "taxRate" ? Math.max(0, Number(value)) : (line.taxRate ?? DEFAULT_TAX_RATE);

        // SYSPRO UOM Logic: Standard Base UOM forces effective factor to 1
        const effectiveFactor = selectedUom === line.uom ? 1 : factor;

        // Normalized Stock Quantity = Entered Quantity * Effective Conversion Factor
        const calculatedBaseQty = Number((enteredQty * effectiveFactor).toFixed(4));

        const subtotal = calculatedBaseQty * unitPrice;
        const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
        const lineTotal = Number((subtotal + taxAmount).toFixed(2));

        return {
          ...updated,
          enteredQty,
          selectedUom,
          conversionFactor: factor,
          quantity: calculatedBaseQty,
          unitPrice,
          taxRate,
          taxAmount,
          lineTotal,
        };
      })
    );
  };

  const handleRemoveLineItem = (stockItemId: string) => {
    setLines((prev) => prev.filter((i) => i.stockItemId !== stockItemId));
  };

  const handleClearGRN = () => {
    setLines([]);
    setSupplierInvoiceNo("");
  };

  // Order Totals Summary
  const totals = useMemo(() => {
    return lines.reduce(
      (acc, item) => {
        const sub = item.quantity * item.unitPrice;
        acc.subtotal += sub;
        acc.taxTotal += item.taxAmount ?? 0;
        acc.grandTotal += item.lineTotal;
        acc.totalBaseUnits += item.quantity;
        return acc;
      },
      { subtotal: 0, taxTotal: 0, grandTotal: 0, totalBaseUnits: 0 }
    );
  }, [lines]);

  // Form Submission via GRN Mutation Hook
  const handleSubmitGRN = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error("Please select a Supplier for 3-Way Matching.");
      return;
    }

    if (!supplierInvoiceNo.trim()) {
      toast.error("Supplier Invoice / Delivery Note # is required.");
      return;
    }

    if (lines.length === 0) {
      toast.error("Please select items to receive into stock.");
      return;
    }

    const payload: GRNPayload = {
      documentNumber,
      supplierId,
      supplierInvoiceNo,
      items: lines.map((line) => ({
        stockItemId: line.stockItemId,
        quantity: Number(line.quantity), // Transmits Normalized Base Stock Qty for FIFO Lot Update
        unitPrice: Number(line.unitPrice),
      })),
    };

    try {
      await createGRN(payload);
      handleClearGRN();
      setSupplierId("");
      setDocumentNumber(`GRN-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch (err: any) {
      // Handled in Hook Toast
    }
  };

  document.title = "Goods Received Note | SYSPRO ERP";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Form onSubmit={handleSubmitGRN}>
            {/* Header Control Panel */}
            <Card className="shadow-sm border-0 mb-3">
              <CardHeader className="bg-white border-bottom py-3 px-3">
                <Row className="g-3 align-items-center justify-content-between">
                  <Col md={4} sm={12}>
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="card-title mb-0 fs-16 fw-semibold text-dark text-nowrap">
                        Goods Received Note
                      </h5>
                      <Badge color="light" className="text-dark border font-monospace px-2 py-1 fs-11">
                        Ref: {documentNumber}
                      </Badge>
                    </div>
                  </Col>

                  <Col md={8} sm={12}>
                    <div className="d-flex align-items-center gap-2 justify-content-md-end">
                      {/* Warehouse Selector */}
                      <div style={{ minWidth: "200px" }}>
                        {isWarehousesLoading ? (
                          <Spinner size="sm" color="primary" />
                        ) : (
                          <Input
                            type="select"
                            className="form-select form-select-sm fs-12 fw-medium"
                            value={selectedWarehouseId ?? ""}
                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                          >
                            <option value="" disabled>Select Receiving Warehouse</option>
                            {warehousesList.map((wh: any) => (
                              <option key={wh.id ?? wh.warehouseId} value={wh.id ?? wh.warehouseId}>
                                🏬 {wh.warehouseName ?? wh.name}
                              </option>
                            ))}
                          </Input>
                        )}
                      </div>

                      {/* Supplier Picker Dropdown */}
                      <div style={{ minWidth: "240px", position: "relative", zIndex: 1050}}>
                        <Dropdown
                          isOpen={isSupplierDropdownOpen}
                          toggle={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                          className="w-100"
                        >
                          <DropdownToggle
                            tag="div"
                            className="d-flex justify-content-between align-items-center p-1.5 px-2 bg-light rounded cursor-pointer border border-light-subtle"
                          >
                            <div className="d-flex align-items-center gap-1.5">
                              <i className="ri-truck-line text-muted fs-13"></i>
                              <span className="mb-0 fs-12 fw-medium text-dark text-truncate" style={{ maxWidth: "170px" }}>
                                {selectedSupplier ? (selectedSupplier.name ?? selectedSupplier.supplierName) : "Select Supplier *"}
                              </span>
                            </div>
                            <i className="ri-arrow-down-s-line text-muted fs-12"></i>
                          </DropdownToggle>
                          <DropdownMenu className="p-2 shadow-lg w-100 border-0 rounded-3" style={{ minWidth: "260px" }}>
                            <Input
                              type="text"
                              placeholder="Search supplier name/code..."
                              bsSize="sm"
                              className="mb-2 fs-12 shadow-none border-light-subtle bg-light"
                              value={supplierSearch}
                              onChange={(e) => setSupplierSearch(e.target.value)}
                            />
                            <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                              {isSuppliersLoading ? (
                                <div className="p-2 text-center text-muted fs-11">Loading suppliers...</div>
                              ) : filteredSuppliers.length === 0 ? (
                                <div className="p-2 text-center text-muted fs-11">No suppliers found</div>
                              ) : (
                                filteredSuppliers.map((sup: any) => {
                                  const sId = String(sup.id ?? sup.supplierId);
                                  const sName = sup.name ?? sup.supplierName ?? sup.companyName;
                                  return (
                                    <div
                                      key={sId}
                                      className="p-2 rounded fs-12 cursor-pointer hover-bg-light d-flex align-items-center justify-content-between"
                                      onClick={() => {
                                        setSupplierId(sId);
                                        setIsSupplierDropdownOpen(false);
                                      }}
                                    >
                                      <span className="fw-medium text-dark d-block text-truncate">{sName}</span>
                                      <span className="badge bg-light text-muted font-monospace fs-10">{sup.code ?? sup.supplierCode ?? sId}</span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </DropdownMenu>
                        </Dropdown>
                      </div>

                      {/* Supplier Invoice / DN Input */}
                      <div style={{ minWidth: "200px" }}>
                        <Input
                          type="text"
                          bsSize="sm"
                          className="form-control form-control-sm fs-12 font-monospace border-primary-subtle"
                          placeholder="Supplier Invoice / DN # *"
                          value={supplierInvoiceNo}
                          onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardHeader>
            </Card>

            <Row>
              {/* Product Catalog Selector */}
              <Col lg={4} xl={4}>
                <Card className="shadow-sm border-0 mb-3" style={{ height: "calc(100vh - 240px)", display: "flex", flexDirection: "column" }}>
                  <CardHeader className="border-bottom py-2.5 px-3 bg-white">
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control form-control-sm fs-12 ps-4"
                        placeholder="Search stock code or description..."
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                      />
                      <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-13"></i>
                      {catalogSearch && (
                        <i
                          className="ri-close-fill position-absolute top-50 end-0 translate-middle-y me-2 text-muted fs-14 cursor-pointer"
                          onClick={() => setCatalogSearch("")}
                        ></i>
                      )}
                    </div>
                  </CardHeader>

                  <CardBody className="p-2 overflow-y-auto flex-grow-1 bg-light-subtle" style={{ minHeight: 0 }}>
                    {isStockLoading ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5">
                        <Spinner size="sm" color="primary" className="mb-2" />
                        <span className="text-muted fs-12 fw-medium">Loading warehouse stock...</span>
                      </div>
                    ) : filteredStockBalances.length > 0 ? (
                      <div className="d-flex flex-column gap-1.5">
                        {filteredStockBalances.map((stock: any) => {
                          const itemId = String(stock.stockItemId ?? stock.stockItem?.id ?? stock.id);
                          const itemCode = stock.stockItem?.itemCode ?? stock.stockCode ?? stock.stock_code ?? "STK";
                          const itemName = stock.stockItem?.description ?? stock.description ?? "Unnamed Item";
                          const uom = stock.uom ?? stock.unitOfMeasure ?? stock.stockItem?.uom ?? "EA";
                          const qtyOnHand = Number(stock.qtyOnHand ?? 0);

                          const isAdded = lines.some((l) => l.stockItemId === itemId);

                          return (
                            <div
                              key={itemId}
                              onClick={() => handleAddLineItem(stock)}
                              className={`p-2 rounded-2 border cursor-pointer transition-all bg-white hover-shadow-sm d-flex align-items-center justify-content-between ${
                                isAdded ? "border-primary shadow-xs" : "border-light-subtle"
                              }`}
                            >
                              <div className="pe-2" style={{ minWidth: 0 }}>
                                <div className="d-flex align-items-center gap-1.5 mb-1">
                                  <span className="badge bg-light text-muted border font-monospace fs-10 px-1 py-0.5 fw-normal">
                                    {itemCode}
                                  </span>
                                  <span className="badge bg-primary-subtle text-primary fs-10 px-1 py-0.5">
                                    {uom}
                                  </span>
                                </div>
                                <h6 className="fs-12 fw-semibold text-dark mb-0 text-truncate" style={{ maxWidth: "210px" }}>
                                  {itemName}
                                </h6>
                              </div>
                              <div className="text-end flex-shrink-0">
                                <span className="fs-10 text-muted d-block">On Hand</span>
                                <span className={`fs-11 fw-bold font-monospace ${qtyOnHand > 0 ? "text-success" : "text-danger"}`}>
                                  {qtyOnHand}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5 text-center text-muted">
                        <i className="ri-inbox-line display-6 text-muted mb-2 opacity-50"></i>
                        <h6 className="fs-13 fw-semibold text-dark mb-1">No stock items found</h6>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>

              {/* GRN High-Density Line Grid & Dual UOM Handling */}
              <Col lg={8} xl={8}>
                <Card className="shadow-sm border-0 mb-3" style={{ height: "calc(100vh - 240px)", display: "flex", flexDirection: "column" }}>
                  <CardHeader className="border-bottom py-2.5 px-3 bg-white d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="card-title mb-0 fs-15 fw-semibold text-dark">Received Line Items</h5>
                      <Badge style={{ backgroundColor: BRAND_PURPLE_SUBTLE, color: BRAND_PURPLE }} className="px-2 py-0.5 fs-11">
                        {lines.length} Line{lines.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {lines.length > 0 && (
                      <span className="text-danger fs-12 fw-medium cursor-pointer" onClick={handleClearGRN}>
                        Clear Lines
                      </span>
                    )}
                  </CardHeader>

                  <CardBody className="p-0 overflow-y-auto flex-grow-1" style={{ minHeight: 0 }}>
                    {lines.length === 0 ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                        <i className="ri-file-add-line display-5 text-muted mb-2 opacity-50"></i>
                        <span className="fs-13 fw-medium">No line items added to GRN</span>
                        <span className="fs-11 text-muted">Select products from the left stock catalog.</span>
                      </div>
                    ) : (
                      <Table responsive className="mb-0 fs-12 border-0 align-middle">
                        <thead className="table-light fs-11 text-muted text-uppercase sticky-top">
                          <tr>
                            <th style={{ width: "25%" }}>Stock Code & Name</th>
                            <th style={{ width: "22%" }}>Receipt Qty & UOM</th>
                            <th style={{ width: "18%" }}>Base Stock Qty</th>
                            <th style={{ width: "15%" }}>Unit Cost</th>
                            <th style={{ width: "15%" }}>Line Total</th>
                            <th style={{ width: "5%" }} className="text-center"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((line) => {
                            const isAltSelected = line.selectedUom !== line.uom;

                            return (
                              <tr key={line.stockItemId}>
                                <td>
                                  <div className="fw-semibold text-dark font-monospace">{line.stockItemCode}</div>
                                  <div className="text-muted fs-11 text-truncate" style={{ maxWidth: "170px" }}>
                                    {line.stockItemName}
                                  </div>
                                </td>

                                {/* Dual UOM Controls */}
                                <td>
                                  <div className="d-flex align-items-center gap-1 mb-1">
                                    <Input
                                      type="number"
                                      bsSize="sm"
                                      min="0.0001"
                                      step="any"
                                      className="form-control form-control-sm text-end font-monospace fw-bold shadow-none"
                                      value={line.enteredQty}
                                      onChange={(e) => handleLineUpdate(line.stockItemId, "enteredQty", e.target.value)}
                                      style={{ width: "75px" }}
                                    />
                                    <Input
                                      type="select"
                                      bsSize="sm"
                                      className="form-select form-select-sm fs-11 shadow-none"
                                      value={line.selectedUom}
                                      onChange={(e) => handleLineUpdate(line.stockItemId, "selectedUom", e.target.value)}
                                      style={{ width: "80px" }}
                                    >
                                      <option value={line.uom}>{line.uom}</option>
                                      {line.altUom && <option value={line.altUom}>{line.altUom}</option>}
                                    </Input>
                                  </div>

                                  {/* Inline Conversion Factor Adjustment */}
                                  {isAltSelected && (
                                    <div className="d-flex align-items-center gap-1 fs-10 text-muted">
                                      <span>1 {line.selectedUom} =</span>
                                      <Input
                                        type="number"
                                        bsSize="sm"
                                        min="0.0001"
                                        step="any"
                                        className="form-control form-control-sm p-0 px-1 text-center font-monospace fs-10"
                                        value={line.conversionFactor}
                                        onChange={(e) => handleLineUpdate(line.stockItemId, "conversionFactor", e.target.value)}
                                        style={{ width: "45px", height: "20px" }}
                                      />
                                      <span>{line.uom}</span>
                                    </div>
                                  )}
                                </td>

                                {/* Normalized Base Quantity */}
                                <td>
                                  <div className="fw-bold font-monospace text-primary fs-12">
                                    {line.quantity.toLocaleString()} {line.uom}
                                  </div>
                                  <span className="fs-10 text-muted">Base Stock Unit</span>
                                </td>

                                {/* Unit Cost Input */}
                                <td>
                                  <Input
                                    type="number"
                                    bsSize="sm"
                                    min="0"
                                    step="any"
                                    className="form-control form-control-sm font-monospace text-end shadow-none"
                                    value={line.unitPrice}
                                    onChange={(e) => handleLineUpdate(line.stockItemId, "unitPrice", e.target.value)}
                                    style={{ width: "85px" }}
                                  />
                                </td>

                                {/* Calculated Line Total */}
                                <td>
                                  <div className="fw-bold text-dark font-monospace">
                                    {line.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  <span className="fs-10 text-muted">VAT ({line.taxRate ?? DEFAULT_TAX_RATE}%)</span>
                                </td>

                                {/* Action */}
                                <td className="text-center">
                                  <i
                                    className="ri-delete-bin-line text-danger cursor-pointer fs-14"
                                    title="Remove line item"
                                    onClick={() => handleRemoveLineItem(line.stockItemId)}
                                  ></i>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    )}
                  </CardBody>

                  {/* Summary & Posting Bar */}
                  <div className="p-3 bg-white border-top border-light-subtle flex-shrink-0">
                    <Row className="align-items-center">
                      <Col md={7}>
                        <div className="d-flex align-items-center gap-4 text-muted fs-12">
                          <div>
                            <span>Total Items: </span>
                            <strong className="text-dark">{lines.length}</strong>
                          </div>
                          <div>
                            <span>Total Base Stock Units: </span>
                            <strong className="text-dark font-monospace">{totals.totalBaseUnits.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span>Tax Total: </span>
                            <strong className="text-dark font-monospace">{totals.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                          </div>
                        </div>
                      </Col>

                      <Col md={5} className="d-flex align-items-center justify-content-end gap-3">
                        <div className="text-end">
                          <span className="fs-11 text-muted d-block">Grand Total</span>
                          <h4 className="mb-0 fw-bold text-dark fs-18 font-monospace">
                            {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h4>
                        </div>

                        <Button
                          type="submit"
                          className="border-0 rounded py-2 px-3 shadow-sm d-flex align-items-center gap-2"
                          style={{
                            backgroundColor: isPosting || lines.length === 0 || !supplierId || !supplierInvoiceNo ? "#a3b4cc" : BRAND_PURPLE,
                          }}
                          disabled={isPosting || lines.length === 0 || !supplierId || !supplierInvoiceNo}
                        >
                          {isPosting ? (
                            <>
                              <Spinner size="sm" />
                              <span className="fs-13 fw-semibold">Posting GRN...</span>
                            </>
                          ) : (
                            <>
                              <span className="fs-13 fw-semibold text-white">Post Goods Receipt</span>
                              <i className="ri-arrow-right-line fs-14 text-white"></i>
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