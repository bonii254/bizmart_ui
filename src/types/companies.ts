export interface Company {
  companyId: string;
  companyCode: string;
  companyName: string;
  createdAt?: string;
  isActive?: boolean;
}

export interface CompanyListResponse {
  success: boolean;
  message: string;
  data: Company[];
}

export interface CompanyPayload {
  companyCode: string;
  companyName: string;
  isActive?: boolean;
}

export type UpdateCompanyRequest = Partial<CompanyPayload>;