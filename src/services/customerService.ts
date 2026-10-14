import { APIClient } from "../helpers/api_helper";
import { 
  Customer, 
  CustomerPayload, 
  UpdateCustomerRequest,
  CreateCustomerPaymentRequest, 
  CustomerPaymentResultData, 
  CustomerPaymentResponse
} from "../types/customer";

const api = new APIClient();
const BASE_URL = "/api/customers";
const PAYMENT_BASE_URL = "/api/transactions/customer-payments";

export const CustomerService = {
  getAllCustomers: async (): Promise<Customer[]> => {
    const response = await api.get(BASE_URL);
    return response.data?.data ?? response.data ?? response;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data?.data ?? response.data ?? response;
  },

  createCustomer: async (payload: CustomerPayload): Promise<string> => {
    const response = await api.create(BASE_URL, payload);
    return response.data?.data ?? response.data ?? response;
  },

  updateCustomer: async (id: string, payload: UpdateCustomerRequest): Promise<string> => {
    const response = await api.create(`${BASE_URL}/${id}/update`, payload);
    return response.data?.data ?? response.data ?? response;
  },

  deleteCustomer: async (id: string): Promise<string> => {
    const response = await api.create(`${BASE_URL}/${id}/delete`, {});
    return response.data?.data ?? response.data ?? response;
  }
};

export const CustomerPaymentService = {
  createCustomerPayment: async (
    payload: CreateCustomerPaymentRequest
  ): Promise<CustomerPaymentResultData> => {
    const response: CustomerPaymentResponse = await api.create(
      PAYMENT_BASE_URL, 
      payload
    );
    return response.data ?? response;
  },
};