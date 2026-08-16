import { APIClient } from "../helpers/api_helper";
import {
  Company,
  CompanyPayload,
  UpdateCompanyRequest,
  CompanyListResponse,
} from "../types/companies";

const api = new APIClient();
const BASE_URL = "/mock/companies";

export const CompanyService = {
  getAllCompanies: async (active?: boolean): Promise<CompanyListResponse> => {
    const params = active !== undefined ? { active: String(active) } : {};
    return await api.get(`${BASE_URL}`, { params });
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
    return response.company;
  },

  deleteCompany: async (id: string): Promise<{ message: string }> => {
    return await api.delete(`${BASE_URL}/${id}`);
  },
};