import { APIClient } from "../helpers/api_helper";
import { 
  Customer, 
  CustomerPayload, 
  UpdateUserRequest, 
  CustomerListResponse 
} from "../types/customer";

const api = new APIClient();
const BASE_URL = "/mock/customers";

export const CustomerService = {
  getAllCustomers: async (page = 1, perPage = 10): Promise<CustomerListResponse> => {
    return await api.get(BASE_URL, { page, per_page: perPage });
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    return await api.get(`${BASE_URL}/${id}`);
  },

  createCustomer: async (payload: CustomerPayload): Promise<Customer> => {
    const response = await api.create(BASE_URL, payload);
    return response.customer ?? response;
  },

  updateCustomer: async (id: number, payload: UpdateUserRequest): Promise<Customer> => {
    const response = await api.update(`${BASE_URL}/${id}`, payload);
    return response.customer ?? response;
  },

  deleteCustomer: async (id: number): Promise<{ message: string }> => {
    return await api.delete(`${BASE_URL}/${id}`);
  }
};