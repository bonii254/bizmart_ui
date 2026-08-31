import React, { useState, useMemo } from "react";
import { 
  Table, 
  Typography, 
  Card, 
  Button, 
  Select, 
  Row, 
  Col, 
  Input, 
  Space, 
  Tag 
} from "antd";
import { 
  DownOutlined, 
  RightOutlined, 
  SearchOutlined, 
  ReloadOutlined, 
  FileExcelOutlined 
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

const EMPTY_REPORT_DATA: StockTakeReportItem[] = [];

// Domain & Data Types
export interface StockTakeDefinition {
  stockTakeId: string | number;
  stDescription: string;
  warehouse?: string;
  status?: string;
}

export interface StockTakeReportItem {
  entryId?: string | number;
  stockCode?: string;
  itemCode?: string;
  item_code?: string;
  stockDescription?: string;
  description?: string;
  qntyCaptured?: number;
  quantityCaptured?: number;
  productClass?: string;
  productClassDescr?: string;
  categoryName?: string;
  categoryCode?: string;
}

export interface StockTakeTableRow {
  key: string;
  stockCode: string;
  stockDescription: string;
  qntyCaptured: number;
  isGroup: boolean;
  groupLabel?: string;
  children?: StockTakeTableRow[];
}

interface Props {
  definitions?: StockTakeDefinition[];
  reportData?: StockTakeReportItem[];
  loadingDefs?: boolean;
  loadingReport?: boolean;
  selectedStockTakeId?: string | number | null;
  onSelectStockTake?: (id: string | number | null) => void;
  onLoadReport?: () => void;
  onExportExcel?: () => void;
}

const StockTakeReport: React.FC<Props> = ({
  definitions = [],
  reportData = [],
  loadingDefs = false,
  loadingReport = false,
  selectedStockTakeId = null,
  onSelectStockTake,
  onLoadReport,
  onExportExcel,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const safeReportData = Array.isArray(reportData) ? reportData : EMPTY_REPORT_DATA;

  const filteredData = useMemo(() => {
    if (!searchQuery) return safeReportData;
    const q = searchQuery.toLowerCase();
    return safeReportData.filter((item) => {
      const code = item.stockCode || item.itemCode || item.item_code || "";
      const desc = item.stockDescription || item.description || "";
      const cat = item.productClassDescr || item.categoryName || item.productClass || "";
      return (
        code.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      );
    });
  }, [safeReportData, searchQuery]);

  // Transform flat array into category/product-class grouped tree structure
  const groupedData = useMemo<StockTakeTableRow[]>(() => {
    const groups = new Map<string, StockTakeTableRow[]>();

    for (const item of filteredData) {
      const catName = item.productClassDescr || item.categoryName || item.productClass || "Uncategorized";
      const catCode = item.productClass || item.categoryCode || "";
      const groupKey = catCode ? `${catCode} - ${catName}` : catName;

      const code = item.stockCode || item.itemCode || item.item_code || "UNKNOWN";
      const desc = item.stockDescription || item.description || "";
      const qty = item.qntyCaptured ?? item.quantityCaptured ?? 0;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }

      groups.get(groupKey)!.push({
        key: String(item.entryId || `${groupKey}-${code}`),
        stockCode: code,
        stockDescription: desc,
        qntyCaptured: qty,
        isGroup: false,
      });
    }

    const result: StockTakeTableRow[] = [];

    groups.forEach((children: StockTakeTableRow[], groupKey: string) => {
      const groupTotalQty = children.reduce(
        (sum: number, c: StockTakeTableRow) => sum + c.qntyCaptured, 
        0
      );
    
      result.push({
        key: `group-${groupKey}`,
        stockCode: groupKey,
        groupLabel: groupKey,
        stockDescription: `Total Items: ${children.length}`,
        qntyCaptured: groupTotalQty,
        isGroup: true,
        children,
      });
    });
    
    return result;
  }, [filteredData]);

  const grandTotalQty = useMemo(() => {
    return safeReportData.reduce(
      (sum, item) => sum + (item.qntyCaptured ?? item.quantityCaptured ?? 0),
      0
    );
  }, [safeReportData]);

  const columns: ColumnsType<StockTakeTableRow> = [
    {
      title: "Product Class / Category",
      dataIndex: "stockCode",
      key: "stockCode",
      width: 280,
      render: (val, record) => {
        if (record.isGroup) {
          return <Text strong>{record.groupLabel}</Text>;
        }
        return <Text style={{ paddingLeft: 24 }}>{val}</Text>;
      },
    },
    {
      title: "Description",
      dataIndex: "stockDescription",
      key: "stockDescription",
      render: (val, record) => {
        if (record.isGroup) {
          return <Tag color="blue">{val}</Tag>;
        }
        return val;
      },
    },
    {
      title: "Quantity Captured",
      dataIndex: "qntyCaptured",
      key: "qntyCaptured",
      align: "right",
      width: 180,
      sorter: (a, b) => a.qntyCaptured - b.qntyCaptured,
      render: (val, record) => (
        <Text strong={record.isGroup} style={{ color: record.isGroup ? "#096dd9" : undefined }}>
          {(val || 0).toLocaleString()}
        </Text>
      ),
    },
  ];

  const expandAll = () => {
    setExpandedKeys(groupedData.map((g) => g.key));
  };

  const collapseAll = () => {
    setExpandedKeys([]);
  };

  const handleExpand = (expanded: boolean, record: StockTakeTableRow) => {
    if (expanded) {
      setExpandedKeys((prev) => [...prev, record.key]);
    } else {
      setExpandedKeys((prev) => prev.filter((k) => k !== record.key));
    }
  };

  return (
    <div className="page-content" style={{ paddingTop: 120 }}>
      <div className="container-fluid">
        <Card loading={loadingDefs}>
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={24} lg={6}>
              <Title level={4} style={{ margin: 0 }}>
                Stock Take Report
              </Title>
            </Col>

            <Col xs={24} lg={18}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }} wrap>
                <Select
                  style={{ width: 220 }}
                  placeholder="Select Stock Take"
                  loading={loadingDefs}
                  value={selectedStockTakeId}
                  onChange={(v) => onSelectStockTake && onSelectStockTake(v)}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={definitions.map((st) => ({
                    value: st.stockTakeId,
                    label: st.stDescription,
                  }))}
                />

                <Input
                  placeholder="Search code / item..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 180 }}
                  allowClear
                />

                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={onLoadReport}
                  loading={loadingReport}
                  disabled={!selectedStockTakeId}
                >
                  Load Report
                </Button>

                <Button size="middle" onClick={expandAll}>
                  Expand All
                </Button>
                <Button size="middle" onClick={collapseAll}>
                  Collapse All
                </Button>

                {onExportExcel && (
                  <Button type="default" icon={<FileExcelOutlined />} onClick={onExportExcel}>
                    Export
                  </Button>
                )}
              </Space>
            </Col>
          </Row>

          <Table<StockTakeTableRow>
            size="middle"
            columns={columns}
            dataSource={groupedData}
            loading={loadingReport}
            bordered
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} product classes`,
            }}
            expandable={{
              expandedRowKeys: expandedKeys,
              onExpand: handleExpand,
              expandIcon: ({ expanded, onExpand, record }) =>
                record.isGroup ? (
                  <Button
                    type="text"
                    size="small"
                    onClick={(e) => onExpand(record, e)}
                    style={{ marginRight: 8 }}
                  >
                    {expanded ? <DownOutlined /> : <RightOutlined />}
                  </Button>
                ) : null,
            }}
            rowClassName={(record) => (record.isGroup ? "group-header-row" : "stock-item-row")}
            summary={() => (
              <Table.Summary.Row style={{ background: "#f0f9ff" }}>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong>Grand Total Captured Quantity</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: "#096dd9" }}>
                    {grandTotalQty.toLocaleString()}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />

          <style>{`
            .group-header-row > td {
              background-color: #fafafa !important;
              font-weight: 600;
            }
          `}</style>
        </Card>
      </div>
    </div>
  );
};

export default StockTakeReport;