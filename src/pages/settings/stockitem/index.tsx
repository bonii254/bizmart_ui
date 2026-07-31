import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, FormFeedback, Spinner, Alert, 
  Row, Col
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useStockItems, useStockItemMutation } from '../../../Components/Hooks/useStockItems';
import { StockItem, StockItemPayload, UpdateStockItemRequest, UOM } from '../../../types/stockitem';
import { handleBackendErrors } from '../../../helpers/form_utils';
import TablePagination from "../../TablePagination"; 

const StockItemManagement = () => {
  const [pageIndex, setPageIndex] = useState(0); 
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useStockItems(); 
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
      uom: 'LITERS' as UOM,
      is_active: true
    },
    validationSchema: Yup.object({
      stock_code: Yup.string()
        .max(30, 'Stock Code is too long')
        .required('Stock Code SKU identifier is required'),
      description: Yup.string().required('Item description details are required'),
      uom: Yup.string().oneOf(['LITERS', 'KILOGRAMS'], 'Invalid Unit of Measure').required('UOM is required'),
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
      uom: item.uom,
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
      {globalError && <Alert color="danger" className="mb-3">{globalError}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="search-box">
            <Input 
                type="text" 
                className="form-control" 
                placeholder="Search stock code or desc..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPageIndex(0); }}
                style={{ width: '250px' }}
            />
        </div>
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
                uom: 'LITERS',
                is_active: true
              }
            }); 

            setModalOpen(true); 
          }}
        >
          <i className="ri-add-line align-bottom me-1"></i> Register New Item
        </Button>
      </div>

      <Table hover responsive className="align-middle custom-datatable">
        <thead className="table-light">
          <tr>
            <th>Stock Code / Description</th>
            <th>Unit of Measure</th>
            <th>Status</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={4} className="text-center p-5"><Spinner color="primary" /></td></tr>
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
            <tr><td colSpan={4} className="text-center p-4">No master stock items found matching your search.</td></tr>
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      {/* Form Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
            {isEditMode ? 'Update SKU Specification' : 'Register New Catalog Item'}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <Row>
                <Col md={6}>
                    <FormGroup>
                        <Label className="form-label">Stock Code (SKU)</Label>
                        <Input 
                            placeholder="e.g. FUEL-DSL-001"
                            disabled={isEditMode} // Usually catalog SKUs are immutable keys
                            {...formik.getFieldProps('stock_code')} 
                            invalid={!!(formik.touched.stock_code && formik.errors.stock_code)} 
                        />
                        <FormFeedback>{formik.errors.stock_code}</FormFeedback>
                    </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup>
                    <Label className="form-label">Unit of Measure (UOM)</Label>
                    <Input type="select" {...formik.getFieldProps('uom')}>
                      <option value="LITERS">LITERS</option>
                      <option value="KILOGRAMS">KILOGRAMS</option>
                    </Input> 
                    <FormFeedback>{formik.errors.uom}</FormFeedback>     
                  </FormGroup>
                </Col>

                <Col md={12}>
                    <FormGroup>
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
    </React.Fragment>
  );
};

export default StockItemManagement;