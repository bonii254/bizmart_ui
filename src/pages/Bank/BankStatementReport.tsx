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
  Select,
  Empty,
  Statistic,
  Space,
} from 'antd';
import {
  ReloadOutlined,
  FileExcelOutlined,
  BankOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

import { useBanks, useBankBalance, useBankTransactions } from '../../Components/Hooks/useBanks';
import { Bank, BankTransaction } from '../../types/bank';
import BankStatementTable from './BankStatementTable';

const { Title, Text } = Typography;

const BankStatementReport: React.FC = () => {
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>();
  const [filteredStatementItems, setFilteredStatementItems] = useState<BankTransaction[]>([]);

  // Fetch banks list
  const { data: banksDataResponse, isLoading: isLoadingBanks } = useBanks();

  // Normalize banks array safely
  const banksList = useMemo<Bank[]>(() => {
    if (!banksDataResponse) return [];
    const raw = banksDataResponse as any;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.banks)) return raw.banks;
    return [];
  }, [banksDataResponse]);

  // Get active selected bank object
  const selectedBank = useMemo(() => {
    return banksList.find((b) => b.bankId === selectedBankId);
  }, [banksList, selectedBankId]);

  // Fetch bank balance hook (handling negative balances safely)
  const { data: bankBalanceData, refetch: refetchBalance } = useBankBalance(
    selectedBankId || null
  );

  // Fetch bank transactions hook
  const {
    data: bankTransactionsResponse,
    isLoading: isLoadingTransactions,
    isFetching: isFetchingTransactions,
    refetch: refetchTransactions,
  } = useBankTransactions(selectedBankId || null);

  // Normalize raw transactions items
  const rawTransactions = useMemo<BankTransaction[]>(() => {
    if (!bankTransactionsResponse) return [];
    if (Array.isArray(bankTransactionsResponse)) return bankTransactionsResponse;
    const raw = bankTransactionsResponse as any;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  }, [bankTransactionsResponse]);

  // Sync emitted filtered data for Excel export
  const handleFilteredDataChange = useCallback((items: BankTransaction[]) => {
    setFilteredStatementItems(items);
  }, []);

  // Handle reload data
  const handleRefresh = () => {
    refetchBalance();
    refetchTransactions();
  };

  // Export Filtered Statement to Excel
  const handleExportToExcel = () => {
    if (!filteredStatementItems || filteredStatementItems.length === 0) {
      message.warning('No bank statement records available to export');
      return;
    }

    try {
      const exportData = filteredStatementItems.map((item) => ({
        'Posted At': item.postedAt ? dayjs(item.postedAt).format('DD/MM/YYYY HH:mm') : 'N/A',
        'Transaction Type': item.transactionType?.toUpperCase() || 'N/A',
        'Document Number': item.documentNumber || 'N/A',
        'Reference': item.reference || 'N/A',
        'Payment Method': item.paymentMethodCode || 'N/A',
        'Debit (Ksh)': item.debit || 0,
        'Credit (Ksh)': item.credit || 0,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Bank Statement');

      const bankCodeStr = selectedBank?.bankCode || 'BankStatement';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `BankStatement_${bankCodeStr}_${timestamp}.xlsx`);
      message.success('Bank statement exported successfully!');
    } catch (error) {
      message.error('Failed to export bank statement to Excel');
    }
  };

  // Compute live balance numeric value (fallback to 0 if null/undefined)
  const currentBalance = bankBalanceData?.balance ?? 0;

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
                  <BankOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>
                    Bank Statement
                  </Title>
                </div>
              </div>
            </Col>

            {/* Controls Bar */}
            <Col xs={24} lg={18}>
              <Row gutter={[8, 8]} justify="end" align="middle">
                {/* Select Bank */}
                <Col xs={24} sm={12} md={12} lg={10}>
                  <Select
                    showSearch
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="Select Bank Account..."
                    loading={isLoadingBanks}
                    value={selectedBankId}
                    onChange={(val) => setSelectedBankId(val)}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={banksList.map((b) => ({
                      value: b.bankId,
                      label: `${b.bankName} - ${b.accountNumber} (${b.currencyCode})`,
                    }))}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  />
                </Col>

                {/* Actions */}
                <Col xs={12} sm={6} md={6} lg={6}>
                  <Button
                    type="primary"
                    block
                    onClick={handleRefresh}
                    loading={isFetchingTransactions}
                    disabled={!selectedBankId}
                    icon={<ReloadOutlined />}
                  >
                    Load
                  </Button>
                </Col>

                <Col xs={12} sm={6} md={6} lg={8}>
                  <Button
                    type="default"
                    block
                    onClick={handleExportToExcel}
                    loading={isLoadingTransactions}
                    icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
                    disabled={!selectedBankId || filteredStatementItems.length === 0}
                  >
                    Export ({filteredStatementItems.length})
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Content Area */}
        {!selectedBankId ? (
          <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '50px 20px' }}>
            <Empty
              description={
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  Please select a bank account from the top dropdown to view its statement and balance.
                </Text>
              }
            />
          </Card>
        ) : (
          <>
            {/* Bank Information & Live Balance Banner */}
            {selectedBank && (
              <Card
                size="small"
                className="shadow-sm border-0 mb-3"
                bodyStyle={{ padding: '12px 16px', backgroundColor: '#fafafa' }}
              >
                <Row gutter={[16, 12]} align="middle" justify="space-between">
                  <Col xs={24} md={14}>
                    <Space size="middle" align="center">
                      <WalletOutlined style={{ fontSize: '24px', color: '#1677ff' }} />
                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          {selectedBank.bankName} ({selectedBank.branchName})
                        </Title>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Account Name: <strong>{selectedBank.accountName}</strong> | Account No:{' '}
                          <strong>{selectedBank.accountNumber}</strong> | Currency: {selectedBank.currencyCode}
                        </Text>
                      </div>
                    </Space>
                  </Col>

                  <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                    <Statistic
                      title={<span style={{ fontSize: '12px' }}>Current Live Balance</span>}
                      value={currentBalance}
                      precision={2}
                      valueStyle={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: currentBalance >= 0 ? '#3f8600' : '#cf1322',
                        fontFamily: 'monospace',
                      }}
                      prefix={selectedBank.currencyCode ? `${selectedBank.currencyCode} ` : 'Ksh '}
                    />
                    {bankBalanceData?.updatedAt && (
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        Updated: {dayjs(bankBalanceData.updatedAt).format('DD/MM/YYYY HH:mm')}
                      </Text>
                    )}
                  </Col>
                </Row>
              </Card>
            )}

            {/* Table Section */}
            {isLoadingTransactions ? (
              <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" tip="Loading Bank Statement..." />
              </Card>
            ) : (
              <BankStatementTable
                data={rawTransactions}
                loading={isFetchingTransactions}
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

export default BankStatementReport;