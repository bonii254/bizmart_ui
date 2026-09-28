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
  Select,
} from 'antd';
import {
  ReloadOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

import { useWarehouses } from '../../../Components/Hooks/useWarehouse';
import { useInventoryValuation } from '../../../Components/Hooks/useReport2';
import { 
    InventoryValuationItem, 
    InventoryValuationQueryParams 
} from '../../../types/reports2';
import InventoryValuationTable from './InventoryValuationTable';

const { Title, Text } = Typography;

const InventoryValuationReport: React.FC = () => {
  // Warehouse filter state (holds warehouseId UUID)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  
  // Holds active filtered dataset emitted by child table for Excel export
  const [filteredValuationItems, setFilteredValuationItems] = useState<InventoryValuationItem[]>([]);

  // Fetch list of available warehouses for dropdown selection
  const { data: warehousesList, isLoading: isLoadingWarehouses } = useWarehouses();

  // Construct query parameters passed directly to the backend API via custom hook
  const queryParams = useMemo<InventoryValuationQueryParams>(() => {
    return {
      warehouseId: selectedWarehouseId || undefined,
    };
  }, [selectedWarehouseId]);

  // Query Inventory Valuation endpoint (automatically refetches on warehouseId change)
  const {
    data: responseData,
    isLoading: isLoadingValuation,
    isFetching: isFetchingValuation,
    refetch,
  } = useInventoryValuation(queryParams);

  // Safely parse API response payload array
  const rawValuationItems = useMemo<InventoryValuationItem[]>(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.data)) return responseData.data;
    return [];
  }, [responseData]);

  // Sync active filtered dataset from child table component
  const handleFilteredDataChange = useCallback((items: InventoryValuationItem[]) => {
    setFilteredValuationItems(items);
  }, []);

  // Export Filtered Inventory Valuation to Excel
  const handleExportToExcel = () => {
    if (!filteredValuationItems || filteredValuationItems.length === 0) {
      message.warning('No inventory valuation data available to export');
      return;
    }

    try {
      const exportData = filteredValuationItems.map((item) => ({
        'Warehouse Code': item.warehouse_code || 'N/A',
        'Item Code': item.item_code || 'N/A',
        Description: item.description || 'N/A',
        'Stock UOM': item.stock_uom?.toUpperCase() || 'N/A',
        'Quantity On Hand': item.quantity_on_hand || 0,
        'Average Cost (Ksh)': item.average_cost || 0,
        'Inventory Value (Ksh)': item.inventory_value || 0,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 16 },
        { wch: 18 },
        { wch: 32 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
        { wch: 22 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Valuation');

      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const whCodeStr = selectedWarehouseId ? 'FilteredWarehouse' : 'AllWarehouses';

      XLSX.writeFile(wb, `InventoryValuation_${whCodeStr}_${timestamp}.xlsx`);
      message.success('Inventory valuation report exported successfully!');
    } catch (error) {
      message.error('Failed to export inventory valuation to Excel');
    }
  };

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
            <Col xs={24} lg={8}>
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
                    Inventory Valuation Report
                  </Title>
                </div>
              </div>
            </Col>

            {/* Controls Bar */}
            <Col xs={24} lg={16}>
              <Row gutter={[8, 8]} justify="end" align="middle">
                {/* Select Warehouse - Passes warehouseId to backend */}
                <Col xs={24} sm={12} md={10} lg={9}>
                  <Select
                    showSearch
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="All Warehouses"
                    loading={isLoadingWarehouses}
                    value={selectedWarehouseId}
                    onChange={(val) => setSelectedWarehouseId(val)}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={(warehousesList || []).map((wh) => ({
                      value: wh.warehouseId,
                      label: `${wh.warehouseName} (${wh.warehouseCode})`,
                    }))}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  />
                </Col>

                {/* Reload Button */}
                <Col xs={12} sm={6} md={5} lg={4}>
                  <Button
                    type="primary"
                    block
                    onClick={() => refetch()}
                    loading={isFetchingValuation}
                    icon={<ReloadOutlined />}
                  >
                    Load
                  </Button>
                </Col>

                {/* Export Button */}
                <Col xs={12} sm={6} md={5} lg={4}>
                  <Button
                    type="default"
                    block
                    onClick={handleExportToExcel}
                    loading={isLoadingValuation}
                    icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
                    disabled={filteredValuationItems.length === 0}
                  >
                    Export ({filteredValuationItems.length})
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Main Content Area */}
        {isLoadingValuation ? (
          <Card size="small" className="shadow-sm border-0" style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="Loading Inventory Valuation..." />
          </Card>
        ) : (
          <InventoryValuationTable
            data={rawValuationItems}
            loading={isFetchingValuation}
            onFilteredDataChange={handleFilteredDataChange}
          />
        )}
      </Container>
      <ToastContainer closeButton={false} limit={1} />
    </div>
  );
};

export default InventoryValuationReport;