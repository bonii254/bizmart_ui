import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag } from 'antd';
import { SearchOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { StockTakeTransaction } from '../../../types/reports2'; 

const { Text } = Typography;

interface Props {
  data?: StockTakeTransaction[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: StockTakeTransaction[]) => void;
}

const StockTakeBrowseTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        item.stock_take_number?.toLowerCase().includes(query) ||
        item.warehouse_name?.toLowerCase().includes(query) ||
        item.operator_name?.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  // Sync filtered dataset to parent component for Excel export
  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  const columns: ColumnsType<StockTakeTransaction> = [
    {
      title: 'Stock Take Number',
      dataIndex: 'stock_take_number',
      key: 'stock_take_number',
      width: 180,
      fixed: 'left',
      render: (text) => (
        <Text strong style={{ fontSize: '12px', color: '#1677ff', fontFamily: 'monospace' }}>
          {text || 'N/A'}
        </Text>
      ),
      sorter: (a, b) => (a.stock_take_number || '').localeCompare(b.stock_take_number || ''),
    },
    {
      title: 'Warehouse Name',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 200,
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShopOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: '12px' }}>{text || 'N/A'}</Text>
        </div>
      ),
      sorter: (a, b) => (a.warehouse_name || '').localeCompare(b.warehouse_name || ''),
    },
    {
      title: 'Operator Name',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 180,
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined style={{ color: '#52c41a' }} />
          <Text style={{ fontSize: '12px' }}>{text || 'N/A'}</Text>
        </div>
      ),
      sorter: (a, b) => (a.operator_name || '').localeCompare(b.operator_name || ''),
    },
    {
      title: 'Posted At',
      dataIndex: 'posted_at',
      key: 'posted_at',
      width: 160,
      render: (val) => (
        <span style={{ fontSize: '12px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A'}
        </span>
      ),
      sorter: (a, b) => dayjs(a.posted_at).unix() - dayjs(b.posted_at).unix(),
    },
  ];

  return (
    <div>
      {/* Search Bar Strip */}
      <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '10px 14px' }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Search by Stock Take #, Warehouse, or Operator..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="small"
            />
          </Col>
        </Row>
      </Card>

      {/* Main Table Component */}
      <Card size="small" className="shadow-sm border-0" bodyStyle={{ padding: 0 }} loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.stock_take_id}
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
          scroll={{ x: 750 }}
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
              <Col xs={24} md={12}>
                <Text strong style={{ fontSize: '13px', color: '#1f1f1f' }}>
                  Total Stock-Take Records: <Tag color="blue">{filteredData.length}</Tag>
                </Text>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StockTakeBrowseTable;