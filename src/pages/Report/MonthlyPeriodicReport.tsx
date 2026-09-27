import React, { useState, useEffect, useMemo } from "react";
import { Container } from "reactstrap";
import { ToastContainer } from "react-toastify";
import {
  Card,
  Select,
  Button,
  Table,
  Space,
  Typography,
  Row,
  Col,
  message,
  Input,
  Tag,
} from "antd";
import {
  ReloadOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  FileExcelOutlined,
  SearchOutlined,
  DownOutlined,
  RightOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

import { usePeriodicInventorySummary } from "../../Components/Hooks/useReports";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { useCategories } from "../../Components/Hooks/useCategory";
import {
  PeriodicInventorySummaryItem,
  PeriodicInventorySummaryQueryParams,
} from "../../types/reports";
import { StockItem } from "../../types/stockitem";
import { Category } from "../../types/category";

const { Title, Text } = Typography;
const { Option } = Select;

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const startYear = 2025;
const years = Array.from(
  { length: Math.max(1, currentYear - startYear + 1) },
  (_, i) => startYear + i
);

interface ProcessedPeriodicItem extends PeriodicInventorySummaryItem {
  key: string;
  categoryName: string;
  categoryId: string;
  isGroupHeader?: boolean;
  groupLabel?: string;
  itemCount?: number;
  parentGroup?: string;
}

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  items: ProcessedPeriodicItem[];
}

