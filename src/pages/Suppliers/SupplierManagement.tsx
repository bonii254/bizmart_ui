import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, FormFeedback, Spinner, Alert, Card, CardBody, Row, Col, Badge, Container 
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSuppliers, useSupplierMutation } from '../../Components/Hooks/useSuppliers';
import { Supplier, SupplierPayload, UpdateSupplierRequest } from '../../types/supplier';
import { handleBackendErrors } from '../../helpers/form_utils';
import TablePagination from "../TablePagination"; 

const SupplierManagement: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0); 
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const { data, isLoading } = useSuppliers(1, 100); 
  const { createSupplier, updateSupplier, deleteSupplier, isCreating, isUpdating, isDeleting } = useSupplierMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [statusToggleModal, setStatusToggleModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSupplierId, setCurrentSupplierId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const allSuppliers: Supplier[] = useMemo(() => data?.suppliers || [], [data]);
  const selectedSupplier = allSuppliers.find(s => s.supplierId === currentSupplierId);

  // Search and Filter Logic
  const filteredSuppliers = useMemo(() => {
    return allSuppliers.filter((supplier) => {
      const matchesSearch = 
        supplier.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.supplierCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.taxNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'ACTIVE' ? supplier.isActive : !supplier.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [allSuppliers, searchTerm, statusFilter]);

  // Supplier Metrics Summary
  const metrics = useMemo(() => {
    const total = allSuppliers.length;
    const active = allSuppliers.filter(s => s.isActive).length;
    const inactive = total - active;
    const avgTerms = total > 0 
      ? Math.round(allSuppliers.reduce((acc, s) => acc + (Number(s.paymentTermsDays) || 0), 0) / total) 
      : 0;
    return { total, active, inactive, avgTerms };
  }, [allSuppliers]);

  // Pagination Logic
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);

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
    getPrePaginationRowModel: () => ({ rows: filteredSuppliers }),
  };

  const formik = useFormik<SupplierPayload>({
    initialValues: { 
      supplierCode: '',
      supplierName: '',
      contactName: '',
      phone: '',
      email: '',
      taxNumber: '',
      paymentTermsDays: 30,
    },
    validationSchema: Yup.object({
      supplierCode: Yup.string().required('Supplier code is required'),
      supplierName: Yup.string().required('Supplier name is required'),
      contactName: Yup.string().required('Contact person is required'),
      phone: Yup.string().required('Phone number is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      taxNumber: Yup.string().required('Tax number is required'),
      paymentTermsDays: Yup.number()
        .min(0, 'Payment terms cannot be negative')
        .required('Payment terms days is required'),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        if (isEditMode && currentSupplierId) {
          const patchedData: UpdateSupplierRequest = {};
          let hasChanges = false;

          (Object.keys(values) as Array<keyof SupplierPayload>).forEach(key => {
            if (values[key] !== formik.initialValues[key]) {
              (patchedData as any)[key] = values[key];
              hasChanges = true;
            }
          });

          if (!hasChanges) return setModalOpen(false);
          await updateSupplier({ id: currentSupplierId, data: patchedData });
        } else {
          await createSupplier(values);
        }
        setModalOpen(false);
      } catch (error: any) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    }
  });

  const handleEdit = (supplier: Supplier) => {
    setIsEditMode(true);
    setCurrentSupplierId(supplier.supplierId);
    formik.resetForm({
      values: {
        supplierCode: supplier.supplierCode || '',
        supplierName: supplier.supplierName || '',
        contactName: supplier.contactName || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        taxNumber: supplier.taxNumber || '',
        paymentTermsDays: supplier.paymentTermsDays ?? 30,
      }
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!currentSupplierId || !selectedSupplier) return;
    try {
      setGlobalError(null);
      await updateSupplier({ 
        id: currentSupplierId, 
        data: { isActive: !selectedSupplier.isActive } 
      });
      setStatusToggleModal(false);
    } catch (error: any) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  const confirmDelete = async () => {
    if (!currentSupplierId || deleteConfirmation !== 'DELETE') return;
    try {
      await deleteSupplier(currentSupplierId);
      setDeleteModal(false);
      setDeleteConfirmation('');
    } catch (error: any) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {globalError && <Alert color="danger" dismissible onClick={() => setGlobalError(null)}>{globalError}</Alert>}

          {/* KPI Summary Cards */}
          <Row className="mb-3">
            <Col md={3}>
              <Card className="card-animate border-0 shadow-sm">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-3">
                        <i className="ri-truck-line"></i>
                      </span>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">Total Suppliers</p>
                      <h4 className="fs-18 fw-semibold mb-0">{metrics.total}</h4>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-animate border-0 shadow-sm">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-success-subtle text-success rounded-circle fs-3">
                        <i className="ri-checkbox-circle-line"></i>
                      </span>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">Active Vendors</p>
                      <h4 className="fs-18 fw-semibold mb-0">{metrics.active}</h4>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-animate border-0 shadow-sm">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-info-subtle text-info rounded-circle fs-3">
                        <i className="ri-calendar-event-line"></i>
                      </span>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">Avg Payment Terms</p>
                      <h4 className="fs-18 fw-semibold mb-0">{metrics.avgTerms} Days</h4>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-animate border-0 shadow-sm">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-3">
                        <i className="ri-close-circle-line"></i>
                      </span>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">Inactive Vendors</p>
                      <h4 className="fs-18 fw-semibold mb-0">{metrics.inactive}</h4>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Controls: Search, Filters, and Add Button */}
          <Card className="border-0 shadow-sm mb-3">
            <CardBody className="p-3">
              <Row className="g-3 align-items-center justify-content-between">
                <Col md={4}>
                  <div className="search-box">
                    <Input 
                      type="text" 
                      placeholder="Search code, name, contact, tax ID..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPageIndex(0); }}
                    />
                  </div>
                </Col>
                <Col md={5} className="d-flex gap-2 justify-content-md-end">
                  <div className="btn-group" role="group">
                    <Button 
                      color={statusFilter === 'ALL' ? 'primary' : 'light'} 
                      size="sm"
                      onClick={() => setStatusFilter('ALL')}
                    >
                      All
                    </Button>
                    <Button 
                      color={statusFilter === 'ACTIVE' ? 'primary' : 'light'} 
                      size="sm"
                      onClick={() => setStatusFilter('ACTIVE')}
                    >
                      Active
                    </Button>
                    <Button 
                      color={statusFilter === 'INACTIVE' ? 'primary' : 'light'} 
                      size="sm"
                      onClick={() => setStatusFilter('INACTIVE')}
                    >
                      Inactive
                    </Button>
                  </div>
                  <Button color="success" onClick={() => { 
                    setIsEditMode(false); 
                    setCurrentSupplierId(null);
                    formik.resetForm(); 
                    setModalOpen(true); 
                  }}>
                    <i className="ri-add-line align-middle me-1"></i> Add Supplier
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Supplier Data Table */}
          <Card className="border-0 shadow-sm">
            <CardBody className="p-0">
              <Table hover responsive className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Supplier Entity</th>
                    <th>Contact Representative</th>
                    <th>Tax Number</th>
                    <th>Payment Terms</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <Spinner color="primary" />
                        <p className="mb-0 text-muted mt-2">Loading supplier directory...</p>
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No supplier records matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((supplier: Supplier) => (
                      <tr key={supplier.supplierId}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <div className="avatar-xs">
                                <div className="avatar-title rounded-circle bg-info-subtle text-info fw-bold text-uppercase">
                                  {supplier.supplierName?.charAt(0) || 'S'}
                                </div>
                              </div>
                            </div>
                            <div className="ms-3">
                              <h5 className="fs-14 mb-0">
                                <Link to={`/suppliers/view/${supplier.supplierId}`} className="text-body fw-bold">
                                  {supplier.supplierName}
                                </Link>
                              </h5>
                              <p className="text-muted mb-0 fs-11 text-uppercase">Code: {supplier.supplierCode}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="fs-13 fw-medium">{supplier.contactName}</div>
                          <div className="text-muted fs-11">{supplier.phone} | {supplier.email}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark font-monospace">{supplier.taxNumber}</span>
                        </td>
                        <td>
                          <span className="fw-medium text-dark">
                            {supplier.paymentTermsDays} Net Days
                          </span>
                        </td>
                        <td>
                          <Badge color={supplier.isActive ? 'success' : 'danger'} pill>
                            {supplier.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            <Button size="sm" outline color="info" onClick={() => handleEdit(supplier)}>
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              outline 
                              color={supplier.isActive ? "warning" : "success"} 
                              onClick={() => { 
                                setCurrentSupplierId(supplier.supplierId); 
                                setStatusToggleModal(true); 
                              }}
                            >
                              {supplier.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button size="sm" outline color="danger" onClick={() => { 
                              setCurrentSupplierId(supplier.supplierId); 
                              setDeleteConfirmation(''); 
                              setDeleteModal(true); 
                            }}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          <TablePagination table={tableInstance} />

          {/* Add / Edit Supplier Modal */}
          <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
            <ModalHeader toggle={() => setModalOpen(false)}>
              {isEditMode ? 'Update Supplier Details' : 'Register New Supplier'}
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
              <ModalBody>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Supplier Code</Label>
                      <Input 
                        placeholder="e.g. SUP-001" 
                        {...formik.getFieldProps('supplierCode')} 
                        invalid={!!(formik.touched.supplierCode && formik.errors.supplierCode)} 
                      />
                      <FormFeedback>{formik.errors.supplierCode}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Supplier / Company Name</Label>
                      <Input 
                        placeholder="e.g. Global Supplies Ltd" 
                        {...formik.getFieldProps('supplierName')} 
                        invalid={!!(formik.touched.supplierName && formik.errors.supplierName)} 
                      />
                      <FormFeedback>{formik.errors.supplierName}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Contact Person</Label>
                      <Input 
                        placeholder="e.g. Jane Wanjiku" 
                        {...formik.getFieldProps('contactName')} 
                        invalid={!!(formik.touched.contactName && formik.errors.contactName)} 
                      />
                      <FormFeedback>{formik.errors.contactName}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Phone Number</Label>
                      <Input 
                        placeholder="+254700000001" 
                        {...formik.getFieldProps('phone')} 
                        invalid={!!(formik.touched.phone && formik.errors.phone)} 
                      />
                      <FormFeedback>{formik.errors.phone}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Email Address</Label>
                      <Input 
                        type="email" 
                        placeholder="sales@supplier.com" 
                        {...formik.getFieldProps('email')} 
                        invalid={!!(formik.touched.email && formik.errors.email)} 
                      />
                      <FormFeedback>{formik.errors.email}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Tax PIN / Number</Label>
                      <Input 
                        placeholder="P051234567A" 
                        {...formik.getFieldProps('taxNumber')} 
                        invalid={!!(formik.touched.taxNumber && formik.errors.taxNumber)} 
                      />
                      <FormFeedback>{formik.errors.taxNumber}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Payment Terms (Days)</Label>
                      <Input 
                        type="number" 
                        placeholder="30" 
                        {...formik.getFieldProps('paymentTermsDays')} 
                        invalid={!!(formik.touched.paymentTermsDays && formik.errors.paymentTermsDays)} 
                      />
                      <FormFeedback>{formik.errors.paymentTermsDays}</FormFeedback>
                    </FormGroup>
                  </Col>
                </Row>
              </ModalBody>
              <ModalFooter>
                <Button color="light" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" color="primary" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? <Spinner size="sm" /> : 'Save Supplier'}
                </Button>
              </ModalFooter>
            </Form>
          </Modal>

          {/* Delete Modal */}
          <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
            <ModalBody className="p-4 text-center">
              <i className="ri-delete-bin-line display-4 text-danger mb-3 d-inline-block"></i>
              <h4>Delete Supplier Record?</h4>
              <p className="text-muted fs-13">
                This action cannot be undone. To confirm, type <strong className="text-dark">DELETE</strong> below.
              </p>
              <Input 
                type="text" 
                value={deleteConfirmation} 
                onChange={(e) => setDeleteConfirmation(e.target.value)} 
                className="text-center mb-3" 
                placeholder="Type DELETE"
              />
              <div className="hstack gap-2 justify-content-center">
                <Button color="light" onClick={() => setDeleteModal(false)}>Cancel</Button>
                <Button 
                  color="danger" 
                  onClick={confirmDelete} 
                  disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                >
                  {isDeleting ? <Spinner size="sm" /> : 'Confirm Delete'}
                </Button>
              </div>
            </ModalBody>
          </Modal>

          {/* Toggle Active Status Modal */}
          <Modal isOpen={statusToggleModal} toggle={() => setStatusToggleModal(false)} centered>
            <ModalBody className="p-4 text-center">
              <i className={`${selectedSupplier?.isActive ? "ri-close-circle-line text-warning" : "ri-checkbox-circle-line text-success"} display-4 mb-3 d-inline-block`}></i>
              <h4>{selectedSupplier?.isActive ? 'Deactivate' : 'Activate'} Supplier Account?</h4>
              <p className="text-muted fs-13">
                {selectedSupplier?.isActive 
                  ? `Deactivating ${selectedSupplier?.supplierName} will restrict creating new Purchase Orders.`
                  : `Activating ${selectedSupplier?.supplierName} will enable procurement and LPO operations.`
                }
              </p>
              <div className="hstack gap-2 justify-content-center mt-4">
                <Button color="light" onClick={() => setStatusToggleModal(false)}>Cancel</Button>
                <Button 
                  color={selectedSupplier?.isActive ? "warning" : "success"} 
                  onClick={handleToggleStatus} 
                  disabled={isUpdating}
                >
                  {isUpdating ? <Spinner size="sm" /> : 'Confirm Status Change'}
                </Button>
              </div>
            </ModalBody>
          </Modal>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SupplierManagement;