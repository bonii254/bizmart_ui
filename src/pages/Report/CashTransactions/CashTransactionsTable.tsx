import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag, Select } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  WalletOutlined,
  UserOutlined,
  BankOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { CashTransaction } from '../../../types/reports2';

const { Text } = Typography;

interface InternalFilterState {
  searchQuery: string;
  paymentMethodCode: string | null;
  transactionType: string | null;
}

interface Props {
  data?: CashTransaction[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: CashTransaction[]) => void;
}

const CashTransactionsTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [filters, setFilters] = useState<InternalFilterState>({
    searchQuery: '',
    paymentMethodCode: null,
    transactionType: null,
  });

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Dynamic payment method filter options
  const paymentMethodOptions = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const methods = Array.from(
      new Set(data.map((item) => item.payment_method_code).filter(Boolean))
    );
    return methods.map((m) => ({ label: m.toUpperCase(), value: m }));
  }, [data]);

  // Dynamic transaction type filter options
  const transactionTypeOptions = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const types = Array.from(
      new Set(data.map((item) => item.transaction_type).filter(Boolean))
    );
    return types.map((t) => ({ label: t.toUpperCase().replace('_', ' '), value: t }));
  }, [data]);

  // Local filter calculation
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      const matchesSearch =
        !filters.searchQuery ||
        item.document_number?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.source_document_number?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.operator_name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.reference?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.bank_name?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesMethod =
        !filters.paymentMethodCode ||
        (item.payment_method_code || '').toLowerCase() === filters.paymentMethodCode.toLowerCase();

      const matchesType =
        !filters.transactionType ||
        (item.transaction_type || '').toLowerCase() === filters.transactionType.toLowerCase();

      return matchesSearch && matchesMethod && matchesType;
    });
  }, [data, filters]);

  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  // Dynamic Grand Totals recalculation
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        const amt = curr.amount || 0;
        acc.netTotal += amt;

        const method = (curr.payment_method_code || '').toUpperCase();
        if (method === 'CASH') {
          acc.cashTotal += amt;
          acc.cashCount += 1;
        } else if (method === 'MOBILE' || method === 'MPESA') {
          acc.mobileTotal += amt;
          acc.mobileCount += 1;
        } else {
          acc.otherTotal += amt;
        }

        return acc;
      },
      { netTotal: 0, cashTotal: 0, mobileTotal: 0, otherTotal: 0, cashCount: 0, mobileCount: 0 }
    );
  }, [filteredData]);

  const fmt = (v: number) =>
    (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const renderPaymentTag = (code: string) => {
    const formatted = (code || 'N/A').toUpperCase();
    switch (formatted) {
      case 'CASH':
        return <Tag color="green" style={{ fontSize: '11px', margin: 0 }}>CASH</Tag>;
      case 'MOBILE':
      case 'MPESA':
        return <Tag color="purple" style={{ fontSize: '11px', margin: 0 }}>MOBILE</Tag>;
      case 'BANK':
      case 'EFT':
        return <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>BANK</Tag>;
      default:
        return <Tag color="geekblue" style={{ fontSize: '11px', margin: 0 }}>{formatted}</Tag>;
    }
  };

  const renderTransactionTag = (type: string) => {
    const formatted = (type || 'N/A').toLowerCase();
    switch (formatted) {
      case 'sale_deposit':
        return <Tag color="cyan" style={{ fontSize: '11px', margin: 0 }}>SALE DEPOSIT</Tag>;
      case 'withdrawal':
        return <Tag color="volcano" style={{ fontSize: '11px', margin: 0 }}>WITHDRAWAL</Tag>;
      default:
        return <Tag color="gold" style={{ fontSize: '11px', margin: 0 }}>{type.toUpperCase().replace('_', ' ')}</Tag>;
    }
  };

  const columns: ColumnsType<CashTransaction> = [
    {
      title: 'Posted At',
      dataIndex: 'posted_at',
      key: 'posted_at',
      width: 140,
      fixed: 'left',
      render: (val) => (
        <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A'}
        </span>
      ),
      sorter: (a, b) => dayjs(a.posted_at).unix() - dayjs(b.posted_at).unix(),
    },
    {
      title: 'Doc Number',
      dataIndex: 'document_number',
      key: 'document_number',
      width: 130,
      render: (text) => <Text strong style={{ fontSize: '12px', color: '#096dd9' }}>{text || 'N/A'}</Text>,
      sorter: (a, b) => (a.document_number || '').localeCompare(b.document_number || ''),
    },
    {
      title: 'Source Doc',
      dataIndex: 'source_document_number',
      key: 'source_document_number',
      width: 130,
      render: (text) => <Text type="secondary" style={{ fontSize: '12px' }}>{text || 'N/A'}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 130,
      render: (type) => renderTransactionTag(type),
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method_code',
      key: 'payment_method_code',
      width: 120,
      render: (code) => renderPaymentTag(code),
    },
    {
      title: 'Bank',
      dataIndex: 'bank_name',
      key: 'bank_name',
      width: 140,
      render: (val) => (
        <span style={{ fontSize: '12px' }}>
          {val ? <><BankOutlined style={{ marginRight: 4 }} />{val}</> : '-'}
        </span>
      ),
    },
    {
      title: 'Operator',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 140,
      render: (val) => (
        <span style={{ fontSize: '12px' }}>
          <UserOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
          {val || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      width: 150,
      ellipsis: true,
      render: (val) => <Text type="secondary" style={{ fontSize: '12px' }}>{val || '-'}</Text>,
    },
    {
      title: 'Amount (Ksh)',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      fixed: 'right',
      render: (val) => {
        const amt = val || 0;
        return (
          <Text
            strong
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: amt >= 0 ? '#3f8600' : '#cf1322',
            }}
          >
            {fmt(amt)}
          </Text>
        );
      },
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
    },
  ];

  return (
    <div>
      {/* Filter Toolbar */}
      <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '10px 14px' }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={10} md={10} lg={10}>
            <Input
              placeholder="Search Doc No, Ref, Operator..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              allowClear
              size="small"
            />
          </Col>

          <Col xs={12} sm={7} md={7} lg={7}>
            <Select
              placeholder="Payment Method"
              style={{ width: '100%' }}
              value={filters.paymentMethodCode}
              onChange={(value) => setFilters((prev) => ({ ...prev, paymentMethodCode: value }))}
              allowClear
              options={paymentMethodOptions}
              suffixIcon={<WalletOutlined />}
              size="small"
              getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            />
          </Col>

          <Col xs={12} sm={7} md={7} lg={7}>
            <Select
              placeholder="Transaction Type"
              style={{ width: '100%' }}
              value={filters.transactionType}
              onChange={(value) => setFilters((prev) => ({ ...prev, transactionType: value }))}
              allowClear
              options={transactionTypeOptions}
              suffixIcon={<FilterOutlined />}
              size="small"
              getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Table Card */}
      <Card size="small" className="shadow-sm border-0" bodyStyle={{ padding: 0 }} loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record, idx) => record.cash_transaction_id || `cash-${idx}`}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            responsive: true,
            size: 'small',
            pageSizeOptions: ['10', '25', '50', '100'],
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
            style: { padding: '8px 12px', margin: 0 },
          }}
          scroll={{ x: 1150 }}
          size="small"
          bordered
        />

        {/* Dynamic Grand Totals Footer */}
        {filteredData.length > 0 && (
          <div
            style={{
              borderTop: '2px solid #1890ff',
              backgroundColor: '#e6f7ff',
              padding: '10px 16px',
            }}
          >
            <Row gutter={[12, 8]} align="middle" justify="space-between">
              <Col xs={24} md={5}>
                <Text strong style={{ fontSize: '13px', color: '#1f1f1f' }}>
                  Grand Totals ({filteredData.length} Records)
                </Text>
              </Col>

              <Col xs={24} md={19}>
                <Row gutter={[16, 4]} justify="end">
                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Cash Total ({totals.cashCount})
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#3f8600' }}>
                      Ksh {fmt(totals.cashTotal)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Mobile Total ({totals.mobileCount})
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#722ed1' }}>
                      Ksh {fmt(totals.mobileTotal)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Net Collections
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: totals.netTotal < 0 ? '#cf1322' : totals.netTotal > 0 ? '#3f8600' : '#1f1f1f',
                      }}
                    >
                      Ksh {fmt(totals.netTotal)}
                    </Text>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CashTransactionsTable;