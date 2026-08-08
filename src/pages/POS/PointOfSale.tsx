import React, { useState, useMemo } from 'react';
import { 
  Button, Form, Label, Input, Spinner, Alert, 
  Row, Col, Card, CardHeader, CardBody, Container, Badge, InputGroup, Table,
  Dropdown, DropdownToggle, DropdownMenu 
} from 'reactstrap';
import { usePOSMutation } from '../../Components/Hooks/usePOS'; // Adjust import path
import { POSLineItem } from '../../types/pos'; // Adjust import path

// Brand Theme Accent Matching Sidebar (#410875)
const BRAND_PURPLE = '#042e6d';
const BRAND_PURPLE_SUBTLE = 'rgba(19, 8, 31, 0.08)';

// Retail Catalog Items
const AVAILABLE_ITEMS = [
  { id: 'STK-001', code: 'SUGAR-2KG', name: 'Sugar 2kg Packet', category: 'Groceries', uom: 'PKT', price: 210.00, icon: 'ri-shopping-bag-2-line' },
  { id: 'STK-002', code: 'RICE-5KG', name: 'Pishori Rice 5kg', category: 'Groceries', uom: 'BAG', price: 650.00, icon: 'ri-store-2-line' },
  { id: 'STK-003', code: 'SODA-500', name: 'Soda 500ml Bottle', category: 'Beverages', uom: 'BTL', price: 60.00, icon: 'ri-cup-line' },
  { id: 'STK-004', code: 'MILK-1L', name: 'Fresh Milk 1 Litre', category: 'Dairy', uom: 'LTR', price: 110.00, icon: 'ri-drop-line' },
  { id: 'STK-005', code: 'SOAP-BAR', name: 'Bathing Soap 200g', category: 'Toiletries', uom: 'PCS', price: 50.00, icon: 'ri-sparkles-line' },
  { id: 'STK-006', code: 'BREAD-400', name: 'White Bread 400g', category: 'Bakery', uom: 'LOAF', price: 65.00, icon: 'ri-cake-3-line' },
  { id: 'STK-007', code: 'OMO-1KG', name: 'Washing Powder 1kg', category: 'Detergents', uom: 'PKT', price: 280.00, icon: 'ri-bubbles-line' },
  { id: 'STK-008', code: 'TEA-250', name: 'Tea Leaves 250g', category: 'Beverages', uom: 'PKT', price: 130.00, icon: 'ri-goblet-line' },
];

const MOCK_CATEGORIES = ['All', 'Groceries', 'Beverages', 'Dairy', 'Toiletries', 'Bakery', 'Detergents'];

const MOCK_CUSTOMERS = [
  { id: 'CUST-WALK-IN', name: 'Walk-in Customer', phone: 'N/A' },
  { id: 'CUST-001', name: 'John Doe (Retailer)', phone: '+254712345678' },
  { id: 'CUST-002', name: 'Jane Smith (Wholesale)', phone: '+254798765432' },
  { id: 'CUST-003', name: 'Apex Traders Ltd', phone: '+254700001122' },
];

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash Payment' },
  { id: 'MOBILE_MONEY', label: 'M-Pesa / Mobile' },
  { id: 'CARD', label: 'Debit / Credit Card' },
];

