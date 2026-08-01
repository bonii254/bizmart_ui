import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, FormFeedback, Spinner, Alert, 
  Row, Col
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Using your provided hooks and types
import { useCategories, useCategoryMutation } from '../../../Components/Hooks/useCategory';
import { Category, CategoryPayload, UpdateCategoryRequest } from '../../../types/category';
import { handleBackendErrors } from '../../../helpers/form_utils';
import TablePagination from "../../TablePagination"; 

const CategoryManagement = () => {
  const [pageIndex, setPageIndex] = useState(0); 
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetching all categories (client-side search retained as per previous logic)
  const { data, isLoading } = useCategories(); 
  const { 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    isCreating, 
    isUpdating, 
    isDeleting 
  } = useCategoryMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Extracting 'categories' from your CategoryListResponse
  const filteredCategories = useMemo(() => {
    const list = data?.categories || [];
    if (!searchTerm) return list;
    return list.filter(item => 
      item.category_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

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
    previousPage: () => setPageIndex(prev => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex(prev => Math.min(prev + 1, totalPages - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < totalPages - 1,
    getPageCount: () => totalPages || 1,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: filteredCategories }),
  };

  const formik = useFormik<CategoryPayload>({
    initialValues: { 
      category_code: '',
      category_name: '',
      description: '',
      parent_id: '', // Handled as string in form, sent as string | null
      is_active: true
    },
    validationSchema: Yup.object({
      category_code: Yup.string()
        .max(30, 'Category Code is too long')
        .required('Category Code identifier is required'),
      category_name: Yup.string()
        .required('Category Name is required'),
      description: Yup.string().optional(),
      parent_id: Yup.string().nullable(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        
        // Sanitize parent_id to be null if left empty
        const payload = {
            ...values,
            parent_id: values.parent_id ? values.parent_id : null
        };

        if (isEditMode && currentCategoryId) {
          const patchedData: UpdateCategoryRequest = {};
          (Object.keys(payload) as Array<keyof CategoryPayload>).forEach(key => {
            if (payload[key] !== formik.initialValues[key]) {
              (patchedData as any)[key] = payload[key];
            }
          });
          await updateCategory({ id: currentCategoryId, data: patchedData });
        } else {
          await createCategory(payload);
        }
        setModalOpen(false);
      } catch (error: any) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    }
  });

  const handleEdit = (item: Category) => {
    setIsEditMode(true);
    setCurrentCategoryId(item.id);
    formik.resetForm({ values: { 
      category_code: item.category_code,
      category_name: item.category_name,
      description: item.description || '',
      parent_id: item.parent_id || '',
      is_active: item.is_active
    }});
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentCategoryId || deleteConfirmation !== 'DELETE') return;
    try {
      await deleteCategory(currentCategoryId);
      setDeleteModal(false);
      setDeleteConfirmation('');
      setCurrentCategoryId(null);
    } catch (error: any) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  return (
    <React.Fragment>
      {globalError && <Alert color="danger" className="mb-3">{globalError}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="search-box">
            <Input 
                type="text" 
                className="form-control" 
                placeholder="Search code or name..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPageIndex(0); }}
                style={{ width: '250px' }}
            />
        </div>
        <Button 
          color="primary" 
          onClick={() => { 
            setIsEditMode(false); 
            setCurrentCategoryId(null);
            setGlobalError(null);

            formik.resetForm({
              values: {
                category_code: '',
                category_name: '',
                description: '',
                parent_id: '',
                is_active: true
              }
            }); 

            setModalOpen(true); 
          }}
        >
          <i className="ri-add-line align-bottom me-1"></i> Register New Category
        </Button>
      </div>

      <Table hover responsive className="align-middle custom-datatable">
        <thead className="table-light">
          <tr>
            <th>Category Info</th>
            <th>Description</th>
            <th>Status</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={4} className="text-center p-5"><Spinner color="primary" /></td></tr>
          ) : paginatedRows.length > 0 ? (
            paginatedRows.map((item: Category) => (
              <tr key={item.id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar-xs flex-shrink-0">
                        <div className="avatar-title rounded-circle bg-info-subtle text-info fw-bold">
                          <i className="ri-folder-2-line"></i>
                        </div>
                    </div>
                    <div className="ms-2">
                      <h5 className="fs-14 mb-0">
                        <Link to={`/inventory/categories/view/${item.id}`} className="text-body fw-bold">{item.category_name}</Link>
                      </h5>
                      <p className="text-muted mb-0 fs-12">
                        Code: {item.category_code}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="text-muted text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                    {item.description || '-'}
                  </span>
                </td>
                <td>
                   <span className={`badge ${item.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                     {item.is_active ? 'Active' : 'Deactivated'}
                   </span>
                </td>
                <td className="text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <Button size="sm" color="soft-info" onClick={() => handleEdit(item)}>
                        <i className="ri-edit-box-line"></i>
                    </Button>
                    <Button size="sm" color="soft-danger" onClick={() => { 
                      setCurrentCategoryId(item.id); setDeleteConfirmation(''); setDeleteModal(true); 
                    }}>
                        <i className="ri-delete-bin-line"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={4} className="text-center p-4">No master categories found matching your search.</td></tr>
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      {/* Form Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
            {isEditMode ? 'Update Category Specification' : 'Register New Category'}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <Row>
                <Col md={6}>
                    <FormGroup>
                        <Label className="form-label">Category Code</Label>
                        <Input 
                            placeholder="e.g. CAT-FUEL"
                            disabled={isEditMode}
                            {...formik.getFieldProps('category_code')} 
                            invalid={!!(formik.touched.category_code && formik.errors.category_code)} 
                        />
                        <FormFeedback>{formik.errors.category_code}</FormFeedback>
                    </FormGroup>
                </Col>
                
                <Col md={6}>
                    <FormGroup>
                        <Label className="form-label">Category Name</Label>
                        <Input 
                            placeholder="e.g. Industrial Fuels"
                            {...formik.getFieldProps('category_name')} 
                            invalid={!!(formik.touched.category_name && formik.errors.category_name)} 
                        />
                        <FormFeedback>{formik.errors.category_name}</FormFeedback>
                    </FormGroup>
                </Col>

                <Col md={12}>
                    <FormGroup>
                        <Label className="form-label">Parent Category (Optional)</Label>
                        <Input 
                            type="select"
                            {...formik.getFieldProps('parent_id')}
                            invalid={!!(formik.touched.parent_id && formik.errors.parent_id)}
                        >
                            <option value="">-- No Parent (Root Category) --</option>
                            {/* Filter out the current category being edited so it can't be its own parent */}
                            {data?.categories?.filter(c => c.id !== currentCategoryId).map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.category_name} ({cat.category_code})
                                </option>
                            ))}
                        </Input>
                        <FormFeedback>{formik.errors.parent_id}</FormFeedback>
                    </FormGroup>
                </Col>

                <Col md={12}>
                    <FormGroup>
                        <Label className="form-label">Category Description</Label>
                        <Input 
                            type="textarea"
                            rows={2}
                            placeholder="Detailed category definitions..."
                            {...formik.getFieldProps('description')} 
                            invalid={!!(formik.touched.description && formik.errors.description)} 
                        />
                        <FormFeedback>{formik.errors.description}</FormFeedback>
                    </FormGroup>
                </Col>
            </Row>

            {isEditMode && (
                <FormGroup check className="mt-2">
                    <Label check>
                        <Input 
                            type="checkbox" 
                            checked={formik.values.is_active}
                            onChange={(e) => formik.setFieldValue('is_active', e.target.checked)}
                        />{' '}
                        Active Catalog Record (Operational Status)
                    </Label>
                </FormGroup>
            )}
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" color="primary" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? <Spinner size="sm" /> : (isEditMode ? 'Update Master Record' : 'Save Category')}
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
              <p className="text-muted fs-14">Type <strong>DELETE</strong> to confirm master record eradication.</p>
              <Input 
                 type="text" value={deleteConfirmation} 
                 onChange={(e) => setDeleteConfirmation(e.target.value)} 
                 className="text-center mb-4" placeholder="Enter DELETE"
              />
              <div className="hstack gap-2 justify-content-center">
                <Button color="light" onClick={() => setDeleteModal(false)}>Cancel</Button>
                <Button color="danger" onClick={confirmDelete} disabled={isDeleting || deleteConfirmation !== 'DELETE'}>
                  {isDeleting ? <Spinner size="sm" /> : 'Confirm Removal'}
                </Button>
              </div>
          </div>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default CategoryManagement;