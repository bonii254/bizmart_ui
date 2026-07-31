import { APIClient } from "../helpers/api_helper";
import { 
    User, 
    UserPayload, 
    UpdateUserRequest, 
    UserListResponse 
} from "../types/user";

const api = new APIClient();

export const UserService = {
  getAllUsers: async (page = 1, perPage = 10): Promise<UserListResponse> => {
    return await api.get(`/users`, { params: { page, per_page: perPage } });
  },

  createUser: async (payload: UserPayload): Promise<User> => {
    const response = await api.create(`/auth/register`, payload);
    return response.user;
  },

  updateUser: async (id: number, payload: UpdateUserRequest): Promise<User> => {
    const response = await api.update(`/auth/user/${id}`, payload);
    return response.user;
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    return await api.delete(`/users/${id}`);
  },

  forgetUserPassword: async (payload: UpdateUserRequest): Promise<{ message: string }> => {
    return await api.update(`/auth/forgot-password`, payload)
  }
}