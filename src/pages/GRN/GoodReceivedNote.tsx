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

import { usePOSMutation } from "../../Components/Hooks/usePOS";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { 
  useItemWarehouseStock 
} from "../../Components/Hooks/useWarehouseStock";
import { useCategories } from "../../Components/Hooks/useCategory";
import { useCustomers } from "../../Components/Hooks/useCustomers";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { useCompanies } from "../../Components/Hooks/useCompanies";
import { useBanks } from "../../Components/Hooks/useBanks";
import { 
  usePrinters, 
  usePrintReceiptMutation 
} from "../../Components/Hooks/useQZPrinter";
import { formatCurrency } from "../../utils/qzConfig";
import { 
  CreateSalesReceiptPayload, 
  PaymentMethodCode 
} from "../../types/POS";
import { StockItem } from "../../types/stockitem";
import { ItemWarehouseStock } from "../../types/warehouseStock";
import { handleBackendErrors } from "../../helpers/form_utils";
import { getLoggedinUser } from "../../helpers/api_helper";

type CartLineItem = {
  itemId: string;
  itemCode: string;
  description: string;
  uomCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
};

const BRAND_PURPLE = "#042e6d";
const BRAND_PURPLE_SUBTLE = "rgba(4, 46, 109, 0.08)";

const PAYMENT_METHODS: { id: PaymentMethodCode; label: string }[] = [
  { id: "CASH", label: "Cash" },
  { id: "MOBILE", label: "Mobile Money" },
  { id: "CARD", label: "Card" },
];

