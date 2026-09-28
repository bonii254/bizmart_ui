import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { OperatorSalesSummaryItem } from '../../../types/reports2';

const { Text } = Typography;

interface Props {
  data?: OperatorSalesSummaryItem[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: OperatorSalesSummaryItem[]) => void;
}

const fmt = (v: number) =>
  (v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const OperatorSalesSummaryTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

  // Filter items by operator name
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      return (
        !searchQuery ||
        item.operator_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data, searchQuery]);

  // Sync filtered dataset to parent component for Excel export
  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  // Calculate grand totals across filtered data
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.invoiceCount += curr.invoice_count || 0;
        acc.salesTotal += curr.sales_total || 0;
        acc.paidTotal += curr.paid_total || 0;
        acc.creditTotal += curr.credit_total || 0;
        return acc;
      },
      { invoiceCount: 0, salesTotal: 0, paidTotal: 0, creditTotal: 0 }
    );
  }, [filteredData]);

  const overallAvgInvoiceValue = useMemo(() => {
    if (totals.invoiceCount === 0) return 0;
    return totals.salesTotal / totals.invoiceCount;
  }, [totals]);

  const columns: ColumnsType<OperatorSalesSummaryItem> = [
    {
      title: 'Operator Name',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 200,
      fixed: 'left',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ fontSize: '12px' }}>
            {text || 'N/A'}
          </Text>
        </div>
      ),
      sorter: (a, b) => (a.operator_name || '').localeCompare(b.operator_name || ''),
    },
    {
      title: 'Invoices Issued',
      dataIndex: 'invoice_count',
      key: 'invoice_count',
      width: 130,
      align: 'center',
      render: (count) => (
        <Tag color="blue" style={{ fontSize: '11px', margin: 0, fontWeight: 600 }}>
          {count ? count.toLocaleString() : 0}
        </Tag>
      ),
      sorter: (a, b) => a.invoice_count - b.invoice_count,
    },
    {
      title: 'Total Sales (Ksh)',
      dataIndex: 'sales_total',
      key: 'sales_total',
      width: 150,
      align: 'right',
      render: (val) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: '12px', color: '#1677ff' }}>
          {fmt(val)}
        </Text>
      ),
      sorter: (a, b) => a.sales_total - b.sales_total,
    },
    {
      title: 'Paid Total (Ksh)',
      dataIndex: 'paid_total',
      key: 'paid_total',
      width: 150,
      align: 'right',
      render: (val) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px', color: '#3f8600' }}>
          {fmt(val)}
        </Text>
      ),
      sorter: (a, b) => a.paid_total - b.paid_total,
    },
    {
      title: 'Credit / Outstanding (Ksh)',
      dataIndex: 'credit_total',
      key: 'credit_total',
      width: 180,
      align: 'right',
      render: (val) => (
        <Text
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: val > 0 ? '#cf1322' : '#595959',
            fontWeight: val > 0 ? 'bold' : 'normal',
          }}
        >
          {fmt(val)}
        </Text>
      ),
      sorter: (a, b) => a.credit_total - b.credit_total,
    },
    {
      title: 'Avg Invoice Value (Ksh)',
      dataIndex: 'average_invoice_value',
      key: 'average_invoice_value',
      width: 170,
      align: 'right',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{fmt(val)}</span>
      ),
      sorter: (a, b) => a.average_invoice_value - b.average_invoice_value,
    },
  ];

  return (
    <div>
      {/* Main Table Component */}
      <Card size="small" className="shadow-sm border-0" bodyStyle={{ padding: 0 }} loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.operator_id}
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
          scroll={{ x: 950 }}
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
              <Col xs={24} md={5}>
                <Text strong style={{ fontSize: '13px', color: '#1f1f1f' }}>
                  Grand Totals ({filteredData.length} Operators)
                </Text>
              </Col>

              <Col xs={24} md={19}>
                <Row gutter={[12, 4]} justify="end">
                  <Col xs={12} sm={4} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Invoices
                    </Text>
                    <Text strong style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {totals.invoiceCount.toLocaleString()}
                    </Text>
                  </Col>

                  <Col xs={12} sm={5} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Sales Total
                    </Text>
                    <Text strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1677ff' }}>
                      Ksh {fmt(totals.salesTotal)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={5} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Paid Total
                    </Text>
                    <Text strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#3f8600' }}>
                      Ksh {fmt(totals.paidTotal)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={5} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Credit Total
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: totals.creditTotal > 0 ? '#cf1322' : '#595959',
                      }}
                    >
                      Ksh {fmt(totals.creditTotal)}
                    </Text>
                  </Col>

                  <Col xs={24} sm={5} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Overall Avg Value
                    </Text>
                    <Text strong style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      Ksh {fmt(overallAvgInvoiceValue)}
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

export default OperatorSalesSummaryTable;