import React, { useState, useMemo, useCallback } from 'react';
import { Container } from 'reactstrap';
import { ToastContainer } from 'react-toastify';
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  message,
  Spin,
  DatePicker,
  Select,
} from 'antd';
import {
  ReloadOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';

import { useWarehouses } from '../../../Components/Hooks/useWarehouse';
import { useStockTakeBrowse } from '../../../Components/Hooks/useReport2';
import {
  StockTakeTransaction,
  StockTakeBrowseQueryParams,
} from '../../../types/reports2'; 
import { Warehouse } from '../../../types/warehouse';
import StockTakeBrowseTable from './StockTakeBrowseTable';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const StockTakeBrowseReport: React.FC = () => {
  // Date Range state (Default: Start of month to end of month)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Warehouse dropdown filter state (holds warehouseId UUID)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  // Active filtered dataset emitted by child table component
  const [filteredItems, setFilteredItems] = useState<StockTakeTransaction[]>([]);

  // Fetch warehouses list for dropdown selector using useWarehouses hook
  const { data: rawWarehousesData, isLoading: isLoadingWarehouses } = useWarehouses();

  // Safely parse warehouses list
  const warehousesList = useMemo<Warehouse[]>(() => {
    if (!rawWarehousesData) return [];
    if (Array.isArray(rawWarehousesData)) return rawWarehousesData;
    const raw = rawWarehousesData as any;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.warehouses)) return raw.warehouses;
    return [];
  }, [rawWarehousesData]);

  // Construct query parameters passed directly to the stock-take browse hook
  const queryParams = useMemo<StockTakeBrowseQueryParams>(() => {
    const fromDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
    const toDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

    return {
      fromDate,
      toDate,
      warehouseId: selectedWarehouseId || undefined,
    };
  }, [dateRange, selectedWarehouseId]);

  // Query endpoint using custom React Query hook
  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
  } = useStockTakeBrowse(queryParams);

  // Safely parse stock-take array payload
  const rawItems = useMemo<StockTakeTransaction[]>(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    const raw = responseData as any;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  }, [responseData]);

  // Sync child filtered list for Excel export
  const handleFilteredDataChange = useCallback((items: StockTakeTransaction[]) => {
    setFilteredItems(items);
  }, []);

  // Export dataset to Excel
  const handleExportToExcel = () => {
    if (!filteredItems || filteredItems.length === 0) {
      message.warning('No stock-take records available to export');
      return;
    }

    try {
      const exportData = filteredItems.map((item) => ({
        'Stock Take Number': item.stock_take_number || 'N/A',
        'Warehouse Name': item.warehouse_name || 'N/A',
        'Operator Name': item.operator_name || 'N/A',
        'Posted At': item.posted_at ? dayjs(item.posted_at).format('DD/MM/YYYY HH:mm') : 'N/A',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 20 },
        { wch: 22 },
        { wch: 22 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Stock-Take Browse');

      const fromStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : 'start';
      const toStr = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : 'end';
      const whStr = selectedWarehouseId ? 'FilteredWarehouse' : 'AllWarehouses';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `StockTakeBrowse_${whStr}_${fromStr}_to_${toStr}_${timestamp}.xlsx`);
      message.success('Stock-take browse records exported successfully!');
    } catch (error) {
      message.error('Failed to export stock-take records to Excel');
    }
  };

  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: 'Today', value: [dayjs(), dayjs()] },
    { label: 'Yesterday', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
    { label: 'Last 7 Days', value: [dayjs().subtract(6, 'day'), dayjs()] },
    { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  ];

  return (
    <div className="page-content position-relative" style={{ zIndex: 1 }}>
      <Container fluid className="px-2 px-md-3">
        {/* Header Controls Bar */}
        <Card
          size="small"
          className="shadow-sm border-0 mb-3"
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            {/* Title Section */}
            <Col xs={24} lg={6}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 6,
                    backgroundColor: '#e6f7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppstoreOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>
                    Stock-Take Browse
                  </Title>
                </div>
              </div>
            </Col>

            {/* Controls Bar */}
            <Col xs={24} lg={18}>
              <Row gutter={[8, 8]} justify="end" align="middle">
                {/* Date Range Picker */}
                <Col xs={24} sm={12} md={8} lg={8} xl={7}>
                  <RangePicker
                    style={{ width: '100%' }}
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates)}
                    format="YYYY-MM-DD"
                    presets={rangePresets}
                    allowClear
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  />
                </Col>

                {/* Warehouse Select Filter */}
                <Col xs={24} sm={12} md={7} lg={7} xl={7}>
                  <Select
                    showSearch
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="All Warehouses"
                    loading={isLoadingWarehouses}
                    value={selectedWarehouseId}
                    onChange={(val) => setSelectedWarehouseId(val)}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={warehousesList.map((wh) => ({
                      value: wh.warehouseId,
                      label: `${wh.warehouseName} (${wh.warehouseCode})`,
                    }))}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  />
                </Col>

                {/* Reload Button */}
                <Col xs={12} sm={6} md={4} lg={4} xl={3}>
                  <Button
                    type="primary"
                    block
                    onClick={() => refetch()}
                    loading={isFetching}
                    icon={<ReloadOutlined />}
                  >
                    Load
                  </Button>
                </Col>

                {/* Export Button */}
                <Col xs={12} sm={6} md={5} lg={5} xl={4}>
                  <Button
                    type="default"
                    block
                    onClick={handleExportToExcel}
                    loading={isLoading}
                    icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
                    disabled={filteredItems.length === 0}
                  >
                    Export ({filteredItems.length})
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Main Content Area */}
        {isLoading ? (
          <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="Fetching Stock-Take Records..." />
          </Card>
        ) : (
          <StockTakeBrowseTable
            data={rawItems}
            loading={isFetching}
            onFilteredDataChange={handleFilteredDataChange}
          />
        )}
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default StockTakeBrowseReport;