import axios from "axios";
import {
  GetRolesResponse,
  GetRoleByIdResponse,
  CreateRolePayload,
  CreateRoleResponse,
  UpdateRolePayload,
  UpdateRoleResponse,
  DeleteRoleResponse,
  GetRoleAccessResponse,
  SaveRoleAccessPayload,
  SaveRoleAccessResponse,
  DeleteRoleAccessParams,
  DeleteRoleAccessResponse
} from "../types/role"
const BASE_URL = "/api/security/roles";

export const roleService = {
  // Role CRUD
  getRoles: async (): Promise<GetRolesResponse> => {
    const { data } = await axios.get(BASE_URL);
    return data;
  },

  getRoleById: async (roleId: string): Promise<GetRoleByIdResponse> => {
    const { data } = await axios.get(`${BASE_URL}/${roleId}`);
    return data;
  },

  createRole: async (payload: CreateRolePayload): Promise<CreateRoleResponse> => {
    const { data } = await axios.post(BASE_URL, payload);
    return data;
  },

  updateRole: async (roleId: string, payload: UpdateRolePayload): Promise<UpdateRoleResponse> => {
    const { data } = await axios.post(`${BASE_URL}/${roleId}/update`, payload);
    return data;
  },

  deleteRole: async (roleId: string): Promise<DeleteRoleResponse> => {
    const { data } = await axios.post(`${BASE_URL}/${roleId}/delete`);
    return data;
  },

  // Role Access Permissions
  getRoleAccess: async (roleId: string): Promise<GetRoleAccessResponse> => {
    const { data } = await axios.get(`${BASE_URL}/${roleId}/access`);
    return data;
  },

  saveRoleAccess: async (
    roleId: string,
    payload: SaveRoleAccessPayload
  ): Promise<SaveRoleAccessResponse> => {
    const { data } = await axios.post(`${BASE_URL}/${roleId}/access/save`, payload);
    return data;
  },

  deleteRoleAccess: async ({
    roleId,
    moduleCode,
    accessCode,
  }: DeleteRoleAccessParams): Promise<DeleteRoleAccessResponse> => {
    const { data } = await axios.post(
      `${BASE_URL}/${roleId}/access/${moduleCode}/${accessCode}/delete`
    );
    return data;
  },
};