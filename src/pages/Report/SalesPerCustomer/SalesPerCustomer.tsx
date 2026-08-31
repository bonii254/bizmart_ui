import React, { useState, useMemo } from 'react';
import { Container } from 'reactstrap';
import { ToastContainer } from 'react-toastify';
import {
  Card,
  Select,
  Button,
  Typography,
  Row,
  Col,
  message,
  Spin,
  Radio,
  RadioChangeEvent,
} from 'antd';
import {
  ReloadOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  FileExcelOutlined,
  UserOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

import { useSalesPerCustomerReport } from '../../../Components/Hooks/useReports';
import { useCustomers } from '../../../Components/Hooks/useCustomers';
import { useSalesTransactions } from '../../../Components/Hooks/usePOS'; // Updated hook import
import { useStockItems } from '../../../Components/Hooks/useStockItems';
import { Customer } from '../../../types/customer';
import { SalesPerCustomerItem } from '../../../types/reports';

import SalesGroupedReport from './SalesGroupedReport';
import SalesGroupedReportSummary from './SalesGroupedReportSummary';
import { SalesTransaction } from '../../../types/POS';

const { Title } = Typography;
const { Option } = Select;

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const currentYear = new Date().getFullYear();
const startYear = 2026;
const years = Array.from(
  { length: Math.max(1, currentYear - startYear + 1) },
  (_, i) => startYear + i
);

const SalesPerCustomer: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [reportType, setReportType] = useState<'Detailed' | 'Summary'>('Detailed');

  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers();

  const queryParams = useMemo(() => {
    const monthIndex = months.indexOf(selectedMonth);
    const startDate = new Date(Date.UTC(selectedYear, monthIndex, 1))
      .toISOString()
      .split('T')[0];
    const endDate = new Date(Date.UTC(selectedYear, monthIndex + 1, 0))
      .toISOString()
      .split('T')[0];

    return {
      fromDate: startDate,
      toDate: endDate,
      customerId: selectedCustomer || undefined,
    };
  }, [selectedMonth, selectedYear, selectedCustomer]);

  const {
    data: rawReportData = [],
    isLoading: isLoadingReport,
    refetch: refetchReport,
  } = useSalesPerCustomerReport(queryParams);

  // Fetch sales transactions using the new useSalesTransactions hook
  const {
    data: transactionsData = [],
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useSalesTransactions({
    fromDate: queryParams.fromDate,
    toDate: queryParams.toDate,
  });

  const {
    data: stockItemsData = [],
    isLoading: isLoadingStockItems,
    refetch: refetchStockItems,
  } = useStockItems();

  // Map invoice_number -> payment_method_code (used as saleType)
  const saleTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    
    // Safely unwrap array whether transactionsData is ApiResponse or direct array
    const transactionsList: SalesTransaction[] = Array.isArray(transactionsData)
      ? transactionsData
      : (transactionsData as any)?.data ?? [];

    transactionsList.forEach((tx) => {
      if (tx.invoice_number) {
        map.set(tx.invoice_number, tx.payment_method_code);
      }
    });

    return map;
  }, [transactionsData]);

  const stockPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    stockItemsData.forEach((item) => {
      if (item.itemCode) {
        map.set(item.itemCode, item.sellingPrice);
      }
    });
    return map;
  }, [stockItemsData]);

  const reportData = useMemo<SalesPerCustomerItem[]>(() => {
    return rawReportData.map((item) => {
      // Map payment_method_code as the saleType via invoice number
      const derivedSaleType =
        (item.invoiceNumber && saleTypeMap.get(item.invoiceNumber)) ||
        (item as any).saleType ||
        'Standard';

      const catalogPrice = item.itemCode ? stockPriceMap.get(item.itemCode) : undefined;
      const sellingPrice = catalogPrice ?? (typeof item.unitPrice === 'number' ? item.unitPrice : 0);

      return {
        ...item,
        saleType: derivedSaleType,
        unitPrice: sellingPrice,
        lineTotal: item.lineTotal ?? 0,
      } as SalesPerCustomerItem;
    });
  }, [rawReportData, saleTypeMap, stockPriceMap]);

  const customers = useMemo<Customer[]>(() => {
    if (!customersData) return [];
    if (Array.isArray(customersData)) return customersData;
    return (customersData as any).data ?? [];
  }, [customersData]);

  const isDataLoading = isLoadingReport || isLoadingTransactions || isLoadingStockItems;

  const handleLoadData = () => {
    refetchReport();
    refetchTransactions();
    refetchStockItems();
    message.success('Report updated successfully');
  };

  const handleExportToExcel = () => {
    if (reportData.length === 0) {
      message.warning('No data to export');
      return;
    }

    try {
      const exportRows = reportData.map((item) => ({
        'Sold At': item.soldAt ? new Date(item.soldAt).toLocaleString() : '',
        'Invoice Number': item.invoiceNumber,
        'Sale Type': (item as any).saleType,
        'Customer Code': item.customerCode,
        'Customer Name': item.customerName,
        'Stock Code': item.itemCode,
        Description: item.description,
        UOM: item.stockUom,
        Quantity: item.quantity,
        'Selling Price': item.unitPrice,
        'Line Total': item.lineTotal,
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Per Customer');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `SalesPerCustomer_${selectedMonth}_${selectedYear}_${dateStr}.xlsx`);
      message.success('Export to Excel successful!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export to Excel');
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Card>
          <Title level={5} style={{ marginBottom: '24px' }}>
            <FileSearchOutlined /> Sales Per Customer Report
          </Title>

          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col>
              <Radio.Group
                onChange={(e: RadioChangeEvent) => setReportType(e.target.value)}
                value={reportType}
              >
                <Radio value="Detailed">Detailed</Radio>
                <Radio value="Summary">Summary</Radio>
              </Radio.Group>
            </Col>

            <Col xs={24} sm={8} md={6} lg={5}>
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder="Select Customer"
                value={selectedCustomer || undefined}
                onChange={setSelectedCustomer}
                allowClear
                loading={isLoadingCustomers}
                suffixIcon={<UserOutlined />}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {customers.map((customer) => (
                  <Option key={customer.customerId} value={customer.customerId}>
                    {customer.customerName} ({customer.customerCode})
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={8} md={6} lg={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Month"
                value={selectedMonth}
                onChange={setSelectedMonth}
                suffixIcon={<CalendarOutlined />}
              >
                {months.map((month) => (
                  <Option key={month} value={month}>
                    {month}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={8} md={4} lg={3}>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Year"
                value={selectedYear}
                onChange={setSelectedYear}
              >
                {years.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col>
              <Button
                type="primary"
                onClick={handleLoadData}
                loading={isDataLoading}
                icon={<ReloadOutlined />}
              >
                {isDataLoading ? 'Loading...' : 'Load Report'}
              </Button>
            </Col>

            <Col>
              <Button
                type="primary"
                onClick={handleExportToExcel}
                icon={<FileExcelOutlined />}
                disabled={reportData.length === 0}
              >
                Export to Excel
              </Button>
            </Col>
          </Row>

          <div style={{ overflowX: 'auto' }}>
            {isDataLoading ? (
              <Spin size="large" />
            ) : (
              <div>
                {reportType === 'Detailed' && (
                  <SalesGroupedReport data={reportData} loading={isDataLoading} />
                )}
                {reportType === 'Summary' && (
                  <SalesGroupedReportSummary data={reportData} loading={isDataLoading} />
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

export default SalesPerCustomer;