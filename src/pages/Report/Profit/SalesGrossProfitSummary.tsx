import React, { useState, useMemo } from 'react';
import { Table, Typography, Card, Button, Tag } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SalesGrossProfitItem } from '../../../types/reports';

const { Title, Text } = Typography;

interface SummaryRow {
  key: string;
  itemCode: string;
  description: string;
  quantity: number;
  salesValue: number;
  costValue: number;
  grossProfit: number;
  marginPercent: number;
  isGroup: boolean;
  children?: SummaryRow[];
}

interface Props {
  data?: SalesGrossProfitItem[];
  loading?: boolean;
}

const SalesGrossProfitSummary: React.FC<Props> = ({ data = [], loading = false }) => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const summaryData = useMemo(() => {
    const map = new Map<string, {
      description: string;
      quantity: number;
      salesValue: number;
      costValue: number;
      grossProfit: number;
      warehouses: Map<string, { quantity: number; salesValue: number; costValue: number; grossProfit: number; }>;
    }>();

    safeData.forEach(item => {
      const code = item.item_code || 'UNKNOWN';
      const wh = item.warehouse_code || 'N/A';
      const sales = item.sales_value || 0;
      const cost = item.cost_value || 0;
      const profit = item.gross_profit ?? (sales - cost);
      const qty = item.quantity || 0;

      if (!map.has(code)) {
        map.set(code, {
          description: item.description || '',
          quantity: 0,
          salesValue: 0,
          costValue: 0,
          grossProfit: 0,
          warehouses: new Map(),
        });
      }

      const curr = map.get(code)!;
      curr.quantity += qty;
      curr.salesValue += sales;
      curr.costValue += cost;
      curr.grossProfit += profit;

      if (!curr.warehouses.has(wh)) {
        curr.warehouses.set(wh, { quantity: 0, salesValue: 0, costValue: 0, grossProfit: 0 });
      }

      const whCurr = curr.warehouses.get(wh)!;
      whCurr.quantity += qty;
      whCurr.salesValue += sales;
      whCurr.costValue += cost;
      whCurr.grossProfit += profit;
    });

    const rows: SummaryRow[] = [];
    map.forEach((val, code) => {
      const children: SummaryRow[] = [];
      val.warehouses.forEach((whVal, whCode) => {
        children.push({
          key: `${code}-${whCode}`,
          itemCode: `Warehouse: ${whCode}`,
          description: `Location break for ${code}`,
          quantity: whVal.quantity,
          salesValue: whVal.salesValue,
          costValue: whVal.costValue,
          grossProfit: whVal.grossProfit,
          marginPercent: whVal.salesValue > 0 ? (whVal.grossProfit / whVal.salesValue) * 100 : 0,
          isGroup: false,
        });
      });

      rows.push({
        key: code,
        itemCode: code,
        description: val.description,
        quantity: val.quantity,
        salesValue: val.salesValue,
        costValue: val.costValue,
        grossProfit: val.grossProfit,
        marginPercent: val.salesValue > 0 ? (val.grossProfit / val.salesValue) * 100 : 0,
        isGroup: true,
        children: children.length > 1 ? children : undefined,
      });
    });

    return rows;
  }, [safeData]);

  const grandTotals = useMemo(() => {
    return summaryData.reduce(
      (acc, curr) => {
        acc.qty += curr.quantity;
        acc.sales += curr.salesValue;
        acc.cost += curr.costValue;
        acc.profit += curr.grossProfit;
        return acc;
      },
      { qty: 0, sales: 0, cost: 0, profit: 0 }
    );
  }, [summaryData]);

  const grandMargin = grandTotals.sales > 0 ? (grandTotals.profit / grandTotals.sales) * 100 : 0;

  const columns: ColumnsType<SummaryRow> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      render: (val, record) => <Text strong={record.isGroup}>{val}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Total Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (val) => val.toLocaleString(),
    },
    {
      title: 'Total Sales (Ksh)',
      dataIndex: 'salesValue',
      key: 'salesValue',
      align: 'right',
      render: (val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: 'Total Cost (Ksh)',
      dataIndex: 'costValue',
      key: 'costValue',
      align: 'right',
      render: (val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: 'Gross Profit (Ksh)',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      align: 'right',
      render: (val) => {
        const color = val > 0 ? '#3f8600' : val < 0 ? '#cf1322' : '#595959';
        return <Text style={{ color, fontWeight: 'bold' }}>{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>;
      },
    },
    {
      title: 'Margin %',
      dataIndex: 'marginPercent',
      key: 'marginPercent',
      align: 'right',
      render: (val) => {
        const color = val > 0 ? 'green' : val < 0 ? 'red' : 'default';
        return <Tag color={color}>{val.toFixed(2)}%</Tag>;
      },
    },
  ];

  return (
    <Card loading={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>Sales Profit Summary by Item</Title>
        <div>
          <Button size="small" onClick={() => setExpandedRows(summaryData.map(i => i.key))} style={{ marginRight: 8 }}>
            Expand All
          </Button>
          <Button size="small" onClick={() => setExpandedRows([])}>Collapse All</Button>
        </div>
      </div>

      <Table<SummaryRow>
        columns={columns}
        dataSource={summaryData}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        size="middle"
        bordered
        expandable={{
          expandedRowKeys: expandedRows,
          onExpand: (expanded, record) => {
            setExpandedRows(prev => expanded ? [...prev, record.key] : prev.filter(k => k !== record.key));
          },
          expandIcon: ({ expanded, onExpand, record }) =>
            record.children ? (
              <Button type="text" size="small" onClick={e => onExpand(record, e)} style={{ marginRight: 8 }}>
                {expanded ? <DownOutlined /> : <RightOutlined />}
              </Button>
            ) : null,
        }}
        summary={() => (
          <Table.Summary.Row style={{ background: '#f0f9ff' }}>
            <Table.Summary.Cell index={0} colSpan={2}>
              <Text strong>Grand Total</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right"><Text strong>{grandTotals.qty.toLocaleString()}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right"><Text strong>{grandTotals.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right"><Text strong>{grandTotals.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">
              <Text style={{ color: grandTotals.profit >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}>
                {grandTotals.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
              <Tag color={grandMargin >= 0 ? 'green' : 'red'}>{grandMargin.toFixed(2)}%</Tag>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
};

export default SalesGrossProfitSummary;