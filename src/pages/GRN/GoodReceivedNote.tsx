import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, Spinner, Alert, 
  Row, Col, Card, CardHeader, CardBody, Container, Badge, InputGroup, InputGroupText
} from 'reactstrap';
import { useGRNs, useGRNMutation } from '../../Components/Hooks/useGrn';
import { GRNHeader, GRNLineItem } from '../../types/grn';
import TablePagination from "../TablePagination";

// Comprehensive Catalog with Categories and UOM for Retail Shop GRN
const AVAILABLE_ITEMS = [
  { id: 'STK-001', code: 'SUGAR-2KG', name: 'Sugar 2kg', category: 'Groceries', uom: 'PKT', estCost: 163.00 },
  { id: 'STK-002', code: 'RICE-5KG', name: 'Pishori Rice 5kg', category: 'Groceries', uom: 'BAG', estCost: 507.00 },
  { id: 'STK-003', code: 'SODA-500', name: 'Soda 500ml', category: 'Beverages', uom: 'BTL', estCost: 46.00 },
  { id: 'STK-004', code: 'MILK-1L', name: 'Fresh Milk 1L', category: 'Dairy', uom: 'LTR', estCost: 78.00 },
  { id: 'STK-005', code: 'SOAP-BAR', name: 'Bathing Soap', category: 'Toiletries', uom: 'PCS', estCost: 36.00 },
  { id: 'STK-006', code: 'BREAD-400', name: 'White Bread 400g', category: 'Bakery', uom: 'LOAF', estCost: 42.00 },
  { id: 'STK-007', code: 'OMO-1KG', name: 'Washing Powder 1kg', category: 'Detergents', uom: 'PKT', estCost: 202.00 },
  { id: 'STK-008', code: 'TEA-250', name: 'Tea Leaves 250g', category: 'Beverages', uom: 'PKT', estCost: 94.00 },
];

const MOCK_CATEGORIES = ['All', 'Groceries', 'Beverages', 'Dairy', 'Toiletries', 'Bakery', 'Detergents'];

const MOCK_SUPPLIERS = [
  { id: 'SUP-001', name: 'Highlands Distributors (SUP-001)' },
  { id: 'SUP-002', name: 'Afrinet Energy & FMCG (SUP-002)' },
];

