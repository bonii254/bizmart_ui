import React, { useState, useMemo } from "react";
import { Container } from "reactstrap";
import { ToastContainer } from "react-toastify";
import {
  Card,
  Select,
  Button,
  Typography,
  Row,
  Col,
  message,
  Spin,
  Radio,
  RadioChangeEvent,
} from "antd";
import {
  ReloadOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

import { useSalesPerItemReport } from "../../../Components/Hooks/useReports";
import { useStockItems } from "../../../Components/Hooks/useStockItems";
import { SalesPerItemQueryParams, SalesPerItemReportResponse } from '../../../types/reports';
import SalesGroupedItemReport from "./SalesGroupedItemReport";
import SalesGroupedItemReportSummary from "./SalesGroupedItemReportSummary";

const { Title } = Typography;
const { Option } = Select;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const startYear = 2025;
const years = Array.from(
  { length: Math.max(1, currentYear - startYear + 1) },
  (_, i) => startYear + i
);

const SalesPerItem: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    months[new Date().getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedItem, setSelectedItem] = useState<string | undefined>(undefined);
  const [reportType, setReportType] = useState<"Detailed" | "Summary">("Detailed");

  // Fetch stock items list
  const { data: stockItems = [], isLoading: loadingStockItems } = useStockItems();

  const queryParams = useMemo<SalesPerItemQueryParams>(() => {
    const monthIndex = months.indexOf(selectedMonth);
    const startDate = new Date(selectedYear, monthIndex, 1);
    const endDate = new Date(selectedYear, monthIndex + 1, 0);

    const formatISO = (d: Date) => d.toISOString().split("T")[0];

    return {
      fromDate: formatISO(startDate),
      toDate: formatISO(endDate),
      itemId: selectedItem,
    };
  }, [selectedMonth, selectedYear, selectedItem]);

  const {
    data = [],
    isLoading,
    isFetching,
    refetch,
  } = useSalesPerItemReport(queryParams);

  const reportData = useMemo<SalesPerItemReportResponse[]>(() => {
    const raw = data as any;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }, [data]);

  const handleExportToExcel = () => {
    if (!reportData || reportData.length === 0) {
      message.warning("No data to export");
      return;
    }

    try {
      const exportData = reportData.map((item: SalesPerItemReportResponse) => ({
        "Sold At": item.soldAt || item.sold_at || "N/A",
        "Invoice Number": item.invoiceNumber || item.invoice_number || "N/A",
        "Customer Name": item.customerName || item.customer_name || "N/A",
        "Item Code": item.itemCode || item.item_code || "N/A",
        Description: item.description || "",
        UOM: item.stockUom || item.stock_uom || "",
        Quantity: item.quantity || 0,
        "Unit Price": item.unitPrice || item.unit_price || 0,
        "Line Total": item.lineTotal ?? item.line_total ?? ((item.unitPrice || 0) * (item.quantity || 0)),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws["!cols"] = [
        { wch: 20 }, { wch: 15 }, { wch: 30 }, 
        { wch: 15 }, { wch: 30 }, { wch: 10 }, 
        { wch: 10 }, { wch: 12 }, { wch: 12 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Sales Per Item");

      const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
      XLSX.writeFile(wb, `SalesPerItem_${selectedMonth}_${selectedYear}_${dateStr}.xlsx`);
      message.success("Export to Excel successful!");
    } catch (error) {
      message.error("Failed to export to Excel");
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Card>
          <Title level={5} style={{ marginBottom: "24px" }}>
            <FileSearchOutlined /> Sales Per Item Report
          </Title>

          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col>
              <Radio.Group 
                onChange={(e: RadioChangeEvent) => setReportType(e.target.value)} 
                value={reportType}
              >
                <Radio value="Detailed">Detailed</Radio>
                <Radio value="Summary">Summary</Radio>
              </Radio.Group>
            </Col>

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

            <Col xs={24} sm={12} md={6} lg={5}>
              <Select
                showSearch
                allowClear
                style={{ width: "100%" }}
                placeholder="All Stock Items"
                value={selectedItem}
                onChange={setSelectedItem}
                loading={loadingStockItems}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                options={stockItems.map(item => ({
                  value: item.itemCode || item.itemCode,
                  label: `${item.itemCode || item.itemCode} - ${item.description}`
                }))}
              />
            </Col>

            <Col>
              <Button
                type="primary"
                onClick={() => refetch()}
                loading={isFetching}
                icon={<ReloadOutlined />}
              >
                {isFetching ? "Loading..." : "Load Report"}
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                onClick={handleExportToExcel}
                loading={isLoading}
                icon={<FileExcelOutlined />}
                disabled={!reportData || reportData.length === 0}
              >
                Export to Excel
              </Button>
            </Col>
          </Row>

          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <div>
                {reportType === "Detailed" && (
                  <SalesGroupedItemReport data={reportData} loading={isFetching} />
                )}
                {reportType === "Summary" && (
                  <SalesGroupedItemReportSummary data={reportData} loading={isFetching} />
                )}
              </div>
            )}
          </div>
        </Card>
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default SalesPerItem;