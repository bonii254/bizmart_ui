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
  UsergroupAddOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';

import { useOperators } from '../../../Components/Hooks/useUsers';
import { useOperatorSalesSummary } from '../../../Components/Hooks/useReport2';
import {
     OperatorSalesSummaryItem,
     OperatorSalesSummaryQueryParams 
} from '../../../types/reports2';
import { Operator } from '../../../types/user';
import OperatorSalesSummaryTable from './OperatorSalesSummaryTable';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const OperatorSalesSummaryReport: React.FC = () => {
  // Date Range state (Default: Start of month to end of month)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Operator dropdown filter state (holds operatorId UUID)
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | undefined>(undefined);

  // Active filtered dataset emitted by child table component
  const [filteredItems, setFilteredItems] = useState<OperatorSalesSummaryItem[]>([]);

  // Fetch operators list for dropdown selector
  const { data: rawOperatorsData, isLoading: isLoadingOperators } = useOperators();

  // Safely parse operators list
  const operatorsList = useMemo<Operator[]>(() => {
    if (!rawOperatorsData) return [];
    if (Array.isArray(rawOperatorsData)) return rawOperatorsData;
    if (rawOperatorsData && Array.isArray(rawOperatorsData.data)) return rawOperatorsData.data;
    return [];
  }, [rawOperatorsData]);

  // Construct query parameters passed directly to the backend API endpoint
  const queryParams = useMemo<OperatorSalesSummaryQueryParams>(() => {
    const fromDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
    const toDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

    return {
      fromDate,
      toDate,
      operatorId: selectedOperatorId || undefined,
    };
  }, [dateRange, selectedOperatorId]);

  // Query endpoint using custom React Query hook
  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
  } = useOperatorSalesSummary(queryParams);

  // Safely parse summary API array payload
  const rawItems = useMemo<OperatorSalesSummaryItem[]>(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.data)) return responseData.data;
    return [];
  }, [responseData]);

  // Sync child filtered list for Excel export
  const handleFilteredDataChange = useCallback((items: OperatorSalesSummaryItem[]) => {
    setFilteredItems(items);
  }, []);

  // Export dataset to Excel
  const handleExportToExcel = () => {
    if (!filteredItems || filteredItems.length === 0) {
      message.warning('No operator sales data available to export');
      return;
    }

    try {
      const exportData = filteredItems.map((item) => ({
        'Operator Name': item.operator_name || 'N/A',
        'Invoices Issued': item.invoice_count || 0,
        'Sales Total (Ksh)': item.sales_total || 0,
        'Paid Total (Ksh)': item.paid_total || 0,
        'Credit Total (Ksh)': item.credit_total || 0,
        'Average Invoice Value (Ksh)': item.average_invoice_value || 0,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 22 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 24 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Operator Sales Summary');

      const fromStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : 'start';
      const toStr = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : 'end';
      const opStr = selectedOperatorId ? 'FilteredOperator' : 'AllOperators';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `OperatorSalesSummary_${opStr}_${fromStr}_to_${toStr}_${timestamp}.xlsx`);
      message.success('Operator sales summary exported successfully!');
    } catch (error) {
      message.error('Failed to export operator sales summary to Excel');
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
                  <UsergroupAddOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>
                    Operator Sales Summary
                  </Title>
                </div>
              </div>
            </Col>

            {/* Controls Bar */}
            <Col xs={24} lg={18}>
              <Row gutter={[8, 8]} justify="end" align="middle">
                {/* Date Range Picker */}
                <Col xs={24} sm={12} md={8} lg={8} xl={7}>
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

                {/* Operator Select Filter */}
                <Col xs={24} sm={12} md={7} lg={7} xl={7}>
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

                {/* Reload Button */}
                <Col xs={12} sm={6} md={4} lg={4} xl={3}>
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
                <Col xs={12} sm={6} md={5} lg={5} xl={4}>
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
            <Spin size="large" tip="Fetching Operator Sales Summary..." />
          </Card>
        ) : (
          <OperatorSalesSummaryTable
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

export default OperatorSalesSummaryReport;