import React, { useState, useMemo, useEffect } from "react";
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
  Row,
  Col,
} from "reactstrap";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useRoles, useRoleMutation } from "../../../Components/Hooks/useRole";
import { Role, CreateRolePayload, UpdateRolePayload } from "../../../types/role";
import { handleBackendErrors } from "../../../helpers/form_utils";
import TablePagination from "../../TablePagination";

const RoleManagement: React.FC = () => {
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Debounced search state
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Shared React Query Hooks
  const { data, isLoading } = useRoles();
  const {
    createRole,
    updateRole,
    deleteRole,
    isCreating,
    isUpdating,
    isDeleting,
  } = useRoleMutation();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");

  // Safely extract Role[] from ApiResponse wrapper
  const roleList = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.data || [];
  }, [data]);

  // Client-side filtering across roleCode, roleName, and description
  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roleList;
    const lower = searchTerm.toLowerCase();
    return roleList.filter(
      (item: Role) =>
        item.roleCode.toLowerCase().includes(lower) ||
        item.roleName.toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower))
    );
  }, [roleList, searchTerm]);

  // Pagination calculations
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredRoles.length / pageSize);

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
    getPageCount: () => totalPages || 1,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: filteredRoles }),
  };

  const formik = useFormik<CreateRolePayload>({
    initialValues: {
      roleCode: "",
      roleName: "",
      description: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      roleCode: Yup.string()
        .max(30, "Role Code is too long")
        .required("Role Code identifier is required"),
      roleName: Yup.string().required("Role Name is required"),
      description: Yup.string().optional(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);

        const payload: CreateRolePayload = {
          roleCode: values.roleCode,
          roleName: values.roleName,
          description: values.description ? values.description : "",
          isActive: values.isActive,
        };

        if (isEditMode && currentRoleId) {
          await updateRole({ 
          roleId: currentRoleId, 
          data: payload as UpdateRolePayload 
        });
      } else {
        await createRole(payload);
      }
        setModalOpen(false);
      } catch (error: unknown) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    },
  });

  const handleCreateNew = () => {
    setIsEditMode(false);
    setCurrentRoleId(null);
    setGlobalError(null);
    formik.resetForm({
      values: {
        roleCode: "",
        roleName: "",
        description: "",
        isActive: true,
      },
    });
    setModalOpen(true);
  };

  const handleEdit = (item: Role) => {
    setIsEditMode(true);
    setCurrentRoleId(item.roleId);
    setGlobalError(null);
    formik.resetForm({
      values: {
        roleCode: item.roleCode,
        roleName: item.roleName,
        description: item.description || "",
        isActive: item.isActive,
      },
    });
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentRoleId || deleteConfirmation !== "DELETE") return;
    try {
      setGlobalError(null);
      await deleteRole(currentRoleId);
      setDeleteModal(false);
      setDeleteConfirmation("");
      setCurrentRoleId(null);
    } catch (error: unknown) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  return (
    <React.Fragment>
      {globalError && (
        <Alert color="danger" className="mb-3">
          {globalError}
        </Alert>
      )}

      {/* Control Toolbar */}
      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-sm-6 col-md-4">
          <div className="search-box position-relative">
            <Input
              type="text"
              className="form-control form-control-sm fs-13 ps-4"
              placeholder="Search code, name, or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-14"></i>
          </div>
        </div>

        <div className="col-12 col-md-8 text-md-end">
          <Button
            color="primary"
            size="sm"
            className="fs-13 fw-medium px-3"
            onClick={handleCreateNew}
          >
            <i className="ri-add-line align-bottom me-1"></i> Register New Role
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Table hover responsive className="align-middle table-nowrap mb-0 custom-datatable">
        <thead className="table-light text-muted text-uppercase fs-11">
          <tr>
            <th style={{ width: "20%" }}>Role Code</th>
            <th style={{ width: "30%" }}>Role Name</th>
            <th style={{ width: "35%" }}>Description</th>
            <th style={{ width: "8%" }}>Status</th>
            <th style={{ width: "7%" }} className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody className="fs-13">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="text-center py-4">
                <Spinner size="sm" color="primary" />
              </td>
            </tr>
          ) : paginatedRows.length > 0 ? (
            paginatedRows.map((item: Role) => (
              <tr key={item.roleId} className="align-middle">
                <td className="py-2">
                  <span className="fw-semibold text-primary font-monospace fs-12">
                    {item.roleCode}
                  </span>
                </td>

                <td className="py-2">
                  <div className="d-flex align-items-center">
                    <Link
                      to={`/settings/roles/view/${item.roleId}`}
                      className="text-dark fw-medium text-truncate d-inline-block font-poppins"
                      style={{ maxWidth: "240px" }}
                      title={item.roleName}
                    >
                      {item.roleName}
                    </Link>
                  </div>
                </td>

                <td className="py-2">
                  <span
                    className="text-muted text-truncate d-inline-block font-poppins fs-12"
                    style={{ maxWidth: "340px" }}
                    title={item.description || ""}
                  >
                    {item.description || "-"}
                  </span>
                </td>

                <td className="py-2">
                  <span
                    className={`badge ${
                      item.isActive
                        ? "bg-success-subtle text-success"
                        : "bg-danger-subtle text-danger"
                    } fs-11`}
                  >
                    {item.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>

                <td className="text-end py-2">
                  <div className="d-flex gap-1 justify-content-end">
                    <Button
                      size="sm"
                      color="soft-info"
                      className="btn-icon waves-effect waves-light"
                      style={{ width: "28px", height: "28px", padding: 0 }}
                      onClick={() => handleEdit(item)}
                      title="Edit Role"
                    >
                      <i className="ri-edit-box-line fs-14"></i>
                    </Button>
                    <Button
                      size="sm"
                      color="soft-danger"
                      className="btn-icon waves-effect waves-light"
                      style={{ width: "28px", height: "28px", padding: 0 }}
                      onClick={() => {
                        setCurrentRoleId(item.roleId);
                        setDeleteConfirmation("");
                        setDeleteModal(true);
                      }}
                      title="Delete Role"
                    >
                      <i className="ri-delete-bin-line fs-14"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-4 text-muted fs-13">
                No roles found matching your search.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      {/* Form Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
          {isEditMode ? "Update Role Definition" : "Register New Role"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Role Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. ROLE_INVENTORY_MGR"
                    disabled={isEditMode}
                    {...formik.getFieldProps("roleCode")}
                    invalid={!!(formik.touched.roleCode && formik.errors.roleCode)}
                  />
                  <FormFeedback>{formik.errors.roleCode}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Role Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Inventory Manager"
                    {...formik.getFieldProps("roleName")}
                    invalid={!!(formik.touched.roleName && formik.errors.roleName)}
                  />
                  <FormFeedback>{formik.errors.roleName}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">Role Description</Label>
                  <Input
                    type="textarea"
                    rows={3}
                    placeholder="Define scope of authority and permissions..."
                    {...formik.getFieldProps("description")}
                    invalid={!!(formik.touched.description && formik.errors.description)}
                  />
                  <FormFeedback>{formik.errors.description}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            {isEditMode && (
              <FormGroup check className="mt-3">
                <Label check>
                  <Input
                    type="checkbox"
                    checked={formik.values.isActive}
                    onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
                  />{" "}
                  Active System Role (Grant Access)
                </Label>
              </FormGroup>
            )}
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (
                <Spinner size="sm" />
              ) : isEditMode ? (
                "Update Role Record"
              ) : (
                "Save Role"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
        <ModalBody className="p-5 text-center">
          <i className="ri-error-warning-line display-4 text-warning"></i>
          <div className="mt-4">
            <h4 className="mb-2">Remove Role?</h4>
            <p className="text-muted fs-14">
              Type <strong>DELETE</strong> to confirm role revocation.
            </p>
            <Input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="text-center mb-4"
              placeholder="Enter DELETE"
            />
            <div className="hstack gap-2 justify-content-center">
              <Button color="light" onClick={() => setDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                color="danger"
                onClick={confirmDelete}
                disabled={isDeleting || deleteConfirmation !== "DELETE"}
              >
                {isDeleting ? <Spinner size="sm" /> : "Confirm Removal"}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default RoleManagement;