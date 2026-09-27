import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag, Select } from 'antd';
import { SearchOutlined, FilterOutlined, SwapOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { InventoryTransaction } from '../../../types/reports';

const { Text } = Typography;

interface InternalFilterState {
  searchQuery: string;
  transactionType: string | null;
  warehouseCode: string | null;
}

interface Props {
  data?: InventoryTransaction[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: InventoryTransaction[]) => void;
}

/**
 * Business Valuation Rules:
 * - Sales / Sale Receipts: Always positive
 * - Stock Take: Can be positive or negative (signed)
 * - Goods Receipt: Can be positive or negative (signed, allowing deductions)
 * - Others: Signed raw total (quantity * unit_cost)
 */
const calculateLineValue = (item: InventoryTransaction): number => {
  const qty = item.quantity || 0;
  const cost = item.unit_cost || 0;
  const rawTotal = qty * cost;
  const type = (item.transaction_type || '').toLowerCase();

  if (type === 'sale' || type === 'sale_receipt') {
    return Math.abs(rawTotal);
  }

  // Stock take, Goods receipt, and Transfers retain their sign (+ or -)
  return rawTotal;
};

const InventoryTransactionsTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [filters, setFilters] = useState<InternalFilterState>({
    searchQuery: '',
    transactionType: null,
    warehouseCode: null,
  });

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Dynamic transaction type filter options
  const transactionTypeOptions = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const types = Array.from(new Set(data.map((item) => item.transaction_type).filter(Boolean)));
    return types.map((t) => ({ label: t.toUpperCase().replace('_', ' '), value: t }));
  }, [data]);

  // Dynamic warehouse filter options
  const warehouseOptions = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const warehouses = Array.from(new Set(data.map((item) => item.warehouse_code).filter(Boolean)));
    return warehouses.map((w) => ({ label: w, value: w }));
  }, [data]);

  // Local filter calculation
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
        !filters.transactionType ||
        (item.transaction_type || '').toLowerCase() === filters.transactionType.toLowerCase();

      const matchesWarehouse =
        !filters.warehouseCode || item.warehouse_code === filters.warehouseCode;

      return matchesSearch && matchesType && matchesWarehouse;
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
        const qty = curr.quantity || 0;
        const lineTotal = calculateLineValue(curr);

        acc.netQuantity += qty;
        if (qty > 0) acc.totalInflowQty += qty;
        else acc.totalOutflowQty += Math.abs(qty);

        acc.netValue += lineTotal;
        return acc;
      },
      { netQuantity: 0, totalInflowQty: 0, totalOutflowQty: 0, netValue: 0 }
    );
  }, [filteredData]);

  const fmt = (v: number) =>
    (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const renderTransactionTag = (type: string) => {
    const formatted = (type || 'N/A').toLowerCase();
    switch (formatted) {
      case 'sale':
      case 'sale_receipt':
        return <Tag color="green" style={{ fontSize: '11px', margin: 0 }}>SALE</Tag>;
      case 'goods_receipt':
        return <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>GOODS RECEIPT</Tag>;
      case 'stock_take':
        return <Tag color="purple" style={{ fontSize: '11px', margin: 0 }}>STOCK TAKE</Tag>;
      case 'transfer_in':
        return <Tag color="cyan" style={{ fontSize: '11px', margin: 0 }}>TRANSFER IN</Tag>;
      case 'transfer_out':
        return <Tag color="volcano" style={{ fontSize: '11px', margin: 0 }}>TRANSFER OUT</Tag>;
      default:
        return <Tag color="geekblue" style={{ fontSize: '11px', margin: 0 }}>{(type || 'N/A').toUpperCase()}</Tag>;
    }
  };

  const columns: ColumnsType<InventoryTransaction> = [
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
      title: 'Ref Number',
      dataIndex: 'reference_number',
      key: 'reference_number',
      width: 130,
      render: (text) => <Text strong style={{ fontSize: '12px' }}>{text || 'N/A'}</Text>,
      sorter: (a, b) => (a.reference_number || '').localeCompare(b.reference_number || ''),
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 130,
      render: (type) => renderTransactionTag(type),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_code',
      key: 'warehouse_code',
      width: 100,
      render: (val) => <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>{val || 'N/A'}</Tag>,
    },
    {
      title: 'Item Code',
      dataIndex: 'item_code',
      key: 'item_code',
      width: 140,
      render: (val) => <Text strong style={{ fontSize: '12px', color: '#096dd9' }}>{val || 'N/A'}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 220,
      ellipsis: true,
      render: (val) => <span style={{ fontSize: '12px' }}>{val || 'N/A'}</span>,
    },
    {
      title: 'UOM',
      dataIndex: 'stock_uom',
      key: 'stock_uom',
      width: 80,
      align: 'center',
      render: (val) => <Tag style={{ fontSize: '10px', margin: 0 }}>{val || 'N/A'}</Tag>,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      align: 'right',
      render: (val) => {
        const qty = val || 0;
        const color = qty > 0 ? '#3f8600' : qty < 0 ? '#cf1322' : '#595959';
        return (
          <Text strong style={{ fontFamily: 'monospace', fontSize: '12px', color }}>
            {qty > 0 ? `+${qty}` : qty}
          </Text>
        );
      },
      sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0),
    },
    {
      title: 'Unit Cost (Ksh)',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      width: 120,
      align: 'right',
      render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{fmt(val)}</span>,
      sorter: (a, b) => (a.unit_cost || 0) - (b.unit_cost || 0),
    },
    {
      title: 'Total Value (Ksh)',
      key: 'total_value',
      width: 130,
      align: 'right',
      fixed: 'right',
      render: (_, record) => {
        const lineVal = calculateLineValue(record);
        return (
          <Text
            strong
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: lineVal < 0 ? '#cf1322' : lineVal > 0 ? '#3f8600' : '#1f1f1f',
            }}
          >
            {fmt(lineVal)}
          </Text>
        );
      },
      sorter: (a, b) => calculateLineValue(a) - calculateLineValue(b),
    },
  ];

  return (
    <div>
      {/* Filter Toolbar */}
      <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '10px 14px' }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={10} md={10} lg={10}>
            <Input
              placeholder="Search Ref, Item Code, Description..."
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
              placeholder="Transaction Type"
              style={{ width: '100%' }}
              value={filters.transactionType}
              onChange={(value) => setFilters((prev) => ({ ...prev, transactionType: value }))}
              allowClear
              options={transactionTypeOptions}
              suffixIcon={<SwapOutlined />}
              size="small"
              getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            />
          </Col>

          <Col xs={12} sm={7} md={7} lg={7}>
            <Select
              placeholder="Warehouse"
              style={{ width: '100%' }}
              value={filters.warehouseCode}
              onChange={(value) => setFilters((prev) => ({ ...prev, warehouseCode: value }))}
              allowClear
              options={warehouseOptions}
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
          rowKey={(record, idx) => record.transaction_id || `row-${idx}`}
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
                      Total Inflow Qty
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#3f8600' }}>
                      +{totals.totalInflowQty}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Outflow Qty
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#cf1322' }}>
                      -{totals.totalOutflowQty}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Net Movement Qty
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                      {totals.netQuantity}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Net Stock Value
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: totals.netValue < 0 ? '#cf1322' : totals.netValue > 0 ? '#3f8600' : '#1f1f1f',
                      }}
                    >
                      Ksh {fmt(totals.netValue)}
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

export default InventoryTransactionsTable;