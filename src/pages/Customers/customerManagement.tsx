import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, FormFeedback, Spinner, Alert, Card, CardBody, Row, Col, Badge, Container 
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useCustomers, useCustomerMutation } from '../../Components/Hooks/useCustomers';
import { Customer, CustomerPayload, UpdateUserRequest } from '../../types/customer';
import { handleBackendErrors } from '../../helpers/form_utils';
import TablePagination from "../TablePagination"; 

const CustomerManagement: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0); 
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const { data, isLoading } = useCustomers(1, 100); 
  const { createCustomer, updateCustomer, deleteCustomer, isCreating, isUpdating, isDeleting } = useCustomerMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [statusToggleModal, setStatusToggleModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const allCustomers: Customer[] = useMemo(() => data?.users || [], [data]);
  const selectedCustomer = allCustomers.find(c => c.id === currentCustomerId);

  // Search and Filter Logic
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter((customer) => {
      const matchesSearch = 
        customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.taxNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'ACTIVE' ? customer.is_active : !customer.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [allCustomers, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const total = allCustomers.length;
    const active = allCustomers.filter(c => c.is_active).length;
    const inactive = total - active;
    const totalCreditLimit = allCustomers.reduce((acc, c) => acc + (Number(c.creditLimit) || 0), 0);
    return { total, active, inactive, totalCreditLimit };
  }, [allCustomers]);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

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
    getPrePaginationRowModel: () => ({ rows: filteredCustomers }),
  };

  const formik = useFormik<CustomerPayload>({
    initialValues: { 
      customerCode: '',
      customerName: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      creditLimit: 0,
    },
    validationSchema: Yup.object({
      customerCode: Yup.string().required('Customer code is required'),
      customerName: Yup.string().required('Customer name is required'),
      contactName: Yup.string().required('Contact person is required'),
      phone: Yup.string().required('Phone number is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      address: Yup.string().required('Address is required'),
      taxNumber: Yup.string().required('Tax number is required'),
      creditLimit: Yup.number().min(0, 'Credit limit must be positive').required('Required'),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        if (isEditMode && currentCustomerId) {
          const patchedData: UpdateUserRequest = {};
          let hasChanges = false;

          (Object.keys(values) as Array<keyof CustomerPayload>).forEach(key => {
            if (values[key] !== formik.initialValues[key]) {
              (patchedData as any)[key] = values[key];
              hasChanges = true;
            }
          });

          if (!hasChanges) return setModalOpen(false);
          await updateCustomer({ id: currentCustomerId, data: patchedData });
        } else {
          await createCustomer(values);
        }
        setModalOpen(false);
      } catch (error: any) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    }
  });

  const handleEdit = (customer: Customer) => {
    setIsEditMode(true);
    setCurrentCustomerId(customer.id);
    formik.resetForm({
      values: {
        customerCode: customer.customerCode || '',
        customerName: customer.customerName || '',
        contactName: customer.contactName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        taxNumber: customer.taxNumber || '',
        creditLimit: customer.creditLimit || 0,
      }
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!currentCustomerId || !selectedCustomer) return;
    try {
      setGlobalError(null);
      await updateCustomer({ 
        id: currentCustomerId, 
        data: { is_active: !selectedCustomer.is_active } as UpdateUserRequest 
      });
      setStatusToggleModal(false);
    } catch (error: any) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  const confirmDelete = async () => {
    if (!currentCustomerId || deleteConfirmation !== 'DELETE') return;
    try {
      await deleteCustomer(currentCustomerId);
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

          {/* Retail Summary KPI Cards */}
          <Row className="mb-3">
            <Col md={3}>
              <Card className="card-animate border-0 shadow-sm">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-3">
                        <i className="ri-user-line"></i>
                      </span>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">Total Customers</p>
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
                        <i className="ri-user-check-line"></i>
                      </span>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">Active Accounts</p>
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
                      <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-3">
                        <i className="ri-money-dollar-circle-line"></i>
                      </span>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">Total Credit Limit</p>
                      <h4 className="fs-18 fw-semibold mb-0">KSH {metrics.totalCreditLimit.toLocaleString()}</h4>
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
                        <i className="ri-user-unfollow-line"></i>
                      </span>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">Inactive Accounts</p>
                      <h4 className="fs-18 fw-semibold mb-0">{metrics.inactive}</h4>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Control Bar: Title, Search, Filters, and Add Button */}
          <Card className="border-0 shadow-sm mb-3">
            <CardBody className="p-3">
              <Row className="g-3 align-items-center justify-content-between">
                <Col md={4}>
                  <div className="search-box">
                    <Input 
                      type="text" 
                      placeholder="Search code, name, phone, tax ID..." 
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
                    setCurrentCustomerId(null);
                    formik.resetForm(); 
                    setModalOpen(true); 
                  }}>
                    <i className="ri-add-line align-middle me-1"></i> Add Customer
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Main Customer Data Table */}
          <Card className="border-0 shadow-sm">
            <CardBody className="p-0">
              <Table hover responsive className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Customer Entity</th>
                    <th>Contact Info</th>
                    <th>Tax / ID</th>
                    <th>Credit Limit</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <Spinner color="primary" />
                        <p className="mb-0 text-muted mt-2">Loading customer directory...</p>
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No customer records matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((customer: Customer) => (
                      <tr key={customer.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <div className="avatar-xs">
                                <div className="avatar-title rounded-circle bg-primary-subtle text-primary fw-bold text-uppercase">
                                  {customer.customerName?.charAt(0) || 'C'}
                                </div>
                              </div>
                            </div>
                            <div className="ms-3">
                              <h5 className="fs-14 mb-0">
                                <Link to={`/customers/view/${customer.id}`} className="text-body fw-bold">
                                  {customer.customerName}
                                </Link>
                              </h5>
                              <p className="text-muted mb-0 fs-11 text-uppercase">Code: {customer.customerCode}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="fs-13 fw-medium">{customer.contactName}</div>
                          <div className="text-muted fs-11">{customer.phone} | {customer.email}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark font-monospace">{customer.taxNumber}</span>
                        </td>
                        <td>
                          <span className="fw-semibold text-dark">
                            ${Number(customer.creditLimit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>
                          <Badge color={customer.is_active ? 'success' : 'danger'} pill>
                            {customer.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            <Button size="sm" outline color="info" onClick={() => handleEdit(customer)}>
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              outline 
                              color={customer.is_active ? "warning" : "success"} 
                              onClick={() => { 
                                setCurrentCustomerId(customer.id); 
                                setStatusToggleModal(true); 
                              }}
                            >
                              {customer.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button size="sm" outline color="danger" onClick={() => { 
                              setCurrentCustomerId(customer.id); 
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

          <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
            <ModalHeader toggle={() => setModalOpen(false)}>
              {isEditMode ? 'Update Customer Details' : 'Register New Retail Customer'}
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
              <ModalBody>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Customer Code</Label>
                      <Input 
                        placeholder="e.g. CUST-001" 
                        {...formik.getFieldProps('customerCode')} 
                        invalid={!!(formik.touched.customerCode && formik.errors.customerCode)} 
                      />
                      <FormFeedback>{formik.errors.customerCode}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Business / Customer Name</Label>
                      <Input 
                        placeholder="e.g. Acme Retailers" 
                        {...formik.getFieldProps('customerName')} 
                        invalid={!!(formik.touched.customerName && formik.errors.customerName)} 
                      />
                      <FormFeedback>{formik.errors.customerName}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Contact Person</Label>
                      <Input 
                        placeholder="e.g. John Doe" 
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
                        placeholder="+254 712 345 678" 
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
                        placeholder="customer@store.com" 
                        {...formik.getFieldProps('email')} 
                        invalid={!!(formik.touched.email && formik.errors.email)} 
                      />
                      <FormFeedback>{formik.errors.email}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Tax Identification Number</Label>
                      <Input 
                        placeholder="TAX-990011" 
                        {...formik.getFieldProps('taxNumber')} 
                        invalid={!!(formik.touched.taxNumber && formik.errors.taxNumber)} 
                      />
                      <FormFeedback>{formik.errors.taxNumber}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Credit Limit (KSH)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="5000" 
                        {...formik.getFieldProps('creditLimit')} 
                        invalid={!!(formik.touched.creditLimit && formik.errors.creditLimit)} 
                      />
                      <FormFeedback>{formik.errors.creditLimit}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Physical Address</Label>
                      <Input 
                        type="text" 
                        placeholder="Street, City, Building" 
                        {...formik.getFieldProps('address')} 
                        invalid={!!(formik.touched.address && formik.errors.address)} 
                      />
                      <FormFeedback>{formik.errors.address}</FormFeedback>
                    </FormGroup>
                  </Col>
                </Row>
              </ModalBody>
              <ModalFooter>
                <Button color="light" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" color="primary" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? <Spinner size="sm" /> : 'Save Customer'}
                </Button>
              </ModalFooter>
            </Form>
          </Modal>

          <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
            <ModalBody className="p-4 text-center">
              <i className="ri-delete-bin-line display-4 text-danger mb-3 d-inline-block"></i>
              <h4>Delete Customer Record?</h4>
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

          <Modal isOpen={statusToggleModal} toggle={() => setStatusToggleModal(false)} centered>
            <ModalBody className="p-4 text-center">
              <i className={`${selectedCustomer?.is_active ? "ri-user-unfollow-line text-warning" : "ri-user-follow-line text-success"} display-4 mb-3 d-inline-block`}></i>
              <h4>{selectedCustomer?.is_active ? 'Deactivate' : 'Activate'} Customer Account?</h4>
              <p className="text-muted fs-13">
                {selectedCustomer?.is_active 
                  ? `Deactivating ${selectedCustomer?.customerName} will block new credit transactions.`
                  : `Activating ${selectedCustomer?.customerName} will allow retail POS checkout.`
                }
              </p>
              <div className="hstack gap-2 justify-content-center mt-4">
                <Button color="light" onClick={() => setStatusToggleModal(false)}>Cancel</Button>
                <Button 
                  color={selectedCustomer?.is_active ? "warning" : "success"} 
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

export default CustomerManagement;