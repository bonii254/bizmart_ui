export interface Customer {
  id: number;
  customerCode: string;
  customerName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  creditLimit: number;
  is_active: boolean;
}

export interface CustomerPayload {
  customerCode: string;
  customerName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  creditLimit: number;
}

export interface UpdateUserRequest extends Partial<CustomerPayload> {
  is_active?: boolean; 
}

export interface CustomerListResponse {
  users: Customer[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}