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
import { useFormik } from "formik";
import * as Yup from "yup";

import { 
    useReasonCodes, 
    useReasonCodeMutation 
} from "../../../Components/Hooks/useReasonCode";
import { 
    ReasonCode, 
    CreateReasonCodeRequest 
} from "../../../types/reasonCode";
import { handleBackendErrors } from "../../../helpers/form_utils";
import { getLoggedinUser } from "../../../helpers/api_helper";
import TablePagination from "../../TablePagination";

const ReasonCodeManagement: React.FC = () => {
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Get current logged-in user details automatically
  const { data: user } = getLoggedinUser() as { data?: { operatorId?: string; userName?: string; displayName?: string } };
  const displayName = user?.displayName || user?.userName || "SYSTEM_ADMIN";

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
  const { data, isLoading } = useReasonCodes();
  const { createReasonCode, isCreating } = useReasonCodeMutation();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Safely extract ReasonCode[] from API response structure
  const reasonCodeList = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return (data as any).data || [];
  }, [data]);

  // Client-side filtering across reasonCode, type, and description
  const filteredReasonCodes = useMemo(() => {
    if (!searchTerm) return reasonCodeList;
    const lower = searchTerm.toLowerCase();
    return reasonCodeList.filter(
      (item: ReasonCode) =>
        item.reasonCode.toLowerCase().includes(lower) ||
        item.type.toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower)) ||
        (item.auditUser && item.auditUser.toLowerCase().includes(lower))
    );
  }, [reasonCodeList, searchTerm]);

  // Pagination calculations
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredReasonCodes.slice(start, start + pageSize);
  }, [filteredReasonCodes, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredReasonCodes.length / pageSize);

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
    getPrePaginationRowModel: () => ({ rows: filteredReasonCodes }),
  };

  const formik = useFormik<CreateReasonCodeRequest>({
    initialValues: {
      reasonCode: "",
      reasonType: "",
      description: "",
      isActive: true,
      auditUser: displayName, // Automatically assigned
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      reasonCode: Yup.string()
        .max(30, "Reason Code is too long")
        .required("Reason Code identifier is required"),
      reasonType: Yup.string().required("Reason Type is required"),
      description: Yup.string().optional(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        const payload: CreateReasonCodeRequest = {
          ...values,
          auditUser: displayName, // Ensure logged-in user name is attached
          description: values.description ? values.description : "",
        };

        await createReasonCode(payload);
        setModalOpen(false);
      } catch (error: unknown) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    },
  });

  const handleCreateNew = () => {
    setGlobalError(null);
    formik.resetForm({
      values: {
        reasonCode: "",
        reasonType: "",
        description: "",
        isActive: true,
        auditUser: displayName,
      },
    });
    setModalOpen(true);
  };

  return (
    <React.Fragment>
      {globalError && (
        <Alert color="danger" className="mb-3">
          {globalError}
        </Alert>
      )}

      {/* Control Toolbar */}
      <Row className="g-2 align-items-center mb-3">
        <Col xs={12} sm={6} md={4}>
          <div className="search-box position-relative">
            <Input
              type="text"
              className="form-control form-control-sm fs-13 ps-4"
              placeholder="Search code, type, or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-14"></i>
          </div>
        </Col>

        <Col xs={12} sm={6} md={8} className="text-sm-end">
          <Button
            color="primary"
            size="sm"
            className="fs-13 fw-medium px-3"
            onClick={handleCreateNew}
          >
            <i className="ri-add-line align-bottom me-1"></i> Register New Reason Code
          </Button>
        </Col>
      </Row>

      {/* Data Table Container */}
      <div className="table-responsive shadow-sm border rounded bg-white mb-3">
        <Table hover className="align-middle table-nowrap mb-0 custom-datatable">
          <thead className="table-light text-muted text-uppercase fs-11">
            <tr>
              <th style={{ width: "18%" }}>Reason Code</th>
              <th style={{ width: "18%" }}>Type</th>
              <th className="d-none d-md-table-cell" style={{ width: "30%" }}>Description</th>
              <th className="d-none d-lg-table-cell" style={{ width: "15%" }}>Audit User</th>
              <th className="d-none d-sm-table-cell" style={{ width: "12%" }}>Audit Date</th>
              <th style={{ width: "7%" }}>Status</th>
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
              paginatedRows.map((item: ReasonCode, idx: number) => (
                <tr key={`${item.reasonCode}-${idx}`} className="align-middle">
                  <td className="py-2">
                    <span className="fw-semibold text-primary font-monospace fs-12">
                      {item.reasonCode}
                    </span>
                  </td>

                  <td className="py-2">
                    <span className="fw-medium text-dark font-monospace fs-12">
                      {item.type}
                    </span>
                  </td>

                  <td className="py-2 d-none d-md-table-cell">
                    <span
                      className="text-muted text-truncate d-inline-block font-poppins fs-12"
                      style={{ maxWidth: "280px" }}
                      title={item.description || ""}
                    >
                      {item.description || "-"}
                    </span>
                  </td>

                  <td className="py-2 d-none d-lg-table-cell">
                    <span className="text-muted font-monospace fs-12">
                      {item.auditUser || "-"}
                    </span>
                  </td>

                  <td className="py-2 d-none d-sm-table-cell">
                    <span className="text-muted fs-12">
                      {item.auditDate ? new Date(item.auditDate).toLocaleDateString() : "-"}
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted fs-13">
                  No reason codes found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <TablePagination table={tableInstance} />

      {/* Form Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg" className="border-0">
        <ModalHeader className="bg-light p-3 border-bottom" toggle={() => setModalOpen(false)}>
          Register New Reason Code
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <Row className="g-3">
              <Col md={6} xs={12}>
                <FormGroup className="mb-0">
                  <Label className="form-label fs-12 fw-semibold">
                    Reason Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="withdrawal, deposit, sale-return, grn-reversal"
                    bsSize="sm"
                    {...formik.getFieldProps("reasonCode")}
                    invalid={!!(formik.touched.reasonCode && formik.errors.reasonCode)}
                  />
                  <FormFeedback>{formik.errors.reasonCode}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6} xs={12}>
                <FormGroup className="mb-0">
                  <Label className="form-label fs-12 fw-semibold">
                    Reason Type <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="withdrawal, deposit, sale-return, grn-reversal"
                    bsSize="sm"
                    {...formik.getFieldProps("reasonType")}
                    invalid={!!(formik.touched.reasonType && formik.errors.reasonType)}
                  />
                  <FormFeedback>{formik.errors.reasonType}</FormFeedback>
                </FormGroup>
              </Col>

              <Col xs={12}>
                <FormGroup className="mb-0">
                  <Label className="form-label fs-12 fw-semibold">Description</Label>
                  <Input
                    type="textarea"
                    rows={3}
                    bsSize="sm"
                    placeholder="Describe the context for this reason code..."
                    {...formik.getFieldProps("description")}
                    invalid={!!(formik.touched.description && formik.errors.description)}
                  />
                  <FormFeedback>{formik.errors.description}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <FormGroup check className="mt-3">
              <Label check className="fs-12 cursor-pointer">
                <Input
                  type="checkbox"
                  checked={formik.values.isActive}
                  onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
                />{" "}
                Active Reason Code
              </Label>
            </FormGroup>
          </ModalBody>
          <ModalFooter className="bg-light p-3 border-top">
            <Button color="light" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="primary" size="sm" disabled={isCreating}>
              {isCreating ? <Spinner size="sm" /> : "Save Reason Code"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

export default ReasonCodeManagement;