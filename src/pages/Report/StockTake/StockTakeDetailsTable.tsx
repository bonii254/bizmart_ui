import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag } from 'antd';
import { SearchOutlined, BarcodeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { StockTakeTransactionDetail } from '../../../types/reports2';

const { Text } = Typography;

interface Props {
  data?: StockTakeTransactionDetail[];
  loading?: boolean;
  selectedCategoryId?: string;
  selectedItemId?: string;
  onFilteredDataChange?: (filteredData: StockTakeTransactionDetail[]) => void;
}

const StockTakeDetailsTable: React.FC<Props> = ({
  data = [],
  loading = false,
  selectedCategoryId,
  selectedItemId,
  onFilteredDataChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.item_code?.toLowerCase().includes(query) ||
        item.stock_code_description?.toLowerCase().includes(query) ||
        item.stock_uom?.toLowerCase().includes(query);

      const matchesCategory =
        !selectedCategoryId || item.category_id === selectedCategoryId;

      const matchesItem =
        !selectedItemId || item.item_id === selectedItemId;

      return matchesSearch && matchesCategory && matchesItem;
    });
  }, [data, searchQuery, selectedCategoryId, selectedItemId]);

  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  const columns: ColumnsType<StockTakeTransactionDetail> = [
    {
      title: 'Item Code',
      dataIndex: 'item_code',
      key: 'item_code',
      width: 150,
      fixed: 'left',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarcodeOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ fontSize: '12px', color: '#1677ff', fontFamily: 'monospace' }}>
            {text || 'N/A'}
          </Text>
        </div>
      ),
      sorter: (a, b) => (a.item_code || '').localeCompare(b.item_code || ''),
    },
    {
      title: 'Description',
      dataIndex: 'stock_code_description',
      key: 'stock_code_description',
      width: 250,
      render: (text) => <Text style={{ fontSize: '12px' }}>{text || 'N/A'}</Text>,
      sorter: (a, b) => (a.stock_code_description || '').localeCompare(b.stock_code_description || ''),
    },
    {
      title: 'UOM',
      dataIndex: 'stock_uom',
      key: 'stock_uom',
      width: 90,
      align: 'center',
      render: (uom) => <Tag style={{ fontSize: '11px', margin: 0 }}>{uom || 'N/A'}</Tag>,
    },
    {
      title: 'Expected Qty',
      dataIndex: 'expected_quantity',
      key: 'expected_quantity',
      width: 130,
      align: 'right',
      render: (val) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {(val ?? 0).toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => (a.expected_quantity ?? 0) - (b.expected_quantity ?? 0),
    },
    {
      title: 'Counted Qty',
      dataIndex: 'counted_quantity',
      key: 'counted_quantity',
      width: 130,
      align: 'right',
      render: (val) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: '12px', color: '#3f8600' }}>
          {(val ?? 0).toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => (a.counted_quantity ?? 0) - (b.counted_quantity ?? 0),
    },
    {
      title: 'Variance',
      key: 'variance',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const variance = (record.counted_quantity ?? 0) - (record.expected_quantity ?? 0);
        return (
          <Text
            strong
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: variance > 0 ? '#3f8600' : variance < 0 ? '#cf1322' : '#595959',
            }}
          >
            {variance > 0 ? `+${variance}` : variance}
          </Text>
        );
      },
      sorter: (a, b) =>
        ((a.counted_quantity ?? 0) - (a.expected_quantity ?? 0)) -
        ((b.counted_quantity ?? 0) - (b.expected_quantity ?? 0)),
    },
  ];

  return (
    <div>
      <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '10px 14px' }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Search by Item Code, Description, or UOM..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="small"
            />
          </Col>
        </Row>
      </Card>

      <Card size="small" className="shadow-sm border-0" bodyStyle={{ padding: 0 }} loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.stock_take_detail_id}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            responsive: true,
            size: 'small',
            pageSizeOptions: ['10', '15', '25', '50'],
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
            style: { padding: '8px 12px', margin: 0 },
          }}
          scroll={{ x: 800 }}
          size="small"
          bordered
        />

        {filteredData.length > 0 && (
          <div
            style={{
              borderTop: '2px solid #1890ff',
              backgroundColor: '#e6f7ff',
              padding: '10px 16px',
            }}
          >
            <Row gutter={[12, 8]} align="middle" justify="space-between">
              <Col xs={24} md={12}>
                <Text strong style={{ fontSize: '13px', color: '#1f1f1f' }}>
                  Total Line Items: <Tag color="blue">{filteredData.length}</Tag>
                </Text>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StockTakeDetailsTable;