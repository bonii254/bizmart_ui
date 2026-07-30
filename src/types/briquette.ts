export type LogStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface BriquetteLog {
  id: string;
  date: string; 
  cooler_id: string;
  attendant_id: string;
  
  cooler_name?: string; 
  attendant_name?: string; 
  attendant_payroll_number?: string;
  is_editable: boolean;
  
  opening_stock: number;
  opening_variance_reason?: string;
  
  receipts: number;
  receipt_serial?: string;
  am_consumption: number;
  pm_consumption: number;
  transfers: number;
  
  total_available: number;
  total_consumption: number;
  total_utilisation: number;
  expected_closing_stock: number;
  closing_stock_actual?: number;
  variance: number;
  variance_percent: number;
  
  remarks?: string;
  qae_remarks?: string;
  status: LogStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateBriquettePayload {
  opening_stock: number | string;
  opening_variance_reason?: string;
}

export interface UpdateBriquettePayload {
  receipts?: number | string;
  receipt_serial?: string;
  am_consumption?: number | string;
  pm_consumption?: number | string;
  transfers?: number | string;
  closing_stock_actual?: number | string;
  remarks?: string;
  status?: 'DRAFT' | 'SUBMITTED';
}

export interface QAEApprovalPayload {
  qae_remarks: string;
  status: 'APPROVED' | 'REJECTED';
}