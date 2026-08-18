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
  useCategories,
  useCategoryMutation,
} from "../../../Components/Hooks/useCategory";
import {
  Category,
  CategoryPayload,
  UpdateCategoryRequest,
} from "../../../types/category";
import { handleBackendErrors } from "../../../helpers/form_utils";
import TablePagination from "../../TablePagination";


const getCategoryId = (item: any): string => item?.id || item?.categoryId || "";

const CategoryManagement: React.FC = () => {
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
  const { data, isLoading } = useCategories();
  const {
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategoryMutation();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");

  // Normalize category list from hook response ({ success, data }, { categories }, or direct array)
  const categoryList = useMemo<Category[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any).data)) return (data as any).data;
    if (Array.isArray((data as any).categories)) return (data as any).categories;
    return [];
  }, [data]);

  // Client-side filtering by search term across code and name
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categoryList;
    const lower = searchTerm.toLowerCase();
    return categoryList.filter(
      (item: Category) =>
        item.categoryCode.toLowerCase().includes(lower) ||
        item.categoryName.toLowerCase().includes(lower)
    );
  }, [categoryList, searchTerm]);

  // Map for fast O(1) parent category name lookup in table rows
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categoryList.forEach((cat) => {
      const id = getCategoryId(cat);
      if (id) map.set(id, cat.categoryName);
    });
    return map;
  }, [categoryList]);

  // Pagination calculations
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize);

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
    getPrePaginationRowModel: () => ({ rows: filteredCategories }),
  };

  const formik = useFormik<CategoryPayload>({
    initialValues: {
      categoryCode: "",
      categoryName: "",
      parentCategoryId: "",
    },
    validationSchema: Yup.object({
      categoryCode: Yup.string()
        .max(30, "Category Code is too long")
        .required("Category Code identifier is required"),
      categoryName: Yup.string().required("Category Name is required"),
      parentCategoryId: Yup.string().nullable().optional(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);

        const payload: CategoryPayload = {
          categoryCode: values.categoryCode,
          categoryName: values.categoryName,
          parentCategoryId: values.parentCategoryId ? values.parentCategoryId : null,
        };

        if (isEditMode && currentCategoryId) {
          const patchedData: UpdateCategoryRequest = {};
          (Object.keys(payload) as Array<keyof CategoryPayload>).forEach((key) => {
            if (payload[key] !== formik.initialValues[key]) {
              patchedData[key] = payload[key] as any;
            }
          });
          await updateCategory({ id: currentCategoryId, data: patchedData });
        } else {
          await createCategory(payload);
        }
        setModalOpen(false);
      } catch (error: unknown) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    },
  });

  const handleEdit = (item: Category) => {
    const id = getCategoryId(item);
    setIsEditMode(true);
    setCurrentCategoryId(id);
    formik.resetForm({
      values: {
        categoryCode: item.categoryCode,
        categoryName: item.categoryName,
        parentCategoryId: item.parentCategoryId || "",
      },
    });
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentCategoryId || deleteConfirmation !== "DELETE") return;
    try {
      await deleteCategory(currentCategoryId);
      setDeleteModal(false);
      setDeleteConfirmation("");
      setCurrentCategoryId(null);
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
              placeholder="Search code or name..."
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
              setCurrentCategoryId(null);
              setGlobalError(null);

              formik.resetForm({
                values: {
                  categoryCode: "",
                  categoryName: "",
                  parentCategoryId: "",
                },
              });

              setModalOpen(true);
            }}
          >
            <i className="ri-add-line align-bottom me-1"></i> Register New Category
          </Button>
        </div>
      </div>

      {/* High-Density Compact Data Table */}
      <Table hover responsive className="align-middle table-nowrap mb-0 custom-datatable">
        <thead className="table-light text-muted text-uppercase fs-11">
          <tr>
            <th style={{ width: "20%" }}>Category Code</th>
            <th style={{ width: "35%" }}>Category Name</th>
            <th style={{ width: "35%" }}>Parent Category</th>
            <th style={{ width: "10%" }} className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody className="fs-13">
          {isLoading ? (
            <tr>
              <td colSpan={4} className="text-center py-4">
                <Spinner size="sm" color="primary" />
              </td>
            </tr>
          ) : paginatedRows.length > 0 ? (
            paginatedRows.map((item: Category) => {
              const catId = getCategoryId(item);
              const parentName = item.parentCategoryId ? categoryMap.get(item.parentCategoryId) : null;

              return (
                <tr key={catId} className="align-middle">
                  {/* 1. Category Code */}
                  <td className="py-2">
                    <span className="fw-semibold text-primary font-monospace fs-12">
                      {item.categoryCode}
                    </span>
                  </td>

                  {/* 2. Category Name */}
                  <td className="py-2">
                    <div className="d-flex align-items-center">
                      <Link
                        to={`/inventory/categories/view/${catId}`}
                        className="text-dark fw-medium text-truncate d-inline-block font-poppins"
                        style={{ maxWidth: "220px" }}
                        title={item.categoryName}
                      >
                        {item.categoryName}
                      </Link>
                    </div>
                  </td>

                  {/* 3. Parent Category */}
                  <td className="py-2">
                    {parentName ? (
                      <span className="badge bg-light text-body border fs-11 fw-normal px-2 py-1">
                        <i className="ri-node-tree text-muted me-1"></i>
                        {parentName}
                      </span>
                    ) : (
                      <span className="text-muted fs-12 me-1">- Root -</span>
                    )}
                  </td>

                  {/* 4. Action Buttons */}
                  <td className="text-end py-2">
                    <div className="d-flex gap-1 justify-content-end">
                      <Button
                        size="sm"
                        color="soft-info"
                        className="btn-icon waves-effect waves-light"
                        style={{ width: "28px", height: "28px", padding: 0 }}
                        onClick={() => handleEdit(item)}
                        title="Edit Category"
                      >
                        <i className="ri-edit-box-line fs-14"></i>
                      </Button>
                      <Button
                        size="sm"
                        color="soft-danger"
                        className="btn-icon waves-effect waves-light"
                        style={{ width: "28px", height: "28px", padding: 0 }}
                        onClick={() => {
                          setCurrentCategoryId(catId);
                          setDeleteConfirmation("");
                          setDeleteModal(true);
                        }}
                        title="Delete Category"
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
              <td colSpan={4} className="text-center py-4 text-muted fs-13">
                No master categories found matching your search.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      {/* Form Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
          {isEditMode ? "Update Category Specification" : "Register New Category"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Category Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. BEV-SOFT"
                    disabled={isEditMode}
                    {...formik.getFieldProps("categoryCode")}
                    invalid={!!(formik.touched.categoryCode && formik.errors.categoryCode)}
                  />
                  <FormFeedback>{formik.errors.categoryCode}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">
                    Category Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Soft Drinks & Carbonated"
                    {...formik.getFieldProps("categoryName")}
                    invalid={!!(formik.touched.categoryName && formik.errors.categoryName)}
                  />
                  <FormFeedback>{formik.errors.categoryName}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">Parent Category (Optional)</Label>
                  <Input
                    type="select"
                    {...formik.getFieldProps("parentCategoryId")}
                    invalid={!!(formik.touched.parentCategoryId && formik.errors.parentCategoryId)}
                  >
                    <option value="">-- No Parent (Root Category) --</option>
                    {categoryList
                      .filter((c: Category) => getCategoryId(c) !== currentCategoryId)
                      .map((cat: Category) => {
                        const id = getCategoryId(cat);
                        return (
                          <option key={id} value={id}>
                            {cat.categoryName} ({cat.categoryCode})
                          </option>
                        );
                      })}
                  </Input>
                  <FormFeedback>{formik.errors.parentCategoryId}</FormFeedback>
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
                "Update Master Record"
              ) : (
                "Save Category"
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
            <h4 className="mb-2">Remove Category?</h4>
            <p className="text-muted fs-14">
              Type <strong>DELETE</strong> to confirm master record eradication.
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

export default CategoryManagement;