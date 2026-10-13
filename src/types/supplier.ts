export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Supplier {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  contactName: string;
  phone: string;
  email: string;
  taxNumber: string;
  paymentTermsDays: number;
  isActive: boolean;
}

export interface SupplierPayload {
  supplierCode: string;
  supplierName: string;
  contactName: string;
  phone: string;
  email: string;
  taxNumber: string;
  paymentTermsDays: number;
  isActive: boolean;
}

export type UpdateSupplierRequest = Partial<SupplierPayload>;

export type GetSuppliersResponse = ApiResponse<Supplier[]>;
export type GetSupplierByIdResponse = ApiResponse<Supplier>;
export type CreateSupplierResponse = ApiResponse<string>;
export type UpdateSupplierResponse = ApiResponse<string>;
export type DeleteSupplierResponse = ApiResponse<string>;

export interface CreateSupplierPaymentRequest {
  supplierId: string;
  operatorId: string;
  bankId: string;
  amount: number;
  paymentMethodCode: string;
  reference: string;
  goodsReceiptId: string;
}

export interface SupplierPaymentResultData {
  documentId: string;
  documentNumber: string;
  total: number;
  postedAt: string;
}

export interface SupplierPaymentResponse {
  success: boolean;
  message: string;
  data: SupplierPaymentResultData;
}