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
  Space,
} from 'antd';
import {
  ReloadOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';

import { useWarehouses } from '../../../Components/Hooks/useWarehouse';
import { useStockTakeBrowse, useStockTakeTransactionsDetail } from '../../../Components/Hooks/useReport2';
import { useCategories } from '../../../Components/Hooks/useCategory';
import { useStockItems } from '../../../Components/Hooks/useStockItems';
import {
  StockTakeTransaction,
  StockTakeBrowseQueryParams,
  StockTakeTransactionDetail,
} from '../../../types/reports2';
import { Warehouse } from '../../../types/warehouse';
import StockTakeBrowseTable from './StockTakeBrowseTable';
import StockTakeDetailsTable from './StockTakeDetailsTable';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const StockTakeBrowseReport: React.FC = () => {
  // Date Range state
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  
  // Drill-down state for selected stock take
  const [selectedStockTake, setSelectedStockTake] = useState<StockTakeTransaction | null>(null);

  // Detail filters state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);

  // Active filtered datasets for export
  const [filteredMasterItems, setFilteredMasterItems] = useState<StockTakeTransaction[]>([]);
  const [filteredDetailItems, setFilteredDetailItems] = useState<StockTakeTransactionDetail[]>([]);

  // Fetch warehouses
  const { data: rawWarehousesData, isLoading: isLoadingWarehouses } = useWarehouses();
  const warehousesList = useMemo<Warehouse[]>(() => {
    if (!rawWarehousesData) return [];
    if (Array.isArray(rawWarehousesData)) return rawWarehousesData;
    const raw = rawWarehousesData as any;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.warehouses)) return raw.warehouses;
    return [];
  }, [rawWarehousesData]);

  // Fetch categories & stock items for detail filters
  const { data: categoriesData } = useCategories();
  const categoriesList = useMemo(() => {
    if (!categoriesData) return [];
    const raw = categoriesData as any;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.categories)) return raw.categories;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  }, [categoriesData]);

  const { data: stockItemsData } = useStockItems();
  const stockItemsList = useMemo(() => {
    if (!stockItemsData) return [];
    if (Array.isArray(stockItemsData)) return stockItemsData;
    const raw = stockItemsData as any;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  }, [stockItemsData]);

  // Master query params
  const queryParams = useMemo<StockTakeBrowseQueryParams>(() => {
    const fromDate = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
    const toDate = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

    return {
      fromDate,
      toDate,
      warehouseId: selectedWarehouseId || undefined,
    };
  }, [dateRange, selectedWarehouseId]);

  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
  } = useStockTakeBrowse(queryParams);

  const rawItems = useMemo<StockTakeTransaction[]>(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    const raw = responseData as any;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  }, [responseData]);

  // Detail query params
  const detailQueryParams = useMemo(() => {
    if (!selectedStockTake) return undefined;
    return {
      stockTakeId: selectedStockTake.stock_take_id,
      warehouseId: selectedWarehouseId || undefined,
    };
  }, [selectedStockTake, selectedWarehouseId]);

  const {
    data: detailResponseData,
    isLoading: isLoadingDetails,
    isFetching: isFetchingDetails,
    refetch: refetchDetails,
  } = useStockTakeTransactionsDetail(detailQueryParams, { enabled: !!selectedStockTake });

  const rawDetailItems = useMemo<StockTakeTransactionDetail[]>(() => {
    if (!detailResponseData) return [];
    if (Array.isArray(detailResponseData)) return detailResponseData;
    const raw = detailResponseData as any;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  }, [detailResponseData]);

  const handleFilteredMasterChange = useCallback((items: StockTakeTransaction[]) => {
    setFilteredMasterItems(items);
  }, []);

  const handleFilteredDetailChange = useCallback((items: StockTakeTransactionDetail[]) => {
    setFilteredDetailItems(items);
  }, []);

  // Export Master to Excel
  const handleExportMasterToExcel = () => {
    if (!filteredMasterItems || filteredMasterItems.length === 0) {
      message.warning('No stock-take records available to export');
      return;
    }
    try {
      const exportData = filteredMasterItems.map((item) => ({
        'Stock Take Number': item.stock_take_number || 'N/A',
        'Warehouse Name': item.warehouse_name || 'N/A',
        'Operator Name': item.operator_name || 'N/A',
        'Posted At': item.posted_at ? dayjs(item.posted_at).format('DD/MM/YYYY HH:mm') : 'N/A',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Stock-Take Browse');

      const fromStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : 'start';
      const toStr = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : 'end';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `StockTakeBrowse_${fromStr}_to_${toStr}_${timestamp}.xlsx`);
      message.success('Stock-take browse records exported successfully!');
    } catch (error) {
      message.error('Failed to export stock-take records');
    }
  };

  // Export Details to Excel
  const handleExportDetailsToExcel = () => {
    if (!filteredDetailItems || filteredDetailItems.length === 0) {
      message.warning('No stock-take detail records available to export');
      return;
    }
    try {
      const exportData = filteredDetailItems.map((item) => ({
        'Stock Take Number': item.stock_take_number || 'N/A',
        'Item Code': item.item_code || 'N/A',
        'Description': item.stock_code_description || 'N/A',
        'UOM': item.stock_uom || 'N/A',
        'Expected Qty': item.expected_quantity ?? 0,
        'Counted Qty': item.counted_quantity ?? 0,
        'Variance': (item.counted_quantity ?? 0) - (item.expected_quantity ?? 0),
        'Warehouse': item.warehouse_name || 'N/A',
        'Operator': item.operator_name || 'N/A',
        'Posted At': item.posted_at ? dayjs(item.posted_at).format('DD/MM/YYYY HH:mm') : 'N/A',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 18 }, { wch: 16 }, { wch: 30 }, { wch: 10 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'StockTake Details');

      const stNum = selectedStockTake?.stock_take_number || 'Details';
      const timestamp = dayjs().format('YYYYMMDD_HHmmss');

      XLSX.writeFile(wb, `StockTakeDetails_${stNum}_${timestamp}.xlsx`);
      message.success('Stock-take details exported successfully!');
    } catch (error) {
      message.error('Failed to export stock-take details');
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
        {!selectedStockTake ? (
          <>
            {/* Header Controls Bar for Master List */}
            <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '12px 16px' }}>
              <Row gutter={[12, 12]} align="middle" justify="space-between">
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

                <Col xs={24} lg={18}>
                  <Row gutter={[8, 8]} justify="end" align="middle">
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

                    <Col xs={12} sm={6} md={5} lg={5} xl={4}>
                      <Button
                        type="default"
                        block
                        onClick={handleExportMasterToExcel}
                        loading={isLoading}
                        icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
                        disabled={filteredMasterItems.length === 0}
                      >
                        Export ({filteredMasterItems.length})
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>

            {isLoading ? (
              <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" tip="Fetching Stock-Take Records..." />
              </Card>
            ) : (
              <StockTakeBrowseTable
                data={rawItems}
                loading={isFetching}
                onRowClick={(record) => setSelectedStockTake(record)}
                onFilteredDataChange={handleFilteredMasterChange}
              />
            )}
          </>
        ) : (
          <>
            {/* Header Bar for Details View */}
            <Card size="small" className="shadow-sm border-0 mb-3" bodyStyle={{ padding: '12px 16px' }}>
              <Row gutter={[12, 12]} align="middle" justify="space-between">
                <Col xs={24} lg={8}>
                  <Space align="center" size="middle">
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => {
                        setSelectedStockTake(null);
                        setSelectedCategoryId(undefined);
                        setSelectedItemId(undefined);
                      }}
                    >
                      Back
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 6,
                          backgroundColor: '#f6ffed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FolderOpenOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                      </div>
                      <div>
                        <Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>
                          Stock-Take Details: {selectedStockTake.stock_take_number}
                        </Title>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          Warehouse: {selectedStockTake.warehouse_name} | Operator: {selectedStockTake.operator_name}
                        </Text>
                      </div>
                    </div>
                  </Space>
                </Col>

                <Col xs={24} lg={16}>
                  <Row gutter={[8, 8]} justify="end" align="middle">
                    {/* Category Filter */}
                    <Col xs={24} lg={16}>
                      <Row gutter={[8, 8]} justify="end" align="middle">
                        {/* Category Filter */}
                        <Col xs={24} sm={10} md={9} lg={8}>
                          <Select
                            showSearch
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Filter by Category..."
                            value={selectedCategoryId}
                            onChange={(val) => setSelectedCategoryId(val)}
                            optionFilterProp="label"
                            filterOption={(input, option) =>
                              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={categoriesList.map((cat: any) => ({
                              value: cat.categoryId || cat.id,
                              label: cat.categoryName || cat.name || '',
                            }))}
                            getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                          />
                        </Col>
                    
                        {/* Stock Item Filter */}
                        <Col xs={24} sm={10} md={9} lg={8}>
                          <Select
                            showSearch
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Filter by Stock Item..."
                            value={selectedItemId}
                            onChange={(val) => setSelectedItemId(val)}
                            optionFilterProp="label"
                            filterOption={(input, option) =>
                              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={stockItemsList.map((si: any) => ({
                              value: si.itemId || si.id,
                              label: `${si.itemCode || ''} - ${si.description || ''}`,
                            }))}
                            getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                          />
                        </Col>
                      </Row>
                    </Col>

                    {/* Refresh Details */}
                    <Col xs={12} sm={4} md={3} lg={3}>
                      <Button
                        type="primary"
                        block
                        onClick={() => refetchDetails()}
                        loading={isFetchingDetails}
                        icon={<ReloadOutlined />}
                      >
                        Load
                      </Button>
                    </Col>

                    {/* Export Details */}
                    <Col xs={12} sm={4} md={3} lg={5}>
                      <Button
                        type="default"
                        block
                        onClick={handleExportDetailsToExcel}
                        loading={isLoadingDetails}
                        icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
                        disabled={filteredDetailItems.length === 0}
                      >
                        Export ({filteredDetailItems.length})
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>

            {isLoadingDetails ? (
              <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" tip="Fetching Stock-Take Details..." />
              </Card>
            ) : (
              <StockTakeDetailsTable
                data={rawDetailItems}
                loading={isFetchingDetails}
                selectedCategoryId={selectedCategoryId}
                selectedItemId={selectedItemId}
                onFilteredDataChange={handleFilteredDetailChange}
              />
            )}
          </>
        )}
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default StockTakeBrowseReport;