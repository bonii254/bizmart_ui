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
} from "reactstrap";
import { toast } from "react-toastify";

import { usePOSMutation } from "../../Components/Hooks/usePOS";
import { useWarehouseStock } from "../../Components/Hooks/useWarehouseStock";
import { useCategories } from "../../Components/Hooks/useCategory";
import { useCustomers } from "../../Components/Hooks/useCustomers";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";

import { 
  usePrinters, 
  usePrintReceiptMutation 
} from "../../Components/Hooks/useQZPrinter";
import { formatCurrency } from "../../utils/qzConfig";
import { POSLineItem } from "../../types/POS";

const BRAND_PURPLE = "#042e6d";
const BRAND_PURPLE_SUBTLE = "rgba(4, 46, 109, 0.08)";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "MOBILE_MONEY", label: "Mobile Money" },
  { id: "CARD", label: "Card" },
];

export const PointOfSale: React.FC = () => {
  const { processSale, isProcessing: isPosting } = usePOSMutation() as any;

  // QZ Printer Setup
  const { data: printersList = [], isLoading: isPrintersLoading } = usePrinters();
  const { printReceipt, isPrinting } = usePrintReceiptMutation();
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");

  useEffect(() => {
    if (printersList.length > 0 && !selectedPrinter) {
      const savedPrinter = localStorage.getItem("pos_preferred_printer");
      setSelectedPrinter(savedPrinter && printersList.includes(savedPrinter) ? savedPrinter : printersList[0]);
    }
  }, [printersList, selectedPrinter]);

  const handlePrinterChange = (printerName: string) => {
    setSelectedPrinter(printerName);
    localStorage.setItem("pos_preferred_printer", printerName);
  };

  // Data Queries
  const { data: warehousesData, isLoading: isWarehousesLoading } = useWarehouses(true);

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

  const { balances: stockBalances = [], isLoading: isStockLoading } = useWarehouseStock(selectedWarehouseId);
  const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories();
  const { data: customersData } = useCustomers(1, 100);

  const customersList = useMemo(() => {
    if (!customersData) return [];
    return Array.isArray(customersData) ? customersData : customersData.users ?? [];
  }, [customersData]);

  const categoriesList = useMemo(() => {
    if (!categoriesData) return ["All"];
    const cats = Array.isArray(categoriesData) ? categoriesData : categoriesData.categories ?? [];
    const validNames = cats
      .map((c: any) => (typeof c === "string" ? c : c.category_code ?? ""))
      .filter((name: string) => name?.trim() !== "");
    return ["All", ...Array.from(new Set(validNames))];
  }, [categoriesData]);

  // POS State
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [cart, setCart] = useState<POSLineItem[]>([]);

  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const activeCustomer = selectedCustomer ?? customersList[0] ?? { id: 0, name: "Walk-in Customer", phone: "+254712345678" };

  const cartMap = useMemo(() => {
    const map = new Map<string | number, POSLineItem>();
    cart.forEach((item) => map.set(item.stockItemId, item));
    return map;
  }, [cart]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.toLowerCase();
    return customersList.filter((c: any) => {
      const nameMatch = (c.name ?? c.fullName ?? "").toLowerCase().includes(query);
      const phoneMatch = (c.phone ?? c.phoneNumber ?? "").includes(query);
      return nameMatch || phoneMatch;
    });
  }, [customersList, customerSearch]);

  const grandTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.lineTotal ?? 0), 0), [cart]);

  const tenderedValue = parseFloat(amountTendered) || 0;
  const changeAmount = useMemo(() => {
    if (paymentMethod !== "CASH") return 0;
    return tenderedValue >= grandTotal ? tenderedValue - grandTotal : 0;
  }, [tenderedValue, grandTotal, paymentMethod]);

  const isInsufficientCash = paymentMethod === "CASH" && tenderedValue > 0 && tenderedValue < grandTotal;

  const filteredCatalogItems = useMemo(() => {
    if (!Array.isArray(stockBalances)) return [];
    const query = catalogSearch.toLowerCase();
    return stockBalances.filter((stock: any) => {
      const itemName = stock.stock_item?.description ?? "";
      const itemCode = stock.stock_item?.stock_code ?? "";
      const itemCategory = stock.categoryName ?? "";

      const matchesSearch = itemName.toLowerCase().includes(query) || itemCode.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "All" || itemCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [stockBalances, catalogSearch, selectedCategory]);

  const handleTileTap = (item: any) => {
    const itemId = item.stockItemId ?? item.id;
    const existing = cartMap.get(itemId);

    if (existing) {
      handleQuantityOrPriceChange(itemId, "quantity", existing.quantity + 1);
    } else {
      const itemCode = item.stock_code ?? "STK";
      const itemName = item.description ?? "Stock Item";
      const unitPrice = Number(item.unit_cost ?? 0);
      const uom = item.uom ?? item.unitOfMeasure ?? item.stock_item?.uom ?? "PCS";

      setCart((prev) => [
        ...prev,
        {
          stockItemId: itemId,
          stockItemCode: itemCode,
          stockItemName: itemName,
          uom,
          quantity: 1,
          unitPrice,
          lineTotal: unitPrice,
        } as POSLineItem,
      ]);
    }
  };

  const handleRemoveLineItem = (stockItemId: string | number) => {
    setCart((prev) => prev.filter((i) => i.stockItemId !== stockItemId));
  };

  const handleQuantityOrPriceChange = (
    stockItemId: string | number,
    field: "quantity" | "unitPrice",
    value: number
  ) => {
    if (field === "quantity" && value <= 0) {
      handleRemoveLineItem(stockItemId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.stockItemId !== stockItemId) return item;
        const qty = field === "quantity" ? Math.max(1, value) : item.quantity;
        const price = field === "unitPrice" ? Math.max(0, value) : item.unitPrice;
        return {
          ...item,
          [field]: value,
          lineTotal: Number((qty * price).toFixed(2)),
        };
      })
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setAmountTendered("");
  };

  // Submit Sale & Print Action
  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Please select items to build an order.");
      return;
    }

    if (paymentMethod === "CASH" && tenderedValue < grandTotal) {
      toast.error("Amount tendered is less than total sale amount.");
      return;
    }

    try {
      const payload = {
        customerId: activeCustomer.id,
        warehouseId: selectedWarehouseId,
        paymentMethod,
        amountPaid: paymentMethod === "CASH" ? tenderedValue : grandTotal,
        items: cart.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      let saleResponse: any = null;
      if (processSale) {
        saleResponse = await processSale(payload);
      }

      const currentWhObj = warehousesList.find((w) => (w.id ?? w.warehouseId) === selectedWarehouseId);
      const receiptPayload = {
        companyName: "FRESHA ENTERPRISES",
        storeName: currentWhObj?.warehouseName ?? "POS STORE",
        receiptNo: saleResponse?.receiptNo ?? `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleString(),
        cashier: "CASHIER",
        customerName: activeCustomer.name ?? activeCustomer.fullName ?? "Walk-in Customer",
        items: cart.map((i) => ({
          name: i.stockItemName,
          qty: i.quantity,
          unitPrice: i.unitPrice,
          total: i.lineTotal,
        })),
        subtotal: grandTotal,
        grandTotal,
        paymentMethod,
        amountTendered: paymentMethod === "CASH" ? tenderedValue : grandTotal,
        changeAmount,
      };

      if (selectedPrinter) {
        try {
          await printReceipt({
            printerName: selectedPrinter,
            receiptData: receiptPayload,
          });
        } catch (printErr) {
          console.error("Thermal print failure:", printErr);
        }
      } else {
        toast.warn("Sale recorded, but no thermal printer is connected.");
      }

      handleClearCart();
      setSelectedCustomer(null);
      setPaymentMethod("CASH");
      toast.success("Transaction completed successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message ?? "Transaction failed.");
    }
  };

  document.title = "Point of Sale | Terminal";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Form onSubmit={handleSubmitSale}>
            <Row>
              {/* Product Catalog */}
              <Col lg={7} xl={8}>
                <Card className="shadow-sm border-0 mb-3" style={{ height: "calc(100vh - 165px)", display: "flex", flexDirection: "column" }}>
                  <CardHeader className="border-bottom py-3 px-3 bg-white">
                    <Row className="g-3 align-items-center justify-content-between">
                      <Col md={7} sm={12}>
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="card-title mb-0 fs-15 fw-semibold text-dark text-nowrap">
                            POS Terminal
                          </h5>
                          
                          {/* Warehouse Select */}
                          <div className="flex-grow-1" style={{ maxWidth: "170px" }}>
                            {isWarehousesLoading ? (
                              <Spinner size="sm" color="primary" />
                            ) : (
                              <Input
                                type="select"
                                className="form-select form-select-sm fs-12"
                                value={selectedWarehouseId ?? ""}
                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                              >
                                <option value="" disabled>Warehouse</option>
                                {warehousesList.map((wh: any) => (
                                  <option key={wh.id ?? wh.warehouseId} value={wh.id ?? wh.warehouseId}>
                                    {wh.warehouseName}
                                  </option>
                                ))}
                              </Input>
                            )}
                          </div>

                          {/* Thermal Printer Select */}
                          <div className="flex-grow-1" style={{ maxWidth: "180px" }}>
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
                            placeholder="Search item code or description..."
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

                      {/* Categories Bar */}
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
                        <span className="text-muted fs-12 fw-medium">Loading inventory...</span>
                      </div>
                    ) : filteredCatalogItems.length > 0 ? (
                      <Row className="g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4 row-cols-xxl-5">
                        {filteredCatalogItems.map((item: any) => {
                          const itemId = item.stockItemId ?? item.id;
                          const itemCode = item.stock_item?.stock_code ?? item.stockItemCode ?? "CODE";
                          const itemName = item.stock_item?.description ?? item.stockItemName ?? "Unnamed Item";
                          const uom = item.stock_item?.uom ?? item.uom ?? "PCS";
                          const qtyOnHand = Number(item.qty_on_hand ?? 0);
                          const price = Number(item.unit_cost ?? item.unitPrice ?? 0);

                          const cartItem = cartMap.get(itemId);
                          const inCartQty = cartItem ? cartItem.quantity : 0;
                          const isSelected = inCartQty > 0;
                          const isOutOfStock = qtyOnHand <= 0;

                          return (
                            <Col key={itemId}>
                              <div
                                onClick={() => handleTileTap(item)}
                                className={`card h-100 border cursor-pointer user-select-none transition-all mb-0 rounded-2 position-relative ${
                                  isSelected ? "border-primary shadow-sm" : "border-light-subtle shadow-none hover-shadow-sm"
                                } ${isOutOfStock ? "opacity-75" : ""}`}
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
                                        <i className="ri-shopping-cart-2-fill fs-10"></i>
                                        <span>{inCartQty}</span>
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
                                      <div className="d-flex flex-column lh-1">
                                        <span className="text-muted fs-10 fw-normal mb-1">{uom}</span>
                                        <span className={`fs-10 fw-medium ${qtyOnHand > 0 ? "text-success" : "text-danger"}`}>
                                          {qtyOnHand > 0 ? `${qtyOnHand} left` : "Out of stock"}
                                        </span>
                                      </div>
                                      <div className="text-end flex-shrink-0">
                                        <span className="fs-12 fw-bold text-primary font-monospace d-block lh-1">
                                          {formatCurrency(price)}
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
                        <h6 className="fs-13 fw-semibold text-dark mb-1">No products found</h6>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>

              {/* Cart Summary & Payment */}
              <Col lg={5} xl={4}>
                <Card className="shadow-sm border-0 mb-3" style={{ height: "calc(100vh - 165px)", display: "flex", flexDirection: "column" }}>
                  <CardHeader className="border-bottom py-3 px-3 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="card-title mb-0 fs-15 fw-semibold text-dark">Current Order</h5>
                      {cart.length > 0 && (
                        <span className="text-danger fs-12 fw-medium cursor-pointer" onClick={handleClearCart}>
                          Clear All
                        </span>
                      )}
                    </div>

                    <Dropdown isOpen={isCustomerDropdownOpen} toggle={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)} className="w-100">
                      <DropdownToggle tag="div" className="d-flex justify-content-between align-items-center p-2 bg-light rounded cursor-pointer border border-light-subtle">
                        <div className="d-flex align-items-center gap-2">
                          <i className="ri-user-3-line text-muted fs-14"></i>
                          <span className="mb-0 fs-12 fw-medium text-dark text-truncate" style={{ maxWidth: "200px" }}>
                            {activeCustomer.name ?? activeCustomer.fullName ?? "Select Customer"}
                          </span>
                        </div>
                        <i className="ri-arrow-down-s-line text-muted"></i>
                      </DropdownToggle>
                      <DropdownMenu className="p-2 shadow-lg w-100 border-0 rounded-3">
                        <Input
                          type="text"
                          placeholder="Search customer..."
                          bsSize="sm"
                          className="mb-2 fs-12 shadow-none border-light-subtle bg-light"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                        <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                          {filteredCustomers.map((cust: any) => (
                            <div key={cust.id} className="p-2 rounded fs-12 cursor-pointer hover-bg-light" onClick={() => { setSelectedCustomer(cust); setIsCustomerDropdownOpen(false); }}>
                              <span className="fw-medium text-dark d-block">{cust.name ?? cust.fullName}</span>
                              <span className="text-muted fs-11">{cust.phone ?? cust.phoneNumber}</span>
                            </div>
                          ))}
                        </div>
                      </DropdownMenu>
                    </Dropdown>
                  </CardHeader>

                  <CardBody className="p-2 overflow-y-auto flex-grow-1" style={{ minHeight: 0 }}>
                    {cart.length === 0 ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                        <i className="ri-shopping-cart-2-line display-6 text-muted mb-1"></i>
                        <span className="fs-12">Cart is empty</span>
                      </div>
                    ) : (
                      cart.map((line) => (
                        <div key={line.stockItemId} className="d-flex align-items-center justify-content-between p-2 mb-2 bg-light rounded border border-light-subtle">
                          <div className="flex-grow-1 pe-2" style={{ minWidth: 0 }}>
                            <h6 className="fs-12 fw-semibold text-dark mb-0 text-truncate">{line.stockItemName}</h6>
                            <span className="fs-11 text-muted">{formatCurrency(line.unitPrice)}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center bg-white rounded border border-light-subtle p-1 shadow-none">
                              <span className="d-flex align-items-center justify-content-center rounded cursor-pointer text-muted px-1.5" onClick={() => handleQuantityOrPriceChange(line.stockItemId, "quantity", line.quantity - 1)}>
                                <i className="ri-subtract-line fs-11"></i>
                              </span>
                              <span className="fs-12 fw-semibold px-2 text-dark">{line.quantity}</span>
                              <span className="d-flex align-items-center justify-content-center rounded cursor-pointer text-primary px-1.5" onClick={() => handleQuantityOrPriceChange(line.stockItemId, "quantity", line.quantity + 1)}>
                                <i className="ri-add-line fs-11"></i>
                              </span>
                            </div>
                            <span className="fs-12 fw-semibold text-dark font-monospace text-end" style={{ width: "75px" }}>
                              {formatCurrency(line.lineTotal)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardBody>

                  <div className="p-3 bg-white border-top border-light-subtle flex-shrink-0">
                    <div className="d-flex gap-2 mb-2">
                      {PAYMENT_METHODS.map((pm) => (
                        <div
                          key={pm.id}
                          className="flex-grow-1 text-center py-1 rounded cursor-pointer border fw-medium fs-11 transition-all"
                          onClick={() => setPaymentMethod(pm.id)}
                          style={{
                            backgroundColor: paymentMethod === pm.id ? BRAND_PURPLE_SUBTLE : "#fff",
                            color: paymentMethod === pm.id ? BRAND_PURPLE : "#6c757d",
                            borderColor: paymentMethod === pm.id ? BRAND_PURPLE : "#dee2e6",
                          }}
                        >
                          {pm.label}
                        </div>
                      ))}
                    </div>

                    {paymentMethod === "CASH" && (
                      <div className="mb-2 p-2 bg-light border border-light-subtle rounded">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fs-11 fw-medium text-muted">Amount Tendered</span>
                          {isInsufficientCash && <span className="fs-11 text-danger fw-medium">Insufficient</span>}
                        </div>
                        <Input
                          type="number"
                          placeholder="0.00"
                          bsSize="sm"
                          className="form-control form-control-sm bg-white border-light-subtle fs-12 fw-bold text-end shadow-none mb-1.5"
                          value={amountTendered}
                          onChange={(e) => setAmountTendered(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-end mb-2 px-1">
                      <div>
                        {paymentMethod === "CASH" && tenderedValue > 0 && (
                          <div className="mb-0">
                            <span className="fs-11 text-muted me-1">Change:</span>
                            <span className="fs-12 fw-bold text-success font-monospace">{formatCurrency(changeAmount)}</span>
                          </div>
                        )}
                        <span className="fs-12 fw-semibold text-muted">Total</span>
                      </div>
                      <h4 className="mb-0 fw-bold text-dark fs-18 font-monospace">
                        {formatCurrency(grandTotal)}
                      </h4>
                    </div>

                    <Button
                      type="submit"
                      className="w-100 border-0 rounded py-2 shadow-sm d-flex justify-content-between align-items-center px-3"
                      style={{
                        backgroundColor: (isPosting || isPrinting || cart.length === 0 || isInsufficientCash) ? "#a3b4cc" : BRAND_PURPLE,
                      }}
                      disabled={isPosting || isPrinting || cart.length === 0 || isInsufficientCash}
                    >
                      <span className="fs-13 fw-semibold text-white">
                        {isPosting ? "Posting Order..." : isPrinting ? "Printing..." : "Charge & Print"}
                      </span>
                      {!(isPosting || isPrinting) && (
                        <i className="ri-printer-line fs-16 text-white opacity-75"></i>
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

export default PointOfSale;