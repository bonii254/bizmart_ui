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
  AccountBookOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';

import { useOperators } from '../../../Components/Hooks/useUsers';
import { useBanks } from '../../../Components/Hooks/useBanks';
import { useDailyTillSummary } from '../../../Components/Hooks/useReport2';
import { 
  DailyTillSummaryItem, 
  DailyTillSummaryQueryParams 
} from '../../../types/reports2';
import { Operator } from '../../../types/user';
import { Bank } from '../../../types/bank';
import DailyTillSummaryTable from './DailyTillSummaryTable';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const DailyTillSummaryReport: React.FC = () => {
  // Date Range State (Default: Start of current month to end of current month)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Dropdown Filter States
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | undefined>(undefined);
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>(undefined);

  // Active filtered dataset emitted by table child component
  const [filteredItems, setFilteredItems] = useState<DailyTillSummaryItem[]>([]);

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
  const queryParams = useMemo<DailyTillSummaryQueryParams>(() => {
    const fromDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
    const toDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

    return {
      fromDate,
      toDate,
      operatorId: selectedOperatorId || undefined,
      bankId: selectedBankId || undefined,
    };
  }, [dateRange, selectedOperatorId, selectedBankId]);

  // Query Daily Till Summary Endpoint
  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
  } = useDailyTillSummary(queryParams);

  // Parse API array payload
  const rawItems = useMemo<DailyTillSummaryItem[]>(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.data)) return responseData.data;
    return [];
  }, [responseData]);

  // Sync child filtered list for Excel export
  const handleFilteredDataChange = useCallback((items: DailyTillSummaryItem[]) => {
    setFilteredItems(items);
  }, []);

  // Export dataset to Excel
  const handleExportToExcel = () => {
    if (!filteredItems || filteredItems.length === 0) {
      message.warning('No daily till summary data available to export');
      return;
    }

    try {
      const exportData = filteredItems.map((item) => ({
        'Period Date': item.period_date || 'N/A',
        'Operator Name': item.operator_name || 'N/A',
        'Bank Name': item.bank_name || 'N/A',
        'Payment Method': item.payment_method_code || 'N/A',
        'Sale Deposits (Ksh)': item.sale_deposits || 0,
        'Payments (Ksh)': item.payments || 0,
        'Withdrawals (Ksh)': item.withdrawals || 0,
        'Net Bank Movement (Ksh)': item.net_bank_movement || 0,
        'Reason Code': item.reason_code || 'N/A',
        'Reason Description': item.reason_description || 'N/A',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 14 },
        { wch: 22 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 18 },
        { wch: 22 },
        { wch: 15 },
        { wch: 25 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Daily Till Summary');

      const fromStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : 'start';
      const toStr = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : 'end';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `DailyTillSummary_${fromStr}_to_${toStr}_${timestamp}.xlsx`);
      message.success('Daily till summary exported successfully!');
    } catch (error) {
      message.error('Failed to export daily till summary to Excel');
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
            <Col xs={24} xl={6}>
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
                  <AccountBookOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>
                    Daily Till Summary
                  </Title>
                </div>
              </div>
            </Col>

            {/* Controls Bar */}
            <Col xs={24} xl={18}>
              <Row gutter={[8, 8]} justify="end" align="middle">
                {/* Date Range Picker */}
                <Col xs={24} sm={12} md={7} lg={7}>
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
                <Col xs={24} sm={12} md={6} lg={6}>
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
                <Col xs={24} sm={12} md={5} lg={5}>
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

                {/* Load Button */}
                <Col xs={12} sm={6} md={3} lg={3}>
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
                <Col xs={12} sm={6} md={3} lg={3}>
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
            <Spin size="large" tip="Fetching Daily Till Summary..." />
          </Card>
        ) : (
          <DailyTillSummaryTable
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

export default DailyTillSummaryReport;