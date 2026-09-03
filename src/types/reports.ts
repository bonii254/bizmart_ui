export interface StockTakeBrowseQueryParams {
  fromDate?: string;
  toDate?: string; 
  WarehouseId?: string;
  operatorId?: string;
}

export interface StockTakeTransaction {
  id?: string;
  stockTakeId?: string;
  stockTakeNo?: string;
  warehouseId?: string;
  warehouseName?: string;
  operatorId?: string;
  operatorName?: string;
  itemCode?: string;
  itemName?: string;
  systemQuantity?: number;
  countedQuantity?: number;
  varianceQuantity?: number;
  unitCost?: number;
  varianceValue?: number;
  transactionDate?: string;
  remarks?: string;
  [key: string]: unknown;
}

export interface StockTakeBrowseResponse {
  success: boolean;
  message: string;
  data: StockTakeTransaction[];
}


export interface InventoryTransactionQueryParams {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  itemId?: string;
}

export type InventoryTransactionType = 
  | "sale" 
  | "goods_receipt" 
  | "stock_take" 
  | (string & {});

export interface InventoryTransaction {
  transaction_id: string;
  posted_at: string;
  transaction_type: InventoryTransactionType;
  reference_number: string;
  warehouse_code: string;
  item_code: string;
  description: string;
  stock_uom: string;
  quantity: number;
  unit_cost: number;
}

export interface InventoryTransactionsResponse {
  success: boolean;
  message: string;
  data: InventoryTransaction[];
}

export interface SalesPerItemReportResponse {
  sold_at?: string;
  soldAt?: string;
  invoice_number?: string;
  invoiceNumber?: string;
  customer_name?: string;
  customerName?: string;
  item_code?: string;
  itemCode?: string;
  description?: string;
  stock_uom?: string;
  stockUom?: string;
  quantity: number;
  unit_price?: number;
  unitPrice?: number;
  line_total?: number;
  lineTotal?: number;

  itemId?: string;
  sellingPrice?: number;
  productClassDescription?: string;
}

export interface SalesPerItemReportResponse {
  success: boolean;
  message: string;
  data: SalesPerItemReportResponse[];
}

export interface SalesPerItemQueryParams {
  fromDate?: string;
  toDate?: string;
  itemId?: string;
}

export interface GroupedDataRecord {
  [stockCode: string]: {
    description: string;
    transactions: SalesPerItemReportResponse[];
    totalQty: number;
    totalValue: number;
  };
}

export interface SummaryClassAccumulator {
  description: string;
  totalQty: number;
  totalValue: number;
  items: {
    [stockCode: string]: {
      description: string;
      totalQty: number;
      totalValue: number;
    };
  };
}

export interface SummaryTableRow {
  key: string;
  stockCode: string;
  description: string;
  totalQty: number;
  totalValue: number;
  isProductClass: boolean;
  children?: SummaryTableRow[];
}

export interface SalesPerCustomerItem {
  soldAt: string;
  invoiceNumber: string;
  customerCode: string;
  customerName: string;
  itemCode: string;
  description: string;
  stockUom: string;
  quantity: number;
  unitPrice?: number;
  lineTotal: number;
  saleType?: string;
}

export interface SalesPerCustomerReportResponse {
  success: boolean;
  message: string;
  data: SalesPerCustomerItem[];
}

export interface SalesPerCustomerQueryParams {
  fromDate?: string;
  toDate?: string;
  customerId?: string;
}

export interface CustomerSummaryAccumulator {
  customerCode: string;
  customerName: string;
  totalQty: number;
  totalValue: number;
  items: {
    [stockCode: string]: {
      description: string;
      totalQty: number;
      totalValue: number;
    };
  };
}

export interface CustomerSummaryTableRow {
  key: string;
  customerCodeOrItem: string;
  customerNameOrDescription: string;
  totalQty: number;
  totalValue: number;
  isCustomerGroup: boolean;
  children?: CustomerSummaryTableRow[];
}

export interface PeriodicInventorySummaryQueryParams {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  itemId?: string;
}

export interface PeriodicInventorySummaryItem {
  period_month: string;
  periodMonth?: string;
  warehouse_code: string;
  warehouseCode?: string;
  item_code: string;
  itemCode?: string;
  description: string;
  stock_uom: string;
  stockUom?: string;
  opening_balance: number;
  openingBalance?: number;
  receipts: number;
  sales: number;
  expenses: number;
  adjustments: number;
  closing_balance: number;
  closingBalance?: number;
}

export interface PeriodicInventorySummaryResponse {
  success: boolean;
  message: string;
  data: PeriodicInventorySummaryItem[];
}

export interface StoreItemSummary {
  itemId: string;
  itemCode: string;
  description: string;
  stockUom: string;
  sellingPrice: number;
  quantityOnHand: number;
  averageCost: number;
  inventoryValue: number;
}

export interface StoreItemSummaryResponse {
  success: boolean;
  message: string;
  data: StoreItemSummary[];
}

