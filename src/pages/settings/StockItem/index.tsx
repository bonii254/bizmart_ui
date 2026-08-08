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

import {
  useStockItems,
  useStockItemMutation,
} from "../../../Components/Hooks/useStockItems";
import { useCategories } from "../../../Components/Hooks/useCategory";
import {
  StockItem,
  StockItemPayload,
  UpdateStockItemRequest,
  UOM,
} from "../../../types/stockitem";
import { Category } from "../../../types/category";
import { handleBackendErrors } from "../../../helpers/form_utils";
import TablePagination from "../../TablePagination";

// Alphabetically sorted UOM list for optimal user experience
const UOM_OPTIONS: UOM[] = [
  "BAGS",
  "BOXES",
  "BUNDLES",
  "CARTONS",
  "CASES",
  "CENTIMETERS",
  "CRATES",
  "CUBIC_METERS",
  "DOZENS",
  "EACH",
  "FEET",
  "GALLONS",
  "GRAMS",
  "INCHES",
  "KILOGRAMS",
  "LITERS",
  "METERS",
  "PACKS",
  "PAIRS",
  "PALLETS",
  "PIECES",
  "POUNDS",
  "ROLLS",
  "SETS",
  "SQUARE_FEET",
  "SQUARE_METERS",
  "TONS",
  "UNITS",
].sort() as UOM[];

