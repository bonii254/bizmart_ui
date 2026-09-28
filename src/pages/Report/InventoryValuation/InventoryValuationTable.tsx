import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag, Select } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { InventoryValuationItem } from '../../../types/reports2';

const { Text } = Typography;

interface InternalFilterState {
  searchQuery: string;
  stockStatus: 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK';
}

interface Props {
  data?: InventoryValuationItem[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: InventoryValuationItem[]) => void;
}

const fmt = (v: number) =>
  (v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const InventoryValuationTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [filters, setFilters] = useState<InternalFilterState>({
    searchQuery: '',
    stockStatus: 'ALL',
  });

  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

  // Filter items by search query and stock availability status
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      const matchesSearch =
        !filters.searchQuery ||
        item.item_code?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.warehouse_code?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      let matchesStock = true;
      if (filters.stockStatus === 'IN_STOCK') {
        matchesStock = item.quantity_on_hand > 0;
      } else if (filters.stockStatus === 'OUT_OF_STOCK') {
        matchesStock = item.quantity_on_hand <= 0;
      }

      return matchesSearch && matchesStock;
    });
  }, [data, filters]);

  // Sync filtered dataset to parent component for Excel exports
  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  // Calculate table-level totals for footer summary
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.totalQty += curr.quantity_on_hand || 0;
        acc.totalValuation += curr.inventory_value || 0;
        return acc;
      },
      { totalQty: 0, totalValuation: 0 }
    );
  }, [filteredData]);

  const columns: ColumnsType<InventoryValuationItem> = [
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_code',
      key: 'warehouse_code',
      width: 120,
      fixed: 'left',
      render: (val) => (
        <Tag color="geekblue" style={{ fontSize: '11px', margin: 0 }}>
          {val || 'N/A'}
        </Tag>
      ),
      sorter: (a, b) => (a.warehouse_code || '').localeCompare(b.warehouse_code || ''),
    },
    {
      title: 'Item Code',
      dataIndex: 'item_code',
      key: 'item_code',
      width: 150,
      fixed: 'left',
      render: (text) => (
        <Text strong style={{ fontSize: '12px', color: '#1677ff' }}>
          {text || 'N/A'}
        </Text>
      ),
      sorter: (a, b) => (a.item_code || '').localeCompare(b.item_code || ''),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      ellipsis: true,
      render: (text) => <span style={{ fontSize: '12px' }}>{text || 'N/A'}</span>,
    },
    {
      title: 'UOM',
      dataIndex: 'stock_uom',
      key: 'stock_uom',
      width: 90,
      align: 'center',
      render: (uom) => (
        <Tag color="default" style={{ fontSize: '11px', margin: 0 }}>
          {uom ? uom.toUpperCase() : 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Qty On Hand',
      dataIndex: 'quantity_on_hand',
      key: 'quantity_on_hand',
      width: 130,
      align: 'right',
      render: (val) => (
        <Text
          strong
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: val > 0 ? '#3f8600' : '#cf1322',
          }}
        >
          {val.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.quantity_on_hand - b.quantity_on_hand,
    },
    {
      title: 'Average Cost (Ksh)',
      dataIndex: 'average_cost',
      key: 'average_cost',
      width: 150,
      align: 'right',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{fmt(val)}</span>
      ),
      sorter: (a, b) => a.average_cost - b.average_cost,
    },
    {
      title: 'Inventory Value (Ksh)',
      dataIndex: 'inventory_value',
      key: 'inventory_value',
      width: 170,
      align: 'right',
      fixed: 'right',
      render: (val) => (
        <Text
          strong
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: val > 0 ? '#1677ff' : '#8c8c8c',
          }}
        >
          {fmt(val)}
        </Text>
      ),
      sorter: (a, b) => a.inventory_value - b.inventory_value,
    },
  ];

  return (
    <div>
      {/* Search & Filter Bar */}
      <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '10px 14px' }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={14} md={14}>
            <Input
              placeholder="Search Item Code, Description, Warehouse..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              allowClear
              size="small"
            />
          </Col>

          <Col xs={24} sm={10} md={10}>
            <Select
              placeholder="Stock Availability"
              style={{ width: '100%' }}
              value={filters.stockStatus}
              onChange={(value) => setFilters((prev) => ({ ...prev, stockStatus: value }))}
              options={[
                { label: 'All Items', value: 'ALL' },
                { label: 'In Stock (> 0)', value: 'IN_STOCK' },
                { label: 'Out of Stock (<= 0)', value: 'OUT_OF_STOCK' },
              ]}
              suffixIcon={<FilterOutlined />}
              size="small"
              getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Table Component */}
      <Card size="small" className="shadow-sm border-0" bodyStyle={{ padding: 0 }} loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredData.map((item, idx) => ({ ...item, key: `${item.warehouse_code}_${item.item_code}_${idx}` }))}
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
          scroll={{ x: 1000 }}
          size="small"
          bordered
        />

        {/* Dynamic Grand Totals Footer Bar */}
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
                  Total Valuation Summary ({filteredData.length} Items)
                </Text>
              </Col>

              <Col xs={24} md={18}>
                <Row gutter={[16, 4]} justify="end">
                  <Col xs={12} sm={8} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Units on Hand
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#3f8600' }}>
                      {totals.totalQty.toLocaleString()}
                    </Text>
                  </Col>

                  <Col xs={12} sm={10} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Valuation Value
                    </Text>
                    <Text strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#1677ff' }}>
                      Ksh {fmt(totals.totalValuation)}
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

export default InventoryValuationTable;