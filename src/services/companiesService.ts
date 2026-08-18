import { APIClient } from "../helpers/api_helper";
import {
  Company,
  CompanyPayload,
  UpdateCompanyRequest,
} from "../types/companies";

const api = new APIClient();
const BASE_URL = "/api/administration/companies";

export const CompanyService = {
  getAllCompanies: async (): Promise<Company[]> => {
    const response = await api.get(BASE_URL);
    return response.data || []
  },

  createCompany: async (payload: CompanyPayload): Promise<Company> => {
    const response = await api.create(`${BASE_URL}`, payload);
    return response.data;
  },

  updateCompany: async (
    id: string,
    payload: UpdateCompanyRequest,
  ): Promise<Company> => {
    const response = await api.update(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  deleteCompany: async (id: string): Promise<{ message: string }> => {
    return await api.delete(`${BASE_URL}/${id}`);
  },
};