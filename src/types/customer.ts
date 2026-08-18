export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Customer {
  customerId: string;
  customerCode: string;
  customerName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  creditLimit: number;
  priceCode: string;
  isActive: boolean;
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
  priceCode: string;
  isActive: boolean;
}

export type UpdateCustomerRequest = Partial<CustomerPayload>;

export type GetCustomersResponse = ApiResponse<Customer[]>;
export type GetCustomerByIdResponse = ApiResponse<Customer>;
export type CreateCustomerResponse = ApiResponse<string>;
export type UpdateCustomerResponse = ApiResponse<string>;
export type DeleteCustomerResponse = ApiResponse<string>;

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}