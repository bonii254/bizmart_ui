import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, FormFeedback, Spinner, Alert, 
  Row, Col, Card, CardHeader, CardBody, Container
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { useBanks, useBankMutation } from '../../Components/Hooks/useBanks';
import { Bank, BankPayload, UpdateBankRequest } from '../../types/bank';
import { handleBackendErrors } from '../../helpers/form_utils';
import TablePagination from "../TablePagination"; 

const BankManagement: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0); 
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // useBanks now directly yields Bank[] via queryFn unwrap
  const { data: banksList = [], isLoading } = useBanks(); 
  const { 
    createBank, 
    updateBank, 
    deleteBank, 
    isCreating, 
    isUpdating, 
    isDeleting 
  } = useBankMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBankId, setCurrentBankId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const filteredBanks = useMemo(() => {
    if (!searchTerm) return banksList;
    return banksList.filter(item => 
      item.bankName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bankCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [banksList, searchTerm]);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredBanks.slice(start, start + pageSize);
  }, [filteredBanks, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredBanks.length / pageSize);

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
    getPrePaginationRowModel: () => ({ rows: filteredBanks }),
  };

  const formik = useFormik<BankPayload>({
    initialValues: { 
      bankCode: '',
      bankName: '',
      branchName: '',
      accountName: '',
      accountNumber: '',
      currencyCode: 'KES',
      swiftCode: '',
      isActive: true
    },
    validationSchema: Yup.object({
      bankCode: Yup.string().required('Bank Code is required (e.g., KCB)'),
      bankName: Yup.string().required('Bank Name is required'),
      branchName: Yup.string().required('Branch Name is required'),
      accountName: Yup.string().required('Account Name is required'),
      accountNumber: Yup.string().required('Account Number is required'),
      currencyCode: Yup.string().required('Currency Code is required'),
      swiftCode: Yup.string().required('SWIFT Code is required'),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        if (isEditMode && currentBankId) {
          const patchedData: UpdateBankRequest = {};
          (Object.keys(values) as Array<keyof BankPayload>).forEach(key => {
            if (values[key] !== formik.initialValues[key]) {
              (patchedData as any)[key] = values[key];
            }
          });
          await updateBank({ id: currentBankId, data: patchedData });
        } else {
          await createBank(values);
        }
        setModalOpen(false);
      } catch (error: unknown) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    }
  });

  const handleEdit = (item: Bank) => {
    setIsEditMode(true);
    setCurrentBankId(item.bankId);
    formik.resetForm({ values: { 
      bankCode: item.bankCode,
      bankName: item.bankName,
      branchName: item.branchName,
      accountName: item.accountName,
      accountNumber: item.accountNumber,
      currencyCode: item.currencyCode,
      swiftCode: item.swiftCode,
      isActive: item.isActive
    }});
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentBankId || deleteConfirmation !== 'DELETE') return;
    try {
      await deleteBank(currentBankId);
      setDeleteModal(false);
      setDeleteConfirmation('');
      setCurrentBankId(null);
    } catch (error: unknown) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Card>
            <CardHeader className="border-0 pb-0">
              <Row className="g-4 align-items-center mb-3">
                <Col sm={3}>
                  <div className="search-box">
                    <Input 
                      type="text" 
                      className="form-control" 
                      placeholder="Search bank name or account..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPageIndex(0); }}
                    />
                    <i className="ri-search-line search-icon"></i>
                  </div>
                </Col>
                <Col sm="auto" className="ms-auto">
                  <Button 
                    color="primary" 
                    onClick={() => { 
                      setIsEditMode(false); 
                      setCurrentBankId(null);
                      setGlobalError(null);
                      formik.resetForm(); 
                      setModalOpen(true); 
                    }}
                  >
                    <i className="ri-add-line align-bottom me-1"></i> Add Corporate Bank
                  </Button>
                </Col>
              </Row>
              {globalError && <Alert color="danger">{globalError}</Alert>}
            </CardHeader>

            <CardBody>
              <Table hover responsive className="align-middle custom-datatable table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Bank Details</th>
                    <th>Account Info</th>
                    <th>Branch / SWIFT</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center p-5"><Spinner color="primary" /></td></tr>
                  ) : paginatedRows.length > 0 ? (
                    paginatedRows.map((item: Bank) => (
                      <tr key={item.bankId}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-xs flex-shrink-0">
                              <div className="avatar-title rounded-circle bg-primary-subtle text-primary fw-bold">
                                <i className="ri-bank-line"></i>
                              </div>
                            </div>
                            <div className="ms-2">
                              <h5 className="fs-14 mb-0 fw-bold">{item.bankName}</h5>
                              <p className="text-muted mb-0 fs-12">Code: {item.bankCode}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <h5 className="fs-13 mb-1">{item.accountName}</h5>
                          <p className="text-muted mb-0 fs-12 font-monospace">
                            {item.accountNumber} <span className="badge bg-light text-dark ms-1">{item.currencyCode}</span>
                          </p>
                        </td>
                        <td>
                          <h5 className="fs-13 mb-1">{item.branchName}</h5>
                          <p className="text-muted mb-0 fs-12">SWIFT: {item.swiftCode}</p>
                        </td>
                        <td>
                          <span className={`badge ${item.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {item.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            <Button size="sm" color="soft-info" onClick={() => handleEdit(item)}>
                              <i className="ri-edit-box-line"></i>
                            </Button>
                            <Button size="sm" color="soft-danger" onClick={() => { 
                              setCurrentBankId(item.bankId); setDeleteConfirmation(''); setDeleteModal(true); 
                            }}>
                              <i className="ri-delete-bin-line"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="text-center p-4">No corporate banking records found.</td></tr>
                  )}
                </tbody>
              </Table>
              <div className="mt-3">
                <TablePagination table={tableInstance} />
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>

      {/* Form Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="lg">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
          {isEditMode ? 'Update Bank Account Details' : 'Register Corporate Bank Account'}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-4">
            <Row>
              <Col md={6} className="mb-3">
                <FormGroup>
                  <Label className="form-label">Bank Name <span className="text-danger">*</span></Label>
                  <Input 
                    placeholder="e.g. KCB Bank"
                    {...formik.getFieldProps('bankName')} 
                    invalid={!!(formik.touched.bankName && formik.errors.bankName)} 
                  />
                  <FormFeedback>{formik.errors.bankName}</FormFeedback>
                </FormGroup>
              </Col>
              
              <Col md={6} className="mb-3">
                <FormGroup>
                  <Label className="form-label">Bank Code <span className="text-danger">*</span></Label>
                  <Input 
                    placeholder="e.g. KCB"
                    disabled={isEditMode}
                    {...formik.getFieldProps('bankCode')} 
                    invalid={!!(formik.touched.bankCode && formik.errors.bankCode)} 
                  />
                  <FormFeedback>{formik.errors.bankCode}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6} className="mb-3">
                <FormGroup>
                  <Label className="form-label">Branch Name <span className="text-danger">*</span></Label>
                  <Input 
                    placeholder="e.g. Westlands"
                    {...formik.getFieldProps('branchName')} 
                    invalid={!!(formik.touched.branchName && formik.errors.branchName)} 
                  />
                  <FormFeedback>{formik.errors.branchName}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6} className="mb-3">
                <FormGroup>
                  <Label className="form-label">SWIFT Code <span className="text-danger">*</span></Label>
                  <Input 
                    placeholder="e.g. KCBLKENX"
                    {...formik.getFieldProps('swiftCode')} 
                    invalid={!!(formik.touched.swiftCode && formik.errors.swiftCode)} 
                  />
                  <FormFeedback>{formik.errors.swiftCode}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={12}><hr className="mt-2 mb-4" /></Col>

              <Col md={6} className="mb-3">
                <FormGroup>
                  <Label className="form-label">Account Name <span className="text-danger">*</span></Label>
                  <Input 
                    placeholder="e.g. Main Till"
                    {...formik.getFieldProps('accountName')} 
                    invalid={!!(formik.touched.accountName && formik.errors.accountName)} 
                  />
                  <FormFeedback>{formik.errors.accountName}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} className="mb-3">
                <FormGroup>
                  <Label className="form-label">Account Number <span className="text-danger">*</span></Label>
                  <Input 
                    placeholder="e.g. 1100000000"
                    {...formik.getFieldProps('accountNumber')} 
                    invalid={!!(formik.touched.accountNumber && formik.errors.accountNumber)} 
                  />
                  <FormFeedback>{formik.errors.accountNumber}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={2} className="mb-3">
                <FormGroup>
                  <Label className="form-label">Currency <span className="text-danger">*</span></Label>
                  <Input 
                    type="select"
                    {...formik.getFieldProps('currencyCode')} 
                    invalid={!!(formik.touched.currencyCode && formik.errors.currencyCode)}
                  >
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </Input>
                  <FormFeedback>{formik.errors.currencyCode}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            {isEditMode && (
              <FormGroup check className="mt-2">
                <Label check>
                  <Input 
                    type="checkbox" 
                    checked={formik.values.isActive}
                    onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                  />{' '}
                  Active Corporate Account (Operational Status)
                </Label>
              </FormGroup>
            )}
          </ModalBody>
          <ModalFooter className="bg-light p-3 border-top">
            <Button color="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" color="primary" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? <Spinner size="sm" /> : (isEditMode ? 'Update Bank Record' : 'Save Bank Record')}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
        <ModalBody className="p-5 text-center">
          <i className="ri-error-warning-line display-4 text-warning"></i>
          <div className="mt-4">
            <h4 className="mb-2">Remove Corporate Bank Account?</h4>
            <p className="text-muted fs-14">Type <strong>DELETE</strong> to confirm master record eradication.</p>
            <Input 
              type="text" 
              value={deleteConfirmation} 
              onChange={(e) => setDeleteConfirmation(e.target.value)} 
              className="text-center mb-4" 
              placeholder="Enter DELETE"
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

export default BankManagement;