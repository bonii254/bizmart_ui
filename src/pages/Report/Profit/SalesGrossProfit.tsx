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
  Radio,
  RadioChangeEvent,
  DatePicker,
} from 'antd';
import {
  ReloadOutlined,
  DollarOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';

import { useSalesGrossProfitReport } from '../../../Components/Hooks/useReports';
import { SalesGrossProfitQueryParams, SalesGrossProfitItem } from '../../../types/reports';
import SalesGrossProfitGrouped from './SalesGrossProfitGrouped';
import SalesGrossProfitSummary from './SalesGrossProfitSummary';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const SalesGrossProfit: React.FC = () => {
  // Default date range: Start of current month to end of current month
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [reportType, setReportType] = useState<'Detailed' | 'Summary'>('Detailed');

  // Holds the exact filtered transactions actively displayed on the UI
  const [filteredData, setFilteredData] = useState<SalesGrossProfitItem[]>([]);

  const queryParams = useMemo<SalesGrossProfitQueryParams>(() => {
    const fromDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
    const toDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';

    return {
      fromDate,
      toDate,
    };
  }, [dateRange]);

  const {
    data = [],
    isLoading,
    isFetching,
    refetch,
  } = useSalesGrossProfitReport(queryParams);

  const rawReportData = useMemo<SalesGrossProfitItem[]>(() => {
    const raw = data as any;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }, [data]);

  const handleFilteredDataChange = useCallback((updatedFilteredData: SalesGrossProfitItem[]) => {
    setFilteredData(updatedFilteredData);
  }, []);

  const handleExportToExcel = () => {
    // Determine active dataset: detailed filtered list or raw report data depending on view
    const exportSource = reportType === 'Detailed' ? filteredData : rawReportData;

    if (!exportSource || exportSource.length === 0) {
      message.warning('No filtered data available to export');
      return;
    }

    try {
      const exportData = exportSource.map((item: SalesGrossProfitItem) => {
        // Format date string to match front-end UI presentation (e.g. DD/MM/YYYY HH:mm)
        const formattedSoldAt = item.sold_at && dayjs(item.sold_at).isValid()
          ? dayjs(item.sold_at).format('DD/MM/YYYY HH:mm')
          : 'N/A';

        const salesVal = item.sales_value || 0;
        const grossProfitVal = item.gross_profit ?? 0;
        const calculatedMargin = item.gross_margin_percent ?? (salesVal > 0 ? (grossProfitVal / salesVal) * 100 : 0);

        return {
          'Sold At': formattedSoldAt,
          'Invoice Number': item.invoice_number || 'N/A',
          'Warehouse Code': item.warehouse_code || 'N/A',
          'Item Code': item.item_code || 'N/A',
          Description: item.description || '',
          Quantity: item.quantity || 0,
          'Sales Value (Ksh)': salesVal,
          'Cost Value (Ksh)': item.cost_value || 0,
          'Gross Profit (Ksh)': grossProfitVal,
          'Gross Margin (%)': Number(calculatedMargin.toFixed(2)),
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 20 }, { wch: 16 }, { wch: 16 }, 
        { wch: 18 }, { wch: 28 }, { wch: 10 }, 
        { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Sales Gross Profit');

      const fromStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : 'start';
      const toStr = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : 'end';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      XLSX.writeFile(wb, `SalesGrossProfit_Filtered_${fromStr}_to_${toStr}_${timestamp}.xlsx`);
      message.success('Exported filtered data successfully!');
    } catch (error) {
      message.error('Failed to export to Excel');
    }
  };

  // Quick Preset Ranges for DatePicker
  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: 'Today', value: [dayjs(), dayjs()] },
    { label: 'Yesterday', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
    { label: 'Last 7 Days', value: [dayjs().subtract(6, 'day'), dayjs()] },
    { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  ];

  const activeExportCount = reportType === 'Detailed' ? filteredData.length : rawReportData.length;

  return (
    <div className="page-content">
      <Container fluid>
        <Card>
          <Title level={5} style={{ marginBottom: '20px' }}>
            <DollarOutlined /> Sales Gross Profit Report
          </Title>

          {/* Filters Control Bar */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} align="middle">
            <Col>
              <Radio.Group 
                onChange={(e: RadioChangeEvent) => setReportType(e.target.value)} 
                value={reportType}
              >
                <Radio value="Detailed">Detailed</Radio>
                <Radio value="Summary">Summary</Radio>
              </Radio.Group>
            </Col>

            {/* Date Range Picker with Presets */}
            <Col xs={24} sm={12} md={8} lg={7}>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="YYYY-MM-DD"
                presets={rangePresets}
                allowClear={false}
              />
            </Col>

            <Col>
              <Button
                type="primary"
                onClick={() => refetch()}
                loading={isFetching}
                icon={<ReloadOutlined />}
              >
                {isFetching ? 'Loading...' : 'Load Report'}
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                onClick={handleExportToExcel}
                loading={isLoading}
                icon={<FileExcelOutlined />}
                disabled={activeExportCount === 0}
              >
                Export Excel ({activeExportCount})
              </Button>
            </Col>
          </Row>

          {/* Data Views */}
          <div style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <div>
                {reportType === 'Detailed' && (
                  <SalesGrossProfitGrouped 
                    data={rawReportData} 
                    loading={isFetching} 
                    onFilteredDataChange={handleFilteredDataChange}
                  />
                )}
                {reportType === 'Summary' && (
                  <SalesGrossProfitSummary data={rawReportData} loading={isFetching} />
                )}
              </div>
            )}
          </div>
        </Card>
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default SalesGrossProfit;