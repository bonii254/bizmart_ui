import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, FormFeedback, Spinner, Alert, InputGroup  
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useUsers, useUserMutation } from '../../../Components/Hooks/useUsers';
import { UserRole, UserPayload, UpdateUserRequest } from '../../../types/user';
import { handleBackendErrors } from '../../../helpers/form_utils';
import TablePagination from "../../TablePagination"; 



const UserManagement = () => {
  const [pageIndex, setPageIndex] = useState(0); 
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useUsers(1, 100); 
  const { createUser, updateUser, deleteUser, isCreating, isUpdating, isDeleting } = useUserMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const allUsers = useMemo(() => data?.users || [], [data]);
  const selectedUser = allUsers.find(u => u.id === currentUserId);

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return allUsers.slice(start, start + pageSize);
  }, [allUsers, pageIndex, pageSize]);

  const totalPages = Math.ceil(allUsers.length / pageSize);

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
    getPrePaginationRowModel: () => ({ rows: allUsers }),
  };

  const formik = useFormik<UserPayload>({
    initialValues: { 
      username: '',
      email: '', 
      payroll_number: '', 
      password: '', 
      confirm_password:'',
      role: UserRole.ATTENDANT,                                                                                                                                                                     },
    validationSchema: Yup.object({
      username: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email').required('Required'),
      payroll_number: Yup.string().required('Required'),
      password: isEditMode ? Yup.string() : Yup.string().required('Required'),
      confirm_password: isEditMode 
        ? Yup.string() 
        : Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Required'),
      role: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        if (isEditMode && currentUserId) {
          const patchedData: UpdateUserRequest = {};
          let hasChanges = false;
          (Object.keys(values) as Array<keyof UserPayload>).forEach(key => {
            if (values[key] !== formik.initialValues[key]) {
              (patchedData as any)[key] = values[key];
              hasChanges = true;
            }
          });
          if (!hasChanges) return setModalOpen(false);
          await updateUser({ id: currentUserId, data: patchedData });
        } else {
          await createUser(values);
        }
        setModalOpen(false);
      } catch (error: any) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    }
  });

  const handleEdit = (user: any) => {
    setIsEditMode(true);
    setCurrentUserId(user.id);
    formik.resetForm({ values: { 
      username: user.username, email: user.email, 
      payroll_number: user.payroll_number || '', role: user.role, password: '' 
    }});
    setModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!currentUserId || !selectedUser) return;
    try {
      setGlobalError(null);
      await updateUser({ 
        id: currentUserId, 
        data: { is_active: selectedUser.is_active ? 0 : 1 } as UpdateUserRequest 
      });
      setDeactivateModal(false);
    } catch (error: any) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  const confirmDelete = async () => {
    if (!currentUserId || deleteConfirmation !== 'DELETE') return;
    try {
      await deleteUser(currentUserId);
      setDeleteModal(false);
      setDeleteConfirmation('');
    } catch (error: any) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  return (
    <React.Fragment>
      {globalError && <Alert color="danger">{globalError}</Alert>}
      
      <div className="d-flex justify-content-between mb-3">
        <h5>System Users</h5>
        <Button color="primary" onClick={() => { 
          setIsEditMode(false); setCurrentUserId(null);
          formik.resetForm(); setModalOpen(true); 
        }}>Add User</Button>
      </div>

      <Table hover responsive className="align-middle">
        <thead className="table-light">
          <tr>
            <th>Employee Identity</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} className="text-center"><Spinner /></td></tr>
          ) : (
            paginatedRows.map((user: any) => (
              <tr key={user.id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="avatar-xs">
                        <div className="avatar-title rounded-circle bg-primary-subtle text-primary fw-bold text-uppercase">
                          {user.username?.charAt(0)}
                        </div>
                      </div>
                    </div>
                    <div className="ms-2">
                      <h5 className="fs-14 mb-0">
                        <Link to={`/users/view/${user.id}`} className="text-body fw-bold">{user.username}</Link>
                      </h5>
                      <p className="text-muted mb-0 fs-11 text-uppercase">Payroll: {user.payroll_number || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.role_name}</td>
                <td>
                   <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                     {user.is_active ? 'Active' : 'Inactive'}
                   </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" color="soft-info" onClick={() => handleEdit(user)}>Edit</Button>
                    <Button 
                      size="sm" 
                      color={user.is_active ? "soft-warning" : "soft-success"} 
                      onClick={() => { setCurrentUserId(user.id); setDeactivateModal(true); }}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" color="soft-danger" onClick={() => { 
                      setCurrentUserId(user.id); setDeleteConfirmation(''); setDeleteModal(true); 
                    }}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered>
        <ModalHeader>{isEditMode ? 'Update User' : 'Create User'}</ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label>Full Name</Label>
              <Input {...formik.getFieldProps('username')} invalid={!!formik.errors.username} />
              <FormFeedback>{formik.errors.username}</FormFeedback>
            </FormGroup>
            <FormGroup>
              <Label>Payroll Number</Label>
              <Input type="text" {...formik.getFieldProps('payroll_number')} invalid={!!formik.errors.payroll_number} />
              <FormFeedback>{formik.errors.payroll_number}</FormFeedback>
            </FormGroup>
            <FormGroup>
              <Label>Email</Label>
              <Input {...formik.getFieldProps('email')} invalid={!!formik.errors.email} />
              <FormFeedback>{formik.errors.email}</FormFeedback>
            </FormGroup>
            {!isEditMode && (
              <>
                <FormGroup>
                  <Label>Password</Label>
                  <InputGroup>
                    <Input type={showPassword ? "text" : "password"} {...formik.getFieldProps('password')} invalid={!!(formik.touched.password && formik.errors.password)} />
                    <Button color="light" type="button" onClick={() => setShowPassword(!showPassword)}>
                      <i className={showPassword ? "ri-eye-off-fill" : "ri-eye-fill"}></i>
                    </Button>
                    <FormFeedback>{formik.errors.password}</FormFeedback>
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label>Confirm Password</Label>
                  <InputGroup>
                    <Input type={showConfirmPassword ? "text" : "password"} {...formik.getFieldProps('confirm_password')} invalid={!!(formik.touched.confirm_password && formik.errors.confirm_password)} />
                    <Button color="light" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <i className={showConfirmPassword ? "ri-eye-off-fill" : "ri-eye-fill"}></i>
                    </Button>
                    <FormFeedback>{formik.errors.confirm_password}</FormFeedback>
                  </InputGroup>
                </FormGroup>
              </>
            )}
            <FormGroup>
              <Label>Role</Label>
              <Input type="select" {...formik.getFieldProps('role')}>
                <option value="ATTENDANT">Attendant</option>
                <option value="QAE">QAE</option>
                <option value="ADMIN">Admin</option>
              </Input>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" color="primary" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
        <ModalBody className="p-5 text-center">
          <i className="ri-delete-bin-line display-4 text-danger"></i>
          <h4 className="mt-4">Delete User?</h4>
          <p className="text-muted">To confirm, please type <strong className="text-dark">DELETE</strong> below.</p>
          <Input 
             type="text" value={deleteConfirmation} 
             onChange={(e) => setDeleteConfirmation(e.target.value)} 
             className="text-center mb-3" placeholder="Type DELETE"
          />
          <div className="hstack gap-2 justify-content-center">
            <Button color="light" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button color="danger" onClick={confirmDelete} disabled={isDeleting || deleteConfirmation !== 'DELETE'}>
              {isDeleting ? <Spinner size="sm" /> : 'Confirm Permanent Delete'}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      <Modal isOpen={deactivateModal} toggle={() => setDeactivateModal(false)} centered>
        <ModalBody className="p-5 text-center">
          <i className={`${selectedUser?.is_active ? "ri-user-down-line text-danger" : "ri-user-follow-line text-success"} display-4`}></i>
          <h4 className="mt-4">{selectedUser?.is_active ? 'Deactivate' : 'Activate'} User?</h4>
          <div className="hstack gap-2 justify-content-center mt-4">
            <Button color="light" onClick={() => setDeactivateModal(false)}>Cancel</Button>
            <Button color={selectedUser?.is_active ? "danger" : "success"} onClick={handleToggleStatus} disabled={isUpdating}>
              Confirm
            </Button>
          </div>
        </ModalBody>
      </Modal>

    </React.Fragment>
  );
};

export default UserManagement;