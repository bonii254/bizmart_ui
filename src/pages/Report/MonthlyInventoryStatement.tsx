import React, { useState, useMemo } from "react";
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
  Flex,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  FileExcelOutlined,
  SearchOutlined,
  HomeOutlined,
  BarcodeOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

import {
  MonthlyInventoryStatementItem,
  MonthlyInventoryStatementQueryParams,
} from "../../types/reports2";
import {
    useMonthlyInventoryStatement
} from "../../Components/Hooks/useReport2";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { useStockItems } from "../../Components/Hooks/useStockItems";

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

const getTransactionTag = (type: string) => {
  const normalized = type?.toLowerCase() || "";
  switch (normalized) {
    case "goods_receipt":
    case "receipt":
    case "grn":
      return <Tag color="green">Goods Receipt</Tag>;
    case "sale":
    case "issue":
    case "sales_invoice":
      return <Tag color="volcano">Sale / Issue</Tag>;
    case "stock_take":
    case "inventory_count":
      return <Tag color="purple">Stock Take</Tag>;
    case "adjustment":
    case "stock_adjustment":
      return <Tag color="gold">Adjustment</Tag>;
    case "transfer_in":
      return <Tag color="cyan">Transfer In</Tag>;
    case "transfer_out":
      return <Tag color="magenta">Transfer Out</Tag>;
    default:
      return <Tag color="blue">{type?.replace(/_/g, " ") || "Transaction"}</Tag>;
  }
};

const numberStyle: React.CSSProperties = {
  fontFamily:
    "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
  fontVariantNumeric: "tabular-nums",
  fontSize: "12px",
};

