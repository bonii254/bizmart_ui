import React from "react";
import { RequisitionHeaderDetail } from "../../types/requisition";

interface MasterListProps {
  requisitions: RequisitionHeaderDetail[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function RequisitionsMasterList({
  requisitions,
  selectedId,
  isLoading,
  onSelect,
  currentPage,
  totalPages,
  onPageChange,
}: MasterListProps) {
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Draft": return "badge bg-soft-warning text-warning";
      case "Approved": return "badge bg-soft-success text-success";
      case "IN_TRANSIT": return "badge bg-soft-secondary text-secondary";
      case "COMPLETED": return "badge bg-soft-info text-info";
      default: return "badge bg-soft-dark text-dark";
    }
  };

  if (isLoading) {
    return (
      <div className="card card-body text-center p-5">
        <div className="spinner-border text-primary m-auto" role="status"></div>
        <p className="text-muted mt-3 mb-0">Syncing local inventory ledgers...</p>
      </div>
    );
  }

  return (
    <div className="card h-100 mb-0" style={{ minHeight: "calc(100vh - 230px)" }}>
      <div className="card-header align-items-center d-flex bg-light-subtle">
        <h5 className="card-title mb-0 flex-grow-1 fw-semibold fs-14">Requisitions Listing</h5>
      </div>
      
      <div className="card-body p-0 style-scroll" style={{ overflowY: "auto", maxHeight: "calc(100vh - 340px)" }}>
        {requisitions.length === 0 ? (
          <div className="text-center p-4 text-muted">No material entries recorded.</div>
        ) : (
          <div className="list-group list-group-flush">
            {requisitions.map((req) => {
              const isActive = req.id === selectedId;
              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => onSelect(req.id)}
                  className={`list-group-item list-group-item-action border-0 px-3 py-3 ${
                    isActive ? "bg-primary-subtle border-start border-3 border-primary" : ""
                  }`}
                >
                  <div className="d-flex align-items-center w-100 justify-content-between mb-2">
                    <h6 className={`mb-0 fw-bold ${isActive ? "text-primary" : "text-dark"}`}>
                      {req.req_number}
                    </h6>
                    <span className={getStatusBadgeClass(req.status)}>{req.status}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between text-muted fs-12">
                    <span>
                      <i className="ri-user-shared-line me-1 align-middle"></i>
                      Holder: <span className="fw-medium text-primary">{req.holder_name}</span>
                    </span>
                    <span>
                      <i className="ri-calendar-event-line me-1 align-middle"></i>
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-footer py-2 bg-light-subtle">
        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-sm btn-light"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Prev
          </button>
          <span className="fs-12 text-muted fw-medium">Page {currentPage} of {totalPages}</span>
          <button
            className="btn btn-sm btn-light"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}