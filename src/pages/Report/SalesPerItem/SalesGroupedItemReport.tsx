import React, { useState, useMemo } from 'react';
import { Table, Typography, Card, Input, Select, DatePicker, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { 
  SalesPerItemReportResponse, 
  GroupedDataRecord 
} from '../../../types/reports';
import { useStockItems } from '../../../Components/Hooks/useStockItems';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface InternalFilterState {
  customer: string;
  salesOrder: string;
  itemId: string | null;
  dateRange: [any, any] | null;
}

interface Props {
  data?: SalesPerItemReportResponse[];
  loading?: boolean;
}

const SalesGroupedItemReport: React.FC<Props> = ({ data = [], loading = false }) => {
  const [filters, setFilters] = useState<InternalFilterState>({
    customer: '',
    salesOrder: '',
    itemId: null,
    dateRange: null,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const { data: stockItems = [], isLoading: loadingStockItems } = useStockItems();

  const groupedData = useMemo(() => {
    if (!Array.isArray(data)) return {};

    return data.reduce<GroupedDataRecord>((acc, item) => {
      const stockCode = item.itemCode || item.item_code || item.itemId || 'UNKNOWN';
      
      if (!acc[stockCode]) {
        acc[stockCode] = {
          description: item.description || 'No Description',
          transactions: [],
          totalQty: 0,
          totalValue: 0,
        }; 
      }
      
      const qty = item.quantity || 0;
      const lineVal = item.lineTotal ?? item.line_total ?? ((item.unitPrice || 0) * qty);

      acc[stockCode].transactions.push(item);
      acc[stockCode].totalQty += qty;
      acc[stockCode].totalValue += lineVal;
      
      return acc;
    }, {});
  }, [data]);

  const filteredGroupedData = useMemo(() => {
    const result: GroupedDataRecord = {};
    
    Object.entries(groupedData).forEach(([stockCode, itemData]) => {
      if (filters.itemId && stockCode !== filters.itemId) {
        return;
      }

      const filteredTransactions = itemData.transactions.filter(transaction => {
        const customerName = transaction.customerName || transaction.customer_name || '';
        const invoiceNumber = transaction.invoiceNumber || transaction.invoice_number || '';
        const soldAt = transaction.soldAt || transaction.sold_at;

        const matchesCustomer = !filters.customer || 
          customerName.toLowerCase().includes(filters.customer.toLowerCase());
        const matchesSalesOrder = !filters.salesOrder || 
          invoiceNumber.toLowerCase().includes(filters.salesOrder.toLowerCase());
        const matchesDate = !filters.dateRange || (soldAt &&
          new Date(soldAt) >= filters.dateRange[0].startOf('day').toDate() &&
          new Date(soldAt) <= filters.dateRange[1].endOf('day').toDate()
        );
        
        return matchesCustomer && matchesSalesOrder && matchesDate;
      });

      if (filteredTransactions.length > 0) {
        result[stockCode] = {
          ...itemData,
          transactions: filteredTransactions,
          totalQty: filteredTransactions.reduce((sum, item) => sum + (item.quantity || 0), 0),
          totalValue: filteredTransactions.reduce((sum, item) => 
            sum + (item.lineTotal ?? item.line_total ?? ((item.unitPrice || 0) * (item.quantity || 0))), 0
          ),
        };
      }
    });
    
    return result;
  }, [groupedData, filters]);

  const grandTotal = useMemo(() => {
    return Object.values(filteredGroupedData).reduce((sum, itemData) => 
      sum + itemData.totalValue, 0
    );
  }, [filteredGroupedData]);

  const columns: ColumnsType<SalesPerItemReportResponse> = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (val, record) => val || record.customer_name || 'N/A',
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (val, record) => val || record.invoice_number || 'N/A',
    },
    {
      title: 'Date',
      dataIndex: 'soldAt',
      key: 'soldAt',
      render: (val, record) => {
        const dateStr = val || record.sold_at;
        return dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : 'N/A';
      }
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (val) => val ?? 0,
    },
    {
      title: 'Value (Ksh)',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right',
      render: (value: number, record) => {
        const total = value ?? record.line_total ?? ((record.unitPrice || record.unit_price || 0) * (record.quantity || 0));
        return total.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
      },
    },
  ];

  const handleFilterChange = (key: keyof InternalFilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

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
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={stockItems.map(item => ({
                value: item.itemCode || item.itemCode || item.itemId,
                label: `${item.itemCode || item.itemCode} - ${item.description}`
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Filter by Customer"
              prefix={<SearchOutlined />}
              value={filters.customer}
              onChange={(e) => handleFilterChange('customer', e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Filter by Invoice Number"
              prefix={<SearchOutlined />}
              value={filters.salesOrder}
              onChange={(e) => handleFilterChange('salesOrder', e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </Col>
        </Row>
      </Card>

      <Card loading={loading}>
        {Object.entries(filteredGroupedData).map(([stockCode, itemData]) => (
          <div key={stockCode} style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Title level={5} style={{ margin: '8px 0' }}>
                {stockCode} - {itemData.description}
              </Title>
            </div>
            
            <Table 
              columns={columns}
              dataSource={itemData.transactions}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: itemData.transactions.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              onChange={(newPagination) => setPagination({
                current: newPagination.current || 1,
                pageSize: newPagination.pageSize || 10
              })}
              size="small"
              bordered
              rowKey={(record, index) => `${record.invoiceNumber || record.invoice_number || 'inv'}-${record.itemCode || record.item_code || stockCode}-${index}`}
            />
            
            <Row gutter={16} style={{ margin: '8px 0 16px' }}>
              <Col xs={24} md={12}>
                <div style={{ 
                  padding: '8px',
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #f0f0f0',
                  borderRadius: '2px'
                }}>
                  <Text strong>Item Total: </Text>
                  <Text>{itemData.totalQty} units | </Text>
                  <Text strong>Ksh {formatCurrency(itemData.totalValue)}</Text>
                </div>
              </Col>
            </Row>
          </div>
        ))}
        
        {Object.keys(filteredGroupedData).length > 0 && (
          <div style={{ 
            borderTop: '2px solid #1890ff', 
            marginTop: '12px', 
            padding: '12px 0',
            textAlign: 'right',
            backgroundColor: '#f0f9ff'
          }}>
            <Title level={5} style={{ margin: 0 }}>
              Grand Total: Ksh {formatCurrency(grandTotal)}
            </Title>
          </div>
        )}

        {Object.keys(filteredGroupedData).length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#999'
          }}>
            <Text>No transactions found matching the current filters</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SalesGroupedItemReport;