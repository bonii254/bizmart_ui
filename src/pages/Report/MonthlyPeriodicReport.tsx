import React, { useState, useEffect, useMemo } from "react";
import { Container } from "reactstrap";
//import BreadCrumb from "../../Components/Common/BreadCrumb";
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
} from "antd";
import {
  ReloadOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  FileExcelOutlined,
  SearchOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

import {
  usePeriodicInventorySummary
} from "../../Components/Hooks/useReports";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { useCategories } from "../../Components/Hooks/useCategory"; // Adjust import paths according to your structure
import {
  PeriodicInventorySummaryItem,
  PeriodicInventorySummaryQueryParams,
} from "../../types/reports";
import { StockItem } from "../../types/stockitem";
import { Category } from "../../types/category";

const { Title } = Typography;
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
  const { data: rawPeriodicData = [], isLoading: loadingPeriodic, isFetching } = usePeriodicInventorySummary(
    queryParams ?? undefined
  );
  const { data: stockItems = [] } = useStockItems();
  const { data: categories = [] } = useCategories();

  // Create fast lookup maps
  const stockItemMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    stockItems.forEach((item) => {
      if (item.itemCode) map.set(item.itemCode.toLowerCase(), item);
    });
    return map;
  }, [stockItems]);

  const categoryMap = useMemo(() => {
  const map = new Map<string, string>();
  
  const categoryList = Array.isArray(categories) 
    ? categories 
    : categories?.categories ?? [];

  categoryList.forEach((cat: Category) => {
    map.set(cat.categoryId, cat.categoryName);
  });
  
  return map;
}, [categories]);
  // Combine endpoint output with StockItem catalog to associate Categories
  const enrichedPeriodicData = useMemo(() => {
    return rawPeriodicData.map((item, index) => {
      const codeKey = (item.itemCode || item.item_code || "").toLowerCase();
      const matchedCatalogItem = stockItemMap.get(codeKey);

      let catId = matchedCatalogItem?.categoryId || "uncategorized";
      let catName = "Uncategorized";

      if (matchedCatalogItem?.categoryName) {
        catName = matchedCatalogItem.categoryName;
      } else if (matchedCatalogItem?.category && typeof matchedCatalogItem.category === "object" && "name" in matchedCatalogItem.category) {
        catName = matchedCatalogItem.category.name;
      } else if (catId !== "uncategorized" && categoryMap.has(catId)) {
        catName = categoryMap.get(catId)!;
      }

      return {
        ...item,
        key: `item-${item.itemCode || item.item_code || index}-${index}`,
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

      const groupMatchesSearch =
        !searchText || groupLabel.toLowerCase().includes(searchText.toLowerCase());

      const filteredItems = group.items.filter(
        (item) =>
          !searchText ||
          (item.itemCode || item.item_code)?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchText.toLowerCase())
      );

      if (filteredItems.length > 0 || groupMatchesSearch) {
        flatData.push({
          key: `group-${groupLabel}`,
          isGroupHeader: true,
          categoryName: groupLabel,
          groupLabel,
          itemCount: filteredItems.length,
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
  }, [processedDataGroups, searchText, expandedGroups]);

  const handleLoadData = () => {
    const monthIndex = months.indexOf(selectedMonth);
    const yearStr = selectedYear;
    const monthStr = String(monthIndex + 1).padStart(2, "0");
    const lastDayStr = String(new Date(selectedYear, monthIndex + 1, 0).getDate()).padStart(2, "0");

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
    const newSet = new Set(expandedGroups);
    if (newSet.has(groupLabel)) {
      newSet.delete(groupLabel);
    } else {
      newSet.add(groupLabel);
    }
    setExpandedGroups(newSet);
  };

  const columns = [
    {
      title: "Stock Code",
      dataIndex: "itemCode",
      key: "itemCode",
      width: 120,
      render: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return record.itemCode || record.item_code;
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 230,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search description"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Search
            </Button>
            <Button onClick={() => { clearFilters(); confirm(); }} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return false;
        return record.description?.toLowerCase().includes((value as string).toLowerCase()) || false;
      },
      render: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return value;
      },
    },
    {
      title: "UOM",
      dataIndex: "stockUom",
      key: "stockUom",
      width: 80,
      render: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return record.stockUom || record.stock_uom;
      },
    },
    {
      title: "OB Qty",
      dataIndex: "openingBalance",
      key: "openingBalance",
      align: "right" as const,
      width: 90,
      render: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        const val = record.openingBalance ?? record.opening_balance ?? 0;
        return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    },
    {
      title: "Receipts",
      dataIndex: "receipts",
      key: "receipts",
      align: "right" as const,
      width: 90,
      render: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return Number(record.receipts ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    },
    {
      title: "Sales",
      dataIndex: "sales",
      key: "sales",
      align: "right" as const,
      width: 90,
      render: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return Number(record.sales ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    },
    {
      title: "Expenses",
      dataIndex: "expenses",
      key: "expenses",
      align: "right" as const,
      width: 90,
      render: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return Number(record.expenses ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    },
    {
      title: "Adjustments",
      dataIndex: "adjustments",
      key: "adjustments",
      align: "right" as const,
      width: 90,
      render: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        return Number(record.adjustments ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    },
    {
      title: "Closing Balance",
      dataIndex: "closingBalance",
      key: "closingBalance",
      align: "right" as const,
      width: 110,
      render: (value: any, record: ProcessedPeriodicItem) => {
        if (record.isGroupHeader) return null;
        const val = record.closingBalance ?? record.closing_balance ?? 0;
        return (
          <span style={{ fontWeight: 600 }}>
            {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <span style={{ fontWeight: "normal", fontSize: "12px", marginLeft: "8px" }}>
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
    if (enrichedPeriodicData.length === 0) {
      message.warning("No data to export");
      return;
    }

    const exportData = enrichedPeriodicData.map((item) => ({
      Category: item.categoryName,
      "Stock Code": item.itemCode || item.item_code,
      Description: item.description,
      UOM: item.stockUom || item.stock_uom,
      "Opening Balance": item.openingBalance ?? item.opening_balance ?? 0,
      Receipts: item.receipts,
      Sales: item.sales,
      Expenses: item.expenses,
      Adjustments: item.adjustments,
      "Closing Balance": item.closingBalance ?? item.closing_balance ?? 0,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Periodic Summary");
    XLSX.writeFile(wb, `Periodic_Summary_${selectedMonth}_${selectedYear}.xlsx`);
    message.success("Export to Excel successful!");
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Card>
          <Title level={5} style={{ marginBottom: "24px" }}>
            <FileSearchOutlined /> Periodic Inventory Summary
          </Title>

          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={8} md={6} lg={4}>
              <Select
                style={{ width: "100%" }}
                placeholder="Select Month"
                value={selectedMonth}
                onChange={setSelectedMonth}
                suffixIcon={<CalendarOutlined />}
              >
                {months.map((month) => (
                  <Option key={month} value={month}>
                    {month}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={8} md={4} lg={3}>
              <Select
                style={{ width: "100%" }}
                placeholder="Select Year"
                value={selectedYear}
                onChange={setSelectedYear}
              >
                {years.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={8} md={6} lg={4}>
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
                onClick={handleLoadData}
                loading={loadingPeriodic || isFetching}
                icon={<ReloadOutlined />}
              >
                {loadingPeriodic || isFetching ? "Loading..." : "Load Periodical"}
              </Button>
            </Col>

            <Col>
              <Button
                type="primary"
                onClick={handleExportToExcel}
                icon={<FileExcelOutlined />}
                disabled={enrichedPeriodicData.length === 0}
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
              loading={loadingPeriodic || isFetching}
              bordered
              size="small"
              scroll={{ x: "max-content" }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: filteredData.length,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100", "200"],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
              }}
              locale={{
                emptyText: 'No data available. Select a month and year, then click "Load Periodical".',
              }}
            />
          </div>
        </Card>
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default MonthlyPeriodicReport;