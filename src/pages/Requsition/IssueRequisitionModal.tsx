import React, { useState, useEffect, useRef } from "react";
import { useIssueStock } from "../../Components/Hooks/useRequisation";
import { 
  RequisitionHeaderDetail, 
  IssueRequisitionPayload,
} from "../../types/requisition";
import { handleBackendErrors } from "../../helpers/form_utils";
import { toast } from "react-toastify";

interface IssueProps {
  isOpen: boolean;
  requisition: RequisitionHeaderDetail | null;
  onClose: () => void;
}

export default function IssueRequisitionModal({ isOpen, requisition, onClose }: IssueProps) {
  const issueMutation = useIssueStock(requisition?.id || "");
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [issueData, setIssueData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (requisition?.lines) {
      const initialValues: Record<string, string> = {};
      requisition.lines.forEach((line) => {
        const qtyRequested = parseFloat(line.qty_requested) || 0;
        const qtyIssued = parseFloat(line.qty_issued) || 0;
        const remaining = qtyRequested - qtyIssued;

        if (remaining > 0) {
          initialValues[line.id] = "";
        }
      });
      setIssueData(initialValues);
    }
  }, [requisition]);

  if (!isOpen || !requisition) return null;

  const activeLines = requisition.lines.filter((line) => {
    const qtyRequested = parseFloat(line.qty_requested) || 0;
    const qtyIssued = parseFloat(line.qty_issued) || 0;
    return qtyRequested - qtyIssued > 0;
  });

  const handleInputChange = (lineId: string, value: string) => {
    setIssueData((prev) => ({
      ...prev,
      [lineId]: value,
    }));
  };

  const handleFillMax = (lineId: string, maxQty: number) => {
    setIssueData((prev) => ({
      ...prev,
      [lineId]: maxQty.toFixed(4).replace(/\.?0+$/, ""),
    }));
  };

  const handleAutoFillAll = () => {
    const updated: Record<string, string> = {};
    activeLines.forEach((line) => {
      const remaining = (parseFloat(line.qty_requested) || 0) - (parseFloat(line.qty_issued) || 0);
      updated[line.id] = remaining.toFixed(4).replace(/\.?0+$/, "");
    });
    setIssueData(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    const payloadLines = Object.entries(issueData)
      .map(([lineId, val]) => ({
        line_id: lineId,
        qty_to_issue: val.trim(),
      }))
      .filter((item) => {
        const num = parseFloat(item.qty_to_issue) || 0;
        return num > 0;
      });

    if (payloadLines.length === 0) {
      setGlobalError("Please specify an issue quantity greater than zero for at least one line item.");
      return;
    }

    for (const item of payloadLines) {
      const line = requisition.lines.find((l) => l.id === item.line_id);
      if (line) {
        const remaining = (parseFloat(line.qty_requested) || 0) - (parseFloat(line.qty_issued) || 0);
        const inputNum = parseFloat(item.qty_to_issue) || 0;
        if (inputNum > remaining) {
          setGlobalError(`Allocation exceeded! Item '${line.description}' permits a maximum issue of ${remaining} ${line.uom || ""}.`);
          return;
        }
      }
    }

    const finalPayload: IssueRequisitionPayload = {
      issue_data: payloadLines,
    };

    try {
      await issueMutation.mutateAsync(finalPayload);
      toast.success("Stock items issued to transit successfully.");
      onClose();
    } catch (err: any) {
      handleBackendErrors(err, setFieldErrors, setGlobalError);
      errorTimeoutRef.current = setTimeout(() => {
        setGlobalError(null);
        setFieldErrors({});
      }, 15000);
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }} 
      role="dialog" 
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-lg" 
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 overflow-hidden">
          <div className="modal-header bg-light p-3">
            <h5 className="modal-title text-black fw-bold fs-15 text-uppercase">
              <i className="ri-truck-line me-2"></i> Issue Stock to Transit ({requisition.req_number})
            </h5>
            <button type="button" className="btn-close btn-close-black" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
              {globalError && <div className="alert alert-danger font-medium mb-3">{globalError}</div>}

              {activeLines.length === 0 ? (
                <div className="alert alert-success text-center mb-0 p-4">
                  <i className="ri-checkbox-circle-fill fs-24 align-middle text-success mb-2 d-block"></i>
                  <span className="fw-semibold text-success">
                    All items in this requisition have been fully issued to transit.
                  </span>
                </div>
              ) : (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-1 border-bottom">
                    <div>
                      <h6 className="form-label text-dark fw-semibold fs-12 text-uppercase mb-1">Items Awaiting Issue</h6>
                      <p className="text-muted fs-11 mb-0">Specify quantities to deduct from source warehouse and push to GIT.</p>
                    </div>
                    <button type="button" className="btn btn-sm btn-soft-warning" onClick={handleAutoFillAll}>
                      <i className="ri-magic-line align-middle me-1"></i> Auto-fill All Remaining
                    </button>
                  </div>

                  {activeLines.map((line) => {
                    const qtyRequested = parseFloat(line.qty_requested) || 0;
                    const qtyIssued = parseFloat(line.qty_issued) || 0;
                    const remaining = qtyRequested - qtyIssued;
                    const currentVal = issueData[line.id] || "";

                    return (
                      <div key={line.id} className="row g-2 mb-2 align-items-center mx-0 bg-light p-2 rounded-2">
                        <div className="col-md-5">
                          <label className="form-label fs-11 text-muted mb-0">Catalog Item Match</label>
                          <div className="fw-semibold text-dark fs-12 text-truncate">
                            {line.stock_code ? `[${line.stock_code}]` : ""} {line.description || line.stock_item_id}
                          </div>
                          <div className="text-muted fs-11">
                            Req: <span className="fw-medium">{line.qty_requested}</span> {line.uom} | Issued: <span className="fw-medium text-success">{line.qty_issued}</span> {line.uom}
                          </div>
                        </div>

                        <div className="col-md-3">
                          <label className="form-label fs-11 text-muted mb-0 d-block text-end">Remaining Bal</label>
                          <span className="badge bg-soft-info text-info fs-12 d-block text-end py-1 font-monospace">
                            {remaining.toFixed(4).replace(/\.?0+$/, "")} {line.uom}
                          </span>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fs-11 text-muted mb-0">Qty to Issue</label>
                          <div className="input-group input-group-sm">
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              max={remaining}
                              required
                              placeholder="0.0000"
                              className={`form-control text-end ${fieldErrors[line.id] ? "is-invalid" : ""}`}
                              value={currentVal}
                              onChange={(e) => handleInputChange(line.id, e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary fs-10"
                              onClick={() => handleFillMax(line.id, remaining)}
                            >
                              Max
                            </button>
                          </div>
                          {fieldErrors[line.id] && <div className="text-danger fs-11 mt-1">{fieldErrors[line.id]}</div>}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="modal-footer bg-light p-3">
              <button type="button" className="btn btn-light" onClick={onClose}>Discard</button>
              {activeLines.length > 0 && (
                <button 
                  type="submit" 
                  className="btn btn-warning" 
                  disabled={issueMutation.isPending}
                >
                  {issueMutation.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" />
                      Deducting & Transferring...
                    </>
                  ) : (
                    "Dispatch Stock to Transit"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}