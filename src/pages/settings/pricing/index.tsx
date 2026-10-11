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
  Card,
  CardBody,
  CardHeader,
  Container,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";

import {
  usePriceCodes,
  usePriceCodeMutation,
} from "../../../Components/Hooks/usePricing";
import { PriceCode, CreatePriceCodeRequest } from "../../../types/pricing";
import TablePagination from "../../TablePagination";

const PriceCodeManagement: React.FC = () => {
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Search filter state
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!globalError) return;
    const timer = setTimeout(() => {
      setGlobalError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [globalError]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: priceCodes, isLoading } = usePriceCodes();

  const { createPriceCode, isCreating } = usePriceCodeMutation();

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const filteredPriceCodes = useMemo(() => {
    let list: PriceCode[] = priceCodes || [];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter((item) => {
        return (
          item.priceCodeValue?.toLowerCase().includes(lowerSearch) ||
          item.description?.toLowerCase().includes(lowerSearch)
        );
      });
    }

    return list;
  }, [priceCodes, searchTerm]);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredPriceCodes.slice(start, start + pageSize);
  }, [filteredPriceCodes, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredPriceCodes.length / pageSize) || 1;

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
    getPrePaginationRowModel: () => ({ rows: filteredPriceCodes }),
  };

  const formik = useFormik<CreatePriceCodeRequest>({
    initialValues: {
      priceCodeValue: "",
      description: "",
      isDefault: false,
      isActive: true,
    },
    validationSchema: Yup.object({
      priceCodeValue: Yup.string().required("Price code value is required"),
      description: Yup.string().required("Description is required"),
      isDefault: Yup.boolean().required(),
      isActive: Yup.boolean().required(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        await createPriceCode(values);
        setModalOpen(false);
      } catch (error: any) {
        setGlobalError(error?.response?.data?.message || "Failed to create price code.");
      }
    },
  });

  document.title = "Price Codes Management | Pricing";

  return (
    <React.Fragment>
      <Container fluid className="px-2 px-md-3">
        <Row>
          <Col lg={12}>
            {globalError && (
              <Alert
                color="danger"
                className="mb-3 border-0 shadow-sm alert-dismissible fade show"
                toggle={() => setGlobalError(null)}
              >
                <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
                {globalError}
              </Alert>
            )}

            <Card className="shadow-sm border-0">
              <CardHeader className="border-bottom py-3 px-3 bg-white">
                <Row className="g-2 align-items-center justify-content-between">
                  <Col xl={6} lg={6} md={6} sm={12}>
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control form-control-sm fs-12 ps-4"
                        placeholder="Filter price code or description..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                      />
                      <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-13"></i>
                    </div>
                  </Col>

                  <Col xl={6} lg={6} md={6} sm={12} className="text-md-end">
                    <Button
                      color="primary"
                      size="sm"
                      className="fs-12 fw-medium px-3 text-nowrap w-100 w-md-auto"
                      onClick={() => {
                        setGlobalError(null);
                        formik.resetForm({
                          values: {
                            priceCodeValue: "",
                            description: "",
                            isDefault: false,
                            isActive: true,
                          },
                        });
                        setModalOpen(true);
                      }}
                    >
                      <i className="ri-add-line align-bottom me-1"></i> Add Price Code
                    </Button>
                  </Col>
                </Row>
              </CardHeader>

              <CardBody className="p-0">
                <div className="table-responsive">
                  <Table hover size="sm" className="align-middle mb-0 custom-datatable table-sm">
                    <thead className="table-light text-muted text-uppercase fs-10">
                      <tr>
                        <th className="ps-3 py-2 text-nowrap">Price Code Value</th>
                        <th className="py-2">Description</th>
                        <th className="py-2 text-nowrap">Default Tier</th>
                        <th className="py-2 text-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="fs-12">
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            <Spinner size="sm" color="primary" />
                          </td>
                        </tr>
                      ) : paginatedRows.length > 0 ? (
                        paginatedRows.map((item: PriceCode, index: number) => {
                          return (
                            <tr key={item.priceCodeValue || index} className="align-middle">
                              <td className="py-2 ps-3 text-nowrap">
                                <span className="fw-semibold text-primary font-monospace fs-11">
                                  {item.priceCodeValue || "N/A"}
                                </span>
                              </td>
                              <td className="py-2 text-dark fw-medium">
                                {item.description || "N/A"}
                              </td>
                              <td className="py-2 text-nowrap">
                                {item.isDefault ? (
                                  <Badge color="primary-subtle" className="text-primary border fs-10 fw-medium px-1.5 py-0.5">
                                    Default
                                  </Badge>
                                ) : (
                                  <span className="text-muted fs-11">-</span>
                                )}
                              </td>
                              <td className="py-2 text-nowrap">
                                <Badge
                                  color={item.isActive ? "success-subtle" : "danger-subtle"}
                                  className={`text-${item.isActive ? "success" : "danger"} fs-10 fw-normal px-1.5 py-0.5`}
                                >
                                  {item.isActive ? "Active" : "Deactivated"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted fs-12">
                            No price codes found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                <div className="px-3 py-2 border-top">
                  <TablePagination table={tableInstance} />
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal Form */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="md">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
          Register New Price Code
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-3 p-md-4">
            <Row className="g-3">
              <Col xs={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Price Code Value <span className="text-danger">*</span>
                  </Label>
                  <Input
                    bsSize="sm"
                    placeholder="e.g. A, B, C"
                    {...formik.getFieldProps("priceCodeValue")}
                    invalid={!!(formik.touched.priceCodeValue && formik.errors.priceCodeValue)}
                  />
                  <FormFeedback>{formik.errors.priceCodeValue}</FormFeedback>
                </FormGroup>
              </Col>

              <Col xs={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Description <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    placeholder="e.g. Retail pricing tier"
                    {...formik.getFieldProps("description")}
                    invalid={!!(formik.touched.description && formik.errors.description)}
                  />
                  <FormFeedback>{formik.errors.description}</FormFeedback>
                </FormGroup>
              </Col>

              <Col xs={12}>
                <FormGroup check className="mt-1">
                  <Label check className="form-check-label text-muted fs-12">
                    <Input
                      type="checkbox"
                      className="form-check-input me-1"
                      checked={formik.values.isDefault}
                      onChange={(e) => formik.setFieldValue("isDefault", e.target.checked)}
                    />
                    Set as Default Price Code
                  </Label>
                </FormGroup>
              </Col>

              <Col xs={12}>
                <FormGroup check className="mt-1">
                  <Label check className="form-check-label text-muted fs-12">
                    <Input
                      type="checkbox"
                      className="form-check-input me-1"
                      checked={formik.values.isActive}
                      onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
                    />
                    Set Price Code as Active
                  </Label>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              size="sm"
              disabled={isCreating}
            >
              {isCreating ? <Spinner size="sm" /> : "Save Price Code"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

export default PriceCodeManagement;