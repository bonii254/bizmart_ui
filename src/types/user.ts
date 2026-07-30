export enum UserRole {
  ATTENDANT = "ATTENDANT",
  QAE = "QAE",
  ADMIN = "ADMIN"
}

export interface User {
  id: number;
  username: string;
  email: string;
  payroll_number: string;
  role_name: UserRole;
  is_active: boolean;
  last_login?: string;
  has_employee_profile: boolean;
}

export interface UserPayload {
  username: string;
  email: string;
  payroll_number: string;
  password?: string;
  confirm_password?: string;
  role: UserRole;
}

export interface UpdateUserRequest extends Partial<UserPayload> {
  is_active?: number; 
}

export interface UserListResponse {
  users: User[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}