export const MonthlyInventoryStatement: React.FC = () => {
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>(
    months[new Date().getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<
    string | undefined
  >(undefined);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(
    undefined
  );

  // Active Query Parameters state
  const [queryParams, setQueryParams] =
    useState<MonthlyInventoryStatementQueryParams | null>(null);

  // Table Local States
  const [searchText, setSearchText] = useState<string>("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  // API Hooks
  const { data: warehouses = [], isLoading: loadingWarehouses } =
    useWarehouses();
  const { data: stockItems = [], isLoading: loadingStockItems } =
    useStockItems();

  const {
    data: statementResponse,
    isLoading: loadingStatement,
    isFetching,
  } = useMonthlyInventoryStatement(queryParams ?? undefined, {
    enabled: !!queryParams,
  });

  const statementItems: MonthlyInventoryStatementItem[] = useMemo(() => {
    return statementResponse?.data || [];
  }, [statementResponse]);

  // Handle Load / Query Submit
  const handleLoadStatement = () => {
    const monthIndex = months.indexOf(selectedMonth);
    const monthStr = String(monthIndex + 1).padStart(2, "0");
    const lastDayStr = String(
      new Date(selectedYear, monthIndex + 1, 0).getDate()
    ).padStart(2, "0");

    setQueryParams({
      fromDate: `${selectedYear}-${monthStr}-01`,
      toDate: `${selectedYear}-${monthStr}-${lastDayStr}`,
      warehouseId: selectedWarehouseId,
      itemId: selectedItemId,
    });
  };

  const handleResetFilters = () => {
    setSelectedMonth(months[new Date().getMonth()]);
    setSelectedYear(currentYear);
    setSelectedWarehouseId(undefined);
    setSelectedItemId(undefined);
    setSearchText("");
    setQueryParams(null);
  };

  // Search filtering
  const filteredStatementItems = useMemo(() => {
    if (!searchText.trim()) return statementItems;
    const q = searchText.toLowerCase();

    return statementItems.filter(
      (item) =>
        item.item_code?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.warehouse_code?.toLowerCase().includes(q) ||
        item.reference_number?.toLowerCase().includes(q) ||
        item.transaction_type?.toLowerCase().includes(q)
    );
  }, [statementItems, searchText]);

  // Aggregate totals calculations
  const totals = useMemo(() => {
    return filteredStatementItems.reduce(
      (acc, item) => {
        const qty = Number(item.quantity) || 0;
        acc.totalQuantity += qty;
        if (qty > 0) acc.totalIn += qty;
        else acc.totalOut += Math.abs(qty);
        return acc;
      },
      { totalQuantity: 0, totalIn: 0, totalOut: 0 }
    );
  }, [filteredStatementItems]);

  const fmt = (v: number) =>
    (v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Table Columns Definition
  const columns = [
    {
      title: "Date & Time",
      dataIndex: "posted_at",
      key: "posted_at",
      width: 150,
      fixed: "left" as const,
      render: (val: string) => (
        <span style={{ fontSize: "12px", color: "#262626" }}>
          {val ? new Date(val).toLocaleString() : "N/A"}
        </span>
      ),
      sorter: (a: MonthlyInventoryStatementItem, b: MonthlyInventoryStatementItem) =>
        new Date(a.posted_at || 0).getTime() - new Date(b.posted_at || 0).getTime(),
    },
    {
      title: "WH Code",
      dataIndex: "warehouse_code",
      key: "warehouse_code",
      width: 100,
      render: (val: string) => (
        <Tag style={{ fontSize: "11px", margin: 0 }}>{val || "N/A"}</Tag>
      ),
      sorter: (a: MonthlyInventoryStatementItem, b: MonthlyInventoryStatementItem) =>
        (a.warehouse_code || "").localeCompare(b.warehouse_code || ""),
    },
    {
      title: "Item Code",
      dataIndex: "item_code",
      key: "item_code",
      width: 130,
      render: (val: string) => (
        <Text strong style={{ fontSize: "12px", color: "#096dd9" }}>
          {val || "N/A"}
        </Text>
      ),
      sorter: (a: MonthlyInventoryStatementItem, b: MonthlyInventoryStatementItem) =>
        (a.item_code || "").localeCompare(b.item_code || ""),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 200,
      ellipsis: true,
      render: (val: string) => (
        <span style={{ fontSize: "12px", color: "#262626" }}>{val || "N/A"}</span>
      ),
    },
    {
      title: "UOM",
      dataIndex: "stock_uom",
      key: "stock_uom",
      width: 80,
      align: "center" as const,
      render: (val: string) => (
        <span style={{ fontSize: "11px", color: "#595959" }}>{val || "N/A"}</span>
      ),
    },
    {
      title: "Txn Type",
      dataIndex: "transaction_type",
      key: "transaction_type",
      width: 140,
      render: (val: string) => getTransactionTag(val),
      sorter: (a: MonthlyInventoryStatementItem, b: MonthlyInventoryStatementItem) =>
        (a.transaction_type || "").localeCompare(b.transaction_type || ""),
    },
    {
      title: "Ref Number",
      dataIndex: "reference_number",
      key: "reference_number",
      width: 140,
      render: (val: string) => (
        <Text code style={{ fontSize: "11px" }}>
          {val || "N/A"}
        </Text>
      ),
    },
    {
      title: "Qty Movement",
      dataIndex: "quantity",
      key: "quantity",
      align: "right" as const,
      width: 120,
      render: (val: number) => {
        const num = Number(val || 0);
        return (
          <Text
            strong
            style={{
              ...numberStyle,
              color: num > 0 ? "#3f8600" : num < 0 ? "#cf1322" : "#1f1f1f",
            }}
          >
            {num > 0 ? `+${fmt(num)}` : fmt(num)}
          </Text>
        );
      },
      sorter: (a: MonthlyInventoryStatementItem, b: MonthlyInventoryStatementItem) =>
        (a.quantity || 0) - (b.quantity || 0),
    },
    {
      title: "Running Balance",
      dataIndex: "running_balance",
      key: "running_balance",
      align: "right" as const,
      width: 140,
      fixed: "right" as const,
      render: (val: number) => (
        <Text strong style={{ ...numberStyle, color: "#003a8c" }}>
          {fmt(Number(val || 0))}
        </Text>
      ),
      sorter: (a: MonthlyInventoryStatementItem, b: MonthlyInventoryStatementItem) =>
        (a.running_balance || 0) - (b.running_balance || 0),
    },
  ];

  // Excel Export Handler
  const handleExportToExcel = () => {
    if (filteredStatementItems.length === 0) {
      message.warning("No statement items available to export");
      return;
    }

    try {
      const exportData = filteredStatementItems.map((item) => ({
        "Period Month": item.period_month,
        "Posted At": item.posted_at
          ? new Date(item.posted_at).toLocaleString()
          : "",
        "Warehouse Code": item.warehouse_code,
        "Item Code": item.item_code,
        Description: item.description,
        UOM: item.stock_uom,
        "Transaction Type": item.transaction_type,
        "Reference Number": item.reference_number,
        Quantity: item.quantity,
        "Running Balance": item.running_balance,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws["!cols"] = [
        { wch: 14 },
        { wch: 20 },
        { wch: 14 },
        { wch: 16 },
        { wch: 28 },
        { wch: 10 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
        { wch: 16 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Monthly Statement");
      XLSX.writeFile(
        wb,
        `Inventory_Statement_${selectedMonth}_${selectedYear}.xlsx`
      );
      message.success("Monthly statement exported successfully!");
    } catch (err) {
      message.error("Failed to export inventory statement to Excel");
    }
  };

  const isDataLoading = loadingStatement || isFetching;

  return (
    <div className="page-content">
      <div className="container-fluid">
        {/* Scoped CSS Overrides to prevent Ant Design elements from clipping over Velzon Topbar */}
        <style>
          {`
            .velzon-report-wrapper .ant-table-cell-fix-left,
            .velzon-report-wrapper .ant-table-cell-fix-right,
            .velzon-report-wrapper .ant-table-header {
              z-index: 5 !important;
            }
            .velzon-report-wrapper .ant-select-dropdown {
              z-index: 1050 !important;
            }
          `}
        </style>

        <div className="velzon-report-wrapper">
          {/* Header Toolbar */}
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ marginBottom: 16, borderRadius: 8 }}
            bodyStyle={{ padding: "12px 16px" }}
          >
            <Row gutter={[12, 12]} align="middle" justify="space-between">
              <Col xs={24} sm={24} md={6} lg={6}>
                <Title
                  level={5}
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  <FileSearchOutlined
                    style={{ color: "#1890ff", marginRight: "8px" }}
                  />
                  Statement Filters
                </Title>
              </Col>

              {/* Filters Bar */}
              <Col xs={24} sm={24} md={18} lg={18}>
                <Flex
                  wrap="wrap"
                  gap="small"
                  align="center"
                  justify="end"
                  style={{ width: "100%" }}
                >
                  <Select
                    size="small"
                    style={{ width: "115px" }}
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
                    style={{ width: "85px" }}
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

                  {/* Warehouse Selector */}
                  <Select
                    size="small"
                    style={{ width: "160px" }}
                    placeholder="Select Warehouse"
                    allowClear
                    loading={loadingWarehouses}
                    value={selectedWarehouseId}
                    onChange={setSelectedWarehouseId}
                    suffixIcon={<HomeOutlined style={{ color: "#8c8c8c" }} />}
                  >
                    {warehouses.map((wh) => (
                      <Option key={wh.warehouseId} value={wh.warehouseId}>
                        {wh.warehouseCode} - {wh.warehouseName}
                      </Option>
                    ))}
                  </Select>

                  {/* Stock Item Selector */}
                  <Select
                    size="small"
                    showSearch
                    style={{ width: "180px" }}
                    placeholder="Select Stock Item"
                    allowClear
                    loading={loadingStockItems}
                    value={selectedItemId}
                    onChange={setSelectedItemId}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      String(option?.children ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    suffixIcon={<BarcodeOutlined style={{ color: "#8c8c8c" }} />}
                  >
                    {stockItems.map((item) => (
                      <Option key={item.itemId || item.id} value={item.itemId || item.id}>
                        {item.itemCode} - {item.description}
                      </Option>
                    ))}
                  </Select>

                  <Button
                    type="primary"
                    onClick={handleLoadStatement}
                    loading={isDataLoading}
                    icon={<ReloadOutlined />}
                    size="small"
                  >
                    Load Statement
                  </Button>

                  <Tooltip title="Reset all filters">
                    <Button
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={handleResetFilters}
                    />
                  </Tooltip>

                  <Button
                    type="default"
                    onClick={handleExportToExcel}
                    icon={<FileExcelOutlined style={{ color: "#52c41a" }} />}
                    disabled={filteredStatementItems.length === 0}
                    size="small"
                  >
                    Export
                  </Button>
                </Flex>
              </Col>
            </Row>
          </Card>

          {/* Table Data Card */}
          <Card
            size="small"
            bordered={false}
            className="shadow-sm"
            style={{ borderRadius: 8, overflow: "hidden" }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Local Table Search Header */}
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
              }}
            >
              <Row justify="space-between" align="middle">
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Showing {filteredStatementItems.length} transactions
                  </Text>
                </Col>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="Search reference, item code, description..."
                    prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    size="small"
                  />
                </Col>
              </Row>
            </div>

            <Table
              columns={columns}
              dataSource={filteredStatementItems.map((item, idx) => ({
                ...item,
                key: `row-${item.reference_number || idx}-${idx}`,
              }))}
              rowKey="key"
              loading={isDataLoading}
              bordered
              size="small"
              scroll={{ x: 1100 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: filteredStatementItems.length,
                showSizeChanger: true,
                responsive: true,
                size: "small",
                pageSizeOptions: ["10", "20", "50", "100", "200"],
                onChange: (page, pageSize) =>
                  setPagination({ current: page, pageSize }),
                style: { padding: "8px 16px", margin: 0 },
              }}
              locale={{
                emptyText: queryParams
                  ? "No inventory statement records found for the selected parameters."
                  : "Select parameters and click 'Load Statement' to view monthly inventory records.",
              }}
            />

            {/* Dynamic Totals Footer */}
            {filteredStatementItems.length > 0 && (
              <div
                style={{
                  borderTop: "2px solid #1890ff",
                  backgroundColor: "#e6f7ff",
                  padding: "10px 16px",
                }}
              >
                <Row gutter={[12, 12]} align="middle" justify="space-between">
                  <Col xs={24} sm={8}>
                    <Text strong style={{ fontSize: "12px", color: "#1f1f1f" }}>
                      Statement Movement Summary ({filteredStatementItems.length}{" "}
                      Transactions)
                    </Text>
                  </Col>

                  <Col xs={24} sm={16}>
                    <Flex
                      wrap="wrap"
                      gap="large"
                      justify="end"
                      style={{ width: "100%" }}
                    >
                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: "10px", display: "block" }}
                        >
                          Total Inflow Qty
                        </Text>
                        <Text strong style={{ ...numberStyle, color: "#3f8600" }}>
                          +{fmt(totals.totalIn)}
                        </Text>
                      </div>

                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: "10px", display: "block" }}
                        >
                          Total Outflow Qty
                        </Text>
                        <Text strong style={{ ...numberStyle, color: "#cf1322" }}>
                          -{fmt(totals.totalOut)}
                        </Text>
                      </div>

                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: "10px", display: "block" }}
                        >
                          Net Movement Qty
                        </Text>
                        <Text
                          strong
                          style={{
                            ...numberStyle,
                            color:
                              totals.totalQuantity < 0
                                ? "#cf1322"
                                : totals.totalQuantity > 0
                                ? "#3f8600"
                                : "#1f1f1f",
                          }}
                        >
                          {totals.totalQuantity > 0
                            ? `+${fmt(totals.totalQuantity)}`
                            : fmt(totals.totalQuantity)}
                        </Text>
                      </div>
                    </Flex>
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MonthlyInventoryStatement;