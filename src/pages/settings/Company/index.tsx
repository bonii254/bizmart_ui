import React, { useState, useEffect, useMemo } from "react";
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
import {
  useCompanies,
  useCompanyMutation,
} from "../../../Components/Hooks/useCompanies";
import {
  Company,
  CompanyPayload,
  UpdateCompanyRequest,
} from "../../../types/companies";
import { handleBackendErrors } from "../../../helpers/form_utils";
import TablePagination from "../../TablePagination";

const CompanyManagement = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useCompanies();
  const {
    createCompany,
    updateCompany,
    deleteCompany,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCompanyMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    if (!globalError) return;

    const timer = setTimeout(() => {
      setGlobalError(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [globalError]);

  const filteredCompanies = useMemo(() => {
    const list: Company[] = Array.isArray(data)
      ? data
      : (data as any)?.data || [];

    if (!searchTerm) return list;
    return list.filter(
      (c) =>
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredCompanies.length / pageSize);

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
    getPrePaginationRowModel: () => ({ rows: filteredCompanies }),
  };

  const formik = useFormik<CompanyPayload>({
    initialValues: {
      companyCode: "",
      companyName: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      companyCode: Yup.string().required("Company code is required"),
      companyName: Yup.string().required("Company name is required"),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        if (isEditMode && currentCompanyId) {
          const patchedData: UpdateCompanyRequest = {};
          (Object.keys(values) as Array<keyof CompanyPayload>).forEach((key) => {
            if (values[key] !== formik.initialValues[key]) {
              (patchedData as any)[key] = values[key];
            }
          });
          await updateCompany({ id: currentCompanyId, data: patchedData });
        } else {
          await createCompany(values);
        }
        setModalOpen(false);
      } catch (error: any) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    },
  });

  const handleEdit = (company: Company) => {
    setIsEditMode(true);
    setCurrentCompanyId(company.companyId);
    formik.resetForm({
      values: {
        companyCode: company.companyCode,
        companyName: company.companyName,
        isActive: company.isActive ?? true,
      },
    });
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentCompanyId || deleteConfirmation !== "DELETE") return;
    try {
      await deleteCompany(currentCompanyId);
      setDeleteModal(false);
      setDeleteConfirmation("");
      setCurrentCompanyId(null);
    } catch (error: any) {
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

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="search-box">
          <Input
            type="text"
            className="form-control"
            placeholder="Search code or name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageIndex(0);
            }}
            style={{ width: "250px" }}
          />
        </div>
        <Button
          color="primary"
          onClick={() => {
            setIsEditMode(false);
            setCurrentCompanyId(null);
            setGlobalError(null);
            formik.resetForm({
              values: {
                companyCode: "",
                companyName: "",
                isActive: true,
              },
            });
            setModalOpen(true);
          }}
        >
          <i className="ri-add-line align-bottom me-1"></i> Add New Company
        </Button>
      </div>

      <Table hover responsive className="align-middle custom-datatable">
        <thead className="table-light">
          <tr>
            <th>Company Name</th>
            <th>Company Code</th>
            <th>Status</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={4} className="text-center p-5">
                <Spinner color="primary" />
              </td>
            </tr>
          ) : paginatedRows.length > 0 ? (
            paginatedRows.map((company: Company) => (
              <tr key={company.companyId}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar-xs flex-shrink-0">
                      <div className="avatar-title rounded-circle bg-primary-subtle text-primary fw-bold">
                        <i className="ri-building-line"></i>
                      </div>
                    </div>
                    <div className="ms-2">
                      <h5 className="fs-14 mb-0">
                        <Link
                          to={`/companies/view/${company.companyId}`}
                          className="text-body fw-bold"
                        >
                          {company.companyName}
                        </Link>
                      </h5>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge bg-light text-body border">
                    {company.companyCode}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge ${
                      company.isActive ?? true
                        ? "bg-success-subtle text-success"
                        : "bg-danger-subtle text-danger"
                    }`}
                  >
                    {company.isActive ?? true ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <Button
                      size="sm"
                      color="soft-info"
                      onClick={() => handleEdit(company)}
                    >
                      <i className="ri-edit-box-line"></i>
                    </Button>
                    <Button
                      size="sm"
                      color="soft-danger"
                      onClick={() => {
                        setCurrentCompanyId(company.companyId);
                        setDeleteConfirmation("");
                        setDeleteModal(true);
                      }}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center p-4">
                No companies found matching your search.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        centered
        size="lg"
      >
        <ModalHeader
          className="bg-light p-3 border-bottom-dashed"
          toggle={() => setModalOpen(false)}
        >
          {isEditMode ? "Update Company Record" : "Register New Company"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Company Code</Label>
                  <Input
                    placeholder="e.g. MAIN"
                    {...formik.getFieldProps("companyCode")}
                    invalid={
                      !!(
                        formik.touched.companyCode && formik.errors.companyCode
                      )
                    }
                  />
                  <FormFeedback>{formik.errors.companyCode}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Company Name</Label>
                  <Input
                    placeholder="e.g. Main Retail Company"
                    {...formik.getFieldProps("companyName")}
                    invalid={
                      !!(
                        formik.touched.companyName && formik.errors.companyName
                      )
                    }
                  />
                  <FormFeedback>{formik.errors.companyName}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            {isEditMode && (
              <FormGroup check className="mt-3">
                <Label check>
                  <Input
                    type="checkbox"
                    checked={formik.values.isActive}
                    onChange={(e) =>
                      formik.setFieldValue("isActive", e.target.checked)
                    }
                  />{" "}
                  Set Company as Active
                </Label>
              </FormGroup>
            )}
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <Spinner size="sm" />
              ) : isEditMode ? (
                "Update Company"
              ) : (
                "Register Company"
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
            <h4 className="mb-2">Remove Company?</h4>
            <p className="text-muted fs-14">
              Type <strong>DELETE</strong> to confirm removal.
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

export default CompanyManagement;