const MonthlyPeriodicReport: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    months[new Date().getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [queryParams, setQueryParams] = useState<PeriodicInventorySummaryQueryParams | null>(null);

  const [filteredData, setFilteredData] = useState<ProcessedPeriodicItem[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [searchText, setSearchText] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch Hooks
  const {
    data: rawPeriodicData = [],
    isLoading: loadingPeriodic,
    isFetching,
    refetch,
  } = usePeriodicInventorySummary(queryParams ?? undefined);

  const { data: stockItems = [] } = useStockItems();
  const { data: categories = [] } = useCategories();

  // Create fast lookup maps
  const stockItemMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    if (Array.isArray(stockItems)) {
      stockItems.forEach((item) => {
        const code = item.itemCode || (item as any).item_code;
        if (code) map.set(String(code).toLowerCase(), item);
      });
    }
    return map;
  }, [stockItems]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    const categoryList = Array.isArray(categories)
      ? categories
      : (categories as any)?.categories ?? [];

    categoryList.forEach((cat: Category) => {
      map.set(cat.categoryId, cat.categoryName);
    });

    return map;
  }, [categories]);

  // Combine endpoint output with StockItem catalog to associate Categories
  const enrichedPeriodicData = useMemo(() => {
    const rows: PeriodicInventorySummaryItem[] = Array.isArray(rawPeriodicData)
      ? rawPeriodicData
      : [];

    return rows.map((item, index) => {
      const itemCode = item.itemCode || (item as any).item_code || "";
      const codeKey = String(itemCode).toLowerCase();
      const matchedCatalogItem = stockItemMap.get(codeKey);

      let catId = matchedCatalogItem?.categoryId || "uncategorized";
      let catName = "Uncategorized";

      if (matchedCatalogItem?.categoryName) {
        catName = matchedCatalogItem.categoryName;
      } else if (
        matchedCatalogItem?.category &&
        typeof matchedCatalogItem.category === "object" &&
        "name" in matchedCatalogItem.category
      ) {
        catName = (matchedCatalogItem.category as any).name;
      } else if (catId !== "uncategorized" && categoryMap.has(catId)) {
        catName = categoryMap.get(catId)!;
      }

      return {
        ...item,
        key: `item-${itemCode || index}-${index}`,
        itemCode,
        categoryId: catId,
        categoryName: catName,
      } as ProcessedPeriodicItem;
    });
  }, [rawPeriodicData, stockItemMap, categoryMap]);

  // Group items by category name
  const processedDataGroups = useMemo(() => {
    const groups: Record<string, CategoryGroup> = {};

    enrichedPeriodicData.forEach((item) => {
      const groupKey = item.categoryName || "Uncategorized";

      if (!groups[groupKey]) {
        groups[groupKey] = {
          categoryId: item.categoryId,
          categoryName: groupKey,
          items: [],
        };
      }
      groups[groupKey].items.push(item);
    });

    return groups;
  }, [enrichedPeriodicData]);

  // Auto-expand all groups on data load
  useEffect(() => {
    const groupKeys = Object.keys(processedDataGroups);
    if (groupKeys.length > 0) {
      setExpandedGroups(new Set(groupKeys));
    }
  }, [processedDataGroups]);

  // Filter and flatten grouped data for rendering
  useEffect(() => {
    const flatData: ProcessedPeriodicItem[] = [];

    Object.values(processedDataGroups).forEach((group) => {
      const groupLabel = group.categoryName;
      const q = searchText.toLowerCase();

      const groupMatchesSearch = !searchText || groupLabel.toLowerCase().includes(q);

      const filteredItems = group.items.filter(
        (item) =>
          !searchText ||
          (item.itemCode || (item as any).item_code)?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );

      if (filteredItems.length > 0 || groupMatchesSearch) {
        flatData.push({
          key: `group-${groupLabel}`,
          isGroupHeader: true,
          categoryName: groupLabel,
          groupLabel,
          itemCount: filteredItems.length,
          itemCode: "",
          description: "",
          stockUom: "",
          openingBalance: 0,
          receipts: 0,
          sales: 0,
          expenses: 0,
          adjustments: 0,
          closingBalance: 0,
          categoryId: group.categoryId,
        } as ProcessedPeriodicItem);

        if (expandedGroups.has(groupLabel)) {
          filteredItems.forEach((item) => {
            flatData.push({
              ...item,
              isGroupHeader: false,
              parentGroup: groupLabel,
            });
          });
        }
      }
    });

    setFilteredData(flatData);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [processedDataGroups, searchText, expandedGroups]);

  const handleLoadData = () => {
    const monthIndex = months.indexOf(selectedMonth);
    const yearStr = selectedYear;
    const monthStr = String(monthIndex + 1).padStart(2, "0");
    const lastDayStr = String(
      new Date(selectedYear, monthIndex + 1, 0).getDate()
    ).padStart(2, "0");

    setQueryParams({
      fromDate: `${yearStr}-${monthStr}-01`,
      toDate: `${yearStr}-${monthStr}-${lastDayStr}`,
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(Object.keys(processedDataGroups)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const toggleGroup = (groupLabel: string) => {
    const next = new Set(expandedGroups);
    if (next.has(groupLabel)) next.delete(groupLabel);
    else next.add(groupLabel);
    setExpandedGroups(next);
  };

  // Grand Totals calculation across non-header records
  const totals = useMemo(() => {
    const nonHeaders = filteredData.filter((item) => !item.isGroupHeader);
    return nonHeaders.reduce(
      (acc, curr) => {
        acc.opening += Number(curr.openingBalance ?? (curr as any).opening_balance ?? 0);
        acc.receipts += Number(curr.receipts ?? 0);
        acc.sales += Number(curr.sales ?? 0);
        acc.expenses += Number(curr.expenses ?? 0);
        acc.adjustments += Number(curr.adjustments ?? 0);
        acc.closing += Number(curr.closingBalance ?? (curr as any).closing_balance ?? 0);
        return acc;
      },
      {
        opening: 0,
        receipts: 0,
        sales: 0,
        expenses: 0,
        adjustments: 0,
        closing: 0,
      }
    );
  }, [filteredData]);

  const fmt = (v: number) =>
    (v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const numberStyle: React.CSSProperties = {
    fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
    fontVariantNumeric: "tabular-nums",
    fontSize: "12px",
  };

  const columns = [
    {
      title: "Stock Code",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 130,
      fixed: "left" as const,
      render: (_: any, record: ProcessedPeriodicItem) =>
        record.isGroupHeader ? null : (
          <Text strong style={{ fontSize: "12px", color: "#096dd9" }}>
            {record.itemCode || (record as any).item_code || "N/A"}
          </Text>
        ),
      sorter: (a: ProcessedPeriodicItem, b: ProcessedPeriodicItem) =>
        (a.itemCode || "").localeCompare(b.itemCode || ""),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 210,
      ellipsis: true,
      render: (value: any, record: ProcessedPeriodicItem) =>
        record.isGroupHeader ? null : (
          <span style={{ fontSize: "12px", color: "#262626" }}>{value || "N/A"}</span>
        ),
    },
    {
      title: "UOM",
      dataIndex: "stockUom",
      key: "stockUom",
      width: 80,
      align: "center" as const,
      render: (_: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        const uom = record.stockUom || (record as any).stock_uom;
        return <Tag style={{ fontSize: "10px", margin: 0 }}>{uom || "N/A"}</Tag>;
      },
    },
    {
      title: "OB Qty",
      dataIndex: "openingBalance",
      key: "openingBalance",
      align: "right" as const,
      width: 100,
      render: (_: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        const val = record.openingBalance ?? (record as any).opening_balance ?? 0;
        return <span style={numberStyle}>{fmt(Number(val))}</span>;
      },
      sorter: (a: ProcessedPeriodicItem, b: ProcessedPeriodicItem) =>
        (a.openingBalance ?? 0) - (b.openingBalance ?? 0),
    },
    {
      title: "Receipts",
      dataIndex: "receipts",
      key: "receipts",
      align: "right" as const,
      width: 100,
      render: (_: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return <span style={numberStyle}>{fmt(Number(record.receipts ?? 0))}</span>;
      },
      sorter: (a: ProcessedPeriodicItem, b: ProcessedPeriodicItem) =>
        (a.receipts ?? 0) - (b.receipts ?? 0),
    },
    {
      title: "Sales",
      dataIndex: "sales",
      key: "sales",
      align: "right" as const,
      width: 100,
      render: (_: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return <span style={numberStyle}>{fmt(Number(record.sales ?? 0))}</span>;
      },
      sorter: (a: ProcessedPeriodicItem, b: ProcessedPeriodicItem) =>
        (a.sales ?? 0) - (b.sales ?? 0),
    },
    {
      title: "Expenses",
      dataIndex: "expenses",
      key: "expenses",
      align: "right" as const,
      width: 100,
      render: (_: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return <span style={numberStyle}>{fmt(Number(record.expenses ?? 0))}</span>;
      },
      sorter: (a: ProcessedPeriodicItem, b: ProcessedPeriodicItem) =>
        (a.expenses ?? 0) - (b.expenses ?? 0),
    },
    {
      title: "Adjustments",
      dataIndex: "adjustments",
      key: "adjustments",
      align: "right" as const,
      width: 105,
      render: (_: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return <span style={numberStyle}>{fmt(Number(record.adjustments ?? 0))}</span>;
      },
      sorter: (a: ProcessedPeriodicItem, b: ProcessedPeriodicItem) =>
        (a.adjustments ?? 0) - (b.adjustments ?? 0),
    },
    {
      title: "Closing Balance",
      dataIndex: "closingBalance",
      key: "closingBalance",
      align: "right" as const,
      width: 125,
      fixed: "right" as const,
      render: (_: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        const val = Number(
          record.closingBalance ?? (record as any).closing_balance ?? 0
        );
        return (
          <Text
            strong
            style={{
              ...numberStyle,
              color: val < 0 ? "#cf1322" : val > 0 ? "#3f8600" : "#1f1f1f",
            }}
          >
            {fmt(val)}
          </Text>
        );
      },
      sorter: (a: ProcessedPeriodicItem, b: ProcessedPeriodicItem) =>
        (a.closingBalance ?? 0) - (b.closingBalance ?? 0),
    },
  ];

  const components = {
    body: {
      row: (props: any) => {
        const { children, ...restProps } = props;
        const record = restProps["data-row-key"]
          ? filteredData.find((item) => item.key === restProps["data-row-key"])
          : null;

        if (record && record.isGroupHeader) {
          const isExpanded = expandedGroups.has(record.categoryName);
          return (
            <tr {...restProps}>
              <td
                colSpan={columns.length}
                style={{
                  backgroundColor: "#e6f7ff",
                  fontWeight: 600,
                  fontSize: "13px",
                  padding: "8px 12px",
                  borderBottom: "2px solid #1890ff",
                  cursor: "pointer",
                }}
                onClick={() => toggleGroup(record.categoryName)}
              >
                <Space align="center">
                  {isExpanded ? (
                    <DownOutlined style={{ color: "#1890ff" }} />
                  ) : (
                    <RightOutlined style={{ color: "#1890ff" }} />
                  )}
                  <FolderOpenOutlined style={{ color: "#1890ff" }} />
                  <span style={{ color: "#003a8c" }}>{record.groupLabel}</span>
                  <Tag color="blue" style={{ marginLeft: "6px", fontSize: "11px" }}>
                    {record.itemCount} {record.itemCount === 1 ? "item" : "items"}
                  </Tag>
                </Space>
              </td>
            </tr>
          );
        }
        return <tr {...restProps}>{children}</tr>;
      },
    },
  };

  const handleExportToExcel = () => {
    if (enrichedPeriodicData.length === 0) {
      message.warning("No periodic summary data available to export");
      return;
    }

    try {
      const exportData = enrichedPeriodicData.map((item) => ({
        Category: item.categoryName || "Uncategorized",
        "Stock Code": item.itemCode || (item as any).item_code || "N/A",
        Description: item.description || "N/A",
        UOM: item.stockUom || (item as any).stock_uom || "N/A",
        "Opening Balance": item.openingBalance ?? (item as any).opening_balance ?? 0,
        Receipts: item.receipts ?? 0,
        Sales: item.sales ?? 0,
        Expenses: item.expenses ?? 0,
        Adjustments: item.adjustments ?? 0,
        "Closing Balance": item.closingBalance ?? (item as any).closing_balance ?? 0,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws["!cols"] = [
        { wch: 20 },
        { wch: 16 },
        { wch: 30 },
        { wch: 10 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Periodic Summary");
      XLSX.writeFile(
        wb,
        `Periodic_Summary_${selectedMonth}_${selectedYear}.xlsx`
      );
      message.success("Periodic summary exported successfully!");
    } catch (err) {
      message.error("Failed to export periodic summary to Excel");
    }
  };

  const isDataLoading = loadingPeriodic || isFetching;

  return (
    <div
      className="page-content position-relative"
      style={{
        zIndex: 1,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <Container fluid className="px-2 px-md-3">
        {/* Header Control Card with Wrap-enabled Responsive Flex Toolbar */}
        <Card
          size="small"
          className="shadow-sm border-0 mb-3"
          bodyStyle={{ padding: "10px 14px" }}
        >
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            {/* Title Section */}
            <Col xs={24} md={7} lg={6}>
              <Title level={5} style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
                <FileSearchOutlined style={{ color: "#1890ff", marginRight: "8px" }} />
                Periodic Inventory Summary
              </Title>
            </Col>

            {/* Responsive Flex Control Toolbar */}
            <Col xs={24} md={17} lg={18}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Select
                  size="small"
                  style={{ width: "120px" }}
                  placeholder="Month"
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  suffixIcon={<CalendarOutlined style={{ color: "#8c8c8c" }} />}
                >
                  {months.map((m) => (
                    <Option key={m} value={m}>
                      {m}
                    </Option>
                  ))}
                </Select>

                <Select
                  size="small"
                  style={{ width: "90px" }}
                  placeholder="Year"
                  value={selectedYear}
                  onChange={setSelectedYear}
                >
                  {years.map((y) => (
                    <Option key={y} value={y}>
                      {y}
                    </Option>
                  ))}
                </Select>

                <Input
                  placeholder="Search code or desc..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: "100%", maxWidth: "200px", minWidth: "140px" }}
                />

                <Button
                  type="primary"
                  onClick={handleLoadData}
                  loading={isDataLoading}
                  icon={<ReloadOutlined />}
                  size="small"
                >
                  {isDataLoading ? "Loading" : "Load Periodical"}
                </Button>

                <Button
                  type="default"
                  onClick={handleExportToExcel}
                  icon={<FileExcelOutlined style={{ color: "#52c41a" }} />}
                  disabled={enrichedPeriodicData.length === 0}
                  size="small"
                >
                  Export
                </Button>

                <Button.Group size="small">
                  <Button onClick={expandAll}>Expand All</Button>
                  <Button onClick={collapseAll}>Collapse All</Button>
                </Button.Group>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Main Table Card */}
        <Card size="small" className="shadow-sm border-0" bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            components={components}
            rowKey="key"
            loading={isDataLoading}
            bordered
            size="small"
            scroll={{ x: 1000 }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredData.length,
              showSizeChanger: true,
              responsive: true,
              size: "small",
              pageSizeOptions: ["10", "20", "50", "100", "200"],
              onChange: (page, pageSize) =>
                setPagination({ current: page, pageSize }),
              style: { padding: "8px 12px", margin: 0 },
            }}
            locale={{
              emptyText:
                "No data available. Select a month and year, then click 'Load Periodical'.",
            }}
          />

          {/* Dynamic Grand Totals Footer */}
          {filteredData.length > 0 && (
            <div
              style={{
                borderTop: "2px solid #1890ff",
                backgroundColor: "#e6f7ff",
                padding: "8px 14px",
              }}
            >
              <Row gutter={[12, 8]} align="middle" justify="space-between">
                <Col xs={24} sm={6}>
                  <Text strong style={{ fontSize: "12px", color: "#1f1f1f" }}>
                    Grand Totals ({enrichedPeriodicData.length} Items)
                  </Text>
                </Col>

                <Col xs={24} sm={18}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "16px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
                        OB Qty
                      </Text>
                      <Text strong style={numberStyle}>
                        {fmt(totals.opening)}
                      </Text>
                    </div>

                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
                        Receipts
                      </Text>
                      <Text strong style={numberStyle}>
                        {fmt(totals.receipts)}
                      </Text>
                    </div>

                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
                        Sales
                      </Text>
                      <Text strong style={numberStyle}>
                        {fmt(totals.sales)}
                      </Text>
                    </div>

                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
                        Expenses
                      </Text>
                      <Text strong style={numberStyle}>
                        {fmt(totals.expenses)}
                      </Text>
                    </div>

                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
                        Adjustments
                      </Text>
                      <Text strong style={numberStyle}>
                        {fmt(totals.adjustments)}
                      </Text>
                    </div>

                    <div>
                      <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
                        Closing Balance
                      </Text>
                      <Text
                        strong
                        style={{
                          ...numberStyle,
                          color:
                            totals.closing < 0
                              ? "#cf1322"
                              : totals.closing > 0
                              ? "#3f8600"
                              : "#1f1f1f",
                        }}
                      >
                        {fmt(totals.closing)}
                      </Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Card>
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default MonthlyPeriodicReport;