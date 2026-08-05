export interface POSLineItem {
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxAmount?: number;
  lineTotal: number;
}

export interface POSHeader {
  transactionId: string;
  receiptNumber: string;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  status: string;
  postedAt: string;
  items?: POSLineItem[];
}

export interface POSPayload {
  customerId?: string;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY' | string;
  amountPaid: number;
  items: {
    stockItemId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
}

export interface SinglePOSResponse {
  sale_receipt_201: POSHeader;
}

export interface POSListResponse {
  sales: POSHeader[];
  recordCount?: number;
}