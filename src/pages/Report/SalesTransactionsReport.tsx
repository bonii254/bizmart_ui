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
} from 'antd';
import {
  ReloadOutlined,
  FileExcelOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';

import { useSalesTransactions } from '../../Components/Hooks/usePOS';
import { SalesTransactionQueryParams, SalesTransaction } from '../../types/POS';
import SalesTransactionsTable from './SalesTransactionsTable';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const SalesTransactionsReport: React.FC = () => {
  // Default Date Range: Start of current month to end of current month
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Holds active client-side filtered data emitted by child table
  const [filteredTransactions, setFilteredTransactions] = useState<SalesTransaction[]>([]);

  // Format query parameters for hook
  const queryParams = useMemo<SalesTransactionQueryParams>(() => {
    const fromDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
    const toDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

    return {
      fromDate,
      toDate,
    };
  }, [dateRange]);

  const { data: responseData, isLoading, isFetching, refetch } = useSalesTransactions(queryParams);

  // Safely parse API response array
  const rawTransactions = useMemo<SalesTransaction[]>(() => {
    const raw = responseData as any;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }, [responseData]);

  // Sync active filtered list from child table for export
  const handleFilteredDataChange = useCallback((data: SalesTransaction[]) => {
    setFilteredTransactions(data);
  }, []);

  // Export Filtered Data to Excel
  const handleExportToExcel = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      message.warning('No filtered transaction data available to export');
      return;
    }

    try {
      const exportData = filteredTransactions.map((item: SalesTransaction) => {
        const soldAtFormatted =
          item.sold_at && dayjs(item.sold_at).isValid()
            ? dayjs(item.sold_at).format('DD/MM/YYYY HH:mm')
            : 'N/A';

        const total = item.total || 0;
        const paid = item.paid || 0;
        const balance = total - paid;

        let status = 'UNPAID';
        if (paid >= total) status = 'PAID';
        else if (paid > 0) status = 'PARTIAL';

        return {
          'Sold At': soldAtFormatted,
          'Invoice Number': item.invoice_number || 'N/A',
          Warehouse: item.warehouse_code || 'N/A',
          Customer: item.customer_name || 'N/A',
          Operator: item.operator_name || 'N/A',
          'Payment Method': item.payment_method_code || 'N/A',
          'Bank Name': item.bank_name || 'N/A',
          'Payment Reference': item.payment_reference || 'N/A',
          'Total Amount (Ksh)': total,
          'Paid Amount (Ksh)': paid,
          'Balance (Ksh)': balance,
          'Payment Status': status,
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 18 }, { wch: 15 }, { wch: 12 }, 
        { wch: 22 }, { wch: 16 }, { wch: 16 }, 
        { wch: 14 }, { wch: 22 }, { wch: 18 }, 
        { wch: 18 }, { wch: 16 }, { wch: 14 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Sales Transactions');

      const fromStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : 'start';
      const toStr = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : 'end';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `SalesTransactions_${fromStr}_to_${toStr}_${timestamp}.xlsx`);
      message.success('Sales transactions exported successfully!');
    } catch (error) {
      message.error('Failed to export sales transactions to Excel');
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
    <div className="page-content">
      <Container fluid>
        <Card>
          <Title level={4} style={{ marginBottom: '20px' }}>
            <ShoppingOutlined /> Sales Transactions Report
          </Title>

          {/* Control Bar */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} align="middle">
            <Col xs={24} sm={12} md={8} lg={7}>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="YYYY-MM-DD"
                presets={rangePresets}
                allowClear
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
                disabled={filteredTransactions.length === 0}
              >
                Export Excel ({filteredTransactions.length})
              </Button>
            </Col>
          </Row>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <SalesTransactionsTable
                data={rawTransactions}
                loading={isFetching}
                onFilteredDataChange={handleFilteredDataChange}
              />
            )}
          </div>
        </Card>
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default SalesTransactionsReport;