const PointOfSale = () => {
  const { processSale, isProcessing: isPosting } = usePOSMutation() as any;

  // Alerts
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState(MOCK_CUSTOMERS[0]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [cart, setCart] = useState<POSLineItem[]>([]);

  // Catalog Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Customer Filter
  const filteredCustomers = useMemo(() => {
    return MOCK_CUSTOMERS.filter((c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    );
  }, [customerSearch]);

  // Grand Total Calculation
  const grandTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  }, [cart]);

  // Tendered & Change Calculations
  const tenderedValue = parseFloat(amountTendered) || 0;
  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    return tenderedValue >= grandTotal ? tenderedValue - grandTotal : 0;
  }, [tenderedValue, grandTotal, paymentMethod]);

  const isInsufficientCash = paymentMethod === 'CASH' && tenderedValue > 0 && tenderedValue < grandTotal;

  // Catalog items filter
  const filteredCatalogItems = useMemo(() => {
    const addedIds = new Set(cart.map((i) => i.stockItemId));
    return AVAILABLE_ITEMS.filter((item) => {
      if (addedIds.has(item.id)) return false;
      const matchesSearch =
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [cart, catalogSearch, selectedCategory]);

  // Cart Interactions
  const handleCardItemSelect = (item: typeof AVAILABLE_ITEMS[0]) => {
    setCart((prev) => [
      ...prev,
      {
        stockItemId: item.id,
        stockItemCode: item.code,
        stockItemName: item.name,
        uom: item.uom,
        quantity: 1,
        unitPrice: item.price,
        lineTotal: item.price,
      },
    ]);
  };

  const handleRemoveLineItem = (stockItemId: string) => {
    setCart((prev) => prev.filter((i) => i.stockItemId !== stockItemId));
  };

  const handleQuantityOrPriceChange = (
    stockItemId: string,
    field: 'quantity' | 'unitPrice',
    value: number
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.stockItemId !== stockItemId) return item;
        const qty = field === 'quantity' ? Math.max(1, value) : item.quantity;
        const price = field === 'unitPrice' ? Math.max(0, value) : item.unitPrice;
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
    setAmountTendered('');
  };

  // Submit Sale Order
  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMessage(null);

    if (cart.length === 0) {
      setGlobalError('Please select items from the catalog to build an order.');
      return;
    }

    if (paymentMethod === 'CASH' && tenderedValue < grandTotal) {
      setGlobalError('Amount tendered is less than total sale amount.');
      return;
    }

    try {
      const payload = {
        customerId: selectedCustomer.id,
        paymentMethod,
        amountPaid: paymentMethod === 'CASH' ? tenderedValue : grandTotal,
        items: cart.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      await processSale(payload);

      handleClearCart();
      setSelectedCustomer(MOCK_CUSTOMERS[0]);
      setPaymentMethod('CASH');
      setSuccessMessage('Sale checkout posted and printed successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setGlobalError(err.response?.data?.message || 'Failed to complete transaction.');
    }
  };

  return (
    <div className="page-content">
      <Container fluid className="p-0">
        {/* Top Header Ribbon */}
        <div className="d-flex align-items-center justify-content-between mb-2 bg-white px-3 py-2 rounded shadow-sm border border-light-subtle">
          <div className="d-flex align-items-center gap-2">
            <div 
              className="avatar-xs text-white rounded d-flex align-items-center justify-content-center fw-bold"
              style={{ backgroundColor: BRAND_PURPLE }}
            >
              <i className="ri-shopping-cart-2-fill fs-16"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-semibold text-dark fs-14">POS Register Terminal</h6>
              <span className="text-muted fs-11 font-monospace">TERMINAL #01 • STORE: MAIN WAREHOUSE</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {cart.length > 0 && (
              <Button
                color="soft-danger"
                size="sm"
                className="btn-soft-danger text-danger border-0 fw-medium fs-12 px-2"
                onClick={handleClearCart}
              >
                <i className="ri-delete-bin-line me-1"></i> Reset Cart ({cart.length})
              </Button>
            )}
            <Badge 
              className="px-2 py-1 fs-11 fw-medium border"
              style={{ backgroundColor: BRAND_PURPLE_SUBTLE, color: BRAND_PURPLE, borderColor: BRAND_PURPLE_SUBTLE }}
            >
              <i className="ri-checkbox-blank-circle-fill me-1 fs-9"></i> Terminal Active
            </Badge>
          </div>
        </div>

        {globalError && (
          <Alert color="danger" className="mb-2 py-2 px-3 fs-12 border-0 shadow-sm" toggle={() => setGlobalError(null)}>
            <i className="ri-error-warning-fill me-1 align-middle fs-15"></i> {globalError}
          </Alert>
        )}
        {successMessage && (
          <Alert color="success" className="mb-2 py-2 px-3 fs-12 border-0 shadow-sm" toggle={() => setSuccessMessage(null)}>
            <i className="ri-checkbox-circle-fill me-1 align-middle fs-15"></i> {successMessage}
          </Alert>
        )}

        <Form onSubmit={handleSubmitSale}>
          <Row className="g-2">
            {/* LEFT PANEL: Product Catalog */}
            <Col lg={7} xl={7}>
              {/* Contained height cleanly prevents layout overflow into Velzon Topbar */}
              <Card className="border-0 shadow-sm mb-0 d-flex flex-column" style={{ height: 'calc(100vh - 180px)' }}>
                {/* Search & Categories Stack */}
                <CardHeader className="bg-white border-bottom border-light-subtle p-2">
                  <div className="mb-2">
                    <div className="position-relative">
                      <Input
                        type="text"
                        className="form-control bg-light border-light-subtle ps-5 fs-13"
                        placeholder="Search item name, code or barcode..."
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                      />
                      <i className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-15"></i>
                      {catalogSearch && (
                        <i
                          className="ri-close-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-muted cursor-pointer"
                          onClick={() => setCatalogSearch('')}
                        ></i>
                      )}
                    </div>
                  </div>

                  {/* Category Pills directly under Search */}
                  <div
                    className="d-flex align-items-center gap-1 overflow-x-auto pb-1"
                    style={{ whiteSpace: 'nowrap', scrollbarWidth: 'none' }}
                  >
                    {MOCK_CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat;
                      return (
                        <Button
                          key={cat}
                          size="sm"
                          className="rounded-pill px-3 py-1 fs-11 fw-medium border-0"
                          style={{
                            backgroundColor: isActive ? BRAND_PURPLE : '#f3f3f9',
                            color: isActive ? '#ffffff' : '#495057',
                          }}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          {cat}
                        </Button>
                      );
                    })}
                  </div>
                </CardHeader>

                {/* Product Box Grid */}
                <CardBody className="bg-light-subtle p-2 overflow-y-auto flex-grow-1">
                  {filteredCatalogItems.length > 0 ? (
                    <Row className="g-2">
                      {filteredCatalogItems.map((item) => (
                        <Col xl={3} lg={4} md={6} sm={6} key={item.id}>
                          <Card
                            className="h-100 border-0 shadow-sm bg-white cursor-pointer position-relative overflow-hidden"
                            onClick={() => handleCardItemSelect(item)}
                            style={{
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '';
                            }}
                          >
                            <CardBody className="p-2 d-flex flex-column justify-content-between">
                              <div>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div 
                                    className="avatar-xs rounded d-flex align-items-center justify-content-center"
                                    style={{ backgroundColor: BRAND_PURPLE_SUBTLE, color: BRAND_PURPLE }}
                                  >
                                    <i className={`${item.icon} fs-15`}></i>
                                  </div>
                                  <Badge color="light" className="text-secondary font-monospace border border-light-subtle fs-10 fw-normal">
                                    {item.uom}
                                  </Badge>
                                </div>

                                <h6 className="fs-12 fw-semibold text-dark mb-1 text-truncate" title={item.name}>
                                  {item.name}
                                </h6>
                                <span className="text-muted font-monospace fs-10 d-block mb-2">
                                  {item.code}
                                </span>
                              </div>

                              <div className="pt-2 border-top border-light-subtle d-flex align-items-center justify-content-between">
                                <span className="fs-13 fw-bold font-monospace" style={{ color: BRAND_PURPLE }}>
                                  KES {item.price.toFixed(2)}
                                </span>
                                <div 
                                  className="avatar-xs text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                  style={{ backgroundColor: BRAND_PURPLE }}
                                >
                                  <i className="ri-add-line fs-14"></i>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-5">
                      <div className="avatar-md bg-light rounded-circle d-flex align-items-center justify-content-center mb-2">
                        <i className="ri-inbox-archive-line display-6 text-secondary opacity-50"></i>
                      </div>
                      <h6 className="fs-13 fw-semibold text-dark mb-1">No items found</h6>
                      <p className="fs-11 text-muted mb-0">Try clearing filters or search parameters.</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* RIGHT PANEL: Searchable Customer, Order Table & Checkout */}
            <Col lg={5} xl={5}>
              <Card className="border-0 shadow-sm mb-0 d-flex flex-column" style={{ height: 'calc(100vh - 180px)' }}>
                {/* Searchable Customer Header */}
                <CardHeader className="bg-white border-bottom border-light-subtle p-2">
                  <Row className="g-2">
                    <Col xs={7}>
                      <Label className="form-label fs-11 fw-bold text-uppercase text-muted mb-1">
                        Customer
                      </Label>
                      <Dropdown
                        isOpen={isCustomerDropdownOpen}
                        toggle={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                        className="w-100"
                      >
                        <DropdownToggle
                          tag="button"
                          className="btn btn-sm btn-light border border-light-subtle w-100 d-flex justify-content-between align-items-center text-start fs-12 fw-medium text-dark bg-white"
                        >
                          <span className="text-truncate me-1">{selectedCustomer.name}</span>
                          <i className="ri-arrow-down-s-line text-muted"></i>
                        </DropdownToggle>
                        <DropdownMenu className="p-2 shadow-lg w-100 border-0" style={{ minWidth: '240px' }}>
                          <Input
                            type="text"
                            placeholder="Search customer name or phone..."
                            bsSize="sm"
                            className="mb-2 fs-12 border-light-subtle"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {filteredCustomers.length > 0 ? (
                              filteredCustomers.map((cust) => {
                                const isSelected = selectedCustomer.id === cust.id;
                                return (
                                  <div
                                    key={cust.id}
                                    className="p-2 rounded fs-12"
                                    style={{
                                      cursor: 'pointer',
                                      backgroundColor: isSelected ? BRAND_PURPLE_SUBTLE : 'transparent',
                                      color: isSelected ? BRAND_PURPLE : '#212529',
                                      fontWeight: isSelected ? '600' : 'normal',
                                    }}
                                    onClick={() => {
                                      setSelectedCustomer(cust);
                                      setIsCustomerDropdownOpen(false);
                                      setCustomerSearch('');
                                    }}
                                  >
                                    <div>{cust.name}</div>
                                    <small className="text-muted font-monospace fs-10">{cust.phone}</small>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-muted fs-11 p-2 text-center">No customers matched</div>
                            )}
                          </div>
                        </DropdownMenu>
                      </Dropdown>
                    </Col>

                    <Col xs={5}>
                      <Label className="form-label fs-11 fw-bold text-uppercase text-muted mb-1">
                        Payment Mode
                      </Label>
                      <Input
                        type="select"
                        bsSize="sm"
                        className="form-select bg-white fs-12 border border-light-subtle fw-medium"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.label}
                          </option>
                        ))}
                      </Input>
                    </Col>
                  </Row>
                </CardHeader>

                {/* Cart Order Table */}
                <CardBody className="p-0 overflow-y-auto flex-grow-1 bg-white">
                  {cart.length > 0 ? (
                    <Table responsive hover size="sm" className="align-middle mb-0 border-0">
                      <thead className="table-light fs-11 text-uppercase text-muted border-bottom border-light-subtle">
                        <tr>
                          <th style={{ width: '40%' }} className="ps-3 py-2">Item</th>
                          <th style={{ width: '25%' }} className="text-center py-2">Qty</th>
                          <th style={{ width: '25%' }} className="text-end py-2">Total</th>
                          <th style={{ width: '10%' }} className="text-center py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((line) => (
                          <tr key={line.stockItemId} className="border-bottom border-light-subtle">
                            <td className="ps-3 py-2">
                              <div className="fw-semibold text-dark fs-12 text-truncate" style={{ maxWidth: '130px' }} title={line.stockItemName}>
                                {line.stockItemName}
                              </div>
                              <div className="font-monospace text-muted fs-10">
                                @ KES {line.unitPrice.toFixed(2)}
                              </div>
                            </td>

                            <td className="py-2">
                              <InputGroup size="sm" className="flex-nowrap">
                                <Button
                                  color="light"
                                  className="btn-xs border text-dark px-2 fs-12"
                                  onClick={() =>
                                    handleQuantityOrPriceChange(
                                      line.stockItemId,
                                      'quantity',
                                      line.quantity - 1
                                    )
                                  }
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  className="text-center bg-white border-top border-bottom px-1 fs-12 font-monospace"
                                  style={{ minWidth: '32px' }}
                                  value={line.quantity}
                                  onChange={(e) =>
                                    handleQuantityOrPriceChange(
                                      line.stockItemId,
                                      'quantity',
                                      parseFloat(e.target.value) || 1
                                    )
                                  }
                                />
                                <Button
                                  color="light"
                                  className="btn-xs border text-dark px-2 fs-12"
                                  onClick={() =>
                                    handleQuantityOrPriceChange(
                                      line.stockItemId,
                                      'quantity',
                                      line.quantity + 1
                                    )
                                  }
                                >
                                  +
                                </Button>
                              </InputGroup>
                            </td>

                            <td className="text-end font-monospace fw-bold text-dark fs-12 py-2">
                              {line.lineTotal.toFixed(2)}
                            </td>

                            <td className="text-center py-2">
                              <Button
                                color="link"
                                className="text-danger p-0 border-0 shadow-none fs-15"
                                onClick={() => handleRemoveLineItem(line.stockItemId)}
                              >
                                <i className="ri-delete-bin-fill"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4">
                      <div className="avatar-md bg-light rounded-circle d-flex align-items-center justify-content-center mb-2">
                        <i className="ri-shopping-cart-2-line display-6 text-secondary opacity-40"></i>
                      </div>
                      <p className="fs-12 mb-0 text-center text-muted fw-medium">
                        Your cart is empty.
                        <br />
                        Click items on the left catalog to start building the order.
                      </p>
                    </div>
                  )}
                </CardBody>

                {/* Checkout & Cash Calculation Footer */}
                <div className="border-top border-light-subtle bg-light p-3 mt-auto shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fs-12 fw-bold text-uppercase text-muted">Grand Total</span>
                    <h3 className="mb-0 fw-bold font-monospace" style={{ color: BRAND_PURPLE }}>
                      KES{' '}
                      {grandTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </h3>
                  </div>

                  {/* Cash Change Section */}
                  {paymentMethod === 'CASH' && (
                    <div className="bg-white p-2 rounded border border-light-subtle mb-2">
                      <Row className="g-2 align-items-center mb-1">
                        <Col xs={6}>
                          <span className="fs-11 text-muted d-block">Tendered Cash</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            bsSize="sm"
                            className="form-control font-monospace fs-13 fw-bold border-light-subtle bg-light"
                            value={amountTendered}
                            onChange={(e) => setAmountTendered(e.target.value)}
                          />
                        </Col>
                        <Col xs={6} className="text-end">
                          <span className="fs-11 text-muted d-block">Calculated Change</span>
                          {isInsufficientCash ? (
                            <Badge color="danger" className="bg-danger-subtle text-danger font-monospace fs-11">
                              Insufficient Cash
                            </Badge>
                          ) : (
                            <span className="fs-14 fw-bold font-monospace text-success">
                              KES {changeAmount.toFixed(2)}
                            </span>
                          )}
                        </Col>
                      </Row>

                      {/* Quick Cash Presets */}
                      <div className="d-flex gap-1 overflow-x-auto pt-1">
                        <Button
                          size="sm"
                          color="light"
                          className="py-0 px-2 fs-10 border border-light-subtle text-dark font-monospace"
                          onClick={() => setAmountTendered(grandTotal.toString())}
                        >
                          Exact
                        </Button>
                        {[100, 200, 500, 1000, 2000].map((amt) => (
                          <Button
                            key={amt}
                            size="sm"
                            color="light"
                            className="py-0 px-2 fs-10 border border-light-subtle text-dark font-monospace"
                            onClick={() => setAmountTendered(amt.toString())}
                          >
                            +{amt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Primary Action Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-100 fw-bold fs-14 py-2 shadow-sm border-0"
                    style={{ backgroundColor: BRAND_PURPLE }}
                    disabled={isPosting || cart.length === 0 || isInsufficientCash}
                  >
                    {isPosting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Posting Transaction...
                      </>
                    ) : (
                      <>
                        <i className="ri-printer-line me-1"></i> Post Sale & Print Receipt
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  );
};

export default PointOfSale;