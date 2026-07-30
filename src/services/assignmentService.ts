import { APIClient } from "../helpers/api_helper";
import { 
    CoolerAssignment, 
    CreateAssignmentPayload, 
} from "../types/assignment";

const api = new APIClient();
const BASE_URL = "/v1/assignments";

export const AssignmentService = {
  assignUser: async (payload: CreateAssignmentPayload): Promise<CoolerAssignment> => {
    const response = await api.create(`${BASE_URL}`, payload);
    return response.assignment;
  },

  getActiveAssignment: async (): Promise<CoolerAssignment> => {
    const response = await api.get(`${BASE_URL}/active`);
    return response.assignment;
  },

  getAllAssignments: async (): Promise<CoolerAssignment[]> => {
    const response = await api.get(`${BASE_URL}/all`);
    return response.assignments;
  },

  getUserHistory: async (userId: string): Promise<CoolerAssignment[]> => {
    const response = await api.get(`${BASE_URL}/history/${userId}`);
    return response.history;
  },

  unassignUser: async (userId: string): Promise<{ message: string }> => {
    return await api.create(`${BASE_URL}/unassign`, { user_id: userId });
  },

  deleteAssignment: async (id: string): Promise<{ message: string }> => {
    return await api.delete(`${BASE_URL}/delete/${id}`);
  }
};