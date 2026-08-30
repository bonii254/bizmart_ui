import React, { useState } from "react";
import { Table, Typography, Card, Button } from "antd";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { 
  SalesPerItemReportResponse, 
  SummaryClassAccumulator, 
  SummaryTableRow 
} from "../../../types/reports";

const { Title, Text } = Typography;

interface Props {
  data?: SalesPerItemReportResponse[];
  loading?: boolean;
}

const SalesGroupedItemReportSummary: React.FC<Props> = ({ data = [], loading = false }) => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const safeData = Array.isArray(data) ? data : [];

  const productClassSummary = safeData.reduce<Record<string, SummaryClassAccumulator>>((acc, item) => {
    const productClass = item.productClassDescription || 'General';
    const productClassDescr = item.productClassDescription || 'General Items';
    const stockCode = item.itemCode || item.item_code || item.itemId || 'UNKNOWN';
    const qty = item.quantity || 0;
    const lineVal = item.lineTotal ?? item.line_total ?? ((item.unitPrice || item.unit_price || 0) * qty);
    
    if (!acc[productClass]) {
      acc[productClass] = {
        description: productClassDescr,
        totalQty: 0,
        totalValue: 0,
        items: {}
      };
    }
    
    acc[productClass].totalQty += qty;
    acc[productClass].totalValue += lineVal;
    
    if (!acc[productClass].items[stockCode]) {
      acc[productClass].items[stockCode] = {
        description: item.description || '',
        totalQty: 0,
        totalValue: 0,
      };
    }
    
    acc[productClass].items[stockCode].totalQty += qty;
    acc[productClass].items[stockCode].totalValue += lineVal;
    
    return acc;
  }, {});

  const topLevelData: SummaryTableRow[] = Object.entries(productClassSummary).map(
    ([productClass, classData]) => ({
      key: productClass,
      stockCode: productClass,
      description: classData.description,
      totalQty: classData.totalQty,
      totalValue: classData.totalValue,
      isProductClass: true,
      children: Object.entries(classData.items).map(([stockCode, itemData]) => ({
        key: `${productClass}-${stockCode}`,
        stockCode: stockCode,
        description: itemData.description,
        totalQty: itemData.totalQty,
        totalValue: itemData.totalValue,
        isProductClass: false,
      }))
    })
  );

  const grandTotalQty = topLevelData.reduce((sum, item) => sum + item.totalQty, 0);
  const grandTotalValue = topLevelData.reduce((sum, item) => sum + item.totalValue, 0);

  const columns: ColumnsType<SummaryTableRow> = [
    {
      title: 'Product Class / Stock Code',
      dataIndex: 'stockCode',
      key: 'stockCode',
      sorter: (a, b) => a.stockCode.localeCompare(b.stockCode),
      render: (value, record) => {
        if (record.isProductClass) {
          return (
            <Text strong>
              {value} - {record.description}
            </Text>
          );
        }
        return (
          <Text style={{ paddingLeft: 24 }}>
            {value}
          </Text>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => {
        if (record.isProductClass) {
          return <Text strong>Product Class Total</Text>;
        }
        return value;
      },
    },
    {
      title: 'Total Quantity',
      dataIndex: 'totalQty',
      key: 'totalQty',
      align: 'right',
      sorter: (a, b) => a.totalQty - b.totalQty,
      render: (value, record) => (
        <Text strong={record.isProductClass}>
          {value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Total Value (Ksh)',
      dataIndex: 'totalValue',
      key: 'totalValue',
      align: 'right',
      sorter: (a, b) => a.totalValue - b.totalValue,
      render: (value, record) => (
        <Text strong={record.isProductClass}>
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </Text>
      ),
    },
  ];

  const expandAll = () => {
    setExpandedRows(topLevelData.map(item => item.key));
  };

  const collapseAll = () => {
    setExpandedRows([]);
  };

  const handleExpand = (expanded: boolean, record: SummaryTableRow) => {
    if (expanded) {
      setExpandedRows(prev => [...prev, record.key]);
    } else {
      setExpandedRows(prev => prev.filter(key => key !== record.key));
    }
  };

  return (
    <Card loading={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0 }}>
          Sales Summary by Product Class and Item
        </Title>
        <div>
          <Button 
            size="small" 
            onClick={expandAll}
            style={{ marginRight: 8 }}
          >
            Expand All
          </Button>
          <Button 
            size="small" 
            onClick={collapseAll}
          >
            Collapse All
          </Button>
        </div>
      </div>

      <Table<SummaryTableRow>
        columns={columns}
        dataSource={topLevelData}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} product classes`,
        }}
        size="middle"
        bordered
        expandable={{
          expandedRowKeys: expandedRows,
          onExpand: handleExpand,
          expandIcon: ({ expanded, onExpand, record }) =>
            record.isProductClass ? (
              <Button
                type="text"
                size="small"
                onClick={e => onExpand(record, e)}
                style={{ marginRight: 8 }}
              >
                {expanded ? <DownOutlined /> : <RightOutlined />}
              </Button>
            ) : null,
        }}
        rowClassName={(record) => 
          record.isProductClass ? 'product-class-row' : 'stock-item-row'
        }
        summary={() => (
          <Table.Summary.Row style={{ background: '#f0f9ff' }}>
            <Table.Summary.Cell index={0} colSpan={2}>
              <Text strong>Grand Total</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <Text strong>{grandTotalQty.toLocaleString()}</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right">
              <Text strong>
                {grandTotalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
};

export default SalesGroupedItemReportSummary;