const StockItemManagement: React.FC = () => {
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Auto-search / Debounce states
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Debounce input typing for auto-search (300ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // React Query Hooks
  const { data, isLoading } = useStockItems(searchTerm);
  const { data: categoryData, isLoading: isLoadingCategories } = useCategories("", true);

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
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");

  // Normalize category list from hook response
  const categoriesList: Category[] = useMemo(() => {
    if (!categoryData) return [];
    if (Array.isArray(categoryData)) return categoryData;
    return (categoryData as { categories?: Category[]; data?: Category[] }).categories || (categoryData as { categories?: Category[]; data?: Category[] }).data || [];
  }, [categoryData]);

  // Map category IDs to names for instant lookup in table rows
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categoriesList.forEach((cat) => {
      if (cat.id) map.set(cat.id, cat.category_name || "");
    });
    return map;
  }, [categoriesList]);

  const filteredStockItems = useMemo(() => {
    const list = data?.catalog || [];
    if (!searchTerm) return list;
    const lowerSearch = searchTerm.toLowerCase();
    return list.filter(
      (item) =>
        item.stock_code.toLowerCase().includes(lowerSearch) ||
        item.description.toLowerCase().includes(lowerSearch)
    );
  }, [data, searchTerm]);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredStockItems.slice(start, start + pageSize);
  }, [filteredStockItems, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredStockItems.length / pageSize);

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
    getPrePaginationRowModel: () => ({ rows: filteredStockItems }),
  };

  const formik = useFormik<StockItemPayload>({
    initialValues: {
      stock_code: "",
      description: "",
      uom: "KILOGRAMS",
      category_id: "",
      is_active: true,
    },
    validationSchema: Yup.object({
      stock_code: Yup.string().required("Stock code is required"),
      description: Yup.string().required("Description is required"),
      uom: Yup.mixed<UOM>()
        .oneOf(UOM_OPTIONS, "Invalid Unit of Measure")
        .required("Unit of measure is required"),
      category_id: Yup.string().nullable().optional(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        if (isEditMode && currentStockItemId) {
          const patchedData: UpdateStockItemRequest = {};
          (Object.keys(values) as Array<keyof StockItemPayload>).forEach((key) => {
            if (values[key] !== formik.initialValues[key]) {
              patchedData[key] = values[key] as any;
            }
          });
          await updateStockItem({ id: currentStockItemId, data: patchedData });
        } else {
          await createStockItem(values);
        }
        setModalOpen(false);
      } catch (error: unknown) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    },
  });

  const handleEdit = (item: StockItem) => {
    setIsEditMode(true);
    setCurrentStockItemId(item.id);
    formik.resetForm({
      values: {
        stock_code: item.stock_code,
        description: item.description,
        uom: item.uom,
        category_id: item.category_id || item.category?.id || "",
        is_active: item.is_active ?? true,
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

  return (
    <React.Fragment>
      {globalError && (
        <Alert color="danger" className="mb-3">
          {globalError}
        </Alert>
      )}

      {/* Ultra-Compact Single-Line Header Control Toolbar */}
      <div className="row g-2 align-items-center mb-3">
        {/* Compact Auto-Search Input */}
        <div className="col-12 col-sm-6 col-md-4">
          <div className="search-box position-relative">
            <Input
              type="text"
              className="form-control form-control-sm fs-13 ps-4"
              placeholder="Auto-search code or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-14"></i>
          </div>
        </div>

        {/* Action Button Aligned End */}
        <div className="col-12 col-md-8 text-md-end">
          <Button
            color="primary"
            size="sm"
            className="fs-13 fw-medium px-3"
            onClick={() => {
              setIsEditMode(false);
              setCurrentStockItemId(null);
              setGlobalError(null);
              formik.resetForm({
                values: {
                  stock_code: "",
                  description: "",
                  uom: "KILOGRAMS",
                  category_id: "",
                  is_active: true,
                },
              });
              setModalOpen(true);
            }}
          >
            <i className="ri-add-line align-bottom me-1"></i> Add Stock Item
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Table hover responsive className="align-middle table-nowrap mb-0 custom-datatable">
        <thead className="table-light text-muted text-uppercase fs-11">
          <tr>
            <th style={{ width: "15%" }}>Stock Code</th>
            <th style={{ width: "35%" }}>Description</th>
            <th style={{ width: "15%" }}>Category</th>
            <th style={{ width: "12%" }}>UOM</th>
            <th style={{ width: "13%" }}>Status</th>
            <th style={{ width: "10%" }} className="text-end">Actions</th>
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
            paginatedRows.map((item: StockItem) => {
              // Resolve category name gracefully across API response formats
              const resolvedCategoryName =
                item.category_name ||                (item.category_id ? categoryMap.get(item.category_id) : undefined) ||
                "-";

              return (
                <tr key={item.id} className="align-middle">
                  {/* 1. Stock Code */}
                  <td className="py-2">
                    <span className="fw-semibold text-dark font-poppins fs-12">
                      {item.stock_code}
                    </span>
                  </td>

                  {/* 2. Description */}
                  <td className="py-2">
                    <Link
                      to={`/stock-items/view/${item.id}`}
                      className="text-dark fw-medium text-truncate d-inline-block font-poppins style-description-link"
                      style={{ maxWidth: "320px" }}
                      title={item.description}
                    >
                      {item.description}
                    </Link>
                  </td>

                  {/* 3. Category */}
                  <td className="py-2">
                    {resolvedCategoryName !== "-" ? (
                      <span className="badge bg-info-subtle text-info border fs-11 fw-medium px-2 py-1">
                        {resolvedCategoryName}
                      </span>
                    ) : (
                      <span className="text-muted fs-12">-</span>
                    )}
                  </td>

                  {/* 4. UOM */}
                  <td className="py-2">
                    <span className="badge bg-light text-secondary border fs-11 fw-normal px-2 py-1">
                      {item.uom}
                    </span>
                  </td>

                  {/* 5. Status */}
                  <td className="py-2">
                    <span
                      className={`badge ${
                        item.is_active ?? true
                          ? "bg-success-subtle text-success"
                          : "bg-danger-subtle text-danger"
                      } fs-11`}
                    >
                      {item.is_active ?? true ? "Active" : "Deactivated"}
                    </span>
                  </td>

                  {/* 6. Actions */}
                  <td className="text-end py-2">
                    <div className="d-flex gap-1 justify-content-end">
                      <Button
                        size="sm"
                        color="soft-info"
                        className="btn-icon waves-effect waves-light"
                        style={{ width: "28px", height: "28px", padding: 0 }}
                        onClick={() => handleEdit(item)}
                        title="Edit Item"
                      >
                        <i className="ri-edit-box-line fs-14"></i>
                      </Button>
                      <Button
                        size="sm"
                        color="soft-danger"
                        className="btn-icon waves-effect waves-light"
                        style={{ width: "28px", height: "28px", padding: 0 }}
                        onClick={() => {
                          setCurrentStockItemId(item.id);
                          setDeleteConfirmation("");
                          setDeleteModal(true);
                        }}
                        title="Delete Item"
                      >
                        <i className="ri-delete-bin-line fs-14"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted fs-13">
                No stock items found matching your search.
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
          {isEditMode ? "Update Stock Item" : "Register New Stock Item"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Stock Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. STK-001"
                    {...formik.getFieldProps("stock_code")}
                    invalid={
                      !!(
                        formik.touched.stock_code && formik.errors.stock_code
                      )
                    }
                  />
                  <FormFeedback>{formik.errors.stock_code}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Unit of Measure (UOM) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    {...formik.getFieldProps("uom")}
                    invalid={!!(formik.touched.uom && formik.errors.uom)}
                  >
                    {UOM_OPTIONS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{formik.errors.uom}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">Category</Label>
                  <Input
                    type="select"
                    {...formik.getFieldProps("category_id")}
                    invalid={!!(formik.touched.category_id && formik.errors.category_id)}
                    disabled={isLoadingCategories}
                  >
                    <option value="">-- Select Category (Optional) --</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{formik.errors.category_id}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">
                    Description <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="textarea"
                    rows={3}
                    placeholder="e.g. Industrial Grade Lubricant"
                    {...formik.getFieldProps("description")}
                    invalid={
                      !!(
                        formik.touched.description && formik.errors.description
                      )
                    }
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
                    checked={formik.values.is_active}
                    onChange={(e) =>
                      formik.setFieldValue("is_active", e.target.checked)
                    }
                  />{" "}
                  Set Stock Item as Active
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
                "Update Stock Item"
              ) : (
                "Register Stock Item"
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
            <h4 className="mb-2">Remove Stock Item?</h4>
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

export default StockItemManagement;