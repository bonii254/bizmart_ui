import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssignmentService } from "../../services/assignmentService";
import { CreateAssignmentPayload } from "../../types/assignment";
import { toast } from "react-toastify";

export const useAssignments = (userId?: string) => {
  const queryClient = useQueryClient();

  const allAssignments = useQuery({
    queryKey: ["assignments", "all"],
    queryFn: () => AssignmentService.getAllAssignments(),
  });
  const activeAssignment = useQuery({
    queryKey: ["assignments", "active"],
    queryFn: () => AssignmentService.getActiveAssignment(),
    retry: false, 
  });

  const userHistory = useQuery({
    queryKey: ["assignments", "history", userId],
    queryFn: () => AssignmentService.getUserHistory(userId!),
    enabled: !!userId,
  });

  const createAssignment = useMutation({
    mutationFn: (payload: CreateAssignmentPayload) => AssignmentService.assignUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Attendant assignment updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign attendant");
    }
  });

  const unassignUser = useMutation({
    mutationFn: (uid: string) => AssignmentService.unassignUser(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.info("User has been unassigned");
    }
  });

  const deleteAssignment = useMutation({
    mutationFn: (id: string) => AssignmentService.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.error("Assignment record permanently removed");
    }
  });

  return {
    assignments: allAssignments.data || [],
    activeAssignment: activeAssignment.data || null,
    history: userHistory.data || [],
    
    isLoading: allAssignments.isLoading || activeAssignment.isLoading,
    isAssigning: createAssignment.isPending,
    isUnassigning: unassignUser.isPending,
    
    assignAttendant: createAssignment.mutateAsync,
    unassignAttendant: unassignUser.mutateAsync,
    removeRecord: deleteAssignment.mutateAsync
  };
};