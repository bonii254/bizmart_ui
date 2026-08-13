export interface ReceiptItem {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}


export interface GRNLineItem {
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  uom: string;
  taxRate?: number;
  taxAmount?: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface GRNHeader {
  documentId: string;
  documentNumber: string;
  supplierId: string;
  supplierName?: string;
  supplierInvoiceNo?: string;
  total: number;
  postedAt: string;
  items?: GRNLineItem[];
}

export interface GRNPayload {
  documentNumber?: string;
  supplierId: string;
  supplierInvoiceNo: string;
  items: {
    stockItemId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface SingleGRNResponse {
  goods_receipt_201: GRNHeader;
}

export interface GRNListResponse {
  goodsReceipts: GRNHeader[];
  recordCount?: number;
}