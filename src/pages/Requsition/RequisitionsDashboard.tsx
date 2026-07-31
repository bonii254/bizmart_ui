import React, { useState, useEffect, useMemo } from "react";
import { 
  useRequisitionsLedger, 
  useRequisitionDetail, 
  useApproveRequisition 
} from "../../Components/Hooks/useRequisation";
import { useAssignments } from "../../Components/Hooks/useAssignments"; 
import { getLoggedinUser } from "../../helpers/api_helper";
import { RequisitionHeaderDetail } from "../../types/requisition";

import RequisitionsMasterList from "./RequisitionsMasterList";
import RequisitionDetailPanel from "./RequisitionDetailPanel";
import CreateRequisitionModal from "./CreateRequisitionModal";
import RouteRequisitionModal from "./RouteRequisitionModal";
import IssueRequisitionModal from "./IssueRequisitionModal";
import ReceiveRequisitionModal from "./ReceiveRequisitionModal";

import { toast } from "react-toastify";

const RequisitionsDashboard = () => {
  const currentUser = getLoggedinUser();
  
  const isAttendant = currentUser?.user?.role_name === "ATTENDANT";
  const isAdmin = currentUser?.user?.role_name === "ADMIN";
  const isQAE = currentUser?.user?.role_name === "QAE";

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isRouteOpen, setIsRouteOpen] = useState<boolean>(false);
  const [isIssueOpen, setIsIssueOpen] = useState<boolean>(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState<boolean>(false);

  const { data: ledgerData, isLoading: loadingLedger } = useRequisitionsLedger(currentPage, 10);
  const { data: activeDetail, isLoading: loadingDetail } = useRequisitionDetail(selectedReqId || "", !!selectedReqId);

  const { activeAssignment } = useAssignments();

  const approveMutation = useApproveRequisition(selectedReqId || "");

  const handleApprove = async () => {
    if (!selectedReqId) return;
    try {
      await approveMutation.mutateAsync();
      toast.success("Requisition authorized successfully.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to approve transaction.");
    }
  };

  const requisitions = useMemo<RequisitionHeaderDetail[]>(() => {
    return ledgerData?.data?.items || [];
  }, [ledgerData?.data?.items]);

  useEffect(() => {
    if (requisitions.length > 0 && !selectedReqId) {
      setSelectedReqId(requisitions[0].id);
    }
  }, [requisitions, selectedReqId]);

  const activeStatus = activeDetail?.data?.status;
  
  const isStatusIssuable = 
  activeStatus === "Approved" || 
  activeStatus === "Partially Issued";
  const isStatusReceivable = 
    activeStatus === "Issued" || 
    activeStatus === "Partially Issued"
  const userWarehouseId = activeAssignment?.warehouse_id;
  const reqDestWarehouseId = activeDetail?.data?.dest_warehouse_id;
  const reqSourceWarehouseId = activeDetail?.data?.source_warehouse_id
  
  const isAssignedToDestWarehouse = 
    !!userWarehouseId && 
    !!reqDestWarehouseId && 
    userWarehouseId === reqDestWarehouseId;

  const isAssignedToSourceWarehouse = 
    !!userWarehouseId &&
    !!reqSourceWarehouseId &&
    userWarehouseId === reqSourceWarehouseId;

  const canIssue = (isStatusIssuable && isAttendant && isAssignedToDestWarehouse) || isAdmin;

  const canReceive = (isStatusReceivable && isAttendant && isAssignedToSourceWarehouse) || isAdmin;

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row mb-4 align-items-center">
          <div className="col-sm">
            <div>
              <h4 className="card-title mb-0 flex-grow-1 text-uppercase fw-bold text-primary">
                Material Requisition Ledger
              </h4>
              <p className="text-muted mb-0">Manage inter-warehouse distribution logistics pipelines.</p>
            </div>
          </div>
          <div className="col-sm-auto">
            <div className="d-flex flex-wrap gap-2">
              <button 
                type="button" 
                className="btn btn-success waves-effect waves-light"
                onClick={() => setIsCreateOpen(true)}
              >
                <i className="ri-add-line align-bottom me-1"></i> Raise Requisition
              </button>

              <button
                type="button"
                className="btn btn-soft-secondary waves-effect waves-light"
                disabled={!selectedReqId}
                onClick={() => setIsRouteOpen(true)}
              >
                <i className="ri-route-line align-bottom me-1"></i> Route Document
              </button>

              {canIssue && (
                <button
                  type="button"
                  className="btn btn-warning text-white waves-effect waves-light"
                  onClick={() => setIsIssueOpen(true)}
                >
                  <i className="ri-truck-line align-bottom me-1"></i> Issue Stock
                </button>
              )}

              {canReceive && (
                <button
                  type="button"
                  className="btn btn-info text-white waves-effect waves-light"
                  onClick={() => setIsReceiveOpen(true)}
                >
                  <i className="ri-download-2-line align-bottom me-1"></i> Receive Stock
                </button>
              )}

              {(isAdmin || isQAE) && (
                <button
                  type="button"
                  className="btn btn-primary waves-effect waves-light"
                  disabled={!selectedReqId || approveMutation.isPending || activeStatus === "Approved"}
                  onClick={handleApprove}
                >
                  {approveMutation.isPending ? (
                    <span className="spinner-border spinner-border-sm me-1" />
                  ) : (
                    <i className="ri-checkbox-circle-line align-bottom me-1"></i>
                  )}
                  Approve Requisition
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-4 col-lg-5">
            <RequisitionsMasterList
              requisitions={requisitions}
              selectedId={selectedReqId}
              isLoading={loadingLedger}
              onSelect={setSelectedReqId}
              currentPage={currentPage}
              totalPages={ledgerData?.data?.pages || 1}
              onPageChange={setCurrentPage}
            />
          </div>

          <div className="col-xl-8 col-lg-7">
            <RequisitionDetailPanel 
              requisition={activeDetail?.data} 
              isLoading={loadingDetail} 
            />
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <CreateRequisitionModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
        />
      )}
      
      {isRouteOpen && selectedReqId && (
        <RouteRequisitionModal
          isOpen={isRouteOpen}
          reqId={selectedReqId}
          onClose={() => setIsRouteOpen(false)}
        />
      )}

      {isIssueOpen && activeDetail?.data && (
        <IssueRequisitionModal
          isOpen={isIssueOpen}
          requisition={activeDetail.data}
          onClose={() => setIsIssueOpen(false)}
        />
      )}

      {/* Render Receive Stock Modal */}
      {isReceiveOpen && activeDetail?.data && (
        <ReceiveRequisitionModal
          isOpen={isReceiveOpen}
          requisition={activeDetail.data}
          userWarehouseId={userWarehouseId}
          onClose={() => setIsReceiveOpen(false)}
        />
      )}
    </div>
  );
};

export default RequisitionsDashboard;