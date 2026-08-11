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

  const { 
    data: warehousesData, 
    isLoading: isWarehousesLoading 
  } = useWarehouses(true);
  
  const warehousesList = useMemo(() => {
    if (!warehousesData) return [];
    return Array.isArray(warehousesData) ? warehousesData : 
    warehousesData.warehouses || [];
  }, [warehousesData]);

  const [
    selectedWarehouseId, 
    setSelectedWarehouseId
  ] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (warehousesList.length > 0 && !selectedWarehouseId) {
      const firstWh = warehousesList[0];
      setSelectedWarehouseId(firstWh.id || firstWh.warehouseId);
    }
  }, [warehousesList, selectedWarehouseId]);

  const { 
    balances: stockBalances = [], isLoading: isStockLoading 
  } = useWarehouseStock(selectedWarehouseId);
  const { 
    data: categoriesData, isLoading: isCategoriesLoading 
  } = useCategories();
  const { data: customersData } = useCustomers(1, 100);

  const customersList = useMemo(() => {
    if (!customersData) return [];
    return Array.isArray(customersData) ? customersData : 
    customersData.users || [];
  }, [customersData]);

  const categoriesList = useMemo(() => {
    if (!categoriesData) return ["All"];
    const cats = Array.isArray(categoriesData) ? 
    categoriesData : categoriesData.categories || [];
    const validNames = cats
      .map((c: any) => (typeof c === "string" ? c : c.category_code || ""))
      .filter((name: string) => name && name.trim() !== "");
    return ["All", ...Array.from(new Set(validNames))];
  }, [categoriesData]);

  
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [cart, setCart] = useState<POSLineItem[]>([]);

  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const activeCustomer = selectedCustomer || customersList[0] || { id: 0, 
    name: "Walk-in Customer", phone: "+254712345678" };

  const cartMap = useMemo(() => {
    const map = new Map<string | number, POSLineItem>();
    cart.forEach((item) => map.set(item.stockItemId, item));
    return map;
  }, [cart]);

  
  const filteredCustomers = useMemo(() => {
    return customersList.filter((c: any) => {
      const nameMatch = (c.name || c.fullName || "").toLowerCase().includes(
        customerSearch.toLowerCase());
      const phoneMatch = (c.phone || c.phoneNumber || "").includes(
        customerSearch);
      return nameMatch || phoneMatch;
    });
  }, [customersList, customerSearch]);

  const grandTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  }, [cart]);

  const tenderedValue = parseFloat(amountTendered) || 0;
  const changeAmount = useMemo(() => {
    if (paymentMethod !== "CASH") return 0;
    return tenderedValue >= grandTotal ? tenderedValue - grandTotal : 0;
  }, [tenderedValue, grandTotal, paymentMethod]);

  const isInsufficientCash = paymentMethod === "CASH" && tenderedValue > 0 && 
  tenderedValue < grandTotal;

  const filteredCatalogItems = useMemo(() => {
    if (!Array.isArray(stockBalances)) return [];
    return stockBalances.filter((stock: any) => {
      const itemName = stock.stock_item?.description || "";
      const itemCode = stock.stock_item?.stock_code || "";
      const itemCategory = stock.categoryName || "";

      const matchesSearch =
        itemName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        itemCode.toLowerCase().includes(catalogSearch.toLowerCase());

      const matchesCategory = selectedCategory === "All" || 
      itemCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [stockBalances, catalogSearch, selectedCategory]);

  // ---------------------------------------------------------------------------
  // 4. CART & CATALOG HANDLERS
  // ---------------------------------------------------------------------------
  const handleTileTap = (item: any) => {
    const itemId = item.stockItemId || item.id;
    const existing = cartMap.get(itemId);

    if (existing) {
      handleQuantityOrPriceChange(itemId, "quantity", existing.quantity + 1);
    } else {
      const itemCode = item.stock_code || "STK";
      const itemName = item.description || "Stock Item";
      const unitPrice = Number(item.unit_cost || 0);
      const uom = item.uom || item.unitOfMeasure || item.stock_item?.uom || "PCS";

      setCart((prev) => [
        ...prev,
        {
          stockItemId: itemId,
          stockItemCode: itemCode,
          stockItemName: itemName,
          uom: uom,
          quantity: 1,
          unitPrice: unitPrice,
          lineTotal: unitPrice,
        } as any,
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
        const price = field === "unitPrice" ? 
        Math.max(0, value) : item.unitPrice;
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

  // ---------------------------------------------------------------------------
  // 5. SUBMIT SALE
  // ---------------------------------------------------------------------------
  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Please select items from the catalog to build an order.");
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

      if (processSale) {
        await processSale(payload);
        handleClearCart();
        setSelectedCustomer(null);
        setPaymentMethod("CASH");
        toast.success("Transaction completed!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Transaction failed.");
    }
  };

  document.title = "Point of Sale | Terminal";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Form onSubmit={handleSubmitSale}>
            <Row>
              {/* ========================================================= */}
              {/* LEFT: Product Catalog Card */}
              {/* ========================================================= */}
              <Col lg={7} xl={8}>
                <Card className="shadow-sm border-0 mb-3" 
                style={{ height: "calc(100vh - 165px)", 
                display: "flex", flexDirection: "column" 
                }}>
                  <CardHeader className="border-bottom py-3 px-3 bg-white">
                    <Row 
                    className="g-3 align-items-center justify-content-between">
                      {/* Left: Warehouse Selector */}
                      <Col md={6} sm={12}>
                        <div className="d-flex align-items-center gap-2">
                          <h5 
                          className=
                          "card-title mb-0 fs-15 fw-semibold text-dark text-nowrap">
                            POS Terminal
                          </h5>
                          <div className="flex-grow-1" 
                          style={{ maxWidth: "240px" 

                          }}>
                            {isWarehousesLoading ? (
                              <Spinner size="sm" color="primary" />
                            ) : (
                              <Input
                                type="select"
                                className="form-select form-select-sm fs-12"
                                value={selectedWarehouseId || ""}
                                onChange={(e) => 
                                  setSelectedWarehouseId(e.target.value)}
                              >
                                <option value="" disabled>Select Warehouse</option>
                                {warehousesList.map((wh: any) => (
                                  <option 
                                  key={wh.id || wh.warehouseId} 
                                  value={wh.id || wh.warehouseId}
                                  >
                                    {wh.warehouseName}
                                  </option>
                                ))}
                              </Input>
                            )}
                          </div>
                        </div>
                      </Col>

                      {/* Right: Search Input & Category Scroll */}
                      <Col md={6} sm={12}>
                        <div className="search-box position-relative">
                          <Input
                            type="text"
                            className="form-control form-control-sm fs-12 ps-4"
                            placeholder="Search product code or name..."
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                          />
                          <i className="
                          ri-search-line 
                          search-icon 
                          position-absolute 
                          top-50 start-0 
                          translate-middle-y 
                          ms-2 
                          text-muted 
                          fs-13"></i>
                          {catalogSearch && (
                            <i
                              className="
                              ri-close-fill 
                              position-absolute 
                              top-50 
                              end-0 
                              translate-middle-y 
                              me-2 
                              text-muted 
                              fs-14 
                              cursor-pointer"
                              onClick={() => setCatalogSearch("")}
                            ></i>
                          )}
                        </div>
                      </Col>

                      {/* Category Pills Bar */}
                      <Col xs={12} className="pt-1">
                        <div
                          className="d-flex gap-2 pb-1"
                          onWheel={(e) => {
                            // Translates vertical mouse wheel rotation into horizontal scrolling
                            if (e.deltaY !== 0) {
                              e.currentTarget.scrollLeft += e.deltaY;
                            }
                          }}
                          style={{
                            overflowX: "auto",
                            overflowY: "hidden",
                            whiteSpace: "nowrap",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            WebkitOverflowScrolling: "touch",
                          }}
                        >
                          <style>
                            {`
                              div::-webkit-scrollbar {
                                display: none;
                              }
                            `}
                          </style>
                          {isCategoriesLoading ? (
                            <Spinner size="sm" color="primary" className="my-1" />
                          ) : (
                            [...categoriesList]
                              .sort((a, b) => {
                                if (a === "All") return -1;
                                if (b === "All") return 1;
                                return a.localeCompare(b);
                              })
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
                                      border: isSelected
                                        ? `1px solid ${BRAND_PURPLE}`
                                        : "1px solid #e2e5e8",
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

                  {/* Catalog Tiles Body (Scrollable inside card) */}
                  
<CardBody
  className="p-2 p-sm-3 overflow-y-auto flex-grow-1 bg-light-subtle"
  style={{ minHeight: 0 }}
>
  {isStockLoading ? (
    <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5">
      <Spinner size="sm" color="primary" className="mb-2" />
      <span className="text-muted fs-12 fw-medium">Loading products...</span>
    </div>
  ) : filteredCatalogItems.length > 0 ? (
    <Row className="g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4 row-cols-xxl-5">
      {filteredCatalogItems.map((item: any) => {
        const itemId = item.stockItemId || item.id;
        const itemCode = item.stock_item?.stock_code || item.stockItemCode || "CODE";
        const itemName = item.stock_item?.description || item.stockItemName || "Unnamed Item";
        const uom = item.stock_item?.uom || item.uom || "PCS";
        const qtyOnHand = Number(item.qty_on_hand || 0);
        const price = Number(item.unit_cost || item.unitPrice || 0);

        const cartItem = cartMap.get(itemId);
        const inCartQty = cartItem ? cartItem.quantity : 0;
        const isSelected = inCartQty > 0;
        const isOutOfStock = qtyOnHand <= 0;

        return (
          <Col key={itemId}>
            <div
              onClick={() => handleTileTap(item)}
              className={`card h-100 border cursor-pointer user-select-none transition-all mb-0 rounded-2 position-relative ${
                isSelected
                  ? "border-primary shadow-sm"
                  : "border-light-subtle shadow-none hover-shadow-sm"
              } ${isOutOfStock ? "opacity-75" : ""}`}
              style={{
                minHeight: "128px",
                backgroundColor: isSelected ? "rgba(4, 46, 109, 0.05)" : "#ffffff",
                borderColor: isSelected ? BRAND_PURPLE : undefined,
                transition: "all 0.15s ease-in-out",
              }}
            >
              <div className="card-body p-2 p-sm-2.5 d-flex flex-column justify-content-between">
                {/* 1. Header: Stock Code & Cart Badge */}
                <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                  <span
                    className="badge bg-light text-muted border border-light-subtle font-monospace fs-10 px-1.5 py-0.5 fw-normal text-truncate"
                    style={{ maxWidth: "60%" }}
                    title={itemCode}
                  >
                    {itemCode}
                  </span>

                  {isSelected && (
                    <Badge
                      className="fs-10 px-2 py-0.5 rounded-pill d-flex align-items-center gap-1 fw-semibold shadow-xs ms-auto flex-shrink-0"
                      style={{ backgroundColor: BRAND_PURPLE, color: "#ffffff" }}
                    >
                      <i className="ri-shopping-cart-2-fill fs-10"></i>
                      <span>{inCartQty}</span>
                    </Badge>
                  )}
                </div>

                {/* 2. Content: Product Name */}
                <div className="my-auto py-1">
                  <h6
                    className="fs-12 fw-semibold text-dark mb-0 lh-sm"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      wordBreak: "break-word",
                    }}
                    title={itemName}
                  >
                    {itemName}
                  </h6>
                </div>

                {/* 3. Footer: Stacked Stock Meta & Price */}
                <div className="pt-1.5 border-top border-light-subtle mt-auto">
                  <div className="d-flex align-items-end justify-content-between gap-1">
                    {/* UOM + Stock Left Stack */}
                    <div className="d-flex flex-column lh-1" style={{ minWidth: 0 }}>
                      <span className="text-muted fs-10 fw-normal text-truncate mb-1">
                        {uom}
                      </span>
                      <span
                        className={`fs-10 fw-medium text-truncate ${
                          qtyOnHand > 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {qtyOnHand > 0 ? `${qtyOnHand} left` : "Out of stock"}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="text-end flex-shrink-0">
                      <span className="fs-12 fw-bold text-primary font-monospace d-block lh-1">
                        Ksh {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      <p className="fs-12 text-muted mb-0">Try selecting another category or clearing your search.</p>
    </div>
  )}
</CardBody>
                </Card>
              </Col>

              {/* ========================================================= */}
              {/* RIGHT: Cart & Checkout Summary Card */}
              {/* ========================================================= */}
              <Col lg={5} xl={4}>
                <Card className="shadow-sm border-0 mb-3" style={{ height: "calc(100vh - 165px)", display: "flex", flexDirection: "column" }}>
                  <CardHeader className="border-bottom py-3 px-3 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="card-title mb-0 fs-15 fw-semibold text-dark">
                        Current Order
                      </h5>
                      {cart.length > 0 && (
                        <span
                          className="text-danger fs-12 fw-medium cursor-pointer"
                          onClick={handleClearCart}
                        >
                          Clear All
                        </span>
                      )}
                    </div>

                    {/* Customer Dropdown */}
                    <Dropdown
                      isOpen={isCustomerDropdownOpen}
                      toggle={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="w-100"
                    >
                      <DropdownToggle
                        tag="div"
                        className="d-flex justify-content-between align-items-center p-2 bg-light rounded cursor-pointer border border-light-subtle"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <i className="ri-user-3-line text-muted fs-14"></i>
                          <span className="mb-0 fs-12 fw-medium text-dark text-truncate" style={{ maxWidth: "200px" }}>
                            {activeCustomer.name || activeCustomer.fullName || "Select Customer"}
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
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                          {filteredCustomers.map((cust: any) => (
                            <div
                              key={cust.id}
                              className="p-2 rounded fs-12 cursor-pointer hover-bg-light"
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setIsCustomerDropdownOpen(false);
                              }}
                            >
                              <span className="fw-medium text-dark d-block">{cust.name || cust.fullName}</span>
                              <span className="text-muted fs-11">{cust.phone || cust.phoneNumber}</span>
                            </div>
                          ))}
                        </div>
                      </DropdownMenu>
                    </Dropdown>
                  </CardHeader>

                  {/* Scrollable Cart Items */}
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
                            <h6 className="fs-12 fw-semibold text-dark mb-0 text-truncate">
                              {line.stockItemName}
                            </h6>
                            <span className="fs-11 text-muted">Ksh {line.unitPrice.toFixed(2)}</span>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center bg-white rounded border border-light-subtle p-1 shadow-none">
                              <span
                                className="d-flex align-items-center justify-content-center rounded cursor-pointer text-muted px-1.5"
                                onClick={() => handleQuantityOrPriceChange(line.stockItemId, "quantity", line.quantity - 1)}
                              >
                                <i className="ri-subtract-line fs-11"></i>
                              </span>
                              <span className="fs-12 fw-semibold px-2 text-dark">{line.quantity}</span>
                              <span
                                className="d-flex align-items-center justify-content-center rounded cursor-pointer text-primary px-1.5"
                                onClick={() => handleQuantityOrPriceChange(line.stockItemId, "quantity", line.quantity + 1)}
                              >
                                <i className="ri-add-line fs-11"></i>
                              </span>
                            </div>

                            <span className="fs-12 fw-semibold text-dark font-monospace text-end" style={{ width: "65px" }}>
                              {line.lineTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardBody>

                  {/* Payment & Charge Actions Footer */}
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
                          {isInsufficientCash && (
                            <span className="fs-11 text-danger fw-medium">Insufficient</span>
                          )}
                        </div>
                        <Input
                          type="number"
                          placeholder="0.00"
                          bsSize="sm"
                          className="form-control form-control-sm bg-white border-light-subtle fs-12 fw-bold text-end shadow-none mb-1.5"
                          value={amountTendered}
                          onChange={(e) => setAmountTendered(e.target.value)}
                        />
                        <div className="d-flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                          <Button size="sm" color="light" className="border shadow-none flex-shrink-0 fw-medium fs-10 py-0.5 px-2" onClick={() => setAmountTendered(grandTotal.toString())}>Exact</Button>
                          {[500, 1000, 2000].map((amt) => (
                            <Button key={amt} size="sm" color="light" className="border shadow-none flex-shrink-0 fw-medium fs-10 py-0.5 px-2" onClick={() => setAmountTendered(amt.toString())}>
                              +{amt}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-end mb-2 px-1">
                      <div>
                        {paymentMethod === "CASH" && tenderedValue > 0 && (
                          <div className="mb-0">
                            <span className="fs-11 text-muted me-1">Change:</span>
                            <span className="fs-12 fw-bold text-success font-monospace">{changeAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <span className="fs-12 fw-semibold text-muted">Total</span>
                      </div>
                      <h4 className="mb-0 fw-bold text-dark fs-18 font-monospace">
                        Ksh {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h4>
                    </div>

                    <Button
                      type="submit"
                      className="w-100 border-0 rounded py-2 shadow-sm d-flex justify-content-between align-items-center px-3"
                      style={{
                        backgroundColor: (isPosting || cart.length === 0 || isInsufficientCash) ? "#a3b4cc" : BRAND_PURPLE,
                        transition: "background-color 0.2s",
                      }}
                      disabled={isPosting || cart.length === 0 || isInsufficientCash}
                    >
                      <span className="fs-13 fw-semibold text-white">
                        {isPosting ? "Processing..." : "Charge"}
                      </span>
                      {!isPosting && (
                        <i className="ri-arrow-right-line fs-16 text-white opacity-75"></i>
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