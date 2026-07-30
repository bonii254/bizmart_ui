import React, { useState, useEffect, useRef } from "react";
import { useReceiveStock } from "../../Components/Hooks/useRequisation";
import { 
  RequisitionHeaderDetail, 
  ReceiveRequisitionPayload,
} from "../../types/requisition";
import { handleBackendErrors } from "../../helpers/form_utils";
import { toast } from "react-toastify";

interface ReceiveProps {
  isOpen: boolean;
  requisition: RequisitionHeaderDetail | null;
  userWarehouseId?: string; 
  onClose: () => void;
}

export default function ReceiveRequisitionModal({ 
  isOpen, 
  requisition, 
  userWarehouseId, 
  onClose 
}: ReceiveProps) {
  const receiveMutation = useReceiveStock(requisition?.id || "");
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [receiveData, setReceiveData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Initialize form state using the correct backend property
  useEffect(() => {
    if (requisition?.lines) {
      const initialValues: Record<string, string> = {};
      requisition.lines.forEach((line) => {
        const inTransit = parseFloat(line.qty_in_transit) || 0;

        if (inTransit > 0) {
          initialValues[line.id] = "";
        }
      });
      setReceiveData(initialValues);
    }
  }, [requisition]);

  if (!isOpen || !requisition) return null;

  const receivingWarehouseId = requisition.source_warehouse_id;
  const receivingWarehouseName = requisition.source_warehouse_name;

  const isWarehouseAuthorized = !userWarehouseId || userWarehouseId === receivingWarehouseId;

  // Filter lines using the correct backend property
  const activeLines = requisition.lines.filter((line) => {
    const inTransit = parseFloat(line.qty_in_transit) || 0;
    return inTransit > 0;
  });

  const handleInputChange = (lineId: string, value: string) => {
    setReceiveData((prev) => ({
      ...prev,
      [lineId]: value,
    }));
  };

  const handleFillMax = (lineId: string, maxQty: number) => {
    setReceiveData((prev) => ({
      ...prev,
      [lineId]: maxQty.toFixed(4).replace(/\.?0+$/, ""),
    }));
  };

  const handleAutoFillAll = () => {
    const updated: Record<string, string> = {};
    activeLines.forEach((line) => {
      const inTransit = parseFloat(line.qty_in_transit) || 0;
      updated[line.id] = inTransit.toFixed(4).replace(/\.?0+$/, "");
    });
    setReceiveData(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWarehouseAuthorized) return;

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    const payloadLines = Object.entries(receiveData)
      .map(([lineId, val]) => ({
        line_id: lineId,
        qty_to_receive: val.trim(),
      }))
      .filter((item) => {
        const num = parseFloat(item.qty_to_receive) || 0;
        return num > 0;
      });

    if (payloadLines.length === 0) {
      setGlobalError("Please specify a receive quantity greater than zero for at least one line item.");
      return;
    }

    for (const item of payloadLines) {
      const line = requisition.lines.find((l) => l.id === item.line_id);
      if (line) {
        const inTransit = parseFloat(line.qty_in_transit) || 0;
        const inputNum = parseFloat(item.qty_to_receive) || 0;
        if (inputNum > inTransit) {
          setGlobalError(
            `Receiving Aborted: Intended quantity (${inputNum}) exceeds available physical transit tracking balance (${inTransit} ${line.uom || ""}) on item '${line.description}'.`
          );
          return;
        }
      }
    }

    const finalPayload: ReceiveRequisitionPayload = {
      receipt_data: payloadLines.map(item => ({
        line_id: item.line_id,
        qty_to_receive: item.qty_to_receive
      })),
    };

    try {
      await receiveMutation.mutateAsync(finalPayload);
      toast.success("Stock items successfully received into inventory.");
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
              <i className="ri-download-2-line me-2 text-warning"></i> Receive Stock from Transit ({requisition.req_number})
            </h5>
            <button type="button" className="btn-close btn-close-black" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
              {globalError && <div className="alert alert-danger font-medium mb-3">{globalError}</div>}

              {/* Warehouse Restriction Block */}
              {!isWarehouseAuthorized ? (
                <div className="alert alert-warning text-center p-4 mb-0">
                  <i className="ri-error-warning-fill fs-30 align-middle text-warning mb-2 d-block"></i>
                  <h6 className="fw-semibold text-warning-emphasis">Warehouse Access Restricted</h6>
                  <p className="text-muted fs-12 mb-0 mt-1">
                    Your assigned warehouse does not match the receiving destination of this requisition. 
                    Only personnel assigned to <strong className="text-dark">{receivingWarehouseName}</strong> are authorized to receive these items.
                  </p>
                </div>
              ) : activeLines.length === 0 ? (
                <div className="alert alert-success text-center mb-0 p-4">
                  <i className="ri-checkbox-circle-fill fs-24 align-middle text-success mb-2 d-block"></i>
                  <span className="fw-semibold text-success">
                    All dispatched stock from this transit pool has been received.
                  </span>
                </div>
              ) : (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-1 border-bottom">
                    <div>
                      <h6 className="form-label text-dark fw-semibold fs-12 text-uppercase mb-1">Items In Transit</h6>
                      <p className="text-muted fs-11 mb-0">
                        Confirm physical inbound quantities to commit to <strong>{receivingWarehouseName}</strong>.
                      </p>
                    </div>
                    <button type="button" className="btn btn-sm btn-soft-warning" onClick={handleAutoFillAll}>
                      <i className="ri-magic-line align-middle me-1"></i> Auto-fill All In-Transit
                    </button>
                  </div>

                  {activeLines.map((line) => {
                    const inTransit = parseFloat(line.qty_in_transit) || 0;
                    const currentVal = receiveData[line.id] || "";

                    return (
                      <div key={line.id} className="row g-2 mb-2 align-items-center mx-0 bg-light p-2 rounded-2">
                        <div className="col-md-5">
                          <label className="form-label fs-11 text-muted mb-0">Catalog Item Match</label>
                          <div className="fw-semibold text-dark fs-12 text-truncate">
                            {line.stock_code ? `[${line.stock_code}]` : ""} {line.description || line.stock_item_id}
                          </div>
                          <div className="text-muted fs-11">
                            Requested: <span className="fw-medium text-info">{line.qty_requested}</span> {line.uom}
                          </div>
                        </div>

                        <div className="col-md-3">
                          <label className="form-label fs-11 text-muted mb-0 d-block text-end">In Transit Pool</label>
                          <span className="badge bg-soft-warning text-warning fs-12 d-block text-end py-1 font-monospace">
                            {inTransit.toFixed(4).replace(/\.?0+$/, "")} {line.uom}
                          </span>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fs-11 text-muted mb-0">Qty to Receive</label>
                          <div className="input-group input-group-sm">
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              max={inTransit}
                              required
                              placeholder="0.0000"
                              className={`form-control text-end ${fieldErrors[line.id] ? "is-invalid" : ""}`}
                              value={currentVal}
                              onChange={(e) => handleInputChange(line.id, e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary fs-10"
                              onClick={() => handleFillMax(line.id, inTransit)}
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
              {isWarehouseAuthorized && activeLines.length > 0 && (
                <button 
                  type="submit" 
                  className="btn btn-warning" 
                  disabled={receiveMutation.isPending}
                >
                  {receiveMutation.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" />
                      Processing Warehouse Receipt...
                    </>
                  ) : (
                    "Process Inbound Receipt"
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