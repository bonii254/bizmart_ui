import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Form, FormGroup, Label, Input, Spinner, Alert, 
  Row, Col, Card, CardHeader, CardBody, Container, Badge 
} from 'reactstrap';
import { useCashWithdrawals, useCashWithdrawalMutation, useBanks, useOperators } from '../../Components/Hooks/useCashWithdrawal';
import { CashWithdrawalHeader } from '../../types/cashWithdrawal';
import TablePagination from "../TablePagination";

const CashWithdrawal = () => {
  const [pageIndex, setPageIndex] = useState(0); 
  const [pageSize, setPageSize] = useState(10);

  // Left Sidebar Filter States
  const [selectedWithdrawer, setSelectedWithdrawer] = useState('ALL');
  const [dateFilterMode, setDateFilterMode] = useState('TODAY'); // TODAY, LAST_DAYS, LAST_WEEK, LAST_MONTH, ALL
  const [customDaysCount, setCustomDaysCount] = useState(5);
  const [minAmountFilter, setMinAmountFilter] = useState('');

  // Form States (New Withdrawal)
  const [bankId, setBankId] = useState('');
  const [operatorId, setOperatorId] = useState('OP-001'); // Default CASHIER01
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: banksData } = useBanks();
  const { data: operatorsData } = useOperators();
  const { data: withdrawalData, isLoading } = useCashWithdrawals();
  const { createWithdrawal, isPosting } = useCashWithdrawalMutation();

  const availableTillBalance = 13500.00; // Mock current till balance

  // Advanced Filtering Logic matching user requirements
  const filteredWithdrawals = useMemo(() => {
    const list = withdrawalData?.cashWithdrawals || [];
    const now = new Date();

    return list.filter(item => {
      // 1. Filter by Withdrawer / Operator
      if (selectedWithdrawer !== 'ALL' && item.operatorId !== selectedWithdrawer) {
        return false;
      }

      // 2. Filter by Date Ranges
      const itemDate = new Date(item.postedAt);
      if (dateFilterMode === 'TODAY') {
        if (itemDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilterMode === 'LAST_DAYS') {
        const pastDate = new Date();
        pastDate.setDate(now.getDate() - Number(customDaysCount));
        if (itemDate < pastDate) return false;
      } else if (dateFilterMode === 'LAST_WEEK') {
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        if (itemDate < lastWeek) return false;
      } else if (dateFilterMode === 'LAST_MONTH') {
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        if (itemDate < lastMonth) return false;
      }

      // 3. Filter by Amount Exceeding Range
      if (minAmountFilter !== '' && !isNaN(Number(minAmountFilter))) {
        if (item.amount < Number(minAmountFilter)) return false;
      }

      return true;
    });
  }, [withdrawalData, selectedWithdrawer, dateFilterMode, customDaysCount, minAmountFilter]);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredWithdrawals.slice(start, start + pageSize);
  }, [filteredWithdrawals, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredWithdrawals.length / pageSize);

  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => { setPageSize(size); setPageIndex(0); },
    previousPage: () => setPageIndex(prev => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex(prev => Math.min(prev + 1, totalPages - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < totalPages - 1,
    getPageCount: () => totalPages || 1,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: filteredWithdrawals }),
  };

  const handleThermalPrint = (item: CashWithdrawalHeader) => {
    const win = window.open('', '_blank', 'width=380,height=550');
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>Cash Withdrawal - ${item.documentNumber}</title></head>
        <body style="font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto;">
          <div style="text-align:center; font-weight:bold;">RETAIL ENTERPRISE SYSTEM</div>
          <div style="text-align:center;">CASH WITHDRAWAL VOUCHER</div>
          <hr/>
          <div>Doc #: <b>${item.documentNumber}</b></div>
          <div>Bank: ${item.bankName || 'KCB Bank'}</div>
          <div>Operator: ${item.operatorName || 'CASHIER01'}</div>
          <div>Date: ${new Date(item.postedAt).toLocaleString()}</div>
          <hr/>
          <div>Reason: ${item.reason}</div>
          <div style="font-size:14px; font-weight:bold; margin-top:5px;">Amount: KES ${item.amount.toFixed(2)}</div>
          <hr/>
          <div style="text-align:center;">*** AUTHORIZED TILL DISBURSAL ***</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankId) {
      setFormError("Please select a destination bank account.");
      return;
    }
    if (typeof amount !== 'number' || amount <= 0) {
      setFormError("Please enter a valid withdrawal amount.");
      return;
    }
    if (amount > availableTillBalance) {
      setFormError("Withdrawal amount exceeds available till balance.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Please specify a reason for the cash withdrawal.");
      return;
    }

    try {
      setFormError(null);
      await createWithdrawal({
        bankId,
        operatorId,
        amount,
        reason
      });
      setAmount('');
      setReason('');
      setBankId('');
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to submit withdrawal.");
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Top Header Banner */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="text-muted fs-12 fw-bold text-uppercase">TILL SESSION · CASHIER01</span>
              <h3 className="fw-bold mb-0">Cash Withdrawal Management</h3>
            </div>
            <div className="text-end">
              <span className="text-muted fs-12 d-block">Available in till</span>
              <h4 className="fw-bold text-success mb-0">KES {availableTillBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
            </div>
          </div>

          <Row>
            {/* Left Column: Filters & New Withdrawal Form */}
            <Col lg={4}>
              {/* Filters Card */}
              <Card className="border mb-3 shadow-none">
                <CardHeader className="bg-light py-2">
                  <h6 className="mb-0 fw-bold fs-13"><i className="ri-filter-3-line me-1"></i> Withdrawal Filters</h6>
                </CardHeader>
                <CardBody className="p-3">
                  <FormGroup className="mb-3">
                    <Label className="fs-12 fw-semibold">Withdrawer / Operator</Label>
                    <Input 
                      type="select" 
                      bsSize="sm"
                      value={selectedWithdrawer}
                      onChange={(e) => setSelectedWithdrawer(e.target.value)}
                    >
                      <option value="ALL">All Operators</option>
                      {operatorsData?.map(op => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                      ))}
                    </Input>
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Label className="fs-12 fw-semibold">Date Range</Label>
                    <Input 
                      type="select" 
                      bsSize="sm"
                      value={dateFilterMode}
                      onChange={(e) => setDateFilterMode(e.target.value)}
                    >
                      <option value="TODAY">Today's Withdrawals</option>
                      <option value="LAST_DAYS">Last Specified Number of Days</option>
                      <option value="LAST_WEEK">Last Week</option>
                      <option value="LAST_MONTH">Last Month</option>
                      <option value="ALL">All Time</option>
                    </Input>
                  </FormGroup>

                  {dateFilterMode === 'LAST_DAYS' && (
                    <FormGroup className="mb-3">
                      <Label className="fs-12 fw-semibold">Number of Days</Label>
                      <Input 
                        type="number" 
                        bsSize="sm"
                        min="1"
                        value={customDaysCount}
                        onChange={(e) => setCustomDaysCount(Number(e.target.value))}
                      />
                    </FormGroup>
                  )}

                  <FormGroup className="mb-0">
                    <Label className="fs-12 fw-semibold">Minimum Amount Exceeding (KES)</Label>
                    <Input 
                      type="number" 
                      bsSize="sm"
                      placeholder="e.g. 1000"
                      value={minAmountFilter}
                      onChange={(e) => setMinAmountFilter(e.target.value)}
                    />
                  </FormGroup>
                </CardBody>
              </Card>

              {/* New Withdrawal Form Card */}
              <Card className="border shadow-none">
                <CardHeader className="bg-light py-2 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold fs-13">New withdrawal</h6>
                  <Badge color="info" className="fs-11">{operatorId}</Badge>
                </CardHeader>
                <CardBody className="p-3">
                  {formError && <Alert color="danger" className="py-2 fs-12 mb-3">{formError}</Alert>}
                  <Form onSubmit={handleSubmit}>
                    <FormGroup className="mb-3">
                      <Label className="fs-12 fw-semibold">Destination bank</Label>
                      <Input 
                        type="select"
                        bsSize="sm"
                        value={bankId}
                        onChange={(e) => setBankId(e.target.value)}
                      >
                        <option value="">-- Select Destination Bank --</option>
                        {banksData?.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.name}</option>
                        ))}
                      </Input>
                    </FormGroup>

                    <FormGroup className="mb-3">
                      <Label className="fs-12 fw-semibold">Amount (KES)</Label>
                      <Input 
                        type="number"
                        bsSize="sm"
                        min="1"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                      />
                    </FormGroup>

                    <FormGroup className="mb-3">
                      <Label className="fs-12 fw-semibold">Reason</Label>
                      <Input 
                        type="text"
                        bsSize="sm"
                        placeholder="e.g. Bank deposit run"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </FormGroup>

                    <Button 
                      type="submit" 
                      color="dark" 
                      className="w-100 fw-semibold fs-13" 
                      disabled={isPosting}
                    >
                      {isPosting ? <Spinner size="sm" /> : 'Post withdrawal'}
                    </Button>
                  </Form>
                </CardBody>
              </Card>
            </Col>

            {/* Right Column: Withdrawals Log Listing */}
            <Col lg={8}>
              <Card className="border shadow-none h-100">
                <CardHeader className="bg-light py-2 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold fs-13">Withdrawal Transactions List</h6>
                  <span className="text-muted fs-12">{filteredWithdrawals.length} recorded</span>
                </CardHeader>
                <CardBody className="p-3">
                  <Table hover responsive className="align-middle table-nowrap mb-3">
                    <thead className="table-light">
                      <tr>
                        <th>Document #</th>
                        <th>Bank / Operator</th>
                        <th>Amount</th>
                        <th>Reason</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={5} className="text-center p-4"><Spinner color="primary" /></td></tr>
                      ) : paginatedRows.length > 0 ? (
                        paginatedRows.map((item: CashWithdrawalHeader) => (
                          <tr key={item.documentId}>
                            <td>
                              <span className="fw-bold text-dark">{item.documentNumber}</span>
                              <div className="text-muted fs-11">{new Date(item.postedAt).toLocaleDateString()}</div>
                            </td>
                            <td>
                              <div className="fw-semibold fs-12">{item.bankName || 'KCB Bank'}</div>
                              <Badge color="soft-secondary" className="text-dark fs-10">{item.operatorName || 'CASHIER01'}</Badge>
                            </td>
                            <td>
                              <span className="fw-bold text-danger fs-13">
                                KES {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td>
                              <span className="fs-12 text-muted text-truncate d-block" style={{ maxWidth: '160px' }} title={item.reason}>
                                {item.reason}
                              </span>
                            </td>
                            <td className="text-end">
                              <Button 
                                size="sm" 
                                color="soft-secondary" 
                                onClick={() => handleThermalPrint(item)}
                              >
                                <i className="ri-printer-line"></i> Print
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="text-center p-4 text-muted fs-13">No cash withdrawals match the selected filters.</td></tr>
                      )}
                    </tbody>
                  </Table>
                  <TablePagination table={tableInstance} />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CashWithdrawal;