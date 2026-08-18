import React, { useState, useMemo } from "react";
import {
  Button,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Spinner,
  Alert,
  Card,
  CardBody,
  UncontrolledTooltip,
} from "reactstrap";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  useWarehouses,
  useWarehouseMutation,
} from "../../../Components/Hooks/useWarehouse";
import {
  Warehouse,
  WarehousePayload,
  UpdateWarehouseRequest,
  WarehouseListResponse,
} from "../../../types/warehouse";
import TablePagination from "../../TablePagination";
import { handleBackendErrors } from "../../../helpers/form_utils";

const WarehouseManagement: React.FC = () => {
  // Pagination & Filter States
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // React Query Hooks (aligned with new signature)
  const { data, isLoading } = useWarehouses();
  const { 
    createWarehouse, 
    updateWarehouse, 
    deleteWarehouse, 
    isCreating, 
    isUpdating, 
    isDeleting 
  } = useWarehouseMutation();

  // Modal & Error States
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Extract warehouses array safely
  const rawWarehouses = useMemo<Warehouse[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as Warehouse[];
    return (data as WarehouseListResponse).data || [];
  }, [data]);

  // 1. Filter Logic
  const filteredWarehouses = useMemo(() => {
    let list = rawWarehouses;

    if (statusFilter === "active") {
      list = list.filter((w) => w.isActive ?? true);
    } else if (statusFilter === "inactive") {
      list = list.filter((w) => !(w.isActive ?? true));
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (w) =>
          w.warehouseName.toLowerCase().includes(term) ||
          w.warehouseCode.toLowerCase().includes(term)
      );
    }

    return list;
  }, [rawWarehouses, searchTerm, statusFilter]);

  // 2. Pagination Logic
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredWarehouses.slice(start, start + pageSize);
  }, [filteredWarehouses, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredWarehouses.length / pageSize) || 1;

  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => {
      setPageSize(size);
      setPageIndex(0);
    },
    previousPage: () => setPageIndex((prev) => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < totalPages - 1,
    getPageCount: () => totalPages,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: filteredWarehouses }),
  };

  // 3. Formik Setup
  const formik = useFormik<WarehousePayload>({
    initialValues: {
      warehouseCode: "",
      warehouseName: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      warehouseCode: Yup.string()
        .required("Warehouse code is required")
        .max(20, "Code must be 20 characters or less"),
      warehouseName: Yup.string().required("Warehouse name is required"),
    }),
    onSubmit: async (values) => {
      setGlobalError(null);
      try {
        if (isEditMode && currentWarehouseId) {
          const patchedData: UpdateWarehouseRequest = {};
          (Object.keys(values) as Array<keyof WarehousePayload>).forEach((key) => {
            if (values[key] !== formik.initialValues[key]) {
              patchedData[key] = values[key] as any;
            }
          });

          // Aligned with updateWarehouse({ warehouseId, data })
          await updateWarehouse({ 
            warehouseId: currentWarehouseId, 
            data: patchedData 
          });
        } else {
          // Aligned with createWarehouse(data)
          await createWarehouse(values);
        }
        setModalOpen(false);
      } catch (error: any) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    },
  });

  // 4. Action Handlers
  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setCurrentWarehouseId(null);
    setGlobalError(null);
    formik.resetForm({
      values: {
        warehouseCode: "",
        warehouseName: "",
        isActive: true,
      },
    });
    setModalOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setIsEditMode(true);
    setCurrentWarehouseId(warehouse.warehouseId);
    setGlobalError(null);
    formik.resetForm({
      values: {
        warehouseCode: warehouse.warehouseCode,
        warehouseName: warehouse.warehouseName,
        isActive: warehouse.isActive ?? true,
      },
    });
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentWarehouseId || deleteConfirmation !== "DELETE") return;
    try {
      // Aligned with deleteWarehouse(warehouseId)
      await deleteWarehouse(currentWarehouseId);
      setDeleteModal(false);
      setDeleteConfirmation("");
      setCurrentWarehouseId(null);
    } catch (error: any) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  const isFormSubmitting = isCreating || isUpdating;

  return (
    <React.Fragment>
      {/* Global Error Alert */}
      {globalError && (
        <Alert
          color="danger"
          className="alert-dismissible-custom mb-3"
          toggle={() => setGlobalError(null)}
        >
          <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
          {globalError}
        </Alert>
      )}

      {/* Control Toolbar */}
      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-sm-6 col-md-3">
          <Input
            type="select"
            className="form-select form-select-sm fs-13"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "inactive");
              setPageIndex(0);
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated</option>
          </Input>
        </div>

        <div className="col-12 col-sm-6 col-md-4">
          <div className="search-box position-relative">
            <Input
              type="text"
              className="form-control form-control-sm fs-13 ps-4"
              placeholder="Search name or code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageIndex(0);
              }}
            />
            <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-14"></i>
          </div>
        </div>

        <div className="col-12 col-md-5 text-md-end">
          <Button
            color="primary"
            size="sm"
            className="fs-13 fw-medium px-3"
            onClick={handleOpenCreateModal}
          >
            <i className="ri-add-line align-bottom me-1"></i> Add Warehouse
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-3">
        <CardBody className="p-0">
          <Table hover responsive className="align-middle custom-datatable mb-0">
            <thead className="table-light text-muted text-uppercase fs-11">
              <tr>
                <th className="ps-4" style={{ width: "45%" }}>
                  Warehouse Name
                </th>
                <th style={{ width: "25%" }}>Warehouse Code</th>
                <th style={{ width: "15%" }}>Status</th>
                <th className="text-end pe-4" style={{ width: "15%" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <Spinner color="primary" size="md" className="me-2" />
                    <span className="text-muted fw-medium">
                      Loading warehouses...
                    </span>
                  </td>
                </tr>
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((warehouse: Warehouse) => {
                  const isActive = warehouse.isActive ?? true;

                  return (
                    <tr key={warehouse.warehouseId}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div
                            className="avatar-xs flex-shrink-0 me-3 d-flex align-items-center justify-content-center rounded-3"
                            style={{
                              width: "38px",
                              height: "38px",
                              backgroundColor: isActive ? "#eef2ff" : "#f3f4f6",
                              color: isActive ? "#4f46e5" : "#9ca3af",
                            }}
                          >
                            <i className="ri-store-2-line fs-18"></i>
                          </div>
                          <div>
                            <h6 className="fs-14 mb-0 fw-bold">
                              <Link
                                to={`/warehouses/view/${warehouse.warehouseId}`}
                                className="text-dark text-decoration-none hover-primary"
                              >
                                {warehouse.warehouseName}
                              </Link>
                            </h6>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1 font-monospace fs-12">
                          {warehouse.warehouseCode}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge rounded-pill px-2.5 py-1 fs-11 ${
                            isActive
                              ? "bg-success-subtle text-success"
                              : "bg-danger-subtle text-danger"
                          }`}
                        >
                          <i
                            className={`ri-checkbox-blank-circle-fill fs-8 me-1 align-middle ${
                              isActive ? "text-success" : "text-danger"
                            }`}
                          ></i>
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <Button
                            size="sm"
                            color="light"
                            className="btn-icon btn-soft-info"
                            id={`edit-tooltip-${warehouse.warehouseId}`}
                            onClick={() => handleEdit(warehouse)}
                          >
                            <i className="ri-edit-box-line text-info fs-15"></i>
                          </Button>
                          <UncontrolledTooltip
                            target={`edit-tooltip-${warehouse.warehouseId}`}
                          >
                            Edit Warehouse
                          </UncontrolledTooltip>

                          <Button
                            size="sm"
                            color="light"
                            className="btn-icon btn-soft-danger"
                            id={`delete-tooltip-${warehouse.warehouseId}`}
                            onClick={() => {
                              setCurrentWarehouseId(warehouse.warehouseId);
                              setDeleteConfirmation("");
                              setDeleteModal(true);
                            }}
                          >
                            <i className="ri-delete-bin-line text-danger fs-15"></i>
                          </Button>
                          <UncontrolledTooltip
                            target={`delete-tooltip-${warehouse.warehouseId}`}
                          >
                            Delete Warehouse
                          </UncontrolledTooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="text-muted">
                      <i className="ri-inbox-archive-line display-5 opacity-50 mb-2"></i>
                      <p className="fs-14 mb-0 fw-medium">
                        No warehouses found matching your filters.
                      </p>
                      <small>Try adjusting your search terms or status filter.</small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="px-4 py-3 border-top">
            <TablePagination table={tableInstance} />
          </div>
        </CardBody>
      </Card>

      {/* Add / Edit Form Modal */}
      <Modal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        centered
        size="lg"
        contentClassName="border-0 shadow-lg rounded-3"
      >
        <ModalHeader
          className="bg-light p-3 border-bottom toggle-header"
          toggle={() => setModalOpen(false)}
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`fs-20 ${
                isEditMode
                  ? "ri-edit-2-line text-info"
                  : "ri-add-circle-line text-primary"
              }`}
            ></i>
            <span className="fw-bold">
              {isEditMode ? "Update Warehouse Information" : "Register New Warehouse"}
            </span>
          </div>
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <FormGroup>
                  <Label className="form-label fw-semibold fs-13">
                    Warehouse Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. WH-NAI-01"
                    {...formik.getFieldProps("warehouseCode")}
                    invalid={
                      !!(formik.touched.warehouseCode && formik.errors.warehouseCode)
                    }
                  />
                  <FormFeedback>{formik.errors.warehouseCode}</FormFeedback>
                </FormGroup>
              </div>

              <div className="col-md-6">
                <FormGroup>
                  <Label className="form-label fw-semibold fs-13">
                    Warehouse Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Central Distribution Hub"
                    {...formik.getFieldProps("warehouseName")}
                    invalid={
                      !!(formik.touched.warehouseName && formik.errors.warehouseName)
                    }
                  />
                  <FormFeedback>{formik.errors.warehouseName}</FormFeedback>
                </FormGroup>
              </div>
            </div>

            {isEditMode && (
              <FormGroup check className="mt-3 bg-light p-3 rounded border">
                <Label check className="fw-semibold text-dark fs-13 mb-0 pointer">
                  <Input
                    type="checkbox"
                    className="me-2"
                    checked={formik.values.isActive ?? true}
                    onChange={(e) =>
                      formik.setFieldValue("isActive", e.target.checked)
                    }
                  />
                  Set Warehouse as Active
                </Label>
                <div className="text-muted fs-12 ms-4">
                  Deactivating this warehouse will hide it from new inventory allocations.
                </div>
              </FormGroup>
            )}
          </ModalBody>
          <ModalFooter className="bg-light p-3 border-top">
            <Button
              color="link"
              className="text-muted text-decoration-none"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              className="px-4 shadow-sm"
              disabled={isFormSubmitting}
            >
              {isFormSubmitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Update Warehouse"
              ) : (
                "Save Warehouse"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal}
        toggle={() => setDeleteModal(false)}
        centered
        contentClassName="border-0 shadow-lg rounded-3"
      >
        <ModalBody className="p-4 text-center">
          <div
            className="avatar-lg mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger"
            style={{ width: "64px", height: "64px" }}
          >
            <i className="ri-delete-bin-line display-6"></i>
          </div>
          <h4 className="mb-2 fw-bold text-dark">Confirm Warehouse Deletion</h4>
          <p className="text-muted fs-14 mb-3">
            This action cannot be undone. To prevent accidental deletions, please type{" "}
            <strong className="text-danger">DELETE</strong> below.
          </p>

          <Input
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            className="text-center mb-4 fw-bold"
            placeholder="Type DELETE to confirm"
            style={{ letterSpacing: "1px" }}
          />

          <div className="d-flex gap-2 justify-content-center">
            <Button
              color="light"
              className="px-4"
              onClick={() => setDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              className="px-4 shadow-sm"
              onClick={confirmDelete}
              disabled={isDeleting || deleteConfirmation !== "DELETE"}
            >
              {isDeleting ? <Spinner size="sm" /> : "Confirm Permanent Delete"}
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default WarehouseManagement;