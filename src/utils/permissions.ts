export enum UserRole {
  ATTENDANT = "ATTENDANT",
  EMPLOYEE = "EMPLOYEE",
  SUPERVISOR = "SUPERVISOR",
  QAE = "QAE",
  SUPERADMIN = "SUPERADMIN",
}

export const PERMISSIONS = {
  CAN_VIEW_COOLER_ASSIGNMENTS: [UserRole.QAE, UserRole.SUPERADMIN],
  CAN_MANAGE_RESOURCES: [UserRole.ATTENDANT],
  CAN_APPROVE: [UserRole.QAE],
};

export const hasPermission = (userRole: string, allowedRoles: string[]) => {
  return allowedRoles.includes(userRole);
};