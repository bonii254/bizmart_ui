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
  FormGroup,
  Label,
} from "reactstrap";
import { toast } from "react-toastify";

// Hooks
import { useGRNMutation } from "../../Components/Hooks/useGrn";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { useCategories } from "../../Components/Hooks/useCategory";
import { useSuppliers } from "../../Components/Hooks/useSuppliers"; // Replace with your actual supplier hook import

import { 
  usePrinters, 
  usePrintReceiptMutation 
} from "../../Components/Hooks/useQZPrinter";
import { formatCurrency } from "../../utils/qzConfig";
import { GRNLineItem, GRNPayload } from "../../types/grn";

const BRAND_PURPLE = "#042e6d";

export const GoodsReceiptTerminal: React.FC = () => {
  const { createGRN, isPosting } = useGRNMutation();

  // QZ Printer Setup
  const { data: printersList = [], isLoading: isPrintersLoading } = usePrinters();
  const { printReceipt, isPrinting } = usePrintReceiptMutation();
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");

  useEffect(() => {
    if (printersList.length > 0 && !selectedPrinter) {
      const savedPrinter = localStorage.getItem("grn_preferred_printer");
      setSelectedPrinter(savedPrinter && printersList.includes(savedPrinter) ? savedPrinter : printersList[0]);
    }
  }, [printersList, selectedPrinter]);

  const handlePrinterChange = (printerName: string) => {
    setSelectedPrinter(printerName);
    localStorage.setItem("grn_preferred_printer", printerName);
  };

  // Data Queries
  const { data: stockItemsData, isLoading: isStockLoading } = useStockItems();
  const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories("", true);
  const { data: suppliersData, isLoading: isSuppliersLoading } = useSuppliers(1, 100);

  const stockCatalog = useMemo(() => {
    if (!stockItemsData) return [];
    return Array.isArray(stockItemsData) ? stockItemsData : stockItemsData.catalog ?? [];
  }, [stockItemsData]);

  const suppliersList = useMemo(() => {
    if (!suppliersData) return [];
    return Array.isArray(suppliersData) ? suppliersData : suppliersData.suppliers ?? suppliersData.suppliers ?? [];
  }, [suppliersData]);

  const categoriesList = useMemo(() => {
    if (!categoriesData) return ["All"];
    const cats = Array.isArray(categoriesData) ? categoriesData : categoriesData.categories ?? [];
    const validNames = cats
      .map((c: any) => (typeof c === "string" ? c : c.categoryName ?? c.category_code ?? ""))
      .filter((name: string) => name?.trim() !== "");
    return ["All", ...Array.from(new Set(validNames))];
  }, [categoriesData]);

  // GRN State
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>("");

  const [grnItems, setGrnItems] = useState<GRNLineItem[]>([]);

  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const grnItemsMap = useMemo(() => {
    const map = new Map<string, GRNLineItem>();
    grnItems.forEach((item) => map.set(item.stockItemId, item));
    return map;
  }, [grnItems]);

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.toLowerCase();
    return suppliersList.filter((s: any) => {
      const nameMatch = (s.supplierName ?? s.name ?? "").toLowerCase().includes(query);
      const codeMatch = (s.supplierCode ?? s.code ?? "").toLowerCase().includes(query);
      return nameMatch || codeMatch;
    });
  }, [suppliersList, supplierSearch]);

  // Total Summary
  const grnTotal = useMemo(() => {
    return grnItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  }, [grnItems]);

  const filteredCatalogItems = useMemo(() => {
    if (!Array.isArray(stockCatalog)) return [];
    const query = catalogSearch.toLowerCase();
    return stockCatalog.filter((item: any) => {
      const itemName = item.description ?? "";
      const itemCode = item.itemCode ?? "";
      const itemCategory = item.categoryName ?? "";

      const matchesSearch = itemName.toLowerCase().includes(query) || itemCode.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "All" || itemCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [stockCatalog, catalogSearch, selectedCategory]);

  const handleTileTap = (item: any) => {
    const itemId = item.id ?? item.stockItemId;
    const existing = grnItemsMap.get(itemId);

    if (existing) {
      handleQuantityOrPriceChange(itemId, "quantity", existing.quantity + 1);
    } else {
      const itemCode = item.itemCode ?? "STK";
      const itemName = item.description ?? "Stock Item";
      const unitPrice = Number(item.costPrice ?? item.unitCost ?? 0);
      const uom = item.uom ?? "UNITS";
      const lineTotal = Number((1 * unitPrice).toFixed(2));

      setGrnItems((prev) => [
        ...prev,
        {
          stockItemId: itemId,
          stockItemCode: itemCode,
          stockItemName: itemName,
          uom,
          quantity: 1,
          unitPrice,
          lineTotal,
        },
      ]);
    }
  };

  const handleRemoveLineItem = (stockItemId: string) => {
    setGrnItems((prev) => prev.filter((i) => i.stockItemId !== stockItemId));
  };

  const handleQuantityOrPriceChange = (
    stockItemId: string,
    field: "quantity" | "unitPrice",
    value: number
  ) => {
    setGrnItems((prev) =>
      prev.map((item) => {
        if (item.stockItemId !== stockItemId) return item;

        const qty = field === "quantity" ? Math.max(1, value) : item.quantity;
        const price = field === "unitPrice" ? Math.max(0, value) : item.unitPrice;
        const lineTotal = Number((qty * price).toFixed(2));

        return {
          ...item,
          quantity: qty,
          unitPrice: price,
          lineTotal,
        };
      })
    );
  };

  const handleClearTerminal = () => {
    setGrnItems([]);
    setSupplierInvoiceNo("");
    setSelectedSupplier(null);
  };

  const handleSubmitGRN = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      toast.error("Please select a supplier for this receipt.");
      return;
    }

    if (!supplierInvoiceNo.trim()) {
      toast.error("Supplier Invoice Number is required.");
      return;
    }

    if (grnItems.length === 0) {
      toast.error("Please select items to receive into warehouse stock.");
      return;
    }

    try {
      const payload: GRNPayload = {
        supplierId: selectedSupplier.id ?? selectedSupplier.supplierId,
        supplierInvoiceNo: supplierInvoiceNo.trim(),
        items: grnItems.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      const response = await createGRN(payload);
      const postedDocument = response?.documentNumber;

      const printPayload = {
        companyName: "FRESHA ENTERPRISES",
        storeName: "MAIN WAREHOUSE - RECEIVING",
        receiptNo: postedDocument?.includes ?? `GRN-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleString(),
        cashier: "STORES OFFICER",
        customerName: selectedSupplier.supplierName ?? selectedSupplier.name ?? "Supplier",
        items: grnItems.map((i) => ({
          name: i.stockItemName,
          qty: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate ?? DEFAULT_TAX_RATE,
          taxAmount: i.taxAmount ?? 0,
          total: i.lineTotal,
        })),
        subtotal: grnTotal,
        taxTotal: 0,
        grandTotal: grnTotal,
        paymentMethod: `INV: ${supplierInvoiceNo}`,
      };

      if (selectedPrinter) {
        try {
          await printReceipt({
            printerName: selectedPrinter,
            receiptData: printPayload,
          });
        } catch (printErr) {
          console.error("Thermal print failure:", printErr);
        }
      } else {
        toast.warn("GRN posted, but no thermal printer is connected.");
      }

      handleClearTerminal();
    } catch (err: any) {
      // Toast errors are already handled in useGRNMutation onError
    }
  };

  document.title = "Goods Receipt Note | Warehouse Terminal";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Form onSubmit={handleSubmitGRN}>
            <Row>
              {/* Left Column: Master Stock Catalog Selection */}
              <Col lg={7} xl={8}>
                <Card className="shadow-sm border-0 mb-3" style={{ height: "calc(100vh - 165px)", display: "flex", flexDirection: "column" }}>
                  <CardHeader className="border-bottom py-3 px-3 bg-white">
                    <Row className="g-3 align-items-center justify-content-between">
                      <Col md={7} sm={12}>
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="card-title mb-0 fs-15 fw-semibold text-dark text-nowrap">
                            Stock Inward Receiving
                          </h5>

                          <div className="flex-grow-1" style={{ maxWidth: "200px" }}>
                            {isPrintersLoading ? (
                              <Spinner size="sm" color="secondary" />
                            ) : (
                              <Input
                                type="select"
                                className="form-select form-select-sm fs-12 border-primary-subtle"
                                value={selectedPrinter}
                                onChange={(e) => handlePrinterChange(e.target.value)}
                              >
                                {printersList.length === 0 ? (
                                  <option value="">No Printers</option>
                                ) : (
                                  printersList.map((p) => (
                                    <option key={p} value={p}>
                                      🖨️ {p}
                                    </option>
                                  ))
                                )}
                              </Input>
                            )}
                          </div>
                        </div>
                      </Col>

                      <Col md={5} sm={12}>
                        <div className="search-box position-relative">
                          <Input
                            type="text"
                            className="form-control form-control-sm fs-12 ps-4"
                            placeholder="Search stock item code or description..."
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
                      </Col>

                      {/* Category Horizontal Filter Pills */}
                      <Col xs={12} className="pt-1">
                        <div
                          className="d-flex gap-2 pb-1"
                          onWheel={(e) => {
                            if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
                          }}
                          style={{ overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap", scrollbarWidth: "none" }}
                        >
                          {isCategoriesLoading ? (
                            <Spinner size="sm" color="primary" className="my-1" />
                          ) : (
                            [...categoriesList]
                              .sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)))
                              .map((cat: string, index: number) => {
                                const isSelected = selectedCategory === cat;
                                return (
                                  <div
                                    key={cat || index}
                                    onClick={() => setSelectedCategory(cat)}
                                    className="px-3 py-1 rounded-pill fs-11 cursor-pointer text-nowrap user-select-none flex-shrink-0 transition-all"
                                    style={{
                                      backgroundColor: isSelected ? BRAND_PURPLE : "#f3f6f9",
                                      color: isSelected ? "#ffffff" : "#495057",
                                      border: isSelected ? `1px solid ${BRAND_PURPLE}` : "1px solid #e2e5e8",
                                      fontWeight: isSelected ? "600" : "500",
                                      lineHeight: "1.2",
                                    }}
                                  >
                                    {cat}
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </Col>
                    </Row>
                  </CardHeader>

                  <CardBody className="p-2 p-sm-3 overflow-y-auto flex-grow-1 bg-light-subtle" style={{ minHeight: 0 }}>
                    {isStockLoading ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5">
                        <Spinner size="sm" color="primary" className="mb-2" />
                        <span className="text-muted fs-12 fw-medium">Loading stock catalog...</span>
                      </div>
                    ) : filteredCatalogItems.length > 0 ? (
                      <Row className="g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4 row-cols-xxl-5">
                        {filteredCatalogItems.map((item: any) => {
                          const itemId = item.id ?? item.stockItemId;
                          const itemCode = item.itemCode ?? "CODE";
                          const itemName = item.description ?? "Unnamed Item";
                          const uom = item.uom ?? "UNITS";
                          const costPrice = Number(item.costPrice ?? item.unitCost ?? 0);

                          const grnItem = grnItemsMap.get(itemId);
                          const inGrnQty = grnItem ? grnItem.quantity : 0;
                          const isSelected = inGrnQty > 0;

                          return (
                            <Col key={itemId}>
                              <div
                                onClick={() => handleTileTap(item)}
                                className={`card h-100 border cursor-pointer user-select-none transition-all mb-0 rounded-2 position-relative ${
                                  isSelected ? "border-primary shadow-sm" : "border-light-subtle shadow-none hover-shadow-sm"
                                }`}
                                style={{
                                  minHeight: "128px",
                                  backgroundColor: isSelected ? "rgba(4, 46, 109, 0.05)" : "#ffffff",
                                  borderColor: isSelected ? BRAND_PURPLE : undefined,
                                }}
                              >
                                <div className="card-body p-2 d-flex flex-column justify-content-between">
                                  <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                    <span className="badge bg-light text-muted border border-light-subtle font-monospace fs-10 px-1.5 py-0.5 fw-normal text-truncate" style={{ maxWidth: "60%" }}>
                                      {itemCode}
                                    </span>
                                    {isSelected && (
                                      <Badge className="fs-10 px-2 py-0.5 rounded-pill d-flex align-items-center gap-1 fw-semibold shadow-xs ms-auto flex-shrink-0" style={{ backgroundColor: BRAND_PURPLE, color: "#ffffff" }}>
                                        <i className="ri-inbox-archive-line fs-10"></i>
                                        <span>{inGrnQty}</span>
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="my-auto py-1">
                                    <h6 className="fs-12 fw-semibold text-dark mb-0 lh-sm" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                      {itemName}
                                    </h6>
                                  </div>
                                  <div className="pt-1.5 border-top border-light-subtle mt-auto">
                                    <div className="d-flex align-items-end justify-content-between gap-1">
                                      <span className="text-muted fs-10 fw-normal lh-1">{uom}</span>
                                      <div className="text-end flex-shrink-0">
                                        <span className="fs-12 fw-bold text-primary font-monospace d-block lh-1">
                                          {formatCurrency(costPrice)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    ) : (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5 text-center text-muted">
                        <i className="ri-inbox-line display-5 text-muted mb-2 opacity-50"></i>
                        <h6 className="fs-13 fw-semibold text-dark mb-1">No stock items found</h6>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>

              {/* Right Column: Active GRN Receiving Dock & Posting Controls */}
              <Col lg={5} xl={4}>
                <Card className="shadow-sm border-0 mb-3" style={{ height: "calc(100vh - 165px)", display: "flex", flexDirection: "column" }}>
                  <CardHeader className="border-bottom py-3 px-3 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="card-title mb-0 fs-15 fw-semibold text-dark">GRN Receiving Slip</h5>
                      {grnItems.length > 0 && (
                        <span className="text-danger fs-12 fw-medium cursor-pointer" onClick={handleClearTerminal}>
                          Clear All
                        </span>
                      )}
                    </div>

                    {/* Supplier Selector Dropdown */}
                    <div className="mb-2">
                      <Dropdown isOpen={isSupplierDropdownOpen} toggle={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)} className="w-100">
                        <DropdownToggle tag="div" className="d-flex justify-content-between align-items-center p-2 bg-light rounded cursor-pointer border border-light-subtle">
                          <div className="d-flex align-items-center gap-2">
                            <i className="ri-truck-line text-muted fs-14"></i>
                            <span className="mb-0 fs-12 fw-medium text-dark text-truncate" style={{ maxWidth: "200px" }}>
                              {selectedSupplier ? (selectedSupplier.supplierName ?? selectedSupplier.name) : "Select Supplier *"}
                            </span>
                          </div>
                          <i className="ri-arrow-down-s-line text-muted"></i>
                        </DropdownToggle>
                        <DropdownMenu className="p-2 shadow-lg w-100 border-0 rounded-3">
                          <Input
                            type="text"
                            placeholder="Search supplier..."
                            bsSize="sm"
                            className="mb-2 fs-12 shadow-none border-light-subtle bg-light"
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                          />
                          <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                            {isSuppliersLoading ? (
                              <div className="text-center py-2"><Spinner size="sm" color="primary" /></div>
                            ) : filteredSuppliers.length > 0 ? (
                              filteredSuppliers.map((sup: any) => (
                                <div
                                  key={sup.id ?? sup.supplierId}
                                  className="p-2 rounded fs-12 cursor-pointer hover-bg-light"
                                  onClick={() => { setSelectedSupplier(sup); setIsSupplierDropdownOpen(false); }}
                                >
                                  <span className="fw-medium text-dark d-block">{sup.supplierName ?? sup.name}</span>
                                  <span className="text-muted fs-11">{sup.supplierCode ?? sup.code ?? "SUP"}</span>
                                </div>
                              ))
                            ) : (
                              <div className="p-2 text-muted fs-12 text-center">No suppliers found</div>
                            )}
                          </div>
                        </DropdownMenu>
                      </Dropdown>
                    </div>

                    {/* Supplier Invoice Input */}
                    <FormGroup className="mb-0">
                      <Input
                        type="text"
                        bsSize="sm"
                        placeholder="Supplier Invoice No. *"
                        className="form-control form-control-sm bg-light border-light-subtle fs-12"
                        value={supplierInvoiceNo}
                        onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                      />
                    </FormGroup>
                  </CardHeader>

                  {/* GRN Item Lines */}
                  <CardBody className="p-2 overflow-y-auto flex-grow-1" style={{ minHeight: 0 }}>
                    {grnItems.length === 0 ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                        <i className="ri-inbox-unarchive-line display-6 text-muted mb-1"></i>
                        <span className="fs-12">No stock items added to GRN</span>
                      </div>
                    ) : (
                      grnItems.map((line) => (
                        <div key={line.stockItemId} className="p-2 mb-2 bg-light rounded border border-light-subtle position-relative">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <div className="flex-grow-1 pe-2" style={{ minWidth: 0 }}>
                              <h6 className="fs-12 fw-semibold text-dark mb-0 text-truncate">{line.stockItemName}</h6>
                              <span className="fs-10 text-muted font-monospace">{line.stockItemCode} ({line.uom})</span>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              {/* Quantity Stepper */}
                              <div className="d-flex align-items-center bg-white rounded border border-light-subtle p-1 shadow-none">
                                <span className="d-flex align-items-center justify-content-center rounded cursor-pointer text-muted px-1.5" onClick={() => handleQuantityOrPriceChange(line.stockItemId, "quantity", line.quantity - 1)}>
                                  <i className="ri-subtract-line fs-11"></i>
                                </span>
                                <Input
                                  type="number"
                                  className="form-control form-control-sm p-0 text-center border-0 fw-semibold text-dark fs-12"
                                  style={{ width: "38px", boxShadow: "none" }}
                                  value={line.quantity}
                                  onChange={(e) => handleQuantityOrPriceChange(line.stockItemId, "quantity", Number(e.target.value))}
                                />
                                <span className="d-flex align-items-center justify-content-center rounded cursor-pointer text-primary px-1.5" onClick={() => handleQuantityOrPriceChange(line.stockItemId, "quantity", line.quantity + 1)}>
                                  <i className="ri-add-line fs-11"></i>
                                </span>
                              </div>

                              <i
                                className="ri-delete-bin-line text-danger cursor-pointer ms-1 fs-14"
                                title="Remove line item"
                                onClick={() => handleRemoveLineItem(line.stockItemId)}
                              ></i>
                            </div>
                          </div>
                          
                          {/* Unit Cost Override Field & Line Total */}
                          <div className="d-flex justify-content-between align-items-center pt-1 border-top border-light-subtle fs-11">
                            <div className="d-flex align-items-center gap-1">
                              <span className="text-muted fs-11">Cost:</span>
                              <Input
                                type="number"
                                bsSize="sm"
                                className="form-control form-control-sm py-0 px-1 border-light-subtle font-monospace fs-11"
                                style={{ width: "80px" }}
                                value={line.unitPrice}
                                onChange={(e) => handleQuantityOrPriceChange(line.stockItemId, "unitPrice", Number(e.target.value))}
                              />
                            </div>
                            <span className="fs-12 fw-semibold text-dark font-monospace">
                              {formatCurrency(line.lineTotal)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardBody>

                  {/* Summary & Post Action Footer */}
                  <div className="p-3 bg-white border-top border-light-subtle flex-shrink-0">
                    <div className="d-flex justify-content-between align-items-end mb-3 px-1">
                      <div>
                        <span className="fs-12 fw-semibold text-muted">Total Stock Received</span>
                      </div>
                      <h4 className="mb-0 fw-bold text-dark fs-18 font-monospace">
                        {formatCurrency(grnTotal)}
                      </h4>
                    </div>

                    <Button
                      type="submit"
                      className="w-100 border-0 rounded py-2 shadow-sm d-flex justify-content-between align-items-center px-3"
                      style={{
                        backgroundColor: (isPosting || isPrinting || grnItems.length === 0 || !selectedSupplier || !supplierInvoiceNo.trim()) ? "#a3b4cc" : BRAND_PURPLE,
                      }}
                      disabled={isPosting || isPrinting || grnItems.length === 0 || !selectedSupplier || !supplierInvoiceNo.trim()}
                    >
                      <span className="fs-13 fw-semibold text-white">
                        {isPosting ? "Posting GRN (FIFO)..." : isPrinting ? "Printing Receipt..." : "Post GRN & Print Slip"}
                      </span>
                      {!(isPosting || isPrinting) && (
                        <i className="ri-inbox-archive-line fs-16 text-white opacity-75"></i>
                      )}
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

export default GoodsReceiptTerminal;