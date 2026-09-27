import React, { useState, useEffect, useMemo } from "react";
import { Container } from "reactstrap";
import { ToastContainer } from "react-toastify";
import {
  Card,
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
  FileSearchOutlined,
  FileExcelOutlined,
  SearchOutlined,
  DownOutlined,
  RightOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

import { useStoreItemSummary } from "../../Components/Hooks/useReports";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { useCategories } from "../../Components/Hooks/useCategory";

import { StoreItemSummary } from "../../types/reports";
import { StockItem } from "../../types/stockitem";
import { Category } from "../../types/category";

const { Title, Text } = Typography;

interface ProcessedStoreItem {
  key: string;
  itemId?: string;
  itemCode: string;
  description: string;
  stockUom: string;
  sellingPrice: number;
  quantityOnHand: number;
  averageCost: number;
  inventoryValue: number;
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
  items: ProcessedStoreItem[];
}

const StoreItemSummaryReport: React.FC = () => {
  const [filteredData, setFilteredData] = useState<ProcessedStoreItem[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [searchText, setSearchText] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const {
    data: summaryItems = [],
    isLoading: loadingSummary,
    isFetching,
    isError,
    error,
    refetch,
  } = useStoreItemSummary();

  const { data: stockItems = [] } = useStockItems();
  const { data: categories = [] } = useCategories();

  // Stock items lookup map
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

  // Categories lookup map
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

  // Enrich raw summary items with category descriptions
  const enrichedSummaryData = useMemo(() => {
    const rows: StoreItemSummary[] = Array.isArray(summaryItems)
      ? summaryItems
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
        key: `item-${itemCode || index}-${index}`,
        itemId: item.itemId || (item as any).item_id,
        itemCode,
        description: item.description || "",
        stockUom: item.stockUom || (item as any).stock_uom || "",
        sellingPrice: Number(item.sellingPrice ?? (item as any).selling_price ?? 0),
        quantityOnHand: Number(
          item.quantityOnHand ?? (item as any).quantity_on_hand ?? 0
        ),
        averageCost: Number(item.averageCost ?? (item as any).average_cost ?? 0),
        inventoryValue: Number(
          item.inventoryValue ?? (item as any).inventory_value ?? 0
        ),
        categoryId: catId,
        categoryName: catName,
      } as ProcessedStoreItem;
    });
  }, [summaryItems, stockItemMap, categoryMap]);

  // Group enriched items by category
  const processedDataGroups = useMemo(() => {
    const groups: Record<string, CategoryGroup> = {};

    enrichedSummaryData.forEach((item) => {
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
  }, [enrichedSummaryData]);

  // Expand all category groups by default on initial load
  useEffect(() => {
    const groupKeys = Object.keys(processedDataGroups);
    if (groupKeys.length > 0) {
      setExpandedGroups(new Set(groupKeys));
    }
  }, [processedDataGroups]);

  // Flatten items and group headers for rendering
  useEffect(() => {
    const flatData: ProcessedStoreItem[] = [];

    Object.values(processedDataGroups).forEach((group) => {
      const groupLabel = group.categoryName;
      const q = searchText.toLowerCase();

      const groupMatchesSearch = !searchText || groupLabel.toLowerCase().includes(q);

      const filteredItems = group.items.filter(
        (item) =>
          !searchText ||
          item.itemCode?.toLowerCase().includes(q) ||
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
          sellingPrice: 0,
          quantityOnHand: 0,
          averageCost: 0,
          inventoryValue: 0,
          categoryId: group.categoryId,
        });

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

  // Dynamic Grand Totals calculation across non-header records
  const totals = useMemo(() => {
    const nonHeaders = filteredData.filter((item) => !item.isGroupHeader);
    return nonHeaders.reduce(
      (acc, curr) => {
        acc.totalQty += curr.quantityOnHand || 0;
        acc.totalValue += curr.inventoryValue || 0;
        return acc;
      },
      { totalQty: 0, totalValue: 0 }
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
      width: 140,
      fixed: "left" as const,
      render: (_: any, record: ProcessedStoreItem) =>
        record.isGroupHeader ? null : (
          <Text strong style={{ fontSize: "12px", color: "#096dd9" }}>
            {record.itemCode || "N/A"}
          </Text>
        ),
      sorter: (a: ProcessedStoreItem, b: ProcessedStoreItem) =>
        (a.itemCode || "").localeCompare(b.itemCode || ""),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 220,
      ellipsis: true,
      render: (value: any, record: ProcessedStoreItem) =>
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
      render: (_: any, record: ProcessedStoreItem) =>
        record.isGroupHeader ? null : (
          <Tag style={{ fontSize: "10px", margin: 0 }}>{record.stockUom || "N/A"}</Tag>
        ),
    },
    {
      title: "Selling Price (Ksh)",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      align: "right" as const,
      width: 130,
      render: (_: any, record: ProcessedStoreItem) => {
        if (record.isGroupHeader) return null;
        return <span style={numberStyle}>{fmt(record.sellingPrice)}</span>;
      },
      sorter: (a: ProcessedStoreItem, b: ProcessedStoreItem) =>
        a.sellingPrice - b.sellingPrice,
    },
    {
      title: "Qty On Hand",
      dataIndex: "quantityOnHand",
      key: "quantityOnHand",
      align: "right" as const,
      width: 120,
      render: (_: any, record: ProcessedStoreItem) => {
        if (record.isGroupHeader) return null;
        const qty = record.quantityOnHand || 0;
        const color = qty > 0 ? "#3f8600" : qty < 0 ? "#cf1322" : "#595959";
        return (
          <Text strong style={{ ...numberStyle, color }}>
            {fmt(qty)}
          </Text>
        );
      },
      sorter: (a: ProcessedStoreItem, b: ProcessedStoreItem) =>
        a.quantityOnHand - b.quantityOnHand,
    },
    {
      title: "Avg Cost (Ksh)",
      dataIndex: "averageCost",
      key: "averageCost",
      align: "right" as const,
      width: 120,
      render: (_: any, record: ProcessedStoreItem) => {
        if (record.isGroupHeader) return null;
        return <span style={numberStyle}>{fmt(record.averageCost)}</span>;
      },
      sorter: (a: ProcessedStoreItem, b: ProcessedStoreItem) =>
        a.averageCost - b.averageCost,
    },
    {
      title: "Inventory Value (Ksh)",
      dataIndex: "inventoryValue",
      key: "inventoryValue",
      align: "right" as const,
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: ProcessedStoreItem) => {
        if (record.isGroupHeader) return null;
        const val = record.inventoryValue || 0;
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
      sorter: (a: ProcessedStoreItem, b: ProcessedStoreItem) =>
        a.inventoryValue - b.inventoryValue,
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
    if (enrichedSummaryData.length === 0) {
      message.warning("No store item data available to export");
      return;
    }

    try {
      const exportData = enrichedSummaryData.map((item) => ({
        Category: item.categoryName || "Uncategorized",
        "Stock Code": item.itemCode || "N/A",
        Description: item.description || "N/A",
        UOM: item.stockUom || "N/A",
        "Selling Price (Ksh)": item.sellingPrice || 0,
        "Qty On Hand": item.quantityOnHand || 0,
        "Average Cost (Ksh)": item.averageCost || 0,
        "Inventory Value (Ksh)": item.inventoryValue || 0,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws["!cols"] = [
        { wch: 20 },
        { wch: 16 },
        { wch: 30 },
        { wch: 10 },
        { wch: 18 },
        { wch: 14 },
        { wch: 18 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Store Item Summary");
      XLSX.writeFile(
        wb,
        `Store_Item_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      message.success("Store item summary exported successfully!");
    } catch (err) {
      message.error("Failed to export store item summary to Excel");
    }
  };

  const isDataLoading = loadingSummary || isFetching;

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
        {/* Header Card with Non-Overflowing Responsive Flex Control Toolbar */}
        <Card
          size="small"
          className="shadow-sm border-0 mb-3"
          bodyStyle={{ padding: "10px 14px" }}
        >
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            {/* Title Section */}
            <Col xs={24} md={8} lg={7}>
              <Title level={5} style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
                <FileSearchOutlined style={{ color: "#1890ff", marginRight: "8px" }} />
                Store Item Summary Report
              </Title>
            </Col>

            {/* Responsive Flex Toolbar (Prevents Overflow on Laptops) */}
            <Col xs={24} md={16} lg={17}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Input
                  placeholder="Search code or description..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: "100%", maxWidth: "220px", minWidth: "160px" }}
                />

                <Button
                  type="primary"
                  onClick={() => refetch()}
                  loading={isDataLoading}
                  icon={<ReloadOutlined />}
                  size="small"
                >
                  {isDataLoading ? "Loading" : "Reload"}
                </Button>

                <Button
                  type="default"
                  onClick={handleExportToExcel}
                  loading={loadingSummary}
                  icon={<FileExcelOutlined style={{ color: "#52c41a" }} />}
                  disabled={enrichedSummaryData.length === 0}
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
            scroll={{ x: 950 }}
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
              emptyText: isError
                ? (error as Error)?.message || "Failed to load store item summary."
                : "No store item summary data available.",
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
                <Col xs={24} md={8}>
                  <Text strong style={{ fontSize: "12px", color: "#1f1f1f" }}>
                    Grand Totals ({enrichedSummaryData.length} Total Stock Items)
                  </Text>
                </Col>

                <Col xs={24} md={16}>
                  <Row gutter={[16, 4]} justify="end">
                    <Col xs={12} sm={8} style={{ textAlign: "right" }}>
                      <Text type="secondary" style={{ fontSize: "11px", display: "block" }}>
                        Total Qty On Hand
                      </Text>
                      <Text strong style={{ ...numberStyle, fontSize: "13px" }}>
                        {fmt(totals.totalQty)}
                      </Text>
                    </Col>

                    <Col xs={12} sm={8} style={{ textAlign: "right" }}>
                      <Text type="secondary" style={{ fontSize: "11px", display: "block" }}>
                        Total Inventory Value
                      </Text>
                      <Text
                        strong
                        style={{
                          ...numberStyle,
                          fontSize: "13px",
                          color:
                            totals.totalValue < 0
                              ? "#cf1322"
                              : totals.totalValue > 0
                              ? "#3f8600"
                              : "#1f1f1f",
                        }}
                      >
                        Ksh {fmt(totals.totalValue)}
                      </Text>
                    </Col>
                  </Row>
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

export default StoreItemSummaryReport;