export const PointOfSale: React.FC = () => {
  const { processSale, isPosting } = usePOSMutation();
  const { data: printersList = [], isLoading: isPrintersLoading } = usePrinters();
  const { printReceipt, isPrinting } = usePrintReceiptMutation();

  const { data: user } = getLoggedinUser();
  const operatorId = user?.operatorId;
  const displayname = user?.userName;

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [bankId, setBankId] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");

  const { data: warehousesData, isLoading: isWarehousesLoading } = useWarehouses();
  const { data: banksData } = useBanks();
  const { data: companiesData } = useCompanies();
  const { data: stockItems = [], isLoading: isStockLoading } = useStockItems();

  // Fetch warehouse-specific stock items linked to selected warehouseId
  const { stockItems: warehouseStockItems = [], isLoading: isWarehouseStockLoading } = useItemWarehouseStock({
    warehouseId: warehouseId || undefined,
  });

  const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories();
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers();

  const warehousesList = useMemo(() => {
    return Array.isArray(warehousesData) ? warehousesData : warehousesData ?? [];
  }, [warehousesData]);

  const banksList = useMemo(() => {
    return Array.isArray(banksData) ? banksData : banksData || [];
  }, [banksData]);

  const companiesList = useMemo(() => {
    return Array.isArray(companiesData) ? companiesData : companiesData || [];
  }, [companiesData]);

  const customersList = useMemo(() => {
    return Array.isArray(customersData) ? customersData : customersData ?? [];
  }, [customersData]);

  const categoriesList = useMemo(() => {
    if (!categoriesData) return ["All"];
    const cats = Array.isArray(categoriesData) ? categoriesData : categoriesData.categories ?? [];
    const validNames = cats
      .map((c: any) => (typeof c === "string" ? c : c.category_code ?? ""))
      .filter((name: string) => name?.trim() !== "");
    return ["All", ...Array.from(new Set(validNames))];
  }, [categoriesData]);

  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  useEffect(() => {
    if (warehousesList.length > 0 && !warehouseId) {
      const firstWh = warehousesList[0];
      setWarehouseId(String(firstWh.warehouseId));
    }
  }, [warehousesList, warehouseId]);

  useEffect(() => {
    if (customersList.length > 0 && !customerId) {
      const firstCustomer = customersList[0];
      setCustomerId(String(firstCustomer.customerId));
    }
  }, [customersList, customerId]);

  useEffect(() => {
    if (companiesList.length > 0) {
      const firstCompany = companiesList[0];
      setCompanyName(firstCompany.companyName);
    }
  }, [companiesList, companyName]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>("CASH");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Automatically select the corresponding bankId based on payment method selected (Cash, M-Pesa / Mobile, Card / Others)
  useEffect(() => {
    if (banksList.length > 0) {
      let matchedBank: any = null;

      if (paymentMethod === "CASH") {
        matchedBank = banksList.find((b: any) =>
          (b.bankName ?? "").toLowerCase().includes("cash")
        );
      } else if (paymentMethod === "MOBILE") {
        matchedBank = banksList.find(
          (b: any) =>
            (b.bankName ?? "").toLowerCase().includes("mpesa") ||
            (b.bankName ?? "").toLowerCase().includes("mobile")
        );
      } else if (paymentMethod === "CARD") {
        matchedBank = banksList.find(
          (b: any) =>
            (b.bankName ?? "").toLowerCase().includes("card") ||
            (b.bankName ?? "").toLowerCase().includes("other")
        );
      }

      const selected = matchedBank || banksList[0];
      if (selected) {
        setBankId(String(selected.bankId));
      }
    }
  }, [banksList, paymentMethod]);

  useEffect(() => {
    if (printersList.length > 0 && !selectedPrinter) { 
      const savedPrinter = localStorage.getItem("pos_preferred_printer");
      setSelectedPrinter(
        savedPrinter && printersList.includes(savedPrinter) ? 
        savedPrinter : printersList[0]
      );
    }
  }, [printersList, selectedPrinter]);

  const handlePrinterChange = (printerName: string) => {
    setSelectedPrinter(printerName);
    localStorage.setItem("pos_preferred_printer", printerName);
  };

  const selectedCustomer = useMemo(() => {
    return customersList.find((c: any) => String(c.customerId) === String(customerId));
  }, [customersList, customerId]);

  const cartMap = useMemo(() => {
    const map = new Map<string, CartLineItem>();
    cart.forEach((item) => map.set(item.itemId, item));
    return map;
  }, [cart]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.toLowerCase();
    return customersList.filter((c: any) => {
      const nameMatch = (c.customerName ?? "").toLowerCase().includes(query);
      const phoneMatch = (c.phone ?? "").includes(query);
      return nameMatch || phoneMatch;
    });
  }, [customersList, customerSearch]);

  const cartTotals = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const lineSub = item.quantity * item.unitPrice;
        const lineDisc = item.discount ?? 0;
        acc.subtotal += lineSub;
        acc.discountTotal += lineDisc;
        acc.grandTotal += lineSub - lineDisc;
        return acc;
      },
      { subtotal: 0, discountTotal: 0, grandTotal: 0 }
    );
  }, [cart]);

  const tenderedValue = parseFloat(amountTendered) || 0;
  const changeAmount = useMemo(() => {
    if (paymentMethod !== "CASH") return 0;
    return tenderedValue >= cartTotals.grandTotal ? tenderedValue - cartTotals.grandTotal : 0;
  }, [tenderedValue, cartTotals.grandTotal, paymentMethod]);

  const isInsufficientCash = paymentMethod === "CASH" && tenderedValue > 0 && tenderedValue < cartTotals.grandTotal;

  // Build a set of Item IDs currently linked to the selected warehouse
  const validWarehouseItemIds = useMemo(() => {
    if (!warehouseStockItems || !Array.isArray(warehouseStockItems)) return new Set<string>();
    return new Set(warehouseStockItems.map((ws: ItemWarehouseStock) => String(ws.itemId)));
  }, [warehouseStockItems]);

  // Map Item IDs to Quantity On Hand for quick lookup
  const stockOnHandMap = useMemo(() => {
    if (!warehouseStockItems || !Array.isArray(warehouseStockItems)) return new Map<string, number>();
    const map = new Map<string, number>();
    warehouseStockItems.forEach((ws: ItemWarehouseStock) => {
      map.set(String(ws.itemId), ws.quantityOnHand ?? 0);
    });
    return map;
  }, [warehouseStockItems]);

  // Filter Catalog items by Warehouse Assignment, Active Status, Category, and Search Query
  const filteredCatalogItems = useMemo(() => {
    if (!Array.isArray(stockItems)) return [];
    const query = catalogSearch.toLowerCase();

    return stockItems.filter((stock: StockItem) => {
      const itemIdStr = String(stock.itemId);
      
      // Filter out items not assigned to the selected warehouse
      if (warehouseId && !validWarehouseItemIds.has(itemIdStr)) {
        return false;
      }

      const itemName = stock.description ?? "";
      const itemCode = stock.itemCode ?? "";
      const itemCategory = stock.categoryName ?? "";
      const matchesSearch = itemName.toLowerCase().includes(query) || itemCode.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "All" || itemCategory === selectedCategory;
      return matchesSearch && matchesCategory && stock.isActive;
    });
  }, [stockItems, catalogSearch, selectedCategory, warehouseId, validWarehouseItemIds]);

  const handleTileTap = (item: StockItem) => {
    const itemId = String(item.itemId);
    const existing = cartMap.get(itemId);

    if (existing) {
      handleQuantityOrPriceChange(itemId, "quantity", existing.quantity + 1);
    } else {
      const unitPrice = Number(item.sellingPrice ?? 0);
      const uomCode = item.stockUom ?? "EA";
      const discount = 0;
      const lineTotal = Number((1 * unitPrice - discount).toFixed(2));

      setCart((prev) => [
        ...prev,
        {
          itemId,
          itemCode: item.itemCode,
          description: item.description,
          uomCode,
          quantity: 1,
          unitPrice,
          discount,
          lineTotal,
        },
      ]);
    }
  };

  const handleRemoveLineItem = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const handleQuantityOrPriceChange = (
    itemId: string,
    field: "quantity" | "unitPrice" | "discount",
    value: number
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.itemId !== itemId) return item;
        const qty = field === "quantity" ? Math.max(1, value) : item.quantity;
        const price = field === "unitPrice" ? Math.max(0, value) : item.unitPrice;
        const discount = field === "discount" ? Math.max(0, value) : item.discount ?? 0;
        const lineTotal = Number((qty * price - discount).toFixed(2));

        return { ...item, quantity: qty, unitPrice: price, discount, lineTotal };
      })
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setAmountTendered("");
    setPaymentReference("");
  };

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId) {
      toast.error("Please select a valid Warehouse.");
      return;
    }

    if (!customerId) {
      toast.error("Please select a valid Customer.");
      return;
    }

    if (!operatorId) {
      toast.error("Operator session is invalid. Please log in again.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Please select items to build an order.");
      return;
    }

    if (paymentMethod === "CASH" && tenderedValue < cartTotals.grandTotal) {
      toast.error("Amount tendered is less than the total sale amount.");
      return;
    }

    if (paymentMethod === "MOBILE" && !paymentReference.trim()) {
      toast.error("Please enter the Mobile Money reference code.");
      return;
    }

    const payload: CreateSalesReceiptPayload = {
      warehouseId,
      customerId,
      operatorId,
      paidAmount: paymentMethod === "CASH" ? cartTotals.grandTotal : cartTotals.grandTotal,
      paymentMethodCode: paymentMethod,
      bankId,
      paymentReference: paymentMethod === "MOBILE" 
        ? paymentReference.trim() 
        : paymentMethod === "CASH" 
        ? "CASH" 
        : paymentReference.trim() || `REF-${Date.now()}`,
      lines: cart.map((item) => ({
        itemId: item.itemId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        uomCode: item.uomCode,
      })),
    };

    try {
      let saleResponse: any = null;
      if (processSale) {
        saleResponse = await processSale(payload);
      }

      const activeWh = warehousesList.find((w: any) => String(w.warehouseId) === String(warehouseId));
      
      const receiptPayload = {
        companyName: companyName ?? "ENTERPRISES",
        storeName: activeWh?.warehouseName ?? "POS STORE",
        receiptNo: saleResponse?.data?.documentNumber ?? saleResponse?.documentNumber ?? `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleString(),
        cashier: displayname ?? "CASHIER",
        customerName: selectedCustomer?.customerName ?? "Walk-in Customer",
        items: cart.map((i) => ({
          name: i.description,
          qty: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount ?? 0,
          total: i.lineTotal,
        })),
        subtotal: cartTotals.subtotal,
        discountTotal: cartTotals.discountTotal,
        taxTotal: 0,
        grandTotal: cartTotals.grandTotal,
        paymentMethod,
        amountTendered: paymentMethod === "CASH" ? tenderedValue : cartTotals.grandTotal,
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
      }

      toast.success("Transaction completed successfully!");
      handleClearCart();
    } catch (err: unknown) {
      handleBackendErrors(err, () => {}, setGlobalError);
    }
  };

  const isCatalogLoading = isStockLoading || isWarehouseStockLoading;

  document.title = "Point of Sale | Terminal";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {globalError && (
            <Alert color="danger" className="alert-dismissible-consecutive fade show mb-3">
              <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
              {globalError}
            </Alert>
          )}

          <Form onSubmit={handleSubmitSale}>
            <Row>
              {/* Product Catalog Column */}
              <Col lg={7} xl={8}>
                <Card className="shadow-sm border-0 mb-3" style={{ height: "calc(100vh - 165px)", display: "flex", flexDirection: "column" }}>
                  <CardHeader className="border-bottom py-3 px-3 bg-white">
                    <Row className="g-3 align-items-center justify-content-between">
                      <Col md={7} sm={12}>
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="card-title mb-0 fs-15 fw-semibold text-dark text-nowrap">
                            POS Terminal
                          </h5>
                          
                          <div className="flex-grow-1" style={{ maxWidth: "200px" }}>
                            {isWarehousesLoading ? (
                              <Spinner size="sm" color="primary" />
                            ) : (
                              <Input
                                type="select"
                                className="form-select form-select-sm fs-12"
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                              >
                                <option value="" disabled>Select Warehouse</option>
                                {warehousesList.map((wh: any) => {
                                  const id = String(wh.id ?? wh.warehouseId);
                                  return (
                                    <option key={id} value={id}>
                                      {wh.warehouseName}
                                    </option>
                                  );
                                })}
                              </Input>
                            )}
                          </div>

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
                    {isCatalogLoading ? (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100 py-5">
                        <Spinner size="sm" color="primary" className="mb-2" />
                        <span className="text-muted fs-12 fw-medium">Loading inventory...</span>
                      </div>
                    ) : filteredCatalogItems.length > 0 ? (
                      <Row className="g-2 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4 row-cols-xxl-5">
                        {filteredCatalogItems.map((item: StockItem) => {
                          const itemId = String(item.itemId);
                          const cartItem = cartMap.get(itemId);
                          const inCartQty = cartItem ? cartItem.quantity : 0;
                          const isSelected = inCartQty > 0;
                          const qoh = stockOnHandMap.get(itemId) ?? 0;

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
                                      {item.itemCode}
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
                                      {item.description}
                                    </h6>
                                  </div>
                                  <div className="pt-1.5 border-top border-light-subtle mt-auto">
                                    <div className="d-flex align-items-end justify-content-between gap-1">
                                      <div className="d-flex flex-column lh-1">
                                        <span className="text-muted fs-10 fw-normal mb-1">{item.stockUom}</span>
                                        {qoh <= 0 ? (
                                          <span className="text-danger fs-10 fw-semibold mb-1">Out of Stock</span>
                                        ) : (
                                          <span className="text-muted fs-10 fw-normal mb-1">Stock: {qoh}</span>
                                        )}
                                      </div>
                                      <div className="text-end flex-shrink-0">
                                        <span className="fs-12 fw-bold text-primary font-monospace d-block lh-1">
                                          {formatCurrency(item.sellingPrice)}
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

              {/* Cart Summary & Order Processing Column */}
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

                    {/* Customer Selection Dropdown */}
                    <Dropdown isOpen={isCustomerDropdownOpen} toggle={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)} className="w-100">
                      <DropdownToggle tag="div" className="d-flex justify-content-between align-items-center p-2 bg-light rounded cursor-pointer border border-light-subtle">
                        <div className="d-flex align-items-center gap-2">
                          <i className="ri-user-3-line text-muted fs-14"></i>
                          <span className="mb-0 fs-12 fw-medium text-dark text-truncate" style={{ maxWidth: "200px" }}>
                            {selectedCustomer?.customerName ?? "Select Customer"}
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
                          {isCustomersLoading ? (
                            <div className="text-center py-2"><Spinner size="sm" color="primary" /></div>
                          ) : (
                            filteredCustomers.map((cust: any) => {
                              const custId = String(cust.id ?? cust.customerId);
                              return (
                                <div
                                  key={custId}
                                  className="p-2 rounded fs-12 cursor-pointer hover-bg-light"
                                  onClick={() => {
                                    setCustomerId(custId);
                                    setIsCustomerDropdownOpen(false);
                                  }}
                                >
                                  <span className="fw-medium text-dark d-block">{cust.customerName ?? cust.name}</span>
                                  <span className="text-muted fs-11">{cust.phone ?? cust.phoneNumber}</span>
                                </div>
                              );
                            })
                          )}
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
                        <div key={line.itemId} className="p-2 mb-2 bg-light rounded border border-light-subtle position-relative">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <div className="flex-grow-1 pe-2" style={{ minWidth: 0 }}>
                              <h6 className="fs-12 fw-semibold text-dark mb-0 text-truncate">{line.description}</h6>
                              <span className="fs-11 text-muted">{formatCurrency(line.unitPrice)} / {line.uomCode}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <div className="d-flex align-items-center bg-white rounded border border-light-subtle p-1 shadow-none">
                                <span className="d-flex align-items-center justify-content-center rounded cursor-pointer text-muted px-1.5" onClick={() => handleQuantityOrPriceChange(line.itemId, "quantity", line.quantity - 1)}>
                                  <i className="ri-subtract-line fs-11"></i>
                                </span>
                                <span className="fs-12 fw-semibold px-2 text-dark">{line.quantity}</span>
                                <span className="d-flex align-items-center justify-content-center rounded cursor-pointer text-primary px-1.5" onClick={() => handleQuantityOrPriceChange(line.itemId, "quantity", line.quantity + 1)}>
                                  <i className="ri-add-line fs-11"></i>
                                </span>
                              </div>
                              <span className="fs-12 fw-semibold text-dark font-monospace text-end" style={{ width: "70px" }}>
                                {formatCurrency(line.lineTotal)}
                              </span>
                              <i
                                className="ri-delete-bin-line text-danger cursor-pointer ms-1 fs-14"
                                title="Remove item"
                                onClick={() => handleRemoveLineItem(line.itemId)}
                              ></i>
                            </div>
                          </div>
                          
                          {line.discount > 0 && (
                            <div className="d-flex justify-content-end align-items-center pt-1 border-top border-light-subtle fs-10 text-muted">
                              <span className="text-success">Disc: -{formatCurrency(line.discount)}</span>
                            </div>
                          )}
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

                    {paymentMethod === "MOBILE" && (
                      <div className="mb-2 p-2 bg-light border border-light-subtle rounded">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fs-11 fw-medium text-muted">Reference Code / M-Pesa Code</span>
                        </div>
                        <Input
                          type="text"
                          placeholder="Enter payment reference e.g. QHX123456"
                          bsSize="sm"
                          className="form-control form-control-sm bg-white border-light-subtle fs-12 fw-bold shadow-none"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="mb-2 px-1 fs-11 text-muted">
                      <div className="d-flex justify-content-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(cartTotals.subtotal)}</span>
                      </div>
                      {cartTotals.discountTotal > 0 && (
                        <div className="d-flex justify-content-between text-success">
                          <span>Discount Total:</span>
                          <span>-{formatCurrency(cartTotals.discountTotal)}</span>
                        </div>
                      )}
                    </div>

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
                        {formatCurrency(cartTotals.grandTotal)}
                      </h4>
                    </div>

                    <Button
                      type="submit"
                      className="w-100 border-0 rounded py-2 shadow-sm d-flex justify-content-between align-items-center px-3"
                      style={{
                        backgroundColor: (isPosting || isPrinting || cart.length === 0 || isInsufficientCash || (paymentMethod === "MOBILE" && !paymentReference.trim())) ? "#a3b4cc" : BRAND_PURPLE,
                      }}
                      disabled={isPosting || isPrinting || cart.length === 0 || isInsufficientCash || (paymentMethod === "MOBILE" && !paymentReference.trim())}
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