const GoodsReceipt = () => {
  const [pageIndex, setPageIndex] = useState(0); 
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useGRNs(); 
  const { createGRN, isPosting } = useGRNMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // GRN Form States
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30');
  const [lineItems, setLineItems] = useState<GRNLineItem[]>([]);
  
  // Modal Catalog Filtering
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Calculate Grand Total live
  const grandTotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  }, [lineItems]);

  // Filtered available items for the click-to-add grid (Disappears if already added)
  const filteredCatalogItems = useMemo(() => {
    const addedIds = new Set(lineItems.map(i => i.stockItemId));
    return AVAILABLE_ITEMS.filter(item => {
      if (addedIds.has(item.id)) return false; // Disappear if already selected
      const matchesSearch = item.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                            item.code.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [lineItems, catalogSearch, selectedCategory]);

  // Main table filtering
  const filteredReceipts = useMemo(() => {
    const list = data?.goodsReceipts || [];
    if (!searchTerm) return list;
    return list.filter(item => 
      item.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredReceipts.slice(start, start + pageSize);
  }, [filteredReceipts, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredReceipts.length / pageSize);

  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => { setPageSize(size); setPageIndex(0); },
    previousPage: () => setPageIndex(prev => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex(prev => Math.min(prev + 1, totalPages - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < totalPages - 1,
    getPageCount: () => totalPages || 1,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: filteredReceipts }),
  };

  // Add item from card click
  const handleCardItemSelect = (item: typeof AVAILABLE_ITEMS[0]) => {
    setLineItems(prev => [
      ...prev, 
      {
        stockItemId: item.id,
        stockItemCode: item.code,
        stockItemName: item.name,
        uom: item.uom,
        quantity: 1,
        unitPrice: item.estCost,
        lineTotal: item.estCost
      }
    ]);
  };

  const handleRemoveLineItem = (stockItemId: string) => {
    setLineItems(prev => prev.filter(i => i.stockItemId !== stockItemId));
  };

  const handleQuantityOrPriceChange = (stockItemId: string, field: 'quantity' | 'unitPrice', value: number) => {
    setLineItems(prev => {
      return prev.map(item => {
        if (item.stockItemId !== stockItemId) return item;
        const qty = field === 'quantity' ? value : item.quantity;
        const price = field === 'unitPrice' ? value : item.unitPrice;
        return {
          ...item,
          [field]: value,
          lineTotal: Number((qty * price).toFixed(2))
        };
      });
    });
  };

  // Thermal Printer Function for ePOS 80mm receipt format
  const handlePrintThermalReceipt = (receipt: GRNHeader) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>GRN Receipt - ${receipt.documentNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; font-size: 11px; padding: 2px 0; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 14px;">RETAIL ENTERPRISE SYSTEM</div>
          <div class="center">GOODS RECEIVED NOTE (GRN-201)</div>
          <div class="line"></div>
          <div>Doc #: <span class="bold">${receipt.documentNumber}</span></div>
          <div>Supplier: ${receipt.supplierName || 'Primary Supplier'}</div>
          <div>Invoice Ref: ${receipt.supplierInvoiceNo || 'N/A'}</div>
          <div>Date: ${new Date(receipt.postedAt).toLocaleString()}</div>
          <div class="line"></div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(receipt.items || []).map(i => `
                <tr>
                  <td>${i.stockItemName}<br/>@${i.unitPrice} ${i.uom}</td>
                  <td>${i.quantity}</td>
                  <td class="right">${i.lineTotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="line"></div>
          <div class="bold" style="font-size: 13px; text-align: right;">GRAND TOTAL: KES ${receipt.total.toFixed(2)}</div>
          <div class="line"></div>
          <div class="center" style="margin-top: 10px;">*** FIFO BATCH VERIFIED ***</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setGlobalError("Please select a vendor/supplier.");
      return;
    }
    if (lineItems.length === 0) {
      setGlobalError("Please select at least one stock item to add a receipt line.");
      return;
    }

    try {
      setGlobalError(null);
      await createGRN({
        supplierId,
        supplierInvoiceNo,
        items: lineItems.map(item => ({
          stockItemId: item.stockItemId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      });

      // Reset & close
      setSupplierId('');
      setSupplierInvoiceNo('');
      setLineItems([]);
      setModalOpen(false);
    } catch (err: any) {
      setGlobalError(err.response?.data?.message || "Failed to post Goods Receipt.");
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Card>
            <CardHeader className="border-0 pb-0">
              <Row className="g-4 align-items-center mb-3">
                <Col sm={4}>
                  <div className="search-box">
                    <Input 
                      type="text" 
                      className="form-control" 
                      placeholder="Search GRN # or Supplier..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPageIndex(0); }}
                    />
                    <i className="ri-search-line search-icon"></i>
                  </div>
                </Col>
                <Col sm="auto" className="ms-auto">
                  <Button 
                    color="primary" 
                    onClick={() => { 
                      setGlobalError(null);
                      setLineItems([]);
                      setModalOpen(true); 
                    }}
                  >
                    <i className="ri-add-line align-bottom me-1"></i> Post Goods Receipt (GRN)
                  </Button>
                </Col>
              </Row>
            </CardHeader>

            <CardBody>
              <Table hover responsive className="align-middle custom-datatable table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Document No</th>
                    <th>Supplier / Ref</th>
                    <th>Posting Date</th>
                    <th>Total Valuation</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center p-5"><Spinner color="primary" /></td></tr>
                  ) : paginatedRows.length > 0 ? (
                    paginatedRows.map((item: GRNHeader) => (
                      <tr key={item.documentId}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-xs flex-shrink-0">
                              <div className="avatar-title rounded-circle bg-success-subtle text-success fw-bold">
                                <i className="ri-file-download-line"></i>
                              </div>
                            </div>
                            <div className="ms-2">
                              <h5 className="fs-14 mb-0 fw-bold">{item.documentNumber}</h5>
                              <span className="badge bg-info-subtle text-info">FIFO Lot Log</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <h5 className="fs-13 mb-0">{item.supplierName || 'Highlands Distributors'}</h5>
                          <p className="text-muted mb-0 fs-12">Inv: {item.supplierInvoiceNo || 'N/A'}</p>
                        </td>
                        <td>
                          <span className="fs-13">{new Date(item.postedAt).toLocaleDateString()}</span>
                        </td>
                        <td>
                          <span className="fw-bold text-success fs-14">
                            KES {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="text-end">
                          <Button 
                            size="sm" 
                            color="soft-secondary" 
                            className="me-2"
                            onClick={() => handlePrintThermalReceipt(item)}
                            title="Print Thermal ePOS Receipt"
                          >
                            <i className="ri-printer-line"></i> Print
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="text-center p-4">No goods receipt logs registered.</td></tr>
                  )}
                </tbody>
              </Table>
              <div className="mt-3">
                <TablePagination table={tableInstance} />
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>

      {/* Modern POS Style Split Modal for GRN Entry */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="xl">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
          <i className="ri-shopping-cart-2-line align-middle me-2 text-primary"></i> 
          Goods Received Note (GRN 201) — Retail FIFO Intake
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody className="p-4 bg-light">
            {globalError && <Alert color="danger" className="mb-3">{globalError}</Alert>}
            
            {/* Top Control Bar (Supplier, Invoice, Terms) */}
            <Card className="shadow-none border mb-3">
              <CardBody className="p-3">
                <Row className="g-3 align-items-center">
                  <Col md={5}>
                    <FormGroup className="mb-0">
                      <Label className="form-label fs-12 fw-bold text-muted mb-1">Supplier</Label>
                      <Input 
                        type="select"
                        bsSize="sm"
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                      >
                        <option value="">-- Select Supplier --</option>
                        {MOCK_SUPPLIERS.map(sup => (
                          <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  
                  <Col md={4}>
                    <FormGroup className="mb-0">
                      <Label className="form-label fs-12 fw-bold text-muted mb-1">Supplier invoice ref.</Label>
                      <Input 
                        type="text"
                        bsSize="sm"
                        placeholder="optional"
                        value={supplierInvoiceNo}
                        onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={3}>
                    <FormGroup className="mb-0">
                      <Label className="form-label fs-12 fw-bold text-muted mb-1">Payment terms</Label>
                      <div className="input-group input-group-sm">
                        <Input 
                          type="text" 
                          value={paymentTerms} 
                          onChange={(e) => setPaymentTerms(e.target.value)}
                        />
                        <span className="input-group-text bg-light">days</span>
                      </div>
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {/* Split Grid Layout (Left: Catalog Grid | Right: Receipt Lines Sidebar) */}
            <Row>
              {/* Left Panel: Item Cards & Filters */}
              <Col lg={7}>
                <Card className="shadow-none border h-100 mb-0">
                  <CardBody className="p-3 d-flex flex-column">
                    <div className="mb-3">
                      <div className="search-box mb-2">
                        <Input 
                          type="text" 
                          bsSize="sm"
                          className="form-control" 
                          placeholder="Search item code or name" 
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                        />
                        <i className="ri-search-line search-icon"></i>
                      </div>
                      
                      {/* Category Pills */}
                      <div className="d-flex flex-wrap gap-1">
                        {MOCK_CATEGORIES.map(cat => (
                          <Button 
                            key={cat}
                            size="sm"
                            color={selectedCategory === cat ? 'primary' : 'soft-secondary'}
                            className="fs-11 py-1 px-2"
                            onClick={() => setSelectedCategory(cat)}
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Scrollable Item Cards Grid */}
                    <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '380px' }}>
                      {filteredCatalogItems.length > 0 ? (
                        <Row className="g-2">
                          {filteredCatalogItems.map(item => (
                            <Col md={4} sm={6} key={item.id}>
                              <div 
                                className="p-2 border rounded bg-white shadow-sm cursor-pointer h-100 d-flex flex-column justify-content-between position-relative"
                                style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                                onClick={() => handleCardItemSelect(item)}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0ab39c'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#dee2e6'}
                              >
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="fs-11 text-muted fw-bold font-monospace">{item.code}</span>
                                    <Badge color="light" className="text-dark fs-10">{item.uom}</Badge>
                                  </div>
                                  <h6 className="fs-13 mb-1 text-truncate" title={item.name}>{item.name}</h6>
                                </div>
                                <div className="mt-2 pt-1 border-top border-light">
                                  <span className="fs-11 text-muted d-block">est. cost</span>
                                  <span className="fs-12 fw-bold text-dark">KES {item.estCost.toFixed(2)}</span>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <div className="text-center p-5 text-muted fs-13">
                          <i className="ri-inbox-line display-6 text-muted mb-2"></i>
                          <p className="mb-0">All matching items have been added to receipt lines.</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Right Panel: Receipt Lines Sidebar */}
              <Col lg={5}>
                <Card className="shadow-none border h-100 mb-0 d-flex flex-column">
                  <CardBody className="p-3 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center mb-3">
                        <i className="ri-file-list-3-line fs-16 me-2 text-primary"></i>
                        <h5 className="fs-14 mb-0 fw-bold">Receipt lines</h5>
                      </div>

                      <div className="overflow-auto" style={{ maxHeight: '250px' }}>
                        {lineItems.length > 0 ? (
                          <div className="d-flex flex-column gap-2">
                            {lineItems.map((line) => (
                              <div key={line.stockItemId} className="p-2 border rounded bg-white position-relative">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div>
                                    <h6 className="fs-12 mb-0 fw-bold">{line.stockItemName}</h6>
                                    <span className="fs-11 text-muted font-monospace">{line.stockItemCode}</span>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="btn btn-icon btn-sm btn-ghost-danger p-0"
                                    onClick={() => handleRemoveLineItem(line.stockItemId)}
                                  >
                                    <i className="ri-close-line fs-16"></i>
                                  </button>
                                </div>

                                <Row className="g-2 align-items-center mt-1">
                                  <Col xs={6}>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fs-11">Qty</span>
                                      <Input 
                                        type="number"
                                        min="1"
                                        bsSize="sm"
                                        value={line.quantity}
                                        onChange={(e) => handleQuantityOrPriceChange(line.stockItemId, 'quantity', parseFloat(e.target.value) || 0)}
                                      />
                                      <span className="input-group-text fs-10">{line.uom}</span>
                                    </div>
                                  </Col>
                                  <Col xs={6}>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fs-11">KES</span>
                                      <Input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        bsSize="sm"
                                        value={line.unitPrice}
                                        onChange={(e) => handleQuantityOrPriceChange(line.stockItemId, 'unitPrice', parseFloat(e.target.value) || 0)}
                                      />
                                    </div>
                                  </Col>
                                </Row>
                                <div className="text-end mt-1">
                                  <span className="fs-11 text-muted">Subtotal: </span>
                                  <span className="fs-12 fw-bold text-success">KES {line.lineTotal.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-5 text-muted fs-13 border border-dashed rounded bg-white">
                            <p className="mb-0">Search an item to add a receipt line.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Totals & Submit Footer */}
                    <div className="mt-3 pt-3 border-top">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fs-13 fw-semibold text-muted">Total cost</span>
                        <h4 className="mb-0 fw-bold text-dark">
                          KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                      </div>

                      <Button 
                        type="submit" 
                        color="secondary" 
                        className="w-100 fw-semibold" 
                        disabled={isPosting || lineItems.length === 0}
                      >
                        {isPosting ? <Spinner size="sm" /> : 'Post goods receipt'}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light p-3 border-top">
            <Button color="light" onClick={() => setModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

export default GoodsReceipt;