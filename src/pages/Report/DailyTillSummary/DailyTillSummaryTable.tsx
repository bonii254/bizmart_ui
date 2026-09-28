import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  BankOutlined,
  CreditCardOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DailyTillSummaryItem } from '../../../types/reports2';

const { Text } = Typography;

interface Props {
  data?: DailyTillSummaryItem[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: DailyTillSummaryItem[]) => void;
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

const DailyTillSummaryTable: React.FC<Props> = ({
  data = [],
  loading = false,
  onFilteredDataChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

  // Client-side search filter across dates, payment methods, bank name, operator, and reason code
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return data;

    return data.filter(
      (item) =>
        item.period_date?.toLowerCase().includes(query) ||
        item.payment_method_code?.toLowerCase().includes(query) ||
        item.bank_name?.toLowerCase().includes(query) ||
        item.operator_name?.toLowerCase().includes(query) ||
        item.reason_code?.toLowerCase().includes(query) ||
        item.reason_description?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // Sync filtered dataset to parent component for Excel export
  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  // Calculate grand totals across filtered dataset
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.saleDeposits += curr.sale_deposits || 0;
        acc.payments += curr.payments || 0;
        acc.withdrawals += curr.withdrawals || 0;
        acc.netBankMovement += curr.net_bank_movement || 0;
        return acc;
      },
      { saleDeposits: 0, payments: 0, withdrawals: 0, netBankMovement: 0 }
    );
  }, [filteredData]);

  const columns: ColumnsType<DailyTillSummaryItem> = [
    {
      title: 'Period Date',
      dataIndex: 'period_date',
      key: 'period_date',
      width: 120,
      fixed: 'left',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ fontSize: '12px' }}>
            {text || 'N/A'}
          </Text>
        </div>
      ),
      sorter: (a, b) => (a.period_date || '').localeCompare(b.period_date || ''),
    },
    {
      title: 'Operator',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 160,
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: '12px' }}>{text || 'N/A'}</Text>
        </div>
      ),
      sorter: (a, b) => (a.operator_name || '').localeCompare(b.operator_name || ''),
    },
    {
      title: 'Bank / Account',
      dataIndex: 'bank_name',
      key: 'bank_name',
      width: 150,
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
      title: 'Payment Method',
      dataIndex: 'payment_method_code',
      key: 'payment_method_code',
      width: 150,
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
      title: 'Sale Deposits (Ksh)',
      dataIndex: 'sale_deposits',
      key: 'sale_deposits',
      width: 150,
      align: 'right',
      render: (val) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: '12px', color: '#1677ff' }}>
          {fmt(val)}
        </Text>
      ),
      sorter: (a, b) => a.sale_deposits - b.sale_deposits,
    },
    {
      title: 'Payments (Ksh)',
      dataIndex: 'payments',
      key: 'payments',
      width: 140,
      align: 'right',
      render: (val) => (
        <Text style={{ fontFamily: 'monospace', fontSize: '12px', color: '#595959' }}>
          {fmt(val)}
        </Text>
      ),
      sorter: (a, b) => a.payments - b.payments,
    },
    {
      title: 'Withdrawals (Ksh)',
      dataIndex: 'withdrawals',
      key: 'withdrawals',
      width: 150,
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
      sorter: (a, b) => a.withdrawals - b.withdrawals,
    },
    {
      title: 'Net Bank Movement (Ksh)',
      dataIndex: 'net_bank_movement',
      key: 'net_bank_movement',
      width: 180,
      align: 'right',
      render: (val) => (
        <Text
          strong
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: val < 0 ? '#cf1322' : '#3f8600',
          }}
        >
          {fmt(val)}
        </Text>
      ),
      sorter: (a, b) => a.net_bank_movement - b.net_bank_movement,
    },
    {
      title: 'Reason / Notes',
      dataIndex: 'reason_description',
      key: 'reason_description',
      width: 180,
      render: (text, record) => (
        <Text type="secondary" style={{ fontSize: '11px' }}>
          {text || record.reason_code || '-'}
        </Text>
      ),
    },
  ];

  return (
    <div>
      {/* Quick Search Toolbar */}
      <Card size="small" className="shadow-sm border-0 mb-2" bodyStyle={{ padding: '8px 12px' }}>
        <Row justify="end" align="middle">
          <Col xs={24} sm={10} md={6}>
            <Input
              placeholder="Search date, bank, operator..."
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
          rowKey={(record, index) =>
            `${record.period_date}_${record.payment_method_code}_${record.bank_name}_${record.operator_name}_${index}`
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
          scroll={{ x: 1100 }}
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
                  Grand Totals ({filteredData.length} Records)
                </Text>
              </Col>

              <Col xs={24} md={19}>
                <Row gutter={[12, 4]} justify="end">
                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Sale Deposits
                    </Text>
                    <Text strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1677ff' }}>
                      Ksh {fmt(totals.saleDeposits)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Payments
                    </Text>
                    <Text strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#595959' }}>
                      Ksh {fmt(totals.payments)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Withdrawals
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: totals.withdrawals > 0 ? '#cf1322' : '#595959',
                      }}
                    >
                      Ksh {fmt(totals.withdrawals)}
                    </Text>
                  </Col>

                  <Col xs={12} sm={6} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Net Bank Movement
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: totals.netBankMovement < 0 ? '#cf1322' : '#3f8600',
                      }}
                    >
                      Ksh {fmt(totals.netBankMovement)}
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

export default DailyTillSummaryTable;