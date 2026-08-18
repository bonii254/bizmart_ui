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
  Badge,
} from "reactstrap";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";

import {
  useOperators,
  useOperatorMutation,
} from "../../../Components/Hooks/useUsers";
import { useRoles } from "../../../Components/Hooks/useRole";
import {
  Operator,
  OperatorPayload,
  UpdateOperatorPayload,
} from "../../../types/user";
import { handleBackendErrors } from "../../../helpers/form_utils";
import TablePagination from "../../TablePagination";

const OperatorManagement: React.FC = () => {
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

  // React Query Hooks
  const { data, isLoading } = useOperators();
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles();

  const {
    createOperator,
    updateOperator,
    deleteOperator,
    createOperatorPassword,
    isCreating,
    isUpdating,
    isDeleting,
    isCreatingPassword,
  } = useOperatorMutation();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [passwordModal, setPasswordModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [currentOperatorId, setCurrentOperatorId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");

  // Safe extraction for Operators list
  const operatorList = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray((data as any).data?.data)) return (data as any).data.data;
    return [];
  }, [data]);

  // Safe extraction for Roles list
  const roleList = useMemo(() => {
    if (!rolesData) return [];
    if (Array.isArray(rolesData)) return rolesData;
    if (Array.isArray((rolesData as any).data)) return (rolesData as any).data;
    if (Array.isArray((rolesData as any).data?.data)) return (rolesData as any).data.data;
    return [];
  }, [rolesData]);

  // Null-safe search filtering
  const filteredOperators = useMemo(() => {
    if (!searchTerm) return operatorList;
    const lower = searchTerm.toLowerCase();
    return operatorList.filter((item: Operator) => {
      const code = (item.operatorCode || "").toLowerCase();
      const user = (item.userName || "").toLowerCase();
      const name = (item.displayName || "").toLowerCase();
      const role = (item.roleCode || "").toLowerCase();

      return (
        code.includes(lower) ||
        user.includes(lower) ||
        name.includes(lower) ||
        role.includes(lower)
      );
    });
  }, [operatorList, searchTerm]);

  // Pagination calculations
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredOperators.slice(start, start + pageSize);
  }, [filteredOperators, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredOperators.length / pageSize);

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
    getPrePaginationRowModel: () => ({ rows: filteredOperators }),
  };

  const initialFormValues: OperatorPayload = {
    operatorCode: "",
    userName: "",
    displayName: "",
    roleCode: "",
    canDiscount: false,
    canVoid: false,
    canWithdraw: false,
    isActive: true,
  };

  const formik = useFormik<OperatorPayload>({
    initialValues: initialFormValues,
    validationSchema: Yup.object({
      operatorCode: Yup.string()
        .max(30, "Code is too long")
        .required("Operator code is required"),
      userName: Yup.string()
        .min(3, "Username must be at least 3 characters")
        .required("Username is required"),
      displayName: Yup.string().required("Display name is required"),
      roleCode: Yup.string().required("Role selection is required"),
      canDiscount: Yup.boolean().required(),
      canVoid: Yup.boolean().required(),
      canWithdraw: Yup.boolean().required(),
      isActive: Yup.boolean().required(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);

        if (isEditMode && currentOperatorId) {
          const patchedData: UpdateOperatorPayload = {};
          (Object.keys(values) as Array<keyof OperatorPayload>).forEach((key) => {
            if (values[key] !== formik.initialValues[key]) {
              patchedData[key] = values[key] as any;
            }
          });
          await updateOperator({ id: currentOperatorId, data: patchedData });
        } else {
          await createOperator(values);
        }
        setModalOpen(false);
      } catch (error: unknown) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    },
  });

  // Formik instance for Operator Password creation
  const passwordFormik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Confirm password is required"),
    }),
    onSubmit: async (values) => {
      if (!selectedOperator) return;
      try {
        setGlobalError(null);
        await createOperatorPassword({
          operatorId: selectedOperator.operatorId,
          payload: { password: values.password },
        });
        setPasswordModal(false);
        passwordFormik.resetForm();
      } catch (error: unknown) {
        handleBackendErrors(error, passwordFormik.setErrors, setGlobalError);
      }
    },
  });

  const handleEdit = (item: Operator) => {
    setIsEditMode(true);
    setCurrentOperatorId(item.operatorId);
    formik.resetForm({
      values: {
        operatorCode: item.operatorCode || "",
        userName: item.userName || "",
        displayName: item.displayName || "",
        roleCode: item.roleCode || "",
        canDiscount: !!item.canDiscount,
        canVoid: !!item.canVoid,
        canWithdraw: !!item.canWithdraw,
        isActive: !!item.isActive,
      },
    });
    setModalOpen(true);
  };

  const handleOpenPasswordModal = (item: Operator) => {
    setSelectedOperator(item);
    setShowPassword(false);
    passwordFormik.resetForm();
    setPasswordModal(true);
  };

  const confirmDelete = async () => {
    if (!currentOperatorId || deleteConfirmation !== "DELETE") return;
    try {
      await deleteOperator(currentOperatorId);
      setDeleteModal(false);
      setDeleteConfirmation("");
      setCurrentOperatorId(null);
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

      {/* Toolbar */}
      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-sm-6 col-md-4">
          <div className="search-box position-relative">
            <Input
              type="text"
              className="form-control form-control-sm fs-13 ps-4"
              placeholder="Search code, username, name, or role..."
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
            onClick={() => {
              setIsEditMode(false);
              setCurrentOperatorId(null);
              setGlobalError(null);
              formik.resetForm({ values: initialFormValues });
              setModalOpen(true);
            }}
          >
            <i className="ri-add-line align-bottom me-1"></i> Register Operator
          </Button>
        </div>
      </div>

      {/* Operator Data Table */}
      <Table hover responsive className="align-middle table-nowrap mb-0 custom-datatable">
        <thead className="table-light text-muted text-uppercase fs-11">
          <tr>
            <th style={{ width: "12%" }}>Operator Code</th>
            <th style={{ width: "22%" }}>Operator Details</th>
            <th style={{ width: "12%" }}>Role</th>
            <th style={{ width: "28%" }}>POS Privileges</th>
            <th style={{ width: "10%" }}>Status</th>
            <th style={{ width: "16%" }} className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody className="fs-13">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="text-center py-4">
                <Spinner size="sm" color="primary" />
              </td>
            </tr>
          ) : paginatedRows.length > 0 ? (
            paginatedRows.map((item: Operator, index: number) => (
              <tr 
                key={
                  item.operatorId && item.operatorId !== "00000000-0000-0000-0000-000000000000"
                    ? item.operatorId
                    : index
                } 
                className="align-middle"
              >
                {/* 1. Operator Code */}
                <td className="py-2">
                  <span className="fw-semibold text-primary font-monospace fs-12">
                    {item.operatorCode || "N/A"}
                  </span>
                </td>

                {/* 2. User Info */}
                <td className="py-2">
                  <div className="d-flex align-items-center">
                    <div>
                      <Link
                        to={`/system/operators/view/${item.operatorId}`}
                        className="text-dark fw-medium text-truncate d-block font-poppins mb-0"
                        style={{ maxWidth: "200px" }}
                        title={item.displayName || "Unnamed Operator"}
                      >
                        {item.displayName || "Unnamed Operator"}
                      </Link>
                      <small className="text-muted font-monospace fs-11">
                        @{item.userName || "unknown"}
                      </small>
                    </div>
                  </div>
                </td>

                {/* 3. Role Code */}
                <td className="py-2">
                  <Badge color="soft-info" className="text-info fs-11 font-monospace px-2 py-1">
                    {item.roleCode || "UNASSIGNED"}
                  </Badge>
                </td>

                <td className="py-2">
  <div className="d-flex gap-1 flex-wrap align-items-center">
    <Badge
      color={item.canDiscount ? "success" : "light"}
      className={`fs-11 px-2 py-1 fw-medium ${
        item.canDiscount
          ? "bg-success-subtle text-success border border-success-subtle"
          : "bg-light text-secondary border border-light-subtle"
      }`}
    >
      <i className={`ri-${item.canDiscount ? "checkbox-circle" : "close-circle"}-line me-1`}></i>
      Discount
    </Badge>

    <Badge
      color={item.canVoid ? "warning" : "light"}
      className={`fs-11 px-2 py-1 fw-medium ${
        item.canVoid
          ? "bg-warning-subtle text-warning border border-warning-subtle"
          : "bg-light text-secondary border border-light-subtle"
      }`}
    >
      <i className={`ri-${item.canVoid ? "checkbox-circle" : "close-circle"}-line me-1`}></i>
      Void
    </Badge>

    <Badge
      color={item.canWithdraw ? "danger" : "light"}
      className={`fs-11 px-2 py-1 fw-medium ${
        item.canWithdraw
          ? "bg-danger-subtle text-danger border border-danger-subtle"
          : "bg-light text-secondary border border-light-subtle"
      }`}
    >
      <i className={`ri-${item.canWithdraw ? "checkbox-circle" : "close-circle"}-line me-1`}></i>
      Withdraw
    </Badge>
  </div>
</td>

                {/* 5. Status */}
                <td className="py-2">
                  <span
                    className={`badge ${
                      item.isActive
                        ? "bg-success-subtle text-success"
                        : "bg-danger-subtle text-danger"
                    } fs-11`}
                  >
                    {item.isActive ? "Active" : "Disabled"}
                  </span>
                </td>

                {/* 6. Actions */}
                <td className="text-end py-2">
                  <div className="d-flex gap-1 justify-content-end">
                    <Button
                      size="sm"
                      color="soft-warning"
                      className="btn-icon waves-effect waves-light"
                      style={{ width: "28px", height: "28px", padding: 0 }}
                      onClick={() => handleOpenPasswordModal(item)}
                      title="Set Operator Password"
                    >
                      <i className="ri-key-2-line fs-14"></i>
                    </Button>
                    <Button
                      size="sm"
                      color="soft-info"
                      className="btn-icon waves-effect waves-light"
                      style={{ width: "28px", height: "28px", padding: 0 }}
                      onClick={() => handleEdit(item)}
                      title="Edit Operator"
                    >
                      <i className="ri-edit-box-line fs-14"></i>
                    </Button>
                    <Button
                      size="sm"
                      color="soft-danger"
                      className="btn-icon waves-effect waves-light"
                      style={{ width: "28px", height: "28px", padding: 0 }}
                      onClick={() => {
                        setCurrentOperatorId(item.operatorId);
                        setDeleteConfirmation("");
                        setDeleteModal(true);
                      }}
                      title="Delete Operator"
                    >
                      <i className="ri-delete-bin-line fs-14"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted fs-13">
                No system operators found matching your criteria.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      {/* Form Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
          {isEditMode ? "Update Operator Account" : "Register New Operator"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Operator Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. OP-1024"
                    disabled={isEditMode}
                    {...formik.getFieldProps("operatorCode")}
                    invalid={!!(formik.touched.operatorCode && formik.errors.operatorCode)}
                  />
                  <FormFeedback>{formik.errors.operatorCode}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Username <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. jdoe_pos"
                    {...formik.getFieldProps("userName")}
                    invalid={!!(formik.touched.userName && formik.errors.userName)}
                  />
                  <FormFeedback>{formik.errors.userName}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Display Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. John Doe"
                    {...formik.getFieldProps("displayName")}
                    invalid={!!(formik.touched.displayName && formik.errors.displayName)}
                  />
                  <FormFeedback>{formik.errors.displayName}</FormFeedback>
                </FormGroup>
              </Col>

              {/* Dynamic Role Dropdown selection via useRoles */}
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Role Designation <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    disabled={isLoadingRoles}
                    {...formik.getFieldProps("roleCode")}
                    invalid={!!(formik.touched.roleCode && formik.errors.roleCode)}
                  >
                    <option value="">
                      {isLoadingRoles ? "Loading roles..." : "-- Select Role --"}
                    </option>
                    {roleList.map((role: any) => {
                      const value = role.roleCode || role.code || role.roleId || role.id;
                      const label = role.roleName || role.displayName || role.name || role.roleCode || value;
                      return (
                        <option key={role.roleId || value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </Input>
                  <FormFeedback>{formik.errors.roleCode}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={12}>
                <Label className="form-label fw-semibold text-muted fs-12 mb-2">
                  POS Privilege & Transaction Overrides
                </Label>
                <div className="p-3 border rounded bg-light-subtle">
                  <Row className="g-3">
                    <Col md={4}>
                      <FormGroup check inline className="m-0">
                        <Label check className="fs-13">
                          <Input
                            type="checkbox"
                            checked={formik.values.canDiscount}
                            onChange={(e) => formik.setFieldValue("canDiscount", e.target.checked)}
                          />{" "}
                          Allow Discounts
                        </Label>
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup check inline className="m-0">
                        <Label check className="fs-13">
                          <Input
                            type="checkbox"
                            checked={formik.values.canVoid}
                            onChange={(e) => formik.setFieldValue("canVoid", e.target.checked)}
                          />{" "}
                          Allow Transaction Void
                        </Label>
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup check inline className="m-0">
                        <Label check className="fs-13">
                          <Input
                            type="checkbox"
                            checked={formik.values.canWithdraw}
                            onChange={(e) => formik.setFieldValue("canWithdraw", e.target.checked)}
                          />{" "}
                          Allow Till Withdrawals
                        </Label>
                      </FormGroup>
                    </Col>
                  </Row>
                </div>
              </Col>

              <Col md={12}>
                <FormGroup check inline className="mt-2">
                  <Label check className="fs-13">
                    <Input
                      type="checkbox"
                      checked={formik.values.isActive}
                      onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
                    />{" "}
                    Active Account Status
                  </Label>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (
                <Spinner size="sm" />
              ) : isEditMode ? (
                "Update Operator"
              ) : (
                "Save Operator"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Set/Create Password Modal */}
      <Modal isOpen={passwordModal} toggle={() => setPasswordModal(false)} centered>
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setPasswordModal(false)}>
          Set Password - {selectedOperator?.displayName || "Operator"}
        </ModalHeader>
        <Form onSubmit={passwordFormik.handleSubmit}>
          <ModalBody className="p-4">
            <p className="text-muted fs-13 mb-3">
              Configure or reset security credentials for operator{" "}
              <strong className="text-primary">{selectedOperator?.userName || selectedOperator?.operatorCode}</strong>.
            </p>
            <Row className="g-3">
              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">
                    New Password <span className="text-danger">*</span>
                  </Label>
                  <div className="position-relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...passwordFormik.getFieldProps("password")}
                      invalid={
                        !!(
                          passwordFormik.touched.password &&
                          passwordFormik.errors.password
                        )
                      }
                    />
                    <Button
                      type="button"
                      color="link"
                      className="position-absolute end-0 top-0 text-decoration-none text-muted p-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`ri-eye-${showPassword ? "off-" : ""}fill align-middle`}></i>
                    </Button>
                    <FormFeedback>{passwordFormik.errors.password}</FormFeedback>
                  </div>
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    {...passwordFormik.getFieldProps("confirmPassword")}
                    invalid={
                      !!(
                        passwordFormik.touched.confirmPassword &&
                        passwordFormik.errors.confirmPassword
                      )
                    }
                  />
                  <FormFeedback>{passwordFormik.errors.confirmPassword}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" onClick={() => setPasswordModal(false)}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={isCreatingPassword}>
              {isCreatingPassword ? <Spinner size="sm" /> : "Set Password"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
        <ModalBody className="p-5 text-center">
          <i className="ri-error-warning-line display-4 text-warning"></i>
          <div className="mt-4">
            <h4 className="mb-2">Remove Operator?</h4>
            <p className="text-muted fs-14">
              Type <strong>DELETE</strong> to confirm permanent operator account revocation.
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

export default OperatorManagement;