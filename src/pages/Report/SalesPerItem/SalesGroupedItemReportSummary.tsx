import React, { useState, useMemo } from "react";
import { Table, Typography, Card, Button } from "antd";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { 
  SalesPerItemReportResponse, 
  SummaryClassAccumulator, 
  SummaryTableRow 
} from "../../../types/reports";
import { Category, CategoryListResponse } from "../../../types/category";
import { StockItem } from "../../../types/stockitem";
import { useCategories } from "../../../Components/Hooks/useCategory";
import { useStockItems } from "../../../Components/Hooks/useStockItems";

const { Title, Text } = Typography;

type SalesItemWithCategory = SalesPerItemReportResponse & {
  item_code?: string;
  itemCode?: string;
  categoryId?: string;
  category_id?: string;
  categoryName?: string;
  categoryDescription?: string;
  categoryCode?: string;
  category?: string | { categoryId?: string; id?: string; categoryName?: string; name?: string; description?: string; categoryCode?: string; code?: string };
  category_name?: string;
  category_description?: string;
  category_code?: string;
};

interface Props {
  data?: SalesPerItemReportResponse[];
  loading?: boolean;
}

const SalesGroupedItemReportSummary: React.FC<Props> = ({ data = [], loading = false }) => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const { data: stockItemsData, isLoading: loadingStockItems } = useStockItems();
  const { data: categoryData, isLoading: loadingCategories } = useCategories("", true);

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Extract stock items safely
  const stockItemsList = useMemo<StockItem[]>(() => {
    if (!stockItemsData) return [];
    if (Array.isArray(stockItemsData)) return stockItemsData as StockItem[];
    return (
      (stockItemsData as { items?: StockItem[]; data?: StockItem[] }).items ||
      (stockItemsData as { items?: StockItem[]; data?: StockItem[] }).data ||
      []
    );
  }, [stockItemsData]);

  // Extract categories safely using CategoryListResponse typing
  const categoriesList = useMemo<Category[]>(() => {
    if (!categoryData) return [];
    if (Array.isArray(categoryData)) return categoryData as Category[];
    
    const response = categoryData as CategoryListResponse;
    return response.categories || [];
  }, [categoryData]);

  // Fast lookup Map for Category Name by categoryId
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categoriesList.forEach((cat) => {
      if (cat.categoryId && cat.categoryName) {
        map.set(cat.categoryId, cat.categoryName);
      }
    });
    return map;
  }, [categoriesList]);

  // Fast lookup Map for StockItem by itemCode
  const stockItemMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    stockItemsList.forEach((item) => {
      const code = item.itemCode;
      if (code) {
        map.set(code, item);
      }
    });
    return map;
  }, [stockItemsList]);

  const categorySummary = useMemo(() => {
    return safeData.reduce<Record<string, SummaryClassAccumulator>>((acc, rawItem) => {
      const item = rawItem as SalesItemWithCategory;
      const stockCode = item.item_code || item.itemCode || item.itemId || 'UNKNOWN';

      // 1. Fetch full StockItem by stockCode
      const matchedStockItem = stockItemMap.get(stockCode);

      // 2. Resolve categoryId from StockItem or report payload
      const matchedCategoryId = 
        matchedStockItem?.categoryId || 
        item.categoryId || 
        item.category_id || 
        (typeof item.category === 'object' ? (item.category?.categoryId || item.category?.id) : undefined);

      // 3. Resolve categoryName from categoryMap
      const mappedCategoryName = matchedCategoryId ? categoryMap.get(matchedCategoryId) : undefined;

      // Fallback chain for various category representation fields
      const categoryKey = 
        mappedCategoryName ||
        matchedStockItem?.categoryName ||
        matchedStockItem?.category?.name ||
        item.categoryName || 
        item.category_name ||
        item.categoryDescription || 
        item.category_description ||
        item.categoryCode || 
        item.category_code ||
        (typeof item.category === 'string' ? item.category : (item.category?.categoryName || item.category?.name)) || 
        'Uncategorized';
        
      const categoryDescr = 
        mappedCategoryName ||
        matchedStockItem?.categoryName ||
        item.categoryDescription || 
        item.category_description ||
        item.categoryName || 
        item.category_name ||
        categoryKey;

      const qty = item.quantity || 0;
      const lineVal = item.lineTotal ?? item.line_total ?? ((item.unitPrice || item.unit_price || 0) * qty);
      
      if (!acc[categoryKey]) {
        acc[categoryKey] = {
          description: categoryDescr,
          totalQty: 0,
          totalValue: 0,
          items: {}
        };
      }
      
      acc[categoryKey].totalQty += qty;
      acc[categoryKey].totalValue += lineVal;
      
      if (!acc[categoryKey].items[stockCode]) {
        acc[categoryKey].items[stockCode] = {
          description: item.description || matchedStockItem?.description || '',
          totalQty: 0,
          totalValue: 0,
        };
      }
      
      acc[categoryKey].items[stockCode].totalQty += qty;
      acc[categoryKey].items[stockCode].totalValue += lineVal;
      
      return acc;
    }, {});
  }, [safeData, stockItemMap, categoryMap]);

  const topLevelData: SummaryTableRow[] = useMemo(() => {
    return Object.entries(categorySummary).map(
      ([categoryKey, categoryData]) => ({
        key: categoryKey,
        stockCode: categoryKey,
        description: categoryData.description,
        totalQty: categoryData.totalQty,
        totalValue: categoryData.totalValue,
        isProductClass: true,
        children: Object.entries(categoryData.items).map(([stockCode, itemData]) => ({
          key: `${categoryKey}-${stockCode}`,
          stockCode: stockCode,
          description: itemData.description,
          totalQty: itemData.totalQty,
          totalValue: itemData.totalValue,
          isProductClass: false,
        }))
      })
    );
  }, [categorySummary]);

  const grandTotalQty = useMemo(() => topLevelData.reduce((sum, item) => sum + item.totalQty, 0), [topLevelData]);
  const grandTotalValue = useMemo(() => topLevelData.reduce((sum, item) => sum + item.totalValue, 0), [topLevelData]);

  const columns: ColumnsType<SummaryTableRow> = [
    {
      title: 'Category / Stock Code',
      dataIndex: 'stockCode',
      key: 'stockCode',
      sorter: (a, b) => a.stockCode.localeCompare(b.stockCode),
      render: (value, record) => {
        if (record.isProductClass) {
          return (
            <Text strong>
              {value}
            </Text>
          );
        }
        return (
          <Text style={{ paddingLeft: 24 }}>
            {value}
          </Text>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => {
        if (record.isProductClass) {
          return <Text strong>Category Total</Text>;
        }
        return value;
      },
    },
    {
      title: 'Total Quantity',
      dataIndex: 'totalQty',
      key: 'totalQty',
      align: 'right',
      sorter: (a, b) => a.totalQty - b.totalQty,
      render: (value, record) => (
        <Text strong={record.isProductClass}>
          {value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Total Value (Ksh)',
      dataIndex: 'totalValue',
      key: 'totalValue',
      align: 'right',
      sorter: (a, b) => a.totalValue - b.totalValue,
      render: (value, record) => (
        <Text strong={record.isProductClass}>
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </Text>
      ),
    },
  ];

  const expandAll = () => {
    setExpandedRows(topLevelData.map(item => item.key));
  };

  const collapseAll = () => {
    setExpandedRows([]);
  };

  const handleExpand = (expanded: boolean, record: SummaryTableRow) => {
    if (expanded) {
      setExpandedRows(prev => [...prev, record.key]);
    } else {
      setExpandedRows(prev => prev.filter(key => key !== record.key));
    }
  };

  return (
    <Card loading={loading || loadingCategories || loadingStockItems}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0 }}>
          Sales Summary by Category and Item
        </Title>
        <div>
          <Button 
            size="small" 
            onClick={expandAll}
            style={{ marginRight: 8 }}
          >
            Expand All
          </Button>
          <Button 
            size="small" 
            onClick={collapseAll}
          >
            Collapse All
          </Button>
        </div>
      </div>

      <Table<SummaryTableRow>
        columns={columns}
        dataSource={topLevelData}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} categories`,
        }}
        size="middle"
        bordered
        expandable={{
          expandedRowKeys: expandedRows,
          onExpand: handleExpand,
          expandIcon: ({ expanded, onExpand, record }) =>
            record.isProductClass ? (
              <Button
                type="text"
                size="small"
                onClick={e => onExpand(record, e)}
                style={{ marginRight: 8 }}
              >
                {expanded ? <DownOutlined /> : <RightOutlined />}
              </Button>
            ) : null,
        }}
        rowClassName={(record) => 
          record.isProductClass ? 'category-group-row' : 'stock-item-row'
        }
        summary={() => (
          <Table.Summary.Row style={{ background: '#f0f9ff' }}>
            <Table.Summary.Cell index={0} colSpan={2}>
              <Text strong>Grand Total</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <Text strong>{grandTotalQty.toLocaleString()}</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right">
              <Text strong>
                {grandTotalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
};

export default SalesGroupedItemReportSummary;