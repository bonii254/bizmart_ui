import React, { useState, useMemo } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Input,
  InputGroup,
  InputGroupText,
  Spinner,
} from 'reactstrap';
import dayjs from 'dayjs';

// POS Hooks and Types
import { useSalesTransactions } from '../../Components/Hooks/usePOS';
import { SalesTransaction, SalesTransactionQueryParams } from '../../types/POS';

const RecentSalesTransactions: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const queryParams = useMemo<SalesTransactionQueryParams>(() => ({}), []);

  const { data: responseData, isLoading, isFetching, refetch } = useSalesTransactions(queryParams);

  // Parse raw API response array
  const rawTransactions = useMemo<SalesTransaction[]>(() => {
    const raw = responseData as any;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }, [responseData]);

  // Filter and limit view strictly to top 5 latest transactions
  const latestTransactions = useMemo(() => {
    return rawTransactions
      .filter((item) => {
        const matchesSearch =
          !searchQuery ||
          item.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.warehouse_code?.toLowerCase().includes(searchQuery.toLowerCase());

        const total = item.total || 0;
        const paid = item.paid || 0;
        let matchesStatus = true;

        if (selectedStatus === 'PAID') {
          matchesStatus = paid >= total;
        } else if (selectedStatus === 'PARTIAL') {
          matchesStatus = paid > 0 && paid < total;
        } else if (selectedStatus === 'UNPAID') {
          matchesStatus = paid === 0;
        }

        return matchesSearch && matchesStatus;
      })
      .slice(0, 10);
  }, [rawTransactions, searchQuery, selectedStatus]);

  const getStatusBadge = (item: SalesTransaction) => {
    const total = item.total || 0;
    const paid = item.paid || 0;

    if (paid >= total) {
      return {
        label: 'PAID',
        badgeStyle: 'bg-success-subtle text-success border border-success-subtle',
      };
    }
    if (paid > 0 && paid < total) {
      return {
        label: 'PARTIAL',
        badgeStyle: 'bg-warning-subtle text-warning border border-warning-subtle',
      };
    }
    return {
      label: 'UNPAID',
      badgeStyle: 'bg-danger-subtle text-danger border border-danger-subtle',
    };
  };

  const formatCurrency = (val: number) =>
    (val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Col xl={12}>
      <Card className="card-height-100 border-0 shadow-sm">
        {/* Velzon Header Toolbar */}
        <CardHeader className="align-items-center d-flex py-2 px-3 bg-transparent border-bottom">
          <div className="flex-grow-1">
            <h5 className="card-title mb-0 fs-14 fw-semibold">
              Recent Sales
            </h5>
            <span className="text-muted fs-11">
              Latest 10 sales transactions
            </span>
          </div>

          <div className="flex-shrink-0 d-flex align-items-center gap-2">
            {/* Quick Search */}
            <InputGroup className="input-group-sm" style={{ width: '160px' }}>
              <InputGroupText className="bg-light border-end-0 py-1 px-2">
                <i className="ri-search-line text-muted fs-12"></i>
              </InputGroupText>
              <Input
                type="text"
                placeholder="Search invoice..."
                className="bg-light border-start-0 fs-12 py-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>

            {/* Status Filter */}
            <UncontrolledDropdown>
              <DropdownToggle
                tag="button"
                className="btn btn-sm btn-soft-secondary d-flex align-items-center gap-1 py-1 px-2 fs-12"
              >
                <i className="ri-filter-3-line"></i>
                <span>{selectedStatus === 'ALL' ? 'Status' : selectedStatus}</span>
                <i className="ri-arrow-down-s-line"></i>
              </DropdownToggle>
              <DropdownMenu end className="dropdown-menu-end shadow-sm fs-12">
                <DropdownItem onClick={() => setSelectedStatus('ALL')}>
                  All Statuses
                </DropdownItem>
                <DropdownItem onClick={() => setSelectedStatus('PAID')}>
                  Paid
                </DropdownItem>
                <DropdownItem onClick={() => setSelectedStatus('PARTIAL')}>
                  Partial
                </DropdownItem>
                <DropdownItem onClick={() => setSelectedStatus('UNPAID')}>
                  Unpaid
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            {/* Refresh Button */}
            <button
              type="button"
              className="btn btn-sm btn-soft-primary btn-icon py-1"
              onClick={() => refetch()}
              title="Refresh Data"
              disabled={isFetching}
            >
              <i className={`ri-refresh-line fs-12 ${isFetching ? 'spin' : ''}`}></i>
            </button>
          </div>
        </CardHeader>

        {/* High-Density Compact Table */}
        <CardBody className="p-0">
          <div className="table-responsive">
            <table className="table table-hover table-sm table-nowrap align-middle mb-0">
              <thead className="table-light fs-11 text-muted text-uppercase">
                <tr>
                  <th scope="col" className="ps-3 py-2">
                    Invoice
                  </th>
                  <th scope="col" className="py-2">
                    Warehouse
                  </th>
                  <th scope="col" className="py-2">
                    Date & Time
                  </th>
                  <th scope="col" className="py-2 text-end">
                    Total Amount
                  </th>
                  <th scope="col" className="py-2 text-end">
                    Paid Amount
                  </th>
                  <th scope="col" className="pe-3 py-2 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="fs-12">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      <Spinner size="sm" color="primary" className="me-2" />
                      Loading transactions...
                    </td>
                  </tr>
                ) : latestTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  latestTransactions.map((tx) => {
                    const status = getStatusBadge(tx);
                    return (
                      <tr key={tx.invoice_id || tx.invoice_number}>
                        {/* Invoice & Warehouse Stacked */}
                        <td className="ps-3 py-2">
                          <div className="d-flex align-items-center">
                            <div className="avatar-xs bg-light rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0 text-primary fw-bold fs-11">
                              <i className="ri-receipt-line"></i>
                            </div>
                            <div>
                              <h6 className="fs-12 mb-0 fw-semibold text-dark">
                                {tx.invoice_number || 'N/A'}
                              </h6>
                            </div>
                          </div>
                        </td>
                        <td className="py-2">
                          <span className="fs-12 text-muted">
                            {tx.warehouse_code || 'N/A'}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-2 text-muted fs-11">
                          {tx.sold_at && dayjs(tx.sold_at).isValid()
                            ? dayjs(tx.sold_at).format('DD/MM/YYYY HH:mm')
                            : 'N/A'}
                        </td>

                        {/* Total Amount */}
                        <td className="py-2 text-end fw-semibold text-dark">
                          <span className="fs-11 text-muted me-1">Ksh</span>
                          {formatCurrency(tx.total)}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-2 text-end">
                          <span className="fs-11 text-muted me-1">Ksh</span>
                          <span
                            className={
                              tx.paid >= tx.total
                                ? 'text-success fw-medium'
                                : 'text-danger fw-medium'
                            }
                          >
                            {formatCurrency(tx.paid)}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="pe-3 py-2 text-center">
                          <span
                            className={`badge ${status.badgeStyle} px-2 py-1 fs-10 rounded-pill`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
};

export default RecentSalesTransactions;