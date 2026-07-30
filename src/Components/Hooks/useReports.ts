import { useQuery } from "@tanstack/react-query";
import { InventoryReportService } from "../../services/reportsService";
import { 
  FifoReportParams,
  WarehouseSummaryParams 
} from "../../types/reports";

export const useFifoValuationReport = (params?: FifoReportParams) => {
  return useQuery({
    queryKey: ["fifoValuationReport", params?.warehouse_id],
    queryFn: () => InventoryReportService.getFifoValuationReport(params),
  });
};

export const useWarehouseSummaryReport = (params?: WarehouseSummaryParams) => {
  return useQuery({
    queryKey: ["warehouseSummaryReport", params?.warehouse_id],
    queryFn: () => InventoryReportService.getWarehouseSummaryReport(params),
  });
};