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
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierPayload {
  supplierCode: string;
  supplierName: string;
  contactName: string;
  phone: string;
  email: string;
  taxNumber: string;
  paymentTermsDays: number;
}

export type UpdateSupplierRequest = Partial<SupplierPayload> & {
  isActive?: boolean;
};

export interface SupplierListResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  limit: number;
}