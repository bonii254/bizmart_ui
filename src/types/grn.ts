export interface GoodsReceiptLinePayload {
  itemId: string;
  quantity: number;
  unitPrice: number;
  uomCode: string;
}

export interface CreateGoodsReceiptPayload {
  warehouseId: string;
  supplierId: string;
  operatorId: string;
  lines: GoodsReceiptLinePayload[];
}

export interface GoodsReceiptCreatedData {
  documentId: string;
  documentNumber: string;
  total: number;
  postedAt: string;
}

export interface CreateGoodsReceiptResponse {
  success: boolean;
  message: string;
  data: GoodsReceiptCreatedData;
}

export interface GoodsReceiptDetailData {
  documentId: string;
  documentNumber: string;
  total: number;
  postedAt: string;
  warehouseId?: string;
  supplierId?: string;
  operatorId?: string;
  lines?: GoodsReceiptLinePayload[];
}

export interface SingleGoodsReceiptResponse {
  success: boolean;
  message: string;
  data: GoodsReceiptDetailData;
}

export interface GoodsReceiptReversalLineRequest {
  itemId: string;
  quantity: number;
  unitPrice: number;
  uomCode: string; 
}

export interface CreateGoodsReceiptReversalRequest {
  sourceGoodsReceiptId: string; 
  operatorId: string; 
  reasonCode: string;
  lines: GoodsReceiptReversalLineRequest[];
}

export interface GoodsReceiptReversalResultData {
  documentId: string;
  documentNumber: string;
  total: number;
  postedAt: string;
}

export interface GoodsReceiptReversalResponse {
  success: boolean;
  message: string;
  data: GoodsReceiptReversalResultData;
}