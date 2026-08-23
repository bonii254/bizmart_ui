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
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";

import {
  useStockItems,
  useStockItemMutation,
} from "../../../Components/Hooks/useStockItems";
import { useCategories } from "../../../Components/Hooks/useCategory";
import {
  StockItem,
  StockItemPayload,
  UpdateStockItemRequest,
} from "../../../types/stockitem";
import { Category } from "../../../types/category";
import { handleBackendErrors } from "../../../helpers/form_utils";
import TablePagination from "../../TablePagination";

const StockItemManagement: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
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

  // Fetch stock items via TanStack Query hook
  const { data: stockItems, isLoading } = useStockItems();
  const { data: categoryData } = useCategories("", true);

  const {
    createStockItem,
    updateStockItem,
    deleteStockItem,
    isCreating,
    isUpdating,
    isDeleting,
  } = useStockItemMutation();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentStockItemId, setCurrentStockItemId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");

  // Extract categories safely using updated Category type { id, name }
  const categoriesList: Category[] = useMemo(() => {
    if (!categoryData) return [];
    if (Array.isArray(categoryData)) return categoryData;
    return (
      (categoryData as { categories?: Category[]; data?: Category[] }).categories ||
      (categoryData as { categories?: Category[]; data?: Category[] }).data ||
      []
    );
  }, [categoryData]);

  // Filter items based on Category selection & client-side search term
  const filteredStockItems = useMemo(() => {
    let list: StockItem[] = stockItems || [];

    if (selectedCategoryId) {
      list = list.filter((item) => item.categoryId === selectedCategoryId);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.itemCode?.toLowerCase().includes(lowerSearch) ||
          item.description?.toLowerCase().includes(lowerSearch) ||
          item.categoryName?.toLowerCase().includes(lowerSearch) ||
          item.category?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    return list;
  }, [stockItems, selectedCategoryId, searchTerm]);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredStockItems.slice(start, start + pageSize);
  }, [filteredStockItems, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredStockItems.length / pageSize) || 1;

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
    getPrePaginationRowModel: () => ({ rows: filteredStockItems }),
  };

  const formik = useFormik<StockItemPayload>({
    initialValues: {
      itemCode: "",
      description: "",
      stockUom: "PCS",
      sellingPrice: 0,
      categoryId: "",
      alternateUom: "",
      alternateConversionFactor: null,
      isActive: true,
    },
    validationSchema: Yup.object({
      itemCode: Yup.string().required("Stock code is required"),
      description: Yup.string().required("Description is required"),
      stockUom: Yup.string().required("Base UOM is required"),
      sellingPrice: Yup.number()
        .typeError("Selling price must be a number")
        .min(0, "Selling price must be greater or equal to 0")
        .required("Selling price is required"),
      categoryId: Yup.string().nullable().optional(),
      alternateUom: Yup.string().nullable().optional(),
      alternateConversionFactor: Yup.number().nullable().optional(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        const payload: StockItemPayload = {
          ...values,
          categoryId: values.categoryId || null,
          alternateUom: values.alternateUom || null,
          alternateConversionFactor: values.alternateConversionFactor || null,
        };

        if (isEditMode && currentStockItemId) {
          const patchedData: UpdateStockItemRequest = {};
          (Object.keys(payload) as Array<keyof StockItemPayload>).forEach((key) => {
            if (payload[key] !== formik.initialValues[key]) {
              patchedData[key] = payload[key] as any;
            }
          });

          await updateStockItem({ itemId: currentStockItemId, data: patchedData });
        } else {
          await createStockItem(payload);
        }
        setModalOpen(false);
      } catch (error: unknown) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    },
  });

  const handleEdit = (item: StockItem) => {
    const activeItemId = item.itemId || item.id || "";
    setIsEditMode(true);
    setCurrentStockItemId(activeItemId);
    formik.resetForm({
      values: {
        itemCode: item.itemCode || "",
        description: item.description || "",
        stockUom: item.stockUom || "PCS",
        sellingPrice: item.sellingPrice ?? 0,
        categoryId: item.categoryId || "",
        alternateUom: item.alternateUom || "",
        alternateConversionFactor: item.alternateConversionFactor || null,
        isActive: item.isActive ?? true,
      },
    });
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentStockItemId || deleteConfirmation !== "DELETE") return;
    try {
      await deleteStockItem(currentStockItemId);
      setDeleteModal(false);
      setDeleteConfirmation("");
      setCurrentStockItemId(null);
    } catch (error: unknown) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  document.title = "Master Stock Items | Inventory";

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
                  <Col xl={3} lg={4} md={5} sm={12}>
                    <Input
                      type="select"
                      className="form-select form-select-sm fs-12"
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value);
                        setPageIndex(0);
                      }}
                    >
                      <option value="">All Categories</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </Input>
                  </Col>

                  <Col xl={4} lg={4} md={4} sm={12}>
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control form-control-sm fs-12 ps-4"
                        placeholder="Filter code, item, or category..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                      />
                      <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-13"></i>
                    </div>
                  </Col>

                  <Col xl={5} lg={4} md={3} sm={12} className="text-md-end">
                    <Button
                      color="primary"
                      size="sm"
                      className="fs-12 fw-medium px-3 text-nowrap w-100 w-md-auto"
                      onClick={() => {
                        setIsEditMode(false);
                        setCurrentStockItemId(null);
                        setGlobalError(null);
                        formik.resetForm({
                          values: {
                            itemCode: "",
                            description: "",
                            stockUom: "PCS",
                            sellingPrice: 0,
                            categoryId: selectedCategoryId || "",
                            alternateUom: "",
                            alternateConversionFactor: null,
                            isActive: true,
                          },
                        });
                        setModalOpen(true);
                      }}
                    >
                      <i className="ri-add-line align-bottom me-1"></i> Add Stock Item
                    </Button>
                  </Col>
                </Row>
              </CardHeader>

              <CardBody className="p-0">
                <div className="table-responsive">
                  <Table hover size="sm" className="align-middle mb-0 custom-datatable table-sm">
                    <thead className="table-light text-muted text-uppercase fs-10">
                      <tr>
                        <th className="ps-3 py-2 text-nowrap">Stock Code</th>
                        <th className="py-2">Description</th>
                        <th className="py-2 text-nowrap">Selling Price</th>
                        <th className="py-2 text-nowrap">UOM</th>
                        <th className="py-2 text-nowrap">alternateUom</th>
                        <th className="py-2 text-nowrap">Category</th>
                        <th className="py-2 text-nowrap">Status</th>
                        <th className="text-end pe-3 py-2 text-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="fs-12">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4">
                            <Spinner size="sm" color="primary" />
                          </td>
                        </tr>
                      ) : paginatedRows.length > 0 ? (
                        paginatedRows.map((item: StockItem) => {
                          const activeId = item.itemId || item.id || "";
                          const categoryDisplayName =
                            item.categoryName || item.category?.name || "-";

                          return (
                            <tr key={activeId} className="align-middle">
                              <td className="py-2 ps-3 text-nowrap">
                                <span className="fw-semibold text-primary font-monospace fs-11">
                                  {item.itemCode || "N/A"}
                                </span>
                              </td>
                              <td className="py-2">
                                <Link
                                  to={`/stock-items/view/${activeId}`}
                                  className="text-dark fw-medium text-truncate d-inline-block mw-100 style-description-link"
                                  style={{ maxWidth: "280px" }}
                                  title={item.description}
                                >
                                  {item.description || "N/A"}
                                </Link>
                              </td>
                              <td className="py-2 text-nowrap font-monospace">
                                {Number(item.sellingPrice || 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-2 text-nowrap">
                                <Badge color="light" className="text-secondary border fs-10 fw-normal px-1.5 py-0.5 me-1">
                                  Base: {item.stockUom || "PCS"}
                                </Badge>
                              </td>
                              <td className="py-2 text-nowrap">
                                <Badge color="light" className="text-muted border fs-10 fw-normal px-1.5 py-0.5">
                                    Alt: {item.alternateUom}
                                  </Badge>    
                                </td>
                              <td className="py-2 text-nowrap">
                                {categoryDisplayName !== "-" ? (
                                  <span className="badge bg-info-subtle text-info border fs-10 fw-medium px-1.5 py-0.5">
                                    {categoryDisplayName}
                                  </span>
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
                              <td className="text-end pe-3 py-2 text-nowrap">
                                <div className="hstack gap-1 justify-content-end flex-nowrap">
                                  <Button
                                    size="sm"
                                    color="soft-info"
                                    className="btn-icon waves-effect waves-light"
                                    style={{ width: "26px", height: "26px", padding: 0 }}
                                    onClick={() => handleEdit(item)}
                                    title="Edit Item"
                                  >
                                    <i className="ri-edit-box-line fs-13"></i>
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="soft-danger"
                                    className="btn-icon waves-effect waves-light"
                                    style={{ width: "26px", height: "26px", padding: 0 }}
                                    onClick={() => {
                                      setCurrentStockItemId(activeId);
                                      setDeleteConfirmation("");
                                      setDeleteModal(true);
                                    }}
                                    title="Delete Item"
                                  >
                                    <i className="ri-delete-bin-line fs-13"></i>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-muted fs-12">
                            No master stock items found matching your filters.
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

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
          {isEditMode ? "Update Stock Item" : "Register New Stock Item"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-3 p-md-4">
            <Row className="g-3">
              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Stock Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    bsSize="sm"
                    placeholder="e.g. STK-001"
                    {...formik.getFieldProps("itemCode")}
                    invalid={!!(formik.touched.itemCode && formik.errors.itemCode)}
                  />
                  <FormFeedback>{formik.errors.itemCode}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Description <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    placeholder="e.g. Industrial Grade Lubricant"
                    {...formik.getFieldProps("description")}
                    invalid={!!(formik.touched.description && formik.errors.description)}
                  />
                  <FormFeedback>{formik.errors.description}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Base Unit of Measure (Stock UOM) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    placeholder="e.g. PCS, KG, LTR"
                    {...formik.getFieldProps("stockUom")}
                    invalid={!!(formik.touched.stockUom && formik.errors.stockUom)}
                  />
                  <FormFeedback>{formik.errors.stockUom}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Selling Price <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    placeholder="0.00"
                    {...formik.getFieldProps("sellingPrice")}
                    invalid={!!(formik.touched.sellingPrice && formik.errors.sellingPrice)}
                  />
                  <FormFeedback>{formik.errors.sellingPrice}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Category <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    bsSize="sm"
                    {...formik.getFieldProps("categoryId")}
                    invalid={!!(formik.touched.categoryId && formik.errors.categoryId)}
                  >
                    <option value="">-- Select Category --</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{formik.errors.categoryId}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Alternate UOM (Optional)</Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    placeholder="e.g. BOX, CARTON"
                    {...formik.getFieldProps("alternateUom")}
                  />
                </FormGroup>
              </Col>

              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Alternate Conversion Factor (Optional)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    placeholder="e.g. 12"
                    {...formik.getFieldProps("alternateConversionFactor")}
                  />
                </FormGroup>
              </Col>
            </Row>

            {isEditMode && (
              <FormGroup check className="mt-2">
                <Label check className="form-check-label text-muted fs-12">
                  <Input
                    type="checkbox"
                    className="form-check-input me-1"
                    checked={formik.values.isActive}
                    onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
                  />
                  Set Stock Item as Active
                </Label>
              </FormGroup>
            )}
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="primary" size="sm" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (
                <Spinner size="sm" />
              ) : isEditMode ? (
                "Update Stock Item"
              ) : (
                "Register Stock Item"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
        <ModalBody className="p-4 text-center">
          <i className="ri-error-warning-line display-4 text-warning"></i>
          <div className="mt-3">
            <h5 className="mb-2 fs-15">Remove Stock Item?</h5>
            <p className="text-muted fs-12">
              Type <strong>DELETE</strong> to confirm removal.
            </p>
            <Input
              type="text"
              bsSize="sm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="text-center mb-3 fs-12"
              placeholder="Enter DELETE"
            />
            <div className="hstack gap-2 justify-content-center">
              <Button color="light" size="sm" onClick={() => setDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                color="danger"
                size="sm"
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

export default StockItemManagement;