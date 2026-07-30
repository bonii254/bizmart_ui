import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, FormFeedback, Spinner, Alert
} from 'reactstrap';
import { useAssignments } from '../../../Components/Hooks/useAssignments';
import { useCoolers } from '../../../Components/Hooks/useCoolers';
import { useUsers } from '../../../Components/Hooks/useUsers';
import { CreateAssignmentPayload } from '../../../types/assignment';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { handleBackendErrors } from '../../../helpers/form_utils';
import TablePagination from "../../TablePagination";

const AssignmentManagement = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [unassigningUserId, setUnassigningUserId] = useState<string | null>(null);

  const { assignments, isLoading, assignAttendant, isAssigning, unassignAttendant } = useAssignments();
  const { data: coolersData } = useCoolers();
  const { data: usersData } = useUsers(1, 100);

  const formik = useFormik<CreateAssignmentPayload>({
    initialValues: {
      user_id: '',
      warehouse_id: '',
    },
    validationSchema: Yup.object({
      user_id: Yup.string().required('Please select an attendant'),
      warehouse_id: Yup.string().required('Please select a cooler'),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        await assignAttendant(values);
        setModalOpen(false);
        formik.resetForm();
      } catch (error: any) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    }
  });

  const handleUnassign = async (userId: string) => {
    try {
      setUnassigningUserId(userId);
      await unassignAttendant(userId);
    } catch (error: any) {
      console.error('Error unassigning attendant:', error);
    } finally {
      setUnassigningUserId(null);
    }
  };

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return assignments.slice(start, start + pageSize);
  }, [assignments, pageIndex, pageSize]);

  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => { 
      setPageSize(size); 
      setPageIndex(0); 
    },
    previousPage: () => setPageIndex(prev => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex(prev => Math.min(
      prev + 1, Math.ceil(assignments.length / pageSize) - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < Math.ceil(assignments.length / pageSize) - 1,
    getPageCount: () => Math.ceil(assignments.length / pageSize) || 1,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: assignments }),
  };

  return (
    <React.Fragment>
      {globalError && <Alert color="danger" fade={false}>{globalError}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0">Attendant Assignments</h5>
          <p className="text-muted mb-0 fs-12">Deploy staff to specific cooling Centers</p>
        </div>
        <Button 
          color="primary" 
          onClick={() => {
            formik.resetForm();
            setGlobalError(null);
            setModalOpen(true);
            
            }}>
          <i className="ri-user-shared-line align-bottom me-1"></i> New Assignment
        </Button>
      </div>

      <Table hover responsive className="align-middle custom-datatable">
        <thead className="table-light">
          <tr>
            <th>Attendant</th>
            <th>Assigned Cooler</th>
            <th>Assignment Date</th>
            <th>Status</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="text-center p-5">
                <Spinner color="primary" size="sm" className="me-2" /> Loading assignments...
              </td>
            </tr>
          ) : paginatedRows.length > 0 ? (
            paginatedRows.map((item: any) => (
              <tr key={item.id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-2">
                        <i className="ri-user-follow-line text-primary fs-16"></i>
                    </div>
                    <div className="flex-grow-1">
                        <Link to={`/settings/users`} className="text-body fw-bold">{item.user_name || "Unknown User"}</Link>
                        <p className="text-muted mb-0 fs-11">PN: {item.user_payroll_number || "N/A"}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="text-info fw-bold">{item.warehouse_name || "Unassigned"}</span>
                </td>
                <td>{new Date(item.start_date).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${item.is_active ? 'bg-success-subtle text-success' : 'bg-light text-muted'}`}>
                    {item.is_active ? 'Active Now' : 'Completed'}
                  </span>
                </td>
                <td className="text-end">
                  <div className="d-flex gap-2 justify-content-center">
                    <Button 
                      size="sm" 
                      color="soft-primary" 
                      onClick={() => {
                        formik.setFieldValue('user_id', item.user_id);
                        setModalOpen(true);
                      }}
                    >
                      Reassign
                    </Button>
                    {item.is_active && (
                      <Button 
                        size="sm" 
                        color="soft-danger" 
                        onClick={() => handleUnassign(item.user_id)}
                        disabled={unassigningUserId === item.user_id}
                      >
                        Unassign
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center p-4 text-muted">No assignments found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered>
        <ModalHeader toggle={() => setModalOpen(false)} className="bg-light p-3">
          Deploy Attendant
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Alert color="info" className="fs-12 border-0 shadow-none">
              <i className="ri-information-line me-2"></i>
              Assigning a user to a new cooler will automatically close their current active assignment.
            </Alert>
            
            <FormGroup className="mb-3">
              <Label for="user_id">Select Attendant</Label>
              <Input 
                id="user_id"
                type="select"
                {...formik.getFieldProps('user_id')}
                invalid={!!(formik.touched.user_id && formik.errors.user_id)}
              >
                <option value="">Choose Staff...</option>
                {usersData?.users?.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.username} (PN: {u.payroll_number || 'N/A'})
                  </option>
                ))}
              </Input>
              <FormFeedback>{formik.errors.user_id}</FormFeedback>
            </FormGroup>

            <FormGroup className="mb-0">
              <Label for="cooler_id">Assign to Cooler Asset</Label>
              <Input 
                id="cooler_id"
                type="select"
                {...formik.getFieldProps('warehouse_id')}
                invalid={!!(formik.touched.warehouse_id && formik.errors.warehouse_id)}
              >
                <option value="">Choose Asset...</option>
                {coolersData?.warehouses?.filter(c => c.is_active).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.route || 'No Route'}</option>
                ))}
              </Input>
              <FormFeedback>{formik.errors.warehouse_id}</FormFeedback>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button type="button" color="link" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" color="primary" disabled={isAssigning}>
              {isAssigning ? <Spinner size="sm" /> : "Confirm Deployment"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

export default AssignmentManagement;