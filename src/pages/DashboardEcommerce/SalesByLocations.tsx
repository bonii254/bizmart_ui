import React, { useMemo } from "react";
import { Card, CardBody, CardHeader, Spinner } from "reactstrap";
import dayjs from "dayjs";

import { useSalesPerItemReport } from "../../Components/Hooks/useReports";
import { useCategories } from "../../Components/Hooks/useCategory";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { SalesPerItemReportResponse } from "../../types/reports";
import { Category, CategoryListResponse } from "../../types/category";
import { StockItem } from "../../types/stockitem";

type SalesItemWithCategory = SalesPerItemReportResponse & {
  item_code?: string;
  itemCode?: string;
  categoryId?: string;
  category_id?: string;
  categoryName?: string;
  categoryDescription?: string;
  categoryCode?: string;
  category?:
    | string
    | {
        categoryId?: string;
        id?: string;
        categoryName?: string;
        name?: string;
        description?: string;
        categoryCode?: string;
        code?: string;
      };
  category_name?: string;
  category_description?: string;
  category_code?: string;
};

interface CategorySalesSummary {
  name: string;
  totalValue: number;
  totalQty: number;
  percentage: number;
  color: string;
}

const COLOR_PALETTE = [
  "primary",
  "success",
  "info",
  "warning",
  "danger",
  "secondary",
];

const SalesByCategory: React.FC = () => {
  const { fromDate, toDate } = useMemo(() => {
    const today = dayjs();
    const thirtyDaysAgo = today.subtract(30, "day");
    return {
      fromDate: thirtyDaysAgo.format("YYYY-MM-DD"),
      toDate: today.format("YYYY-MM-DD"),
    };
  }, []);

  const { data: rawReportData = [], isLoading: loadingReport } =
    useSalesPerItemReport({ fromDate, toDate });

  const { data: stockItemsData, isLoading: loadingStockItems } = useStockItems();
  const { data: categoryData, isLoading: loadingCategories } = useCategories("", true);

  const isLoading = loadingReport || loadingStockItems || loadingCategories;

  const reportItems = useMemo<SalesItemWithCategory[]>(() => {
    const raw = rawReportData as any;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  }, [rawReportData]);

  const stockItemMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    if (!stockItemsData) return map;

    const list: StockItem[] = Array.isArray(stockItemsData)
      ? (stockItemsData as StockItem[])
      : (stockItemsData as any).items || (stockItemsData as any).data || [];

    list.forEach((item) => {
      if (item.itemCode) {
        map.set(item.itemCode, item);
      }
    });
    return map;
  }, [stockItemsData]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!categoryData) return map;

    const list: Category[] = Array.isArray(categoryData)
      ? (categoryData as Category[])
      : (categoryData as CategoryListResponse).categories || [];

    list.forEach((cat) => {
      if (cat.categoryId && cat.categoryName) {
        map.set(cat.categoryId, cat.categoryName);
      }
    });
    return map;
  }, [categoryData]);

  const { categoryList, grandTotalValue, grandTotalQty } = useMemo(() => {
    const aggregates: Record<string, { totalValue: number; totalQty: number }> = {};
    let overallValue = 0;
    let overallQty = 0;

    reportItems.forEach((rawItem) => {
      const item = rawItem;
      const stockCode = item.item_code || item.itemCode || item.itemId || "UNKNOWN";

      const matchedStockItem = stockItemMap.get(stockCode);
      const matchedCategoryId =
        matchedStockItem?.categoryId ||
        item.categoryId ||
        item.category_id ||
        (typeof item.category === "object"
          ? item.category?.categoryId || item.category?.id
          : undefined);

      const mappedCategoryName = matchedCategoryId
        ? categoryMap.get(matchedCategoryId)
        : undefined;

      const categoryName =
        mappedCategoryName ||
        matchedStockItem?.categoryName ||
        matchedStockItem?.category?.name ||
        item.categoryName ||
        item.category_name ||
        item.categoryDescription ||
        item.category_description ||
        item.categoryCode ||
        item.category_code ||
        (typeof item.category === "string"
          ? item.category
          : item.category?.categoryName || item.category?.name) ||
        "Uncategorized";

      const qty = item.quantity || 0;
      const lineVal =
        item.lineTotal ??
        item.line_total ??
        (item.unitPrice || item.unit_price || 0) * qty;

      if (!aggregates[categoryName]) {
        aggregates[categoryName] = { totalValue: 0, totalQty: 0 };
      }

      aggregates[categoryName].totalValue += lineVal;
      aggregates[categoryName].totalQty += qty;

      overallValue += lineVal;
      overallQty += qty;
    });

    const sortedList: CategorySalesSummary[] = Object.entries(aggregates)
      .map(([name, data], index) => {
        const percentage =
          overallValue > 0
            ? Math.round((data.totalValue / overallValue) * 100)
            : 0;

        return {
          name,
          totalValue: data.totalValue,
          totalQty: data.totalQty,
          percentage,
          color: COLOR_PALETTE[index % COLOR_PALETTE.length],
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);

    return {
      categoryList: sortedList,
      grandTotalValue: overallValue,
      grandTotalQty: overallQty,
    };
  }, [reportItems, stockItemMap, categoryMap]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="card-height-100 border-0 shadow-sm d-flex flex-column mb-0 w-100">
      <CardHeader className="align-items-center d-flex py-3">
        <h4 className="card-title mb-0 flex-grow-1 text-truncate fs-15 fw-semibold">
          Sales by Category
        </h4>
        <div className="flex-shrink-0 ms-2">
          <span className="badge bg-info-subtle text-info fs-11">
            Last 30 Days
          </span>
        </div>
      </CardHeader>

      <CardBody className="d-flex flex-column justify-content-between p-3 flex-grow-1">
        {isLoading ? (
          <div
            className="d-flex justify-content-center align-items-center flex-grow-1"
            style={{ minHeight: "280px" }}
          >
            <Spinner color="primary" />
          </div>
        ) : (
          <>
            {/* Top Revenue Summary Box */}
            <div className="text-center bg-light rounded-3 p-2 p-sm-3 mb-3">
              <h3 className="fw-bold text-primary mb-1 fs-16 fs-sm-18 text-truncate">
                Ksh {formatCurrency(grandTotalValue)}
              </h3>
              <p className="text-muted text-uppercase fw-semibold mb-0 fs-10 fs-sm-11 text-truncate">
                Total Revenue ({grandTotalQty.toLocaleString()} Units Sold)
              </p>
            </div>

            {/* Scrollable Category List with flex shrinking */}
            <div
              style={{
                maxHeight: "270px",
                overflowY: "auto",
                paddingRight: "4px",
                minHeight: "0px",
              }}
              className="custom-scrollbar flex-grow-1"
            >
              {categoryList.length === 0 ? (
                <div className="text-center text-muted py-4 fs-13">
                  No sales recorded in the last 30 days.
                </div>
              ) : (
                categoryList.map((cat, index) => (
                  <div key={index} className="mb-3 category-row">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6
                        className="fs-12 fs-sm-13 mb-0 text-truncate fw-medium"
                        style={{ maxWidth: "50%" }}
                        title={cat.name}
                      >
                        {cat.name}
                      </h6>
                      <span className="fs-11 fs-sm-12 text-muted fw-medium text-nowrap ms-2">
                        Ksh {formatCurrency(cat.totalValue)}{" "}
                        <span className="ms-1 text-dark fw-semibold">
                          ({cat.percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="progress progress-sm" style={{ height: "6px" }}>
                      <div
                        className={`progress-bar bg-${cat.color}`}
                        role="progressbar"
                        style={{
                          width: `${cat.percentage}%`,
                          borderRadius: "10px",
                        }}
                        title={`${cat.name}: Ksh ${formatCurrency(cat.totalValue)} (${cat.totalQty} units)`}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardBody>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
      `}</style>
    </Card>
  );
};

export default SalesByCategory;