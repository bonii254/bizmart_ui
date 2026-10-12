export interface CreditSaleLineRequest {
  itemId: string;
  quantity: number; 
  unitPrice: number;
  uomCode: string;
}

export interface CreateCreditSaleRequest {
  warehouseId: string;
  customerId: string;
  operatorId: string;
  lines: CreditSaleLineRequest[];
}

export interface CreditSaleResultData {
  documentId: string;
  documentNumber: string;
  total: number;
  postedAt: string;
}

export interface CreditSaleResponse {
  success: boolean;
  message: string;
  data: CreditSaleResultData;
}