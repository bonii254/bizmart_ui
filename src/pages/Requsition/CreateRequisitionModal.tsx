import React, { useState, useRef } from "react";
import { useCoolers } from "../../Components/Hooks/useCoolers";
import { useStockItems } from "../../Components/Hooks/useStockItems";
import { useCreateRequisition } from "../../Components/Hooks/useRequisation";
import { handleBackendErrors } from "../../helpers/form_utils";
import { toast } from "react-toastify";

interface CreateProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormLine {
  stock_item_id: string;
  qty_requested: string;
}

export default function CreateRequisitionModal({ isOpen, onClose }: CreateProps) {

  const createMutation = useCreateRequisition();
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useCoolers();
  const { data: stockItemsData, isLoading: isLoadingItems } = useStockItems();

  const coolers = (
    warehousesData?.warehouses || []
  ).filter((w) => w.warehouse_code !== "GIT");
  
  const stockItemsList = stockItemsData?.catalog || [];

  const [destWarehouseId, setDestWarehouseId] = useState<string>("");
  const [lines, setLines] = useState<FormLine[]>([{ stock_item_id: "", qty_requested: "" }]);
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleAddLine = () => {
    setLines([...lines, { stock_item_id: "", qty_requested: "" }]);
  };

  const handleRemoveLine = (idx: number) => {
    const updated = [...lines];
    updated.splice(idx, 1);
    setLines(updated);
  };

  const handleLineChange = (index: number, field: keyof FormLine, value: string) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    try {
      await createMutation.mutateAsync({
        dest_warehouse_id: destWarehouseId,
        lines: lines.filter(l => l.stock_item_id !== "")
      });
      toast.success("Material Draft Requisition raised successfully.");
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
        className="modal-dialog modal-dialog-centered modal-lg" 
        role="document"
        onClick={(e) => e.stopPropagation()}
        >
        <div className="modal-content border-0 overflow-hidden">
          <div className="modal-header bg-light p-3">
            <h5 className="modal-title text-black fw-bold fs-15 text-uppercase">Raise New Requisition</h5>
            <button type="button" className="btn-close btn-close-black" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
              {globalError && <div className="alert alert-danger font-medium mb-3">{globalError}</div>}

              <div className="mb-4">
                <label className="form-label text-dark fw-semibold fs-12 text-uppercase">Target Warehouse</label>
                <select
                  className={`form-select ${fieldErrors.dest_warehouse_id ? "is-invalid" : ""}`}
                  value={destWarehouseId}
                  required
                  onChange={(e) => setDestWarehouseId(e.target.value)}
                >
                  <option value="">-- Choose Target Storage Plant Node --</option>
                  {coolers?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name || c.id}</option>
                  ))}
                </select>
                {fieldErrors.dest_warehouse_id && <div className="invalid-feedback">{fieldErrors.dest_warehouse_id}</div>}
              </div>

              <div className="d-flex align-items-center justify-content-between mb-2 pb-1 ">
                <h6 className="form-label text-dark fw-semibold fs-12 text-uppercase"> LINE ITEMS</h6>
                <button type="button" className="btn btn-sm btn-soft-primary" onClick={handleAddLine}>
                  <i className="ri-add-line align-middle me-1"></i> Add Item Line
                </button>
              </div>

              {lines.map((line, index) => {
                const selectedItemIds = lines
                  .map((l, i) => i !== index ? l.stock_item_id : "")
                  .filter(id => id !== "");

                const selectableStockItems = stockItemsList.filter(
                  (item: any) => !selectedItemIds.includes(item.id)
                );

                return (
                  <div key={index} className="row g-2 mb-2 align-items-end mx-0 bg-light p-2 rounded-2">
                    <div className="col-md-7">
                      <label className="form-label fs-11 text-muted mb-1">Catalog Stock Item Match</label>
                      <select
                        className="form-select form-select-sm"
                        value={line.stock_item_id}
                        required
                        onChange={(e) => handleLineChange(index, "stock_item_id", e.target.value)}
                      >
                        <option value="">-- Choose Unique Catalog Item --</option>
                        {isLoadingItems ? (
                          <option value="" disabled>Loading...</option>
                        ) : (
                          selectableStockItems.map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {item.stock_code ? `[${item.stock_code}] ${item.description || ""}` : item.id}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fs-11 text-muted mb-1">Requested Vol</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        required
                        placeholder="0.0000"
                        className="form-control form-control-sm text-end"
                        value={line.qty_requested}
                        onChange={(e) => handleLineChange(index, "qty_requested", e.target.value)}
                      />
                    </div>

                    <div className="col-md-2 text-center">
                      <button
                        type="button"
                        disabled={lines.length === 1}
                        className="btn btn-sm btn-soft-danger w-100"
                        onClick={() => handleRemoveLine(index)}
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-footer bg-light p-3">
              <button type="button" className="btn btn-light" onClick={onClose}>Discard</button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Raising Draft Sequence..." : "Commit Transaction"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}