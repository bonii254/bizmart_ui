import React, { useState, useMemo, useCallback } from 'react';
import { Container } from 'reactstrap';
import { ToastContainer } from 'react-toastify';
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  message,
  Spin,
  DatePicker,
  Select,
  Empty,
  Statistic,
  Space,
} from 'antd';
import {
  ReloadOutlined,
  FileExcelOutlined,
  UserOutlined,
  FileTextOutlined,
  PrinterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';

import { useCustomers } from '../../../Components/Hooks/useCustomers';
import { useCustomerStatement } from '../../../Components/Hooks/useReport2';
import { 
    CustomerStatementItem, 
    CustomerStatementQueryParams 
} from '../../../types/reports2';
import { Customer } from '../../../types/customer';
import CustomerStatementTable from './CustomerStatementTable';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const fmtCurrency = (val?: number) =>
  `Ksh ${(val || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CustomerStatementReport: React.FC = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const [filteredStatementItems, setFilteredStatementItems] = useState<CustomerStatementItem[]>([]);

  // Fetch customer list
  const { data: customerDataResponse, isLoading: isLoadingCustomers } = useCustomers();

  // Normalize customer array safely
  const customersList = useMemo<Customer[]>(() => {
    if (!customerDataResponse) return [];
    const raw = customerDataResponse as any;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.customers)) return raw.customers;
    return [];
  }, [customerDataResponse]);

  // Get active selected customer object
  const selectedCustomer = useMemo(() => {
    return customersList.find((c) => c.customerId === selectedCustomerId);
  }, [customersList, selectedCustomerId]);

  // Construct query parameters
  const queryParams = useMemo<CustomerStatementQueryParams | undefined>(() => {
    if (!selectedCustomerId) return undefined;
    return {
      customerId: selectedCustomerId,
      fromDate: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
      toDate: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
    };
  }, [selectedCustomerId, dateRange]);

  // Fetch statement data hook
  const {
    data: statementResponse,
    isLoading: isLoadingStatement,
    isFetching: isFetchingStatement,
    refetch,
  } = useCustomerStatement(queryParams);

  // Normalize raw statement items
  const rawStatementItems = useMemo<CustomerStatementItem[]>(() => {
    if (!statementResponse) return [];
    if (Array.isArray(statementResponse.data)) return statementResponse.data;
    return [];
  }, [statementResponse]);

  // Sync emitted filtered data for Excel export
  const handleFilteredDataChange = useCallback((items: CustomerStatementItem[]) => {
    setFilteredStatementItems(items);
  }, []);

  // Calculate summary KPI metrics
  const kpiMetrics = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    rawStatementItems.forEach((item) => {
      totalDebit += item.debit || 0;
      totalCredit += item.credit || 0;
    });

    const closingBalance =
      rawStatementItems.length > 0
        ? rawStatementItems[rawStatementItems.length - 1].running_balance
        : 0;

    return {
      totalDebit,
      totalCredit,
      closingBalance,
    };
  }, [rawStatementItems]);

  // Export Filtered Statement to Excel
  const handleExportToExcel = () => {
    if (!filteredStatementItems || filteredStatementItems.length === 0) {
      message.warning('No statement records available to export');
      return;
    }

    try {
      const exportData = filteredStatementItems.map((item) => ({
        'Posted At': item.posted_at ? dayjs(item.posted_at).format('DD/MM/YYYY HH:mm') : 'N/A',
        'Transaction Type': item.transaction_type?.toUpperCase() || 'N/A',
        'Document Number': item.document_number || 'N/A',
        'Debit (Ksh)': item.debit || 0,
        'Credit (Ksh)': item.credit || 0,
        'Running Balance (Ksh)': item.running_balance || 0,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 18 },
        { wch: 16 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Customer Statement');

      const customerCodeStr = selectedCustomer?.customerCode || 'Statement';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `CustomerStatement_${customerCodeStr}_${timestamp}.xlsx`);
      message.success('Customer statement exported successfully!');
    } catch (error) {
      message.error('Failed to export statement to Excel');
    }
  };

  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: 'Today', value: [dayjs(), dayjs()] },
    { label: 'Yesterday', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
    { label: 'Last 7 Days', value: [dayjs().subtract(6, 'day'), dayjs()] },
    { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  ];

  return (
    <div className="page-content position-relative" style={{ zIndex: 1 }}>
      <Container fluid className="px-2 px-md-3">
        {/* Header & Controls Bar */}
        <Card
          size="small"
          className="shadow-sm border-0 mb-3"
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            {/* Title */}
            <Col xs={24} lg={6}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 6,
                    backgroundColor: '#e6f7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>
                    Customer Statement
                  </Title>
                </div>
              </div>
            </Col>

            {/* Controls Bar */}
            <Col xs={24} lg={18}>
              <Row gutter={[8, 8]} justify="end" align="middle">
                {/* Select Customer */}
                <Col xs={24} sm={10} md={9} lg={8}>
                  <Select
                    showSearch
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="Select Customer..."
                    loading={isLoadingCustomers}
                    value={selectedCustomerId}
                    onChange={(val) => setSelectedCustomerId(val)}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={customersList.map((c) => ({
                      value: c.customerId,
                      label: `${c.customerName} (${c.customerCode})`,
                    }))}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  />
                </Col>

                {/* Date Range Picker */}
                <Col xs={24} sm={8} md={8} lg={7}>
                  <RangePicker
                    style={{ width: '100%' }}
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates)}
                    format="YYYY-MM-DD"
                    presets={rangePresets}
                    allowClear
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  />
                </Col>

                {/* Actions */}
                <Col xs={12} sm={3} md={3} lg={3}>
                  <Button
                    type="primary"
                    block
                    onClick={() => refetch()}
                    loading={isFetchingStatement}
                    disabled={!selectedCustomerId}
                    icon={<ReloadOutlined />}
                  >
                    Load
                  </Button>
                </Col>

                <Col xs={12} sm={3} md={4} lg={4}>
                  <Button
                    type="default"
                    block
                    onClick={handleExportToExcel}
                    loading={isLoadingStatement}
                    icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
                    disabled={!selectedCustomerId || filteredStatementItems.length === 0}
                  >
                    Export ({filteredStatementItems.length})
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Content Area */}
        {!selectedCustomerId ? (
          <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '50px 20px' }}>
            <Empty
              description={
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  Please select a customer from the top dropdown to generate their statement report.
                </Text>
              }
            />
          </Card>
        ) : (
          <>
            {/* Customer Information Banner */}
            {selectedCustomer && (
              <Card
                size="small"
                className="shadow-sm border-0 mb-3"
                bodyStyle={{ padding: '12px 16px', backgroundColor: '#fafafa' }}
              >
                <Row gutter={[16, 12]} align="middle" justify="space-between">
                  <Col xs={24} md={14}>
                    <Space size="middle" align="center">
                      <UserOutlined style={{ fontSize: '24px', color: '#1677ff' }} />
                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          {selectedCustomer.customerName}
                        </Title>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Code: <strong>{selectedCustomer.customerCode}</strong> | Phone:{' '}
                          {selectedCustomer.phone || 'N/A'} | Email: {selectedCustomer.email || 'N/A'}
                        </Text>
                      </div>
                    </Space>
                  </Col>

                  <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      Tax ID: <strong>{selectedCustomer.taxNumber || 'N/A'}</strong>
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Credit Limit: <strong>{fmtCurrency(selectedCustomer.creditLimit)}</strong>
                    </Text>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Table Section */}
            {isLoadingStatement ? (
              <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" tip="Loading Customer Statement..." />
              </Card>
            ) : (
              <CustomerStatementTable
                data={rawStatementItems}
                loading={isFetchingStatement}
                onFilteredDataChange={handleFilteredDataChange}
              />
            )}
          </>
        )}
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default CustomerStatementReport;