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
  WalletOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';

import { useCashTransactions } from '../../../Components/Hooks/useReport2';
import { 
  CashTransactionQueryParams, 
  CashTransaction 
} from '../../../types/reports2'; 
import CashTransactionsTable from './CashTransactionsTable';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const CashTransactionsReport: React.FC = () => {
  // Default Date Range: Start of current month to end of current month
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Holds active client-side filtered dataset from table
  const [filteredTransactions, setFilteredTransactions] = useState<CashTransaction[]>([]);

  // Construct query payload for backend endpoint
  const queryParams = useMemo<CashTransactionQueryParams>(() => {
    const fromDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
    const toDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

    return {
      fromDate,
      toDate,
    };
  }, [dateRange]);

  const { 
    data: responseData, isLoading, isFetching, refetch 
  } = useCashTransactions(queryParams);

  // Safely extract dataset array
  const rawTransactions = useMemo<CashTransaction[]>(() => {
    const raw = responseData as any; // Cast to 'any' to bypass 'never' type checking

    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.data)) return raw.data.data;

    return [];
  }, [responseData]);

  // Keep filtered list updated for export operations
  const handleFilteredDataChange = useCallback((data: CashTransaction[]) => {
    setFilteredTransactions(data);
  }, []);

  // Export Filtered Dataset to Excel
  const handleExportToExcel = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      message.warning('No cash transaction data available to export');
      return;
    }

    try {
      const exportData = filteredTransactions.map((item: CashTransaction) => {
        const postedAtFormatted =
          item.posted_at && dayjs(item.posted_at).isValid()
            ? dayjs(item.posted_at).format('DD/MM/YYYY HH:mm:ss')
            : 'N/A';

        return {
          'Posted At': postedAtFormatted,
          'Document Number': item.document_number || 'N/A',
          'Source Doc Number': item.source_document_number || 'N/A',
          'Transaction Type': (item.transaction_type || 'N/A').toUpperCase().replace('_', ' '),
          'Payment Method': (item.payment_method_code || 'N/A').toUpperCase(),
          'Bank': item.bank_name || 'N/A',
          Operator: item.operator_name || 'N/A',
          Reference: item.reference || 'N/A',
          'Amount (Ksh)': item.amount || 0,
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 20 }, { wch: 18 }, { wch: 18 },
        { wch: 18 }, { wch: 16 }, { wch: 20 },
        { wch: 20 }, { wch: 22 }, { wch: 16 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Cash Transactions');

      const fromStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : 'start';
      const toStr = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : 'end';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `CashTransactions_${fromStr}_to_${toStr}_${timestamp}.xlsx`);
      message.success('Cash transactions exported successfully!');
    } catch (error) {
      message.error('Failed to export cash transactions to Excel');
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
        {/* Velzon-Safe Header Card */}
        <Card
          size="small"
          className="shadow-sm border-0 mb-3"
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            {/* Title Block */}
            <Col xs={24} lg={8}>
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
                    Cash Transactions Report
                  </Title>
                </div>
              </div>
            </Col>

            {/* Filter & Action Controls */}
            <Col xs={24} lg={16}>
              <Row gutter={[8, 8]} justify="end" align="middle">
                <Col xs={24} sm={13} md={12} lg={12} xl={11}>
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

                <Col xs={12} sm={5} md={6} lg={5} xl={4}>
                  <Button
                    type="primary"
                    block
                    onClick={() => refetch()}
                    loading={isFetching}
                    icon={<ReloadOutlined />}
                  >
                    {isFetching ? 'Loading' : 'Load'}
                  </Button>
                </Col>

                <Col xs={12} sm={6} md={6} lg={5} xl={4}>
                  <Button
                    type="default"
                    block
                    onClick={handleExportToExcel}
                    loading={isLoading}
                    icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
                    disabled={filteredTransactions.length === 0}
                  >
                    Export ({filteredTransactions.length})
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Table Content Container */}
        {isLoading ? (
          <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="Fetching Cash Transactions..." />
          </Card>
        ) : (
          <CashTransactionsTable
            data={rawTransactions}
            loading={isFetching}
            onFilteredDataChange={handleFilteredDataChange}
          />
        )}
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default CashTransactionsReport;