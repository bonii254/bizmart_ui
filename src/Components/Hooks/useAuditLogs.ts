import { useQuery } from "@tanstack/react-query";
import { AuditService } from "../../services/auditService";

export const useAuditLogs = (date: string, page: number, perPage: number) => {
  return useQuery({
    queryKey: ["audit-logs", date, page, perPage],
    queryFn: () => AuditService.getAuditLogs(date, page, perPage),
    enabled: !!date,
    staleTime: 0,
  });
};