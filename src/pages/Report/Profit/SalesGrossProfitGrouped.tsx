import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Card, Input, Row, Col, Tag, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { SalesGrossProfitItem } from '../../../types/reports';
import { useStockItems } from '../../../Components/Hooks/useStockItems';

const { Title, Text } = Typography;

interface InternalFilterState {
  invoiceNumber: string;
  warehouseCode: string;
  itemId: string | null;
  dateRange: [any, any] | null;
}

interface GroupedProfitRecord {
  [stockCode: string]: {
    description: string;
    transactions: SalesGrossProfitItem[];
    totalQty: number;
    totalSales: number;
    totalCost: number;
    totalProfit: number;
    marginPercent: number;
  };
}

interface Props {
  data?: SalesGrossProfitItem[];
  loading?: boolean;
  onFilteredDataChange?: (filteredData: SalesGrossProfitItem[]) => void;
}

const SalesGrossProfitGrouped: React.FC<Props> = ({ 
  data = [], 
  loading = false,
  onFilteredDataChange 
}) => {
  const [filters, setFilters] = useState<InternalFilterState>({
    invoiceNumber: '',
    warehouseCode: '',
    itemId: null,
    dateRange: null,
  });

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const { data: stockItems = [], isLoading: loadingStockItems } = useStockItems();

  const groupedData = useMemo(() => {
    if (!Array.isArray(data)) return {};

    return data.reduce<GroupedProfitRecord>((acc, item) => {
      const stockCode = item.item_code || 'UNKNOWN';

      if (!acc[stockCode]) {
        acc[stockCode] = {
          description: item.description || 'No Description',
          transactions: [],
          totalQty: 0,
          totalSales: 0,
          totalCost: 0,
          totalProfit: 0,
          marginPercent: 0,
        };
      }

      const qty = item.quantity || 0;
      const sales = item.sales_value || 0;
      const cost = item.cost_value || 0;
      const profit = item.gross_profit ?? (sales - cost);

      acc[stockCode].transactions.push(item);
      acc[stockCode].totalQty += qty;
      acc[stockCode].totalSales += sales;
      acc[stockCode].totalCost += cost;
      acc[stockCode].totalProfit += profit;
      acc[stockCode].marginPercent = acc[stockCode].totalSales > 0 
        ? (acc[stockCode].totalProfit / acc[stockCode].totalSales) * 100 
        : 0;

      return acc;
    }, {});
  }, [data]);

  const filteredGroupedData = useMemo(() => {
    const result: GroupedProfitRecord = {};

    Object.entries(groupedData).forEach(([stockCode, itemData]) => {
      if (filters.itemId && stockCode !== filters.itemId) return;

      const filteredTransactions = itemData.transactions.filter(transaction => {
        const invNum = transaction.invoice_number || '';
        const whCode = transaction.warehouse_code || '';
        const soldAt = transaction.sold_at;

        const matchesInvoice = !filters.invoiceNumber || invNum.toLowerCase().includes(filters.invoiceNumber.toLowerCase());
        const matchesWarehouse = !filters.warehouseCode || whCode.toLowerCase().includes(filters.warehouseCode.toLowerCase());
        const matchesDate = !filters.dateRange || (soldAt &&
          new Date(soldAt) >= filters.dateRange[0].startOf('day').toDate() &&
          new Date(soldAt) <= filters.dateRange[1].endOf('day').toDate()
        );

        return matchesInvoice && matchesWarehouse && matchesDate;
      });

      if (filteredTransactions.length > 0) {
        const totalSales = filteredTransactions.reduce((sum, i) => sum + (i.sales_value || 0), 0);
        const totalProfit = filteredTransactions.reduce((sum, i) => sum + (i.gross_profit ?? 0), 0);

        result[stockCode] = {
          ...itemData,
          transactions: filteredTransactions,
          totalQty: filteredTransactions.reduce((sum, i) => sum + (i.quantity || 0), 0),
          totalSales,
          totalCost: filteredTransactions.reduce((sum, i) => sum + (i.cost_value || 0), 0),
          totalProfit,
          marginPercent: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
        };
      }
    });

    return result;
  }, [groupedData, filters]);

  // Extract flat list of filtered transactions and notify parent
  const flatFilteredTransactions = useMemo(() => {
    return Object.values(filteredGroupedData).flatMap(item => item.transactions);
  }, [filteredGroupedData]);

  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(flatFilteredTransactions);
    }
  }, [flatFilteredTransactions, onFilteredDataChange]);

  const grandTotals = useMemo(() => {
    return Object.values(filteredGroupedData).reduce((acc, curr) => {
      acc.sales += curr.totalSales;
      acc.cost += curr.totalCost;
      acc.profit += curr.totalProfit;
      return acc;
    }, { sales: 0, cost: 0, profit: 0 });
  }, [filteredGroupedData]);

  const columns: ColumnsType<SalesGrossProfitItem> = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (val) => val || 'N/A',
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_code',
      key: 'warehouse_code',
      render: (val) => val || 'N/A',
    },
    {
      title: 'Date',
      dataIndex: 'sold_at',
      key: 'sold_at',
      render: (val) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A',
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (val) => val ?? 0,
    },
    {
      title: 'Sales Value (Ksh)',
      dataIndex: 'sales_value',
      key: 'sales_value',
      align: 'right',
      render: (val) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: 'Cost Value (Ksh)',
      dataIndex: 'cost_value',
      key: 'cost_value',
      align: 'right',
      render: (val) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: 'Gross Profit (Ksh)',
      dataIndex: 'gross_profit',
      key: 'gross_profit',
      align: 'right',
      render: (val) => {
        const value = val ?? 0;
        const color = value > 0 ? '#3f8600' : value < 0 ? '#cf1322' : '#595959';
        return (
          <Text style={{ color, fontWeight: 'bold' }}>
            {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        );
      },
    },
    {
      title: 'Margin %',
      dataIndex: 'gross_margin_percent',
      key: 'gross_margin_percent',
      align: 'right',
      render: (val) => {
        const margin = val ?? 0;
        const color = margin > 0 ? 'green' : margin < 0 ? 'red' : 'default';
        return <Tag color={color}>{margin.toFixed(2)}%</Tag>;
      },
    },
  ];

  const handleFilterChange = (key: keyof InternalFilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const fmt = (v: number) => (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Filters</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              showSearch
              placeholder="Filter by Stock Item"
              style={{ width: '100%' }}
              value={filters.itemId}
              onChange={(value) => handleFilterChange('itemId', value)}
              allowClear
              loading={loadingStockItems}
              options={stockItems.map(item => ({
                value: item.itemCode,
                label: `${item.itemCode} - ${item.description}`
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Filter by Invoice Number"
              prefix={<SearchOutlined />}
              value={filters.invoiceNumber}
              onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Filter by Warehouse Code"
              prefix={<SearchOutlined />}
              value={filters.warehouseCode}
              onChange={(e) => handleFilterChange('warehouseCode', e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      <Card loading={loading}>
        {Object.entries(filteredGroupedData).map(([stockCode, itemData]) => (
          <div key={stockCode} style={{ marginBottom: '24px' }}>
            <Title level={5} style={{ margin: '8px 0' }}>
              {stockCode} - {itemData.description}
            </Title>
            
            <Table 
              columns={columns}
              dataSource={itemData.transactions}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: itemData.transactions.length,
                showSizeChanger: true,
                onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
              }}
              size="small"
              bordered
              rowKey={(record, idx) => `${record.invoice_number}-${record.item_code}-${idx}`}
            />
            
            <div style={{ padding: '10px', backgroundColor: '#fafafa', border: '1px solid #f0f0f0', marginTop: '8px' }}>
              <Row gutter={16}>
                <Col span={6}><Text strong>Total Qty:</Text> {itemData.totalQty}</Col>
                <Col span={6}><Text strong>Total Sales:</Text> Ksh {fmt(itemData.totalSales)}</Col>
                <Col span={6}><Text strong>Total Cost:</Text> Ksh {fmt(itemData.totalCost)}</Col>
                <Col span={6}>
                  <Text strong>Gross Profit: </Text>
                  <Text style={{ color: itemData.totalProfit >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>
                    Ksh {fmt(itemData.totalProfit)} ({itemData.marginPercent.toFixed(2)}%)
                  </Text>
                </Col>
              </Row>
            </div>
          </div>
        ))}

        {Object.keys(filteredGroupedData).length > 0 && (
          <div style={{ borderTop: '2px solid #1890ff', marginTop: '16px', padding: '16px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
            <Row justify="space-between" align="middle">
              <Col><Title level={5} style={{ margin: 0 }}>Grand Totals</Title></Col>
              <Col>
                <Text style={{ marginRight: 16 }}>Sales: <Text strong>Ksh {fmt(grandTotals.sales)}</Text></Text>
                <Text style={{ marginRight: 16 }}>Cost: <Text strong>Ksh {fmt(grandTotals.cost)}</Text></Text>
                <Text>Profit: 
                  <Text style={{ color: grandTotals.profit >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold', marginLeft: 4 }}>
                    Ksh {fmt(grandTotals.profit)} ({grandTotals.sales > 0 ? ((grandTotals.profit / grandTotals.sales) * 100).toFixed(2) : 0}%)
                  </Text>
                </Text>
              </Col>
            </Row>
          </div>
        )}

        {Object.keys(filteredGroupedData).length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <Text>No gross profit records found matching current filters.</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SalesGrossProfitGrouped;