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
} from 'antd';
import {
  ReloadOutlined,
  FileExcelOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';

import { useOperators } from '../../../Components/Hooks/useUsers';
import { useBanks } from '../../../Components/Hooks/useBanks';
import { useSalesPaymentSummary } from '../../../Components/Hooks/useReport2';
import { 
    SalesPaymentSummaryItem, 
    SalesPaymentSummaryQueryParams 
} from '../../../types/reports2';
import { Operator } from '../../../types/user';
import { Bank } from '../../../types/bank';
import SalesPaymentSummaryTable from './SalesPaymentSummaryTable';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Common payment method options
const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE', label: 'Mobile Money (M-Pesa)' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer / EFT / RTGS' },
  { value: 'CREDIT', label: 'Credit Account' },
];

const SalesPaymentSummaryReport: React.FC = () => {
  // Date Range State (Default: Start of current month to end of current month)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Dropdown Filter States
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | undefined>(undefined);
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>(undefined);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>(undefined);

  // Active filtered dataset emitted by table child component
  const [filteredItems, setFilteredItems] = useState<SalesPaymentSummaryItem[]>([]);

  // Query Hooks for Filters
  const { data: rawOperatorsData, isLoading: isLoadingOperators } = useOperators();
  const { data: rawBanksData, isLoading: isLoadingBanks } = useBanks();

  // Safely parse operators list
  const operatorsList = useMemo<Operator[]>(() => {
    if (!rawOperatorsData) return [];
    if (Array.isArray(rawOperatorsData)) return rawOperatorsData;
    if (rawOperatorsData && Array.isArray(rawOperatorsData.data)) return rawOperatorsData.data;
    return [];
  }, [rawOperatorsData]);

  // Safely parse banks list
  const banksList = useMemo<Bank[]>(() => {
    if (!rawBanksData) return [];
    if (Array.isArray(rawBanksData)) return rawBanksData;
    return [];
  }, [rawBanksData]);

  // Construct Query Parameters for backend API fetch
  const queryParams = useMemo<SalesPaymentSummaryQueryParams>(() => {
    const fromDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
    const toDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

    return {
      fromDate,
      toDate,
      operatorId: selectedOperatorId || undefined,
      bankId: selectedBankId || undefined,
      paymentMethodCode: selectedPaymentMethod || undefined,
    };
  }, [dateRange, selectedOperatorId, selectedBankId, selectedPaymentMethod]);

  // Query Sales Payment Summary Endpoint
  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
  } = useSalesPaymentSummary(queryParams);

  // Parse API array payload
  const rawItems = useMemo<SalesPaymentSummaryItem[]>(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.data)) return responseData.data;
    return [];
  }, [responseData]);

  // Sync child filtered list for Excel export
  const handleFilteredDataChange = useCallback((items: SalesPaymentSummaryItem[]) => {
    setFilteredItems(items);
  }, []);

  // Export dataset to Excel
  const handleExportToExcel = () => {
    if (!filteredItems || filteredItems.length === 0) {
      message.warning('No sales payment summary data available to export');
      return;
    }

    try {
      const exportData = filteredItems.map((item) => ({
        'Payment Method': item.payment_method_code || 'N/A',
        'Bank Name': item.bank_name || 'N/A',
        'Operator Name': item.operator_name || 'N/A',
        'Sales Count': item.sale_count || 0,
        'Sales Total (Ksh)': item.sales_total || 0,
        'Paid Total (Ksh)': item.paid_total || 0,
        'Outstanding Total (Ksh)': item.outstanding_total || 0,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 18 },
        { wch: 22 },
        { wch: 22 },
        { wch: 14 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Sales Payment Summary');

      const fromStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : 'start';
      const toStr = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : 'end';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `SalesPaymentSummary_${fromStr}_to_${toStr}_${timestamp}.xlsx`);
      message.success('Sales payment summary exported successfully!');
    } catch (error) {
      message.error('Failed to export sales payment summary to Excel');
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
        {/* Header Controls Bar */}
        <Card
          size="small"
          className="shadow-sm border-0 mb-3"
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            {/* Title Section */}
            <Col xs={24} xl={5}>
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
                  <WalletOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>
                    Sales Payment Summary
                  </Title>
                </div>
              </div>
            </Col>

            {/* Controls Bar */}
            <Col xs={24} xl={19}>
              <Row gutter={[8, 8]} justify="end" align="middle">
                {/* Date Range Picker */}
                <Col xs={24} sm={12} md={6} lg={6}>
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

                {/* Operator Filter */}
                <Col xs={24} sm={12} md={5} lg={5}>
                  <Select
                    showSearch
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="All Operators"
                    loading={isLoadingOperators}
                    value={selectedOperatorId}
                    onChange={(val) => setSelectedOperatorId(val)}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={operatorsList.map((op) => ({
                      value: op.operatorId,
                      label: `${op.displayName || op.userName} (${op.operatorCode})`,
                    }))}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  />
                </Col>

                {/* Bank Filter */}
                <Col xs={24} sm={12} md={5} lg={4}>
                  <Select
                    showSearch
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="All Banks"
                    loading={isLoadingBanks}
                    value={selectedBankId}
                    onChange={(val) => setSelectedBankId(val)}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={banksList.map((b) => ({
                      value: b.bankId,
                      label: `${b.bankName} (${b.accountNumber || b.bankCode})`,
                    }))}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  />
                </Col>

                {/* Payment Method Filter */}
                <Col xs={24} sm={12} md={4} lg={4}>
                  <Select
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="All Payment Methods"
                    value={selectedPaymentMethod}
                    onChange={(val) => setSelectedPaymentMethod(val)}
                    options={PAYMENT_METHOD_OPTIONS}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  />
                </Col>

                {/* Load Button */}
                <Col xs={12} sm={6} md={2} lg={2}>
                  <Button
                    type="primary"
                    block
                    onClick={() => refetch()}
                    loading={isFetching}
                    icon={<ReloadOutlined />}
                  >
                    Load
                  </Button>
                </Col>

                {/* Export Button */}
                <Col xs={12} sm={6} md={2} lg={3}>
                  <Button
                    type="default"
                    block
                    onClick={handleExportToExcel}
                    loading={isLoading}
                    icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
                    disabled={filteredItems.length === 0}
                  >
                    Export ({filteredItems.length})
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Main Content Area */}
        {isLoading ? (
          <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="Fetching Sales Payment Summary..." />
          </Card>
        ) : (
          <SalesPaymentSummaryTable
            data={rawItems}
            loading={isFetching}
            onFilteredDataChange={handleFilteredDataChange}
          />
        )}
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default SalesPaymentSummaryReport;