import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag, Select, Space } from 'antd';
import { SearchOutlined, CreditCardOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { SalesTransaction } from '../../types/POS';

const { Title, Text } = Typography;

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
      render: (text) => <Text strong>{text || 'N/A'}</Text>,
      sorter: (a, b) => (a.invoice_number || '').localeCompare(b.invoice_number || ''),
    },
    {
      title: 'Sold At',
      dataIndex: 'sold_at',
      key: 'sold_at',
      render: (val) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A'),
      sorter: (a, b) => dayjs(a.sold_at).unix() - dayjs(b.sold_at).unix(),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (val) => val || 'N/A',
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_code',
      key: 'warehouse_code',
      render: (val) => <Tag color="blue">{val || 'N/A'}</Tag>,
    },
    {
      title: 'Operator',
      dataIndex: 'operator_name',
      key: 'operator_name',
      render: (val) => val || 'N/A',
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method_code',
      key: 'payment_method_code',
      render: (method, record) => {
        const color = method === 'CASH' ? 'green' : method === 'MOBILE' ? 'purple' : 'orange';
        return (
          <Space direction="vertical" size={0}>
            <Tag color={color}>{method || 'N/A'}</Tag>
            {record.payment_reference && record.payment_reference !== 'CASH' && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Ref: {record.payment_reference}
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
      align: 'right',
      render: (val) => fmt(val),
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: 'Paid (Ksh)',
      dataIndex: 'paid',
      key: 'paid',
      align: 'right',
      render: (val) => (
        <Text style={{ color: val > 0 ? '#3f8600' : '#cf1322' }}>{fmt(val)}</Text>
      ),
      sorter: (a, b) => a.paid - b.paid,
    },
    {
      title: 'Balance (Ksh)',
      key: 'balance',
      align: 'right',
      render: (_, record) => {
        const balance = record.total - record.paid;
        return (
          <Text style={{ color: balance > 0 ? '#cf1322' : '#595959', fontWeight: balance > 0 ? 'bold' : 'normal' }}>
            {fmt(balance)}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
      render: (_, record) => {
        const balance = record.total - record.paid;
        if (record.paid >= record.total) {
          return <Tag color="success">PAID</Tag>;
        }
        if (record.paid > 0 && balance > 0) {
          return <Tag color="warning">PARTIAL</Tag>;
        }
        return <Tag color="error">UNPAID</Tag>;
      },
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Filter Transactions</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search Invoice, Customer, Ref, Warehouse..."
              prefix={<SearchOutlined />}
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by Payment Method"
              style={{ width: '100%' }}
              value={filters.paymentMethod}
              onChange={(value) => setFilters((prev) => ({ ...prev, paymentMethod: value }))}
              allowClear
              options={paymentMethodOptions}
              suffixIcon={<CreditCardOutlined />}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              value={filters.paymentStatus}
              onChange={(value) => setFilters((prev) => ({ ...prev, paymentStatus: value }))}
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Fully Paid', value: 'PAID' },
                { label: 'Partially Paid', value: 'PARTIAL' },
                { label: 'Unpaid', value: 'UNPAID' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Card loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.invoice_id}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
          size="small"
          bordered
        />

        {filteredData.length > 0 && (
          <div
            style={{
              borderTop: '2px solid #1890ff',
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#e6f7ff',
              borderRadius: '4px',
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={5} style={{ margin: 0 }}>
                  Grand Totals ({filteredData.length} Records)
                </Title>
              </Col>
              <Col>
                <Space size="large">
                  <Text>
                    Total Amount: <Text strong>Ksh {fmt(totals.totalSales)}</Text>
                  </Text>
                  <Text>
                    Paid Amount:{' '}
                    <Text strong style={{ color: '#3f8600' }}>
                      Ksh {fmt(totals.totalPaid)}
                    </Text>
                  </Text>
                  <Text>
                    Outstanding Balance:{' '}
                    <Text strong style={{ color: totals.totalBalance > 0 ? '#cf1322' : '#595959' }}>
                      Ksh {fmt(totals.totalBalance)}
                    </Text>
                  </Text>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SalesTransactionsTable;