import React, { useState, useRef } from "react";
import { useUsers } from "../../Components/Hooks/useUsers";
import { useRouteRequisition } from "../../Components/Hooks/useRequisation";
import { handleBackendErrors } from "../../helpers/form_utils";
import { toast } from "react-toastify";

interface RouteProps {
  isOpen: boolean;
  reqId: string;
  onClose: () => void;
}

export default function RouteRequisitionModal({ isOpen, reqId, onClose }: RouteProps) {
  const routeMutation = useRouteRequisition();
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: usersData, isLoading: readingUsers } = useUsers(1, 50); 

  const [targetUserId, setTargetUserId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    try {
      await routeMutation.mutateAsync({
        req_id: reqId,
        routed_to_user_id: targetUserId,
        action_notes: notes || null
      });
      toast.success("Accountability path reassigned successfully.");
      onClose();
    } catch (err: any) {
      handleBackendErrors(err, setFieldErrors, setGlobalError);
      errorTimeoutRef.current = setTimeout(() => {
        setGlobalError(null);
        setFieldErrors({});
      }, 3000);
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog"
      onClick={onClose}
    >
      <div 
      className="modal-dialog modal-dialog-centered" 
      role="document"
      onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0">
          <div className="modal-header bg-light p-3">
            <h5 className="modal-title text-black fw-bold fs-14 text-uppercase">ROUTE REQUISITION</h5>
            <button type="button" className="btn-close btn-close-black" onClick={onClose}></button>
          </div>

          <form onSubmit={handleRouteSubmit}>
            <div className="modal-body p-4">
              {globalError && <div className="alert alert-danger fs-13">{globalError}</div>}

              <div className="mb-3">
                <label className="form-label text-muted fs-12 fw-semibold">Route to </label>
                {readingUsers ? (
                  <div className="form-control text-center"><span className="spinner-border spinner-border-sm text-muted" /></div>
                ) : (
                  <select
                    className="form-select"
                    required
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                  >
                    <option value="">-- Choose Recipient Profile --</option>
                    {usersData?.users?.filter(users => users.role_name !== "ADMIN").map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mb-0">
                <label className="form-label text-muted fs-12 fw-semibold">Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  maxLength={250}
                  placeholder="Input forwarding tracking annotations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer bg-light p-3">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button 
                type="submit" 
                className="btn btn-secondary" 
                disabled={routeMutation.isPending || !targetUserId}
              >
                {routeMutation.isPending ? "Routing Document..." : "Forward Vector"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}