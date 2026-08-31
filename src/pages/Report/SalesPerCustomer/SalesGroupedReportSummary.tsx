import React, { useState } from 'react';
import { Table, Typography, Card } from 'antd';
import { SalesPerCustomerItem } from '../../../types/reports';

const { Title } = Typography;

interface SalesGroupedReportSummaryProps {
  data?: SalesPerCustomerItem[];
  loading?: boolean;
}

interface SummaryTableRow {
  key: string;
  date: string;
  salesOrder: string;
  saleType: string;
  customerCode: string;
  customerName: string;
  orderTotal: number;
}

const SalesGroupedReportSummary: React.FC<SalesGroupedReportSummaryProps> = ({
  data = [],
  loading = false,
}) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const summaryData: SummaryTableRow[] = [];
  let grandTotal = 0;

  // Group data by date and invoiceNumber
  const groupedData = data.reduce<
    Record<
      string,
      Record<
        string,
        {
          customerCode: string;
          customerName: string;
          items: SalesPerCustomerItem[];
          total: number;
          saleType: string;
        }
      >
    >
  >((acc, item) => {
    const date = item.soldAt ? item.soldAt.split('T')[0] : 'Unknown Date';
    const invoiceNo = item.invoiceNumber || 'No Invoice';

    if (!acc[date]) {
      acc[date] = {};
    }
    if (!acc[date][invoiceNo]) {
      acc[date][invoiceNo] = {
        customerCode: item.customerCode || '',
        customerName: item.customerName || '',
        items: [],
        total: 0,
        saleType: (item as any).saleType || 'Standard',
      };
    }

    acc[date][invoiceNo].items.push(item);
    acc[date][invoiceNo].total += item.lineTotal || 0;
    grandTotal += item.lineTotal || 0;
    return acc;
  }, {});

  // Flatten the data into summary rows
  Object.entries(groupedData).forEach(([date, orders]) => {
    Object.entries(orders).forEach(([orderNumber, orderData]) => {
      summaryData.push({
        key: `${date}-${orderNumber}`,
        date: date !== 'Unknown Date' ? new Date(date).toLocaleDateString('en-GB') : date,
        salesOrder: orderNumber,
        saleType: orderData.saleType,
        customerCode: orderData.customerCode,
        customerName: orderData.customerName,
        orderTotal: orderData.total,
      });
    });
  });

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: SummaryTableRow, b: SummaryTableRow) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Invoice / Order',
      dataIndex: 'salesOrder',
      key: 'salesOrder',
    },
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
      title: 'Sale Type',
      dataIndex: 'saleType',
      key: 'saleType',
    },
    {
      title: 'Order Total (Ksh)',
      dataIndex: 'orderTotal',
      key: 'orderTotal',
      align: 'right' as const,
      render: (value: number) => {
        const formatted = value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return value < 0 ? <span style={{ color: 'red' }}>{formatted}</span> : formatted;
      },
      sorter: (a: SummaryTableRow, b: SummaryTableRow) => a.orderTotal - b.orderTotal,
    },
  ];

  return (
    <Card loading={loading}>
      <Title level={5} style={{ marginBottom: '16px' }}>
        Sales Per Customer Summary
      </Title>

      <Table<SummaryTableRow>
        columns={columns}
        dataSource={summaryData}
        pagination={{
          ...pagination,
          total: summaryData.length,
          showSizeChanger: true,
          showTotal: (total: number, range: [number, number]) =>
            `${range[0]}-${range[1]} of ${total} orders`,
          onChange: (page: number, pageSize: number) => {
            setPagination({ current: page, pageSize });
          },
          onShowSizeChange: (_current: number, size: number) => {
            setPagination({ current: 1, pageSize: size });
          },
        }}
        size="small"
        bordered
        summary={() => {
          const saleTypeTotals = summaryData.reduce<Record<string, number>>((acc, row) => {
            acc[row.saleType] = (acc[row.saleType] || 0) + row.orderTotal;
            return acc;
          }, {});

          return (
            <>
              {Object.entries(saleTypeTotals).map(([type, total]) => (
                <Table.Summary.Row key={type} style={{ background: '#f5f5f5' }}>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <strong>{type} Total</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong>
                      {total < 0 ? (
                        <span style={{ color: 'red' }}>
                          {total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      )}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              ))}
              <Table.Summary.Row style={{ background: '#fafafa' }}>
                <Table.Summary.Cell index={0} colSpan={5}>
                  <strong>Grand Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <strong>
                    {grandTotal < 0 ? (
                      <span style={{ color: 'red' }}>
                        {grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      grandTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    )}
                  </strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </>
          );
        }}
      />
    </Card>
  );
};

export default SalesGroupedReportSummary;