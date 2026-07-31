import { APIClient } from "../helpers/api_helper";
import { 
    Customer, 
    CustomerPayload, 
    UpdateUserRequest,
    CustomerListResponse  
} from "../types/customer"; 

const api = new APIClient();

export const CustomerService = {
  getAllCustomers: async (page = 1, perPage = 10): Promise<CustomerListResponse> => {
    return await api.get(`/customers`, { params: { page, per_page: perPage } });
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    return await api.get(`/customers/${id}`);
  },

  createCustomer: async (payload: CustomerPayload): Promise<Customer> => {
    const response = await api.create(`/customers`, payload);
    return response.customer ?? response;
  },

  updateCustomer: async (id: number, payload: UpdateUserRequest): Promise<Customer> => {
    const response = await api.update(`/customers/${id}`, payload);
    return response.customer ?? response;
  },

  deleteCustomer: async (id: number): Promise<{ message: string }> => {
    return await api.delete(`/customers/${id}`);
  }
};