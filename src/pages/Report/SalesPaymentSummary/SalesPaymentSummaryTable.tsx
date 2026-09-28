import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag } from 'antd';
import { SearchOutlined, UserOutlined, BankOutlined, CreditCardOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SalesPaymentSummaryItem } from '../../../types/reports2';

const { Text } = Typography;

interface Props {
  data?: SalesPaymentSummaryItem[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: SalesPaymentSummaryItem[]) => void;
}

const fmt = (v: number) =>
  (v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getPaymentMethodTagColor = (code: string) => {
  switch (code?.toUpperCase()) {
    case 'CASH':
      return 'green';
    case 'MOBILE':
    case 'MPESA':
      return 'cyan';
    case 'CHEQUE':
      return 'purple';
    case 'BANK_TRANSFER':
    case 'EFT':
    case 'RTGS':
      return 'blue';
    default:
      return 'geekblue';
  }
};

const SalesPaymentSummaryTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

  // Client-side search across Payment Method, Bank Name, and Operator Name
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return data;

    return data.filter(
      (item) =>
        item.payment_method_code?.toLowerCase().includes(query) ||
        item.bank_name?.toLowerCase().includes(query) ||
        item.operator_name?.toLowerCase().includes(query)
    );
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
        acc.saleCount += curr.sale_count || 0;
        acc.salesTotal += curr.sales_total || 0;
        acc.paidTotal += curr.paid_total || 0;
        acc.outstandingTotal += curr.outstanding_total || 0;
        return acc;
      },
      { saleCount: 0, salesTotal: 0, paidTotal: 0, outstandingTotal: 0 }
    );
  }, [filteredData]);

  const columns: ColumnsType<SalesPaymentSummaryItem> = [
    {
      title: 'Payment Method',
      dataIndex: 'payment_method_code',
      key: 'payment_method_code',
      width: 160,
      fixed: 'left',
      render: (code) => (
        <Tag
          color={getPaymentMethodTagColor(code)}
          style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}
        >
          <CreditCardOutlined style={{ marginRight: 4 }} />
          {code || 'N/A'}
        </Tag>
      ),
      sorter: (a, b) => (a.payment_method_code || '').localeCompare(b.payment_method_code || ''),
    },
    {
      title: 'Bank / Account',
      dataIndex: 'bank_name',
      key: 'bank_name',
      width: 180,
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BankOutlined style={{ color: '#595959' }} />
          <Text strong style={{ fontSize: '12px' }}>
            {text || 'N/A'}
          </Text>
        </div>
      ),
      sorter: (a, b) => (a.bank_name || '').localeCompare(b.bank_name || ''),
    },
    {
      title: 'Operator',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 180,
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: '12px' }}>{text || 'N/A'}</Text>
        </div>
      ),
      sorter: (a, b) => (a.operator_name || '').localeCompare(b.operator_name || ''),
    },
    {
      title: 'Sales Count',
      dataIndex: 'sale_count',
      key: 'sale_count',
      width: 120,
      align: 'center',
      render: (count) => (
        <Tag color="blue" style={{ fontSize: '11px', margin: 0, fontWeight: 600 }}>
          {count ? count.toLocaleString() : 0}
        </Tag>
      ),
      sorter: (a, b) => a.sale_count - b.sale_count,
    },
    {
      title: 'Sales Total (Ksh)',
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
      title: 'Outstanding Total (Ksh)',
      dataIndex: 'outstanding_total',
      key: 'outstanding_total',
      width: 170,
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
      sorter: (a, b) => a.outstanding_total - b.outstanding_total,
    },
  ];

  return (
    <div>

      {/* Main Table Component */}
      <Card size="small" className="shadow-sm border-0" bodyStyle={{ padding: 0 }} loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record, index) =>
            `${record.payment_method_code}_${record.bank_name}_${record.operator_name}_${index}`
          }
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
              <Col xs={24} md={6}>
                <Text strong style={{ fontSize: '13px', color: '#1f1f1f' }}>
                  Grand Totals ({filteredData.length} Records)
                </Text>
              </Col>

              <Col xs={24} md={18}>
                <Row gutter={[12, 4]} justify="end">
                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Total Sales Count
                    </Text>
                    <Text strong style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {totals.saleCount.toLocaleString()}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Sales Total
                    </Text>
                    <Text strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1677ff' }}>
                      Ksh {fmt(totals.salesTotal)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Paid Total
                    </Text>
                    <Text strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#3f8600' }}>
                      Ksh {fmt(totals.paidTotal)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Outstanding Total
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: totals.outstandingTotal > 0 ? '#cf1322' : '#595959',
                      }}
                    >
                      Ksh {fmt(totals.outstandingTotal)}
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

export default SalesPaymentSummaryTable;