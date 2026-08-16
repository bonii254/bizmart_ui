// Generic API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface Role {
  roleId: string;
  roleCode: string;
  roleName: string;
  description: string;
  isActive: boolean;
}

export interface RoleAccess {
  roleId: string;
  moduleCode: string;
  accessCode: string;
  isAllowed: boolean;
}


export interface RolePayload {
  roleCode: string;
  roleName: string;
  description: string;
  isActive: boolean;
}

export type CreateRolePayload = RolePayload;
export type UpdateRolePayload = Partial<RolePayload>;

export interface SaveRoleAccessPayload {
  moduleCode: string;
  accessCode: string;
  isAllowed: boolean;
}


export interface UpdateRoleParams {
  roleId: string;
  payload: UpdateRolePayload;
}

export interface DeleteRoleAccessParams {
  roleId: string;
  moduleCode: string;
  accessCode: string;
}

export type GetRolesResponse = ApiResponse<Role[]>;
export type GetRoleByIdResponse = ApiResponse<Role>;
export type CreateRoleResponse = ApiResponse<string>; // Returns created roleId UUID
export type UpdateRoleResponse = ApiResponse<string>;
export type DeleteRoleResponse = ApiResponse<string>;

// Role Access Responses
export type GetRoleAccessResponse = ApiResponse<RoleAccess[]>;
export type SaveRoleAccessResponse = ApiResponse<string>;
export type DeleteRoleAccessResponse = ApiResponse<string>;