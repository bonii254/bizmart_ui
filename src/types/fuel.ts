export type FuelLogStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

export interface FuelDailyLog {
  id: string;
  date: string;
  cooler_id: string;
  attendant_id: string;

  cooler_name?: string;
  cooler_route?: string;
  attendant_name?: string;
  attendant_payroll_number?: string;
  is_editable: boolean;

  opening_stock_pct: number;
  closing_stock_pct?: number;
  receipt_top_up: number;
  receipt_serial?: string;
  
  opening_hours?: number;
  closing_hours?: number;
  fuel_return: number;

  opening_stock_liters?: number;
  total_available?: number;
  closing_stock_liters?: number;
  fuel_used_liters?: number;
  running_time_minutes?: number;
  actual_consumption_rate?: number;
  expected_consumption_rate?: number;
  variance_liters?: number;
  variance_percent?: number;

  remarks?: string;
  qae_remarks?: string;
  status: FuelLogStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateFuelLogPayload {
  date: string;
  cooler_id: string;
  opening_stock_liters: number | string;
  opening_hours: number | string;
}


export interface UpdateFuelLogPayload {
  receipt_top_up?: number | string;
  receipt_serial?: string;
  closing_stock_liters?: number | string;
  opening_hours?: number | string;
  opening_stock_liters?: number | string;
  closing_hours?: number | string;
  fuel_return?: number | string;
  route_in_charge?: string;
  remarks?: string;
  status?: 'DRAFT' | 'APPROVED' | 'SUBMITTED';
}

export interface QAEFuelApprovalPayload {
  qae_remarks: string;
  status: 'APPROVED' | 'REJECTED';
}