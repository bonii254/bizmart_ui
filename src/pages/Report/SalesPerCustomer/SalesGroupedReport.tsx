import React from 'react';
import { Card, Table, Typography } from 'antd';
import { SalesPerCustomerItem } from '../../../types/reports';

const { Title } = Typography;

interface SalesGroupedReportProps {
  data?: SalesPerCustomerItem[];
  loading?: boolean;
}

interface GroupedByOrder {
  saleType?: string;
  items: SalesPerCustomerItem[];
}

interface GroupedOrdersMap {
  [salesOrder: string]: GroupedByOrder;
}

interface GroupedDataMap {
  [date: string]: GroupedOrdersMap;
}

const SalesGroupedReport: React.FC<SalesGroupedReportProps> = ({ data = [], loading = false }) => {
  // Group data by soldAt date and then by invoiceNumber (salesOrder)
  const groupedData = data.reduce<GroupedDataMap>((acc, item) => {
    const date = item.soldAt ? item.soldAt.split('T')[0] : 'Unknown Date';
    const orderNo = item.invoiceNumber || 'No Invoice';

    if (!acc[date]) {
      acc[date] = {};
    }
    if (!acc[date][orderNo]) {
      acc[date][orderNo] = {
        saleType: (item as any).saleType || 'Standard',
        items: [],
      };
    }

    acc[date][orderNo].items.push(item);
    return acc;
  }, {});

  const calculateOrderTotal = (items: SalesPerCustomerItem[]): number => {
    return items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  };

  const grandTotal = data.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

  const columns = [
    {
      title: 'Customer Code',
      dataIndex: 'customerCode',
      key: 'customerCode',
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Stock Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'UOM',
      dataIndex: 'stockUom',
      key: 'stockUom',
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
    },
    {
      title: 'Selling Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right' as const,
      render: (val?: number) =>
        `Ksh ${(val || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      title: 'Value',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right' as const,
      render: (value: number) =>
        `Ksh ${(value || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
  ];

  return (
    <Card loading={loading}>
      {Object.entries(groupedData).map(([date, salesOrders]) => (
        <div key={date} style={{ marginBottom: '12px' }}>
          <Title level={5} style={{ margin: '12px 0' }}>
            <span style={{ fontWeight: 'bold' }}>Date:</span>{' '}
            {date !== 'Unknown Date'
              ? new Date(date).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : date}
          </Title>

          {Object.entries(salesOrders).map(([orderNumber, orderGroup]) => {
            const orderTotal = calculateOrderTotal(orderGroup.items);

            return (
              <div key={orderNumber} style={{ marginBottom: '24px' }}>
                <Title level={5}>
                  <span style={{ fontWeight: 'bold' }}> Invoice:</span> {orderNumber}{' '}
                  <span style={{ fontWeight: 'bold' }}> Sale Type:</span> {orderGroup.saleType}
                </Title>
                <Table<SalesPerCustomerItem>
                  columns={columns}
                  dataSource={orderGroup.items}
                  pagination={false}
                  rowKey={(record, index) => `${record.invoiceNumber}-${record.itemCode}-${index}`}
                  size="small"
                  bordered
                />
                <div style={{ textAlign: 'right', margin: '8px 0 16px' }}>
                  <strong>
                    Order Total: Ksh{' '}
                    {orderTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              </div>
            );
          })}

          <div style={{ borderTop: '1px solid rgb(32, 13, 13)', margin: '12px 0', paddingTop: '8px' }}>
            <strong>
              Date Total: Ksh{' '}
              {Object.values(salesOrders)
                .reduce((sum, orderGroup) => sum + calculateOrderTotal(orderGroup.items), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      ))}

      <div style={{ borderTop: '2px solid #1890ff', marginTop: '12px', paddingTop: '8px', textAlign: 'right' }}>
        <Title level={5}>
          Grand Total: Ksh{' '}
          {grandTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Title>
      </div>
    </Card>
  );
};

export default SalesGroupedReport;