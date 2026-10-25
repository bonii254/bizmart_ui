import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag, Select } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { BankTransaction } from '../../types/bank';

const { Text } = Typography;

interface FilterState {
  searchQuery: string;
  transactionType: string | null;
}

interface Props {
  data?: BankTransaction[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: BankTransaction[]) => void;
}

const fmt = (v: number) =>
  (v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BankStatementTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    transactionType: null,
  });

  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

  // Filter statement items
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      const matchesSearch =
        !filters.searchQuery ||
        item.documentNumber?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.reference?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesType =
        !filters.transactionType ||
        item.transactionType?.toLowerCase() === filters.transactionType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [data, filters]);

  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  // Compute total debits and credits
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.totalDebit += curr.debit || 0;
        acc.totalCredit += curr.credit || 0;
        return acc;
      },
      { totalDebit: 0, totalCredit: 0 }
    );
  }, [filteredData]);

  const columns: ColumnsType<BankTransaction> = [
    {
      title: 'Posted At',
      dataIndex: 'postedAt',
      key: 'postedAt',
      width: 150,
      fixed: 'left',
      render: (val) => (
        <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A'}
        </span>
      ),
      sorter: (a, b) => dayjs(a.postedAt).unix() - dayjs(b.postedAt).unix(),
    },
    {
      title: 'Type',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 140,
      align: 'center',
      render: (type) => {
        const normalized = (type || '').toLowerCase();
        if (normalized === 'customer_payment') {
          return <Tag color="green" style={{ fontSize: '11px', margin: 0 }}>CUSTOMER PAYMENT</Tag>;
        }
        if (normalized === 'withdrawal') {
          return <Tag color="volcano" style={{ fontSize: '11px', margin: 0 }}>WITHDRAWAL</Tag>;
        }
        if (normalized === 'sale_deposit') {
          return <Tag color="cyan" style={{ fontSize: '11px', margin: 0 }}>SALE DEPOSIT</Tag>;
        }
        return <Tag color="default" style={{ fontSize: '11px', margin: 0 }}>{type?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Document No.',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 140,
      render: (text) => (
        <Text strong style={{ fontSize: '12px', color: '#1677ff' }}>
          {text || 'N/A'}
        </Text>
      ),
      sorter: (a, b) => (a.documentNumber || '').localeCompare(b.documentNumber || ''),
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      width: 130,
      render: (text) => (
        <Text style={{ fontSize: '12px', color: '#595959' }}>
          {text || 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Debit (Ksh)',
      dataIndex: 'debit',
      key: 'debit',
      width: 130,
      align: 'right',
      render: (val) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px', color: val > 0 ? '#cf1322' : '#8c8c8c' }}>
          {val > 0 ? fmt(val) : '-'}
        </Text>
      ),
      sorter: (a, b) => a.debit - b.debit,
    },
    {
      title: 'Credit (Ksh)',
      dataIndex: 'credit',
      key: 'credit',
      width: 130,
      align: 'right',
      render: (val) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px', color: val > 0 ? '#3f8600' : '#8c8c8c' }}>
          {val > 0 ? fmt(val) : '-'}
        </Text>
      ),
      sorter: (a, b) => a.credit - b.credit,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethodCode',
      key: 'paymentMethodCode',
      width: 130,
      align: 'center',
      render: (code) => code ? <Tag style={{ fontSize: '11px' }}>{code}</Tag> : <Text type="secondary">-</Text>,
    },
  ];

  return (
    <div>
      {/* Search & Filter Strip */}
      <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '10px 14px' }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={14} md={12}>
            <Input
              placeholder="Search Document Number or Reference..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              allowClear
              size="small"
            />
          </Col>

          <Col xs={24} sm={10} md={8}>
            <Select
              placeholder="Transaction Type"
              style={{ width: '100%' }}
              value={filters.transactionType}
              onChange={(value) => setFilters((prev) => ({ ...prev, transactionType: value }))}
              allowClear
              options={[
                { label: 'All Types', value: '' },
                { label: 'Customer Payments', value: 'customer_payment' },
                { label: 'Withdrawals', value: 'withdrawal' },
                { label: 'Sale Deposits', value: 'sale_deposit' },
              ]}
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
          dataSource={filteredData.map((item, idx) => ({ ...item, key: idx }))}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            responsive: true,
            size: 'small',
            pageSizeOptions: ['10', '15', '25', '50', '100'],
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
            style: { padding: '8px 12px', margin: 0 },
          }}
          scroll={{ x: 800 }}
          size="small"
          bordered
        />

        {/* Responsive Grand Totals Bar */}
        {filteredData.length > 0 && (
          <div
            style={{
              borderTop: '2px solid #1890ff',
              backgroundColor: '#e6f7ff',
              padding: '10px 16px',
            }}
          >
            <Row gutter={[12, 8]} align="middle" justify="space-between">
              <Col xs={24} md={8}>
                <Text strong style={{ fontSize: '13px', color: '#1f1f1f' }}>
                  Transaction Totals ({filteredData.length} Records)
                </Text>
              </Col>

              <Col xs={24} md={16}>
                <Row gutter={[16, 4]} justify="end">
                  <Col xs={12} sm={12} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Debits
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#cf1322' }}>
                      Ksh {fmt(totals.totalDebit)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={12} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Credits
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#3f8600' }}>
                      Ksh {fmt(totals.totalCredit)}
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

export default BankStatementTable;