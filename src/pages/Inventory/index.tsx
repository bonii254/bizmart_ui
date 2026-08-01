import React, { useState, useMemo, useEffect } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, FormFeedback, Spinner, Alert, 
  Row, Col, Card, CardBody, CardHeader, Container 
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { 
  useStockItems, 
  useStockItemMutation 
} from '../../Components/Hooks/useStockItems';
import { useCategories } from '../../Components/Hooks/useCategory';
import { 
  StockItem,
  StockItemPayload, 
  UpdateStockItemRequest, UOM 
} from '../../types/stockitem';
import { handleBackendErrors } from '../../helpers/form_utils';
import TablePagination from "../TablePagination"; 

const StockItemManagement = () => {
  // Velzon dynamic page title document sync
  useEffect(() => {
    document.title = "Stock Item Management | Velzon - React Admin & Dashboard Template";
  }, []);

  const [pageIndex, setPageIndex] = useState(0); 
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useStockItems(); 
  const { data: categoriesData } = useCategories();

  const { 
    createStockItem, 
    updateStockItem, 
    deleteStockItem, 
    isCreating, 
    isUpdating, 
    isDeleting 
  } = useStockItemMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStockItemId, setCurrentStockItemId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const categoriesList = useMemo(() => {
    if (!categoriesData) return [];
    return Array.isArray(categoriesData) 
      ? categoriesData 
      : (categoriesData as any).categories || (categoriesData as any).data || [];
  }, [categoriesData]);

  const categoryMap = useMemo(() => {
    return new Map<string, string>(
      categoriesList.map((cat: any) => [String(cat.id), String(cat.name)])
    );
  }, [categoriesList]);

  const filteredStockItems = useMemo(() => {
    const list = data?.catalog || [];
    if (!searchTerm) return list;
    return list.filter(item => 
      item.stock_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
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
    previousPage: () => setPageIndex(prev => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex(prev => Math.min(prev + 1, totalPages - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < totalPages - 1,
    getPageCount: () => totalPages || 1,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: filteredStockItems }),
  };

  const formik = useFormik<StockItemPayload>({
    initialValues: { 
      stock_code: '',
      description: '',
      category_id: '',
      uom: 'LITERS' as UOM,
      unit_cost: 0,
      selling_price: 0,
      quantity_on_hand: 0,
      is_active: true
    },
    validationSchema: Yup.object({
      stock_code: Yup.string()
        .max(30, 'Stock Code is too long')
        .required('Stock Code SKU identifier is required'),
      description: Yup.string().required('Item description details are required'),
      category_id: Yup.string().required('Category selection is required'),
      uom: Yup.string().oneOf(['LITERS', 'KILOGRAMS'], 'Invalid Unit of Measure').required('UOM is required'),
      unit_cost: Yup.number()
        .typeError('Unit cost must be a number')
        .min(0, 'Unit cost cannot be negative')
        .required('Unit cost is required'),
      selling_price: Yup.number()
        .typeError('Selling price must be a number')
        .min(0, 'Selling price cannot be negative')
        .required('Selling price is required'),
      quantity_on_hand: Yup.number()
        .typeError('Quantity must be a number')
        .min(0, 'Quantity cannot be negative')
        .optional(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        if (isEditMode && currentStockItemId) {
          const patchedData: UpdateStockItemRequest = {};
          (Object.keys(values) as Array<keyof StockItemPayload>).forEach(key => {
            if (values[key] !== formik.initialValues[key]) {
              (patchedData as any)[key] = values[key];
            }
          });
          await updateStockItem({ id: currentStockItemId, data: patchedData });
        } else {
          await createStockItem(values);
        }
        setModalOpen(false);
      } catch (error: any) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    }
  });

  const handleEdit = (item: StockItem) => {
    setIsEditMode(true);
    setCurrentStockItemId(item.id);
    formik.resetForm({ values: { 
      stock_code: item.stock_code,
      description: item.description,
      category_id: item.category_id || '',
      uom: item.uom,
      unit_cost: item.unit_cost || 0,
      selling_price: item.selling_price || 0,
      quantity_on_hand: item.quantity_on_hand || 0,
      is_active: item.is_active
    }});
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentStockItemId || deleteConfirmation !== 'DELETE') return;
    try {
      await deleteStockItem(currentStockItemId);
      setDeleteModal(false);
      setDeleteConfirmation('');
      setCurrentStockItemId(null);
    } catch (error: any) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Velzon Corporate Header / Breadcrumb */}
          <BreadCrumb title="Stock Item Management" pageTitle="Inventory" />

          {globalError && <Alert color="danger" className="mb-3">{globalError}</Alert>}
          
          <Card className="mb-4">
            <CardHeader className="border-0 align-items-center d-flex">
              <h5 className="card-title mb-0 flex-grow-1">Inventory Master Catalog</h5>
              <div className="flex-shrink-0">
                <Button 
                  color="primary" 
                  onClick={() => { 
                    setIsEditMode(false); 
                    setCurrentStockItemId(null);
                    setGlobalError(null);

                    formik.resetForm({
                      values: {
                        stock_code: '',
                        description: '',
                        category_id: '',
                        uom: 'LITERS',
                        unit_cost: 0,
                        selling_price: 0,
                        quantity_on_hand: 0,
                        is_active: true
                      }
                    }); 

                    setModalOpen(true); 
                  }}
                >
                  <i className="ri-add-line align-bottom me-1"></i> Register New Item
                </Button>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="search-box">
                  <Input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search stock code or desc..." 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPageIndex(0); }}
                    style={{ width: '280px' }}
                  />
                </div>
              </div>

              <Table hover responsive className="align-middle custom-datatable mb-0">
                <thead className="table-light text-muted">
                  <tr>
                    <th>Stock Code / Description</th>
                    <th>Category</th>
                    <th className="text-end">Unit Cost</th>
                    <th className="text-end">Selling Price</th>
                    <th className="text-end">Qty On Hand</th>
                    <th>UOM</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={8} className="text-center p-5"><Spinner color="primary" /></td></tr>
                  ) : paginatedRows.length > 0 ? (
                    paginatedRows.map((item: StockItem) => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-xs flex-shrink-0">
                              <div className="avatar-title rounded-circle bg-success-subtle text-success fw-bold">
                                <i className="ri-barcode-box-line"></i>
                              </div>
                            </div>
                            <div className="ms-2">
                              <h5 className="fs-14 mb-0">
                                <Link to={`/inventory/items/view/${item.id}`} className="text-body fw-bold">{item.stock_code}</Link>
                              </h5>
                              <p className="text-muted mb-0 fs-12">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-body fw-medium">
                            {categoryMap.get(item.category_id) || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="text-end fw-semibold">
                          {(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-end fw-semibold text-primary">
                          {(item.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-end fw-medium">
                          {(item.quantity_on_hand || 0).toLocaleString()}
                        </td>
                        <td>
                          <span className="badge bg-light text-body border">{item.uom}</span>
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
                              setCurrentStockItemId(item.id); setDeleteConfirmation(''); setDeleteModal(true); 
                            }}>
                              <i className="ri-delete-bin-line"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={8} className="text-center p-4">No master stock items found matching your search.</td></tr>
                  )}
                </tbody>
              </Table>

              <TablePagination table={tableInstance} />
            </CardBody>
          </Card>

          {/* Form Modal */}
          <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
            <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
              {isEditMode ? 'Update SKU Specification' : 'Register New Catalog Item'}
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
              <ModalBody className="p-4">
                <Row>
                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <Label className="form-label">Stock Code (SKU)</Label>
                      <Input 
                        placeholder="e.g. FUEL-DSL-001"
                        disabled={isEditMode}
                        {...formik.getFieldProps('stock_code')} 
                        invalid={!!(formik.touched.stock_code && formik.errors.stock_code)} 
                      />
                      <FormFeedback>{formik.errors.stock_code}</FormFeedback>
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <Label className="form-label">Category</Label>
                      <Input 
                        type="select" 
                        {...formik.getFieldProps('category_id')}
                        invalid={!!(formik.touched.category_id && formik.errors.category_id)}
                      >
                        <option value="">Select Category...</option>
                        {categoriesList.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </Input>
                      <FormFeedback>{formik.errors.category_id}</FormFeedback>
                    </FormGroup>
                  </Col>

                  <Col md={4}>
                    <FormGroup className="mb-3">
                      <Label className="form-label">Unit of Measure (UOM)</Label>
                      <Input type="select" {...formik.getFieldProps('uom')}>
                        <option value="LITERS">LITERS</option>
                        <option value="KILOGRAMS">KILOGRAMS</option>
                      </Input> 
                      <FormFeedback>{formik.errors.uom}</FormFeedback>     
                    </FormGroup>
                  </Col>

                  <Col md={4}>
                    <FormGroup className="mb-3">
                      <Label className="form-label">Unit Cost</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...formik.getFieldProps('unit_cost')}
                        invalid={!!(formik.touched.unit_cost && formik.errors.unit_cost)}
                      />
                      <FormFeedback>{formik.errors.unit_cost}</FormFeedback>
                    </FormGroup>
                  </Col>

                  <Col md={4}>
                    <FormGroup className="mb-3">
                      <Label className="form-label">Selling Price</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...formik.getFieldProps('selling_price')}
                        invalid={!!(formik.touched.selling_price && formik.errors.selling_price)}
                      />
                      <FormFeedback>{formik.errors.selling_price}</FormFeedback>
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <Label className="form-label">Initial Quantity On Hand</Label>
                      <Input 
                        type="number"
                        step="1"
                        placeholder="0"
                        {...formik.getFieldProps('quantity_on_hand')}
                        invalid={!!(formik.touched.quantity_on_hand && formik.errors.quantity_on_hand)}
                      />
                      <FormFeedback>{formik.errors.quantity_on_hand}</FormFeedback>
                    </FormGroup>
                  </Col>

                  <Col md={12}>
                    <FormGroup className="mb-3">
                      <Label className="form-label">Item Description</Label>
                      <Input 
                        type="textarea"
                        rows={2}
                        placeholder="Detailed material or item definitions..."
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
                  {isCreating || isUpdating ? <Spinner size="sm" /> : (isEditMode ? 'Update Master Record' : 'Save Catalog SKU')}
                </Button>
              </ModalFooter>
            </Form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
            <ModalBody className="p-5 text-center">
              <i className="ri-error-warning-line display-4 text-warning"></i>
              <div className="mt-4">
                <h4 className="mb-2">Remove Catalog Item?</h4>
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
        </Container>
      </div>
    </React.Fragment>
  );
};

export default StockItemManagement;