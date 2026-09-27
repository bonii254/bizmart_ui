import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag, Select, Space } from 'antd';
import { SearchOutlined, CreditCardOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { SalesTransaction } from '../../types/POS';

const { Text } = Typography;

interface InternalFilterState {
  searchQuery: string;
  paymentMethod: string | null;
  paymentStatus: 'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID';
}

interface Props {
  data?: SalesTransaction[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: SalesTransaction[]) => void;
}

const SalesTransactionsTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [filters, setFilters] = useState<InternalFilterState>({
    searchQuery: '',
    paymentMethod: null,
    paymentStatus: 'ALL',
  });

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const paymentMethodOptions = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const methods = Array.from(new Set(data.map((item) => item.payment_method_code).filter(Boolean)));
    return methods.map((m) => ({ label: m, value: m }));
  }, [data]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      const matchesSearch =
        !filters.searchQuery ||
        item.invoice_number?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.customer_name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.payment_reference?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.warehouse_code?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesMethod =
        !filters.paymentMethod || item.payment_method_code === filters.paymentMethod;

      const balance = item.total - item.paid;
      let matchesStatus = true;

      if (filters.paymentStatus === 'PAID') {
        matchesStatus = item.paid >= item.total;
      } else if (filters.paymentStatus === 'PARTIAL') {
        matchesStatus = item.paid > 0 && item.paid < item.total;
      } else if (filters.paymentStatus === 'UNPAID') {
        matchesStatus = item.paid === 0;
      }

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [data, filters]);

  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.totalSales += curr.total || 0;
        acc.totalPaid += curr.paid || 0;
        acc.totalBalance += (curr.total || 0) - (curr.paid || 0);
        return acc;
      },
      { totalSales: 0, totalPaid: 0, totalBalance: 0 }
    );
  }, [filteredData]);

  const fmt = (v: number) =>
    (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const columns: ColumnsType<SalesTransaction> = [
    {
      title: 'Invoice No.',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      width: 130,
      fixed: 'left',
      render: (text) => <Text strong style={{ fontSize: '12px' }}>{text || 'N/A'}</Text>,
      sorter: (a, b) => (a.invoice_number || '').localeCompare(b.invoice_number || ''),
    },
    {
      title: 'Sold At',
      dataIndex: 'sold_at',
      key: 'sold_at',
      width: 140,
      render: (val) => (
        <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A'}
        </span>
      ),
      sorter: (a, b) => dayjs(a.sold_at).unix() - dayjs(b.sold_at).unix(),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 160,
      ellipsis: true,
      render: (val) => <span style={{ fontSize: '12px' }}>{val || 'N/A'}</span>,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_code',
      key: 'warehouse_code',
      width: 110,
      render: (val) => <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>{val || 'N/A'}</Tag>,
    },
    {
      title: 'Operator',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 130,
      ellipsis: true,
      render: (val) => <span style={{ fontSize: '12px' }}>{val || 'N/A'}</span>,
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method_code',
      key: 'payment_method_code',
      width: 160,
      render: (method, record) => {
        const color = method === 'CASH' ? 'green' : method === 'MOBILE' ? 'purple' : 'orange';
        return (
          <Space direction="horizontal" size={0}>
            <Tag color={color} style={{ fontSize: '11px', margin: 0 }}>{method || 'N/A'}</Tag>
            {record.payment_reference && record.payment_reference !== 'CASH' && (
              <Text type="secondary" style={{ fontSize: '10px' }} ellipsis={{ tooltip: record.payment_reference }}>
                {record.payment_reference}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Total (Ksh)',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{fmt(val)}</span>,
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: 'Paid (Ksh)',
      dataIndex: 'paid',
      key: 'paid',
      width: 120,
      align: 'right',
      render: (val) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px', color: val > 0 ? '#3f8600' : '#cf1322' }}>
          {fmt(val)}
        </Text>
      ),
      sorter: (a, b) => a.paid - b.paid,
    },
    {
      title: 'Balance (Ksh)',
      key: 'balance',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const balance = record.total - record.paid;
        return (
          <Text style={{ fontFamily: 'monospace', fontSize: '12px', color: balance > 0 ? '#cf1322' : '#595959', fontWeight: balance > 0 ? 'bold' : 'normal' }}>
            {fmt(balance)}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const balance = record.total - record.paid;
        if (record.paid >= record.total) {
          return <Tag color="success" style={{ fontSize: '10px', margin: 0 }}>PAID</Tag>;
        }
        if (record.paid > 0 && balance > 0) {
          return <Tag color="warning" style={{ fontSize: '10px', margin: 0 }}>PARTIAL</Tag>;
        }
        return <Tag color="error" style={{ fontSize: '10px', margin: 0 }}>UNPAID</Tag>;
      },
    },
  ];

  return (
    <div>
      {/* Search & Filter Strip */}
      <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '10px 14px' }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={10} md={10} lg={10}>
            <Input
              placeholder="Search Invoice, Customer, Ref, Warehouse..."
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
              value={filters.paymentMethod}
              onChange={(value) => setFilters((prev) => ({ ...prev, paymentMethod: value }))}
              allowClear
              options={paymentMethodOptions}
              suffixIcon={<CreditCardOutlined />}
              size="small"
              getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            />
          </Col>

          <Col xs={12} sm={7} md={7} lg={7}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              value={filters.paymentStatus}
              onChange={(value) => setFilters((prev) => ({ ...prev, paymentStatus: value }))}
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Fully Paid', value: 'PAID' },
                { label: 'Partially Paid', value: 'PARTIAL' },
                { label: 'Unpaid', value: 'UNPAID' },
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
          dataSource={filteredData}
          rowKey={(record) => record.invoice_id}
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
          scroll={{ x: 1050 }}
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
                  Grand Totals ({filteredData.length} Records)
                </Text>
              </Col>

              <Col xs={24} md={18}>
                <Row gutter={[16, 4]} justify="end">
                  <Col xs={12} sm={8} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Sales
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                      Ksh {fmt(totals.totalSales)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={8} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Paid
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#3f8600' }}>
                      Ksh {fmt(totals.totalPaid)}
                    </Text>
                  </Col>

                  <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Outstanding Balance
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: totals.totalBalance > 0 ? '#cf1322' : '#595959',
                      }}
                    >
                      Ksh {fmt(totals.totalBalance)}
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

export default SalesTransactionsTable;