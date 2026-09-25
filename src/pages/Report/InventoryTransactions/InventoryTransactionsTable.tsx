import React, { useState, useMemo, useEffect } from 'react';
import { 
    Table, Typography, Card, Input, Row, Col, Tag, Select, Space 
} from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { 
    InventoryTransaction, 
    InventoryTransactionType 
} from '../../../types/reports';

const { Title, Text } = Typography;

interface InternalFilterState {
  searchQuery: string;
  transactionType: string | null;
}

interface Props {
  data?: InventoryTransaction[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: InventoryTransaction[]) => void;
}

const InventoryTransactionsTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [filters, setFilters] = useState<InternalFilterState>({
    searchQuery: '',
    transactionType: null,
  });

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const transactionTypeOptions = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const types = Array.from(new Set(data.map((item) => item.transaction_type).filter(Boolean)));
    return types.map((t) => ({
      label: t.replace('_', ' ').toUpperCase(),
      value: t,
    }));
  }, [data]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      const matchesSearch =
        !filters.searchQuery ||
        item.reference_number?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.warehouse_code?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesType =
        !filters.transactionType || item.transaction_type === filters.transactionType;

      return matchesSearch && matchesType;
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
        const qty = curr.quantity || 0;
        const unitCost = curr.unit_cost || 0;

        if (qty > 0) {
          acc.inflowQty += qty;
        } else {
          acc.outflowQty += Math.abs(qty);
        }

        acc.totalValuation += qty * unitCost;
        return acc;
      },
      { inflowQty: 0, outflowQty: 0, totalValuation: 0 }
    );
  }, [filteredData]);

  const fmt = (v: number) =>
    (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const renderTypeTag = (type: InventoryTransactionType) => {
    switch (type?.toLowerCase()) {
      case 'goods_receipt':
        return <Tag color="success">GOODS RECEIPT</Tag>;
      case 'sale':
        return <Tag color="error">SALE</Tag>;
      case 'stock_take':
        return <Tag color="processing">STOCK TAKE</Tag>;
      default:
        return <Tag color="default">{type?.replace('_', ' ').toUpperCase() || 'N/A'}</Tag>;
    }
  };

  const columns: ColumnsType<InventoryTransaction> = [
    {
      title: 'Reference No.',
      dataIndex: 'reference_number',
      key: 'reference_number',
      render: (text) => <Text strong>{text || 'N/A'}</Text>,
      sorter: (a, b) => (a.reference_number || '').localeCompare(b.reference_number || ''),
    },
    {
      title: 'Posted At',
      dataIndex: 'posted_at',
      key: 'posted_at',
      render: (val) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A'),
      sorter: (a, b) => dayjs(a.posted_at).unix() - dayjs(b.posted_at).unix(),
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      render: (type) => renderTypeTag(type),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_code',
      key: 'warehouse_code',
      render: (val) => <Tag color="purple">{val || 'N/A'}</Tag>,
    },
    {
      title: 'Item Code',
      dataIndex: 'item_code',
      key: 'item_code',
      render: (val) => <Text code>{val || 'N/A'}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (val) => val || 'N/A',
    },
    {
      title: 'UOM',
      dataIndex: 'stock_uom',
      key: 'stock_uom',
      align: 'center',
      render: (val) => (val ? <Tag>{val}</Tag> : 'N/A'),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (val) => (
        <Text style={{ fontWeight: 'bold', color: val < 0 ? '#cf1322' : '#3f8600' }}>
          {val > 0 ? `+${val}` : val ?? 0}
        </Text>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Unit Cost (Ksh)',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      align: 'right',
      render: (val) => fmt(val),
      sorter: (a, b) => a.unit_cost - b.unit_cost,
    },
    {
      title: 'Total Cost (Ksh)',
      key: 'total_cost',
      align: 'right',
      render: (_, record) => {
        const total = (record.quantity || 0) * (record.unit_cost || 0);
        return (
          <Text strong style={{ color: total < 0 ? '#cf1322' : 'inherit' }}>
            {fmt(total)}
          </Text>
        );
      },
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Filter Transactions</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12}>
            <Input
              placeholder="Search Reference, Item Code, Description, Warehouse..."
              prefix={<SearchOutlined />}
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={12}>
            <Select
              placeholder="Filter by Transaction Type"
              style={{ width: '100%' }}
              value={filters.transactionType}
              onChange={(value) => setFilters((prev) => ({ ...prev, transactionType: value }))}
              allowClear
              options={transactionTypeOptions}
              suffixIcon={<FilterOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <Card loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record, idx) => `${record.transaction_id || record.reference_number}-${idx}`}
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
                    Inflow Qty:{' '}
                    <Text strong style={{ color: '#3f8600' }}>
                      +{totals.inflowQty.toLocaleString()}
                    </Text>
                  </Text>
                  <Text>
                    Outflow Qty:{' '}
                    <Text strong style={{ color: '#cf1322' }}>
                      -{totals.outflowQty.toLocaleString()}
                    </Text>
                  </Text>
                  <Text>
                    Net Cost Valuation:{' '}
                    <Text strong style={{ color: totals.totalValuation < 0 ? '#cf1322' : '#1890ff' }}>
                      Ksh {fmt(totals.totalValuation)}
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

export default InventoryTransactionsTable;