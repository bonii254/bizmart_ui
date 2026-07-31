import React from "react";
import { RequisitionHeaderDetail } from "../../types/requisition";

interface DetailPanelProps {
  requisition?: RequisitionHeaderDetail;
  isLoading: boolean;
}

export default function RequisitionDetailPanel({ requisition, isLoading }: DetailPanelProps) {
  if (isLoading) {
    return (
      <div className="card card-body text-center p-5 h-100 d-flex align-items-center justify-content-center">
        <div className="spinner-grow text-secondary" role="status"></div>
        <p className="text-muted mt-3 mb-0">Decompressing validation schema layouts...</p>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="card card-body text-center p-5 h-100 d-flex align-items-center justify-content-center border-dashed">
        <i className="ri-folder-open-line fs-36 text-muted mb-2"></i>
        <h5 className="text-muted">No Requisition Highlighted</h5>
        <p className="text-muted max-w-sm mb-0 fs-12">Select an item from the left ledger panel index to open its audit trail details.</p>
      </div>
    );
  }

  return (
    <div className="card h-100 mb-0">
      <div className="card-header bg-light-subtle border-bottom d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0 fw-bold fs-15 text-dark">
          Transaction Overview: {requisition.req_number}
        </h5>
      </div>

      <div className="card-body">
        <h6 className="text-muted text-uppercase fw-semibold fs-11 mb-3 letter-spacing">
          Requisation Header
        </h6>
        <div className="row g-3 mb-3 bg-light p-3 rounded-2 mx-0">
          <div className="col-md-3 col-sm-6">
            <span className="text-muted fs-12 d-block mb-1">Req (Requesting) warehouse</span>
            <span className="fw-semibold text-dark fs-13 text-truncate d-block">
              {requisition.source_warehouse_name} {requisition.source_warehouse_route}
            </span>
          </div>
          <div className="col-md-3 col-sm-6">
            <span className="text-muted fs-12 d-block mb-1">Issu (Issuer) warehouse</span>
            <span className="fw-semibold text-dark fs-13 text-truncate d-block">
              {requisition.dest_warehouse_name}  {requisition.dest_warehouse_route}
            </span>
          </div>
          <div className="col-md-3 col-sm-6">
            <span className="text-muted fs-12 d-block mb-1">Originator</span>
            <span className="fw-semibold text-dark fs-13 text-truncate d-block">
              {requisition.requestor_name}
            </span>
          </div>
          <div className="col-md-3 col-sm-6">
            <span className="text-muted fs-12 d-block mb-1">Approved By</span>
            <span className="fw-semibold text-dark fs-13 text-truncate d-block">
              {requisition.approver_name || "Null"}
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="text-muted text-uppercase fw-semibold fs-11 mb-0 letter-spacing">
            Requisition Lines ({requisition.lines?.length || 0})
          </h6>
        </div>

        <div className="table-responsive border rounded-2">
          <table className="table table-centered table-borderless table-nowrap align-middle mb-0">
            <thead className="table-light text-muted fs-11 text-uppercase border-bottom">
              <tr>
                <th scope="col" style={{ width: "80px" }}>Line ID</th>
                <th scope="col">Stock Item</th>
                <th scope="col" className="text-start">Requested Volume</th>
                <th scope="col" className="text-start">Issued GIT</th>
                <th scope="col" className="text-start">Received</th>
              </tr>
            </thead>
            <tbody className="fs-13">
              {requisition.lines?.map((line, idx) => (
                <tr key={line.id} className="border-bottom last-border-none">
                  <td className="fw-medium text-dark">#{(idx + 1).toString().padStart(2, "0")}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div>
                        <span className="fw-semibold text-dark d-block mb-0">{line.description}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-start fw-bold text-dark">{line.qty_requested} {line.uom}</td>
                  <td className="text-start text-muted fw-medium">{Math.trunc(Number(line.qty_issued || 0))} {line.uom}</td>
                  <td className="text-start text-success fw-medium">{line.qty_received || 0} {line.uom}</td>
                </tr>
              ))}
              {(!requisition.lines || requisition.lines.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center text-muted p-4">
                    This document does not contain active allocation item line definitions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}