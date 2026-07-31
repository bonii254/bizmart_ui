import { APIClient } from "../helpers/api_helper";
const api = new APIClient();

export const AuditService = {
  getAuditLogs: async (date: string, page = 1, perPage = 20) => {
    const fileName = `audit.json.${date}`;
    
    return await api.get(`/v1/audit`, {
      params: {
        file: fileName,
        page: page,
        per_page: perPage
      }
    });
  }
};