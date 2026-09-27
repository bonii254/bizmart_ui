import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag, Select } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { SupplierStatementItem } from '../../../types/reports2';

const { Text } = Typography;

interface FilterState {
  searchQuery: string;
  transactionType: string | null;
}

interface Props {
  data?: SupplierStatementItem[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: SupplierStatementItem[]) => void;
}

const fmt = (v: number) =>
  (v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SupplierStatementTable: React.FC<Props> = ({
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
        item.document_number?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesType =
        !filters.transactionType ||
        item.transaction_type?.toLowerCase() === filters.transactionType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [data, filters]);

  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  // Compute total debits, credits, and final running balance
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

  const closingBalance =
    filteredData.length > 0
      ? filteredData[filteredData.length - 1].running_balance
      : 0;

  const columns: ColumnsType<SupplierStatementItem> = [
    {
      title: 'Posted At',
      dataIndex: 'posted_at',
      key: 'posted_at',
      width: 150,
      fixed: 'left',
      render: (val) => (
        <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A'}
        </span>
      ),
      sorter: (a, b) => dayjs(a.posted_at).unix() - dayjs(b.posted_at).unix(),
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 140,
      align: 'center',
      render: (type) => {
        const normalized = (type || '').toLowerCase();
        if (normalized === 'goods_receipt' || normalized === 'grn') {
          return <Tag color="cyan" style={{ fontSize: '11px', margin: 0 }}>GOODS RECEIPT</Tag>;
        }
        if (normalized === 'payment' || normalized === 'disbursement') {
          return <Tag color="green" style={{ fontSize: '11px', margin: 0 }}>PAYMENT</Tag>;
        }
        if (normalized === 'debit_note') {
          return <Tag color="orange" style={{ fontSize: '11px', margin: 0 }}>DEBIT NOTE</Tag>;
        }
        if (normalized === 'credit_note') {
          return <Tag color="purple" style={{ fontSize: '11px', margin: 0 }}>CREDIT NOTE</Tag>;
        }
        return <Tag color="default" style={{ fontSize: '11px', margin: 0 }}>{type?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Document No.',
      dataIndex: 'document_number',
      key: 'document_number',
      width: 150,
      render: (text) => (
        <Text strong style={{ fontSize: '12px', color: '#1677ff' }}>
          {text || 'N/A'}
        </Text>
      ),
      sorter: (a, b) => (a.document_number || '').localeCompare(b.document_number || ''),
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
      title: 'Running Balance (Ksh)',
      dataIndex: 'running_balance',
      key: 'running_balance',
      width: 160,
      align: 'right',
      fixed: 'right',
      render: (val) => (
        <Text
          strong
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: val > 0 ? '#cf1322' : val < 0 ? '#3f8600' : '#262626',
          }}
        >
          {fmt(val)}
        </Text>
      ),
    },
  ];

  return (
    <div>
      {/* Search & Filter Strip */}
      <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '10px 14px' }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={14} md={12}>
            <Input
              placeholder="Search Document Number (e.g. GRN0000001)..."
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
                { label: 'Goods Receipts (Credits)', value: 'goods_receipt' },
                { label: 'Payments (Debits)', value: 'payment' },
                { label: 'Debit Notes', value: 'debit_note' },
                { label: 'Credit Notes', value: 'credit_note' },
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
              <Col xs={24} md={6}>
                <Text strong style={{ fontSize: '13px', color: '#1f1f1f' }}>
                  Statement Totals ({filteredData.length} Records)
                </Text>
              </Col>

              <Col xs={24} md={18}>
                <Row gutter={[16, 4]} justify="end">
                  <Col xs={12} sm={8} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Debits (Payments)
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#cf1322' }}>
                      Ksh {fmt(totals.totalDebit)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={8} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Credits (Goods)
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#3f8600' }}>
                      Ksh {fmt(totals.totalCredit)}
                    </Text>
                  </Col>

                  <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Closing Balance
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: closingBalance > 0 ? '#cf1322' : closingBalance < 0 ? '#3f8600' : '#262626',
                      }}
                    >
                      Ksh {fmt(closingBalance)}
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

export default SupplierStatementTable;