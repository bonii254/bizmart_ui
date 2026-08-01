export interface Company {
  companyId: string;
  companyCode: string;
  companyName: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyPayload {
  companyCode: string;
  companyName: string;
  isActive?: boolean;
}

export interface UpdateCompanyRequest extends Partial<CompanyPayload> {}

export interface CompanyListResponse {
  companies: Company[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}