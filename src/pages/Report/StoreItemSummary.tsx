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
} from "antd";
import {
  ReloadOutlined,
  FileSearchOutlined,
  FileExcelOutlined,
  SearchOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

import { useStoreItemSummary } from "../../Components/Hooks/useReports";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { useCategories } from "../../Components/Hooks/useCategory";

import { StoreItemSummary } from "../../types/reports";
import { StockItem } from "../../types/stockitem";
import { Category } from "../../types/category";

const { Title } = Typography;

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

  useEffect(() => {
    const groupKeys = Object.keys(processedDataGroups);
    if (groupKeys.length > 0) {
      setExpandedGroups(new Set(groupKeys));
    }
  }, [processedDataGroups]);

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

  const columns = [
    {
      title: "Stock Code",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 140,
      render: (_: any, record: ProcessedStoreItem) =>
        record.isGroupHeader ? null : record.itemCode,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 180,
      render: (value: any, record: ProcessedStoreItem) =>
        record.isGroupHeader ? null : value,
    },
    {
      title: "UOM",
      dataIndex: "stockUom",
      key: "stockUom",
      width: 80,
      render: (_: any, record: ProcessedStoreItem) =>
        record.isGroupHeader ? null : record.stockUom,
    },
    {
      title: "Selling Price",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      align: "right" as const,
      width: 100,
      render: (_: any, record: ProcessedStoreItem) => {
        if (record.isGroupHeader) return null;
        return Number(record.sellingPrice ?? 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      },
    },
    {
      title: "Qty On Hand",
      dataIndex: "quantityOnHand",
      key: "quantityOnHand",
      align: "right" as const,
      width: 100,
      render: (_: any, record: ProcessedStoreItem) => {
        if (record.isGroupHeader) return null;
        return Number(record.quantityOnHand ?? 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      },
    },
    {
      title: "Avg Cost",
      dataIndex: "averageCost",
      key: "averageCost",
      align: "right" as const,
      width: 80,
      render: (_: any, record: ProcessedStoreItem) => {
        if (record.isGroupHeader) return null;
        return Number(record.averageCost ?? 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      },
    },
    {
      title: "Inventory Value",
      dataIndex: "inventoryValue",
      key: "inventoryValue",
      align: "right" as const,
      width: 120,
      render: (_: any, record: ProcessedStoreItem) => {
        if (record.isGroupHeader) return null;
        return (
          <span style={{ fontWeight: 600 }}>
            {Number(record.inventoryValue ?? 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        );
      },
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
                  backgroundColor: "#f0f9ff",
                  fontWeight: "bold",
                  fontSize: "14px",
                  padding: "12px 8px",
                  borderBottom: "2px solid #1890ff",
                  cursor: "pointer",
                }}
                onClick={() => toggleGroup(record.categoryName)}
              >
                <Space>
                  {isExpanded ? <DownOutlined /> : <RightOutlined />}
                  <span>
                    {record.groupLabel}
                    <span
                      style={{
                        fontWeight: "normal",
                        fontSize: "12px",
                        marginLeft: "8px",
                      }}
                    >
                      ({record.itemCount} items)
                    </span>
                  </span>
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
      message.warning("No data to export");
      return;
    }

    const exportData = enrichedSummaryData.map((item) => ({
      Category: item.categoryName,
      "Stock Code": item.itemCode,
      Description: item.description,
      UOM: item.stockUom,
      "Selling Price": item.sellingPrice,
      "Qty On Hand": item.quantityOnHand,
      "Average Cost": item.averageCost,
      "Inventory Value": item.inventoryValue,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Store Item Summary");
    XLSX.writeFile(
      wb,
      `Store_Item_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    message.success("Export to Excel successful!");
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Card>
          <Title level={5} style={{ marginBottom: "24px" }}>
            <FileSearchOutlined /> Store Item Summary Report
          </Title>

          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={8} md={6} lg={6}>
              <Input
                placeholder="Search stock code or description"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>

            <Col>
              <Button
                type="primary"
                onClick={() => refetch()}
                loading={loadingSummary || isFetching}
                icon={<ReloadOutlined />}
              >
                {loadingSummary || isFetching ? "Reloading..." : "Reload Data"}
              </Button>
            </Col>

            <Col>
              <Button
                type="primary"
                onClick={handleExportToExcel}
                icon={<FileExcelOutlined />}
                disabled={enrichedSummaryData.length === 0}
              >
                Export to Excel
              </Button>
            </Col>

            <Col>
              <Button size="small" onClick={expandAll} style={{ marginRight: 8 }}>
                Expand All
              </Button>
              <Button size="small" onClick={collapseAll}>
                Collapse All
              </Button>
            </Col>
          </Row>

          <div style={{ overflowX: "auto" }}>
            <Table
              columns={columns}
              dataSource={filteredData}
              components={components}
              rowKey="key"
              loading={loadingSummary || isFetching}
              bordered
              size="small"
              scroll={{ x: "max-content" }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: filteredData.length,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100", "200"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
                onChange: (page, pageSize) =>
                  setPagination({ current: page, pageSize }),
              }}
              locale={{
                emptyText: isError
                  ? (error as Error)?.message || "Failed to load store item summary."
                  : "No data available.",
              }}
            />
          </div>
        </Card>
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default StoreItemSummaryReport;