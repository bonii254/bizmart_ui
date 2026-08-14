import React, { useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Table,
  Badge,
  Button,
  Input,
  Form,
  FormGroup,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";
import {
  useCustomers,
  useCustomerMutation,
} from "../../Components/Hooks/useCustomers"; 
import {
  Customer,
  CustomerPayload,
  UpdateUserRequest,
} from "../../types/customer";

const CORPORATE_NAVY = "#042e6d";
const CORPORATE_NAVY_SUBTLE = "rgba(4, 46, 109, 0.08)";

const INITIAL_FORM_STATE: CustomerPayload = {
  customerCode: "",
  customerName: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  taxNumber: "",
  creditLimit: 0,
};

export const CustomerManagement: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const { data: customerListResponse, isLoading, refetch } = useCustomers(page, perPage);
  const {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCustomerMutation();

  // --- Modal & Drawer States ---
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerPayload>(INITIAL_FORM_STATE);
  const [isActiveForm, setIsActiveForm] = useState<boolean>(true);

  // Extract customer array from backend response model
  const customers = useMemo<Customer[]>(
    () => customerListResponse?.customers ?? [],
    [customerListResponse?.customers]
  );
  const totalCount: number = customerListResponse?.total ?? 0;

  // --- Filtered Data Computation ---
  const filteredCustomers = useMemo(() => {
    return customers.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerCode.toLowerCase().includes(q) ||
        item.contactName.toLowerCase().includes(q) ||
        item.taxNumber.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? item.isActive
          : !item.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  // --- Executive KPI Metrics ---
  const metrics = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.isActive).length;
    const inactive = total - active;
    const totalCreditLimit = customers.reduce((acc, c) => acc + (c.creditLimit || 0), 0);

    return { total, active, inactive, totalCreditLimit };
  }, [customers]);

  // --- Event Handlers ---
  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormData(INITIAL_FORM_STATE);
    setIsActiveForm(true);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      contactName: customer.contactName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      taxNumber: customer.taxNumber,
      creditLimit: customer.creditLimit,
    });
    setIsActiveForm(customer.isActive);
    setIsFormModalOpen(true);
  };

  const handleOpenInspect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
  };

  const handleOpenDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        const updatePayload: UpdateUserRequest = {
          ...formData,
          is_active: isActiveForm,
        };
        await updateCustomer({ id: selectedCustomer.id, data: updatePayload });
      } else {
        await createCustomer(formData);
      }
      setIsFormModalOpen(false);
    } catch {
      // Toast notifications are handled automatically by mutation hooks
    }
  };

  const handleQuickStatusToggle = async (customer: Customer) => {
    try {
      await updateCustomer({
        id: customer.id,
        data: { is_active: !customer.isActive },
      });
    } catch {
      // Toast notifications handled inside mutation hook
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await deleteCustomer(selectedCustomer.id);
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
    } catch {
      // Toast notifications handled inside mutation hook
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (!filteredCustomers.length) return;
    const headers = "Customer Code,Name,Contact Person,Email,Phone,Tax Number,Credit Limit,Address,Status\n";
    const rows = filteredCustomers
      .map(
        (c) =>
          `"${c.customerCode}","${c.customerName}","${c.contactName}","${c.email}","${c.phone}","${c.taxNumber}",${c.creditLimit},"${c.address}","${c.isActive ? "Active" : "On Hold"}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Customer_Master_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "Ksh",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Section Header */}
          <Row className="mb-3">
            <Col xs={12}>
              <div className="d-flex align-items-lg-center flex-column flex-lg-row justify-content-between gap-3">
                <div>
                  <h4 className="fs-18 fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                    <i className="ri-user-star-line text-primary fs-22"></i>
                    Customer Directory & AR Ledger
                  </h4>
                  <p className="text-muted fs-12 mb-0">
                    Accounts Receivable (AR) Client Profiles & Credit Control
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Button
                    color="light"
                    className="btn-sm border shadow-sm fw-medium fs-12 d-flex align-items-center gap-1"
                    onClick={() => refetch()}
                  >
                    <i className="ri-refresh-line fs-14"></i>
                    Reload
                  </Button>
                  <Button
                    color="light"
                    className="btn-sm border shadow-sm fw-medium fs-12 d-flex align-items-center gap-1"
                    onClick={handleExportCSV}
                  >
                    <i className="ri-file-excel-2-line text-success fs-14"></i>
                    Export CSV
                  </Button>
                  <Button
                    className="btn-sm border-0 rounded px-3 d-flex align-items-center gap-2 shadow-sm"
                    style={{ backgroundColor: CORPORATE_NAVY }}
                    onClick={handleOpenCreate}
                  >
                    <i className="ri-add-line fs-15"></i>
                    <span className="fw-semibold fs-12">New Customer</span>
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* KPI Executive Widgets */}
          <Row className="g-3 mb-3">
            <Col xl={3} md={6}>
              <Card className="card-animate shadow-sm border-0 mb-0 h-100">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 fs-11 text-uppercase tracking-wider">
                        Total Clients
                      </p>
                      <h4 className="mt-1 mb-0 fs-22 fw-bold font-monospace text-dark">
                        {metrics.total}
                      </h4>
                    </div>
                    <div
                      className="avatar-sm rounded-3 d-flex align-items-center justify-content-center"
                      style={{ backgroundColor: CORPORATE_NAVY_SUBTLE }}
                    >
                      <i className="ri-user-shared-line fs-20" style={{ color: CORPORATE_NAVY }}></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="card-animate shadow-sm border-0 mb-0 h-100">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 fs-11 text-uppercase tracking-wider">
                        Active Accounts
                      </p>
                      <h4 className="mt-1 mb-0 fs-22 fw-bold font-monospace text-success">
                        {metrics.active}
                      </h4>
                    </div>
                    <div className="avatar-sm bg-success-subtle rounded-3 d-flex align-items-center justify-content-center">
                      <i className="ri-checkbox-circle-fill fs-20 text-success"></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="card-animate shadow-sm border-0 mb-0 h-100">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 fs-11 text-uppercase tracking-wider">
                        On Hold / Suspended
                      </p>
                      <h4 className="mt-1 mb-0 fs-22 fw-bold font-monospace text-danger">
                        {metrics.inactive}
                      </h4>
                    </div>
                    <div className="avatar-sm bg-danger-subtle rounded-3 d-flex align-items-center justify-content-center">
                      <i className="ri-error-warning-fill fs-20 text-danger"></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} md={6}>
              <Card className="card-animate shadow-sm border-0 mb-0 h-100">
                <CardBody className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 fs-11 text-uppercase tracking-wider">
                        Combined Credit Line
                      </p>
                      <h4 className="mt-1 mb-0 fs-20 fw-bold font-monospace text-info">
                        {formatCurrency(metrics.totalCreditLimit)}
                      </h4>
                    </div>
                    <div className="avatar-sm bg-info-subtle rounded-3 d-flex align-items-center justify-content-center">
                      <i className="ri-wallet-3-line fs-20 text-info"></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Main Datatable Card */}
          <Card className="shadow-sm border-0 mb-4">
            <CardHeader className="bg-white border-bottom py-3 px-3">
              <Row className="g-2 align-items-center justify-content-between">
                <Col lg={4} md={5}>
                  <div className="search-box position-relative">
                    <Input
                      type="text"
                      className="form-control form-control-sm fs-12 ps-4"
                      placeholder="Search Code, Name, Tax PIN or Email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-13"></i>
                    {searchTerm && (
                      <i
                        className="ri-close-circle-fill position-absolute top-50 end-0 translate-middle-y me-2 text-muted fs-14 cursor-pointer"
                        onClick={() => setSearchTerm("")}
                      ></i>
                    )}
                  </div>
                </Col>

                <Col lg={8} md={7}>
                  <div className="d-flex align-items-center gap-2 justify-content-md-end flex-wrap">
                    <Nav pills className="nav-pills-custom nav-custom-light btn-group">
                      <NavItem>
                        <NavLink
                          className={`py-1 px-2 fs-11 fw-semibold cursor-pointer ${
                            statusFilter === "ALL" ? "active bg-primary text-white" : "text-muted"
                          }`}
                          onClick={() => setStatusFilter("ALL")}
                        >
                          All Status
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={`py-1 px-2 fs-11 fw-semibold cursor-pointer ${
                            statusFilter === "ACTIVE" ? "active bg-success text-white" : "text-muted"
                          }`}
                          onClick={() => setStatusFilter("ACTIVE")}
                        >
                          Active
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={`py-1 px-2 fs-11 fw-semibold cursor-pointer ${
                            statusFilter === "INACTIVE" ? "active bg-danger text-white" : "text-muted"
                          }`}
                          onClick={() => setStatusFilter("INACTIVE")}
                        >
                          On Hold
                        </NavLink>
                      </NavItem>
                    </Nav>

                    <Input
                      type="select"
                      bsSize="sm"
                      className="form-select form-select-sm fs-12 w-auto"
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </Input>
                  </div>
                </Col>
              </Row>
            </CardHeader>

            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 fs-12 border-0 align-middle">
                  <thead className="table-light fs-11 text-muted text-uppercase sticky-top">
                    <tr>
                      <th style={{ width: "12%" }}>Code</th>
                      <th style={{ width: "24%" }}>Customer Name & Tax PIN</th>
                      <th style={{ width: "22%" }}>Contact Person</th>
                      <th style={{ width: "16%" }}>Credit Limit</th>
                      <th style={{ width: "12%" }}>Status</th>
                      <th style={{ width: "14%" }} className="text-end pe-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <Spinner size="sm" color="primary" className="me-2" />
                          <span className="text-muted fs-12 fw-medium">
                            Retrieving Customer Directory...
                          </span>
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          <i className="ri-inbox-archive-line display-5 opacity-50 mb-2"></i>
                          <h6 className="fs-13 fw-semibold text-dark mb-1">
                            No Customers Found
                          </h6>
                          <span className="fs-11">
                            Adjust search criteria or register a new client profile.
                          </span>
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust.id}>
                          <td>
                            <Badge
                              color="light"
                              className="text-dark border font-monospace fs-11 px-2 py-1 cursor-pointer"
                              onClick={() => handleOpenInspect(cust)}
                            >
                              <i className="ri-user-line me-1 text-muted"></i>
                              {cust.customerCode}
                            </Badge>
                          </td>

                          <td>
                            <div
                              className="fw-bold text-dark fs-12 cursor-pointer hover-text-primary"
                              onClick={() => handleOpenInspect(cust)}
                            >
                              {cust.customerName}
                            </div>
                          </td>

                          <td>
                            <div className="fw-bold text-dark fs-12">{cust.contactName}</div>
                          </td>

                          <td>
                            <Badge color="light" className="text-primary border fs-11 px-2 py-1 font-monospace">
                              {formatCurrency(cust.creditLimit)}
                            </Badge>
                          </td>

                          <td>
                            <Badge
                              color={cust.isActive ? "success" : "danger"}
                              className="fs-10 px-2 py-1 rounded-pill cursor-pointer"
                              onClick={() => handleQuickStatusToggle(cust)}
                              title="Click to toggle account hold state"
                            >
                              <i className="ri-record-circle-line me-1 text-white"></i>
                              {cust.isActive ? "Active" : "On Hold"}
                            </Badge>
                          </td>

                          <td className="text-end pe-3">
                            <UncontrolledDropdown>
                              <DropdownToggle
                                tag="button"
                                className="btn btn-light btn-sm btn-icon border-0 rounded-circle shadow-none"
                              >
                                <i className="ri-more-2-fill fs-14 text-muted"></i>
                              </DropdownToggle>
                              <DropdownMenu className="dropdown-menu-end shadow-sm border-0 fs-12">
                                <DropdownItem
                                  onClick={() => handleOpenInspect(cust)}
                                  className="d-flex align-items-center gap-2"
                                >
                                  <i className="ri-eye-line text-info fs-14"></i>
                                  <span>View Client Profile</span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() => handleOpenEdit(cust)}
                                  className="d-flex align-items-center gap-2"
                                >
                                  <i className="ri-pencil-line text-primary fs-14"></i>
                                  <span>Edit Customer</span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() => handleQuickStatusToggle(cust)}
                                  className="d-flex align-items-center gap-2"
                                >
                                  <i className="ri-toggle-line text-warning fs-14"></i>
                                  <span>
                                    {cust.isActive ? "Put On Hold" : "Activate Client"}
                                  </span>
                                </DropdownItem>
                                <DropdownItem divider />
                                <DropdownItem
                                  onClick={() => handleOpenDelete(cust)}
                                  className="d-flex align-items-center gap-2 text-danger"
                                >
                                  <i className="ri-delete-bin-line fs-14"></i>
                                  <span>Delete Record</span>
                                </DropdownItem>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination Footer */}
              <div className="p-3 border-top border-light-subtle d-flex align-items-center justify-content-between fs-12 text-muted">
                <div>
                  Showing <strong className="text-dark">{filteredCustomers.length}</strong> of{" "}
                  <strong className="text-dark">{totalCount}</strong> customer records
                </div>
                <div className="d-flex gap-1">
                  <Button
                    color="light"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 fs-12"
                  >
                    <i className="ri-arrow-left-s-line me-1"></i>
                    Previous
                  </Button>
                  <Button
                    color="light"
                    size="sm"
                    disabled={page * perPage >= totalCount}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2 py-1 fs-12"
                  >
                    Next
                    <i className="ri-arrow-right-s-line ms-1"></i>
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      <Modal
        isOpen={isFormModalOpen}
        toggle={() => setIsFormModalOpen(!isFormModalOpen)}
        centered
        size="lg"
        className="border-0"
      >
        <ModalHeader
          toggle={() => setIsFormModalOpen(false)}
          className="bg-light p-3 border-bottom"
        >
          <div className="d-flex align-items-center gap-2">
            <i className="ri-user-add-line text-primary fs-18"></i>
            <span className="fs-15 fw-bold text-dark">
              {selectedCustomer ? "Edit Customer Record" : "Register New Customer"}
            </span>
          </div>
        </ModalHeader>

        <Form onSubmit={handleFormSubmit}>
          <ModalBody className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Customer Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    className="font-monospace fw-bold fs-12"
                    placeholder="e.g. CUST-00101"
                    value={formData.customerCode}
                    onChange={(e) =>
                      setFormData({ ...formData, customerCode: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Customer / Business Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    className="fs-12"
                    placeholder="e.g. Acme Retail Enterprises"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Tax Number / PIN <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    className="font-monospace fs-12"
                    placeholder="e.g. P051299831Z"
                    value={formData.taxNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, taxNumber: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Approved Credit Limit ($) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    bsSize="sm"
                    min="0"
                    step="500"
                    className="font-monospace fs-12"
                    placeholder="0"
                    value={formData.creditLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        creditLimit: Number(e.target.value),
                      })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Contact Representative <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    className="fs-12"
                    placeholder="e.g. John Smith"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Telephone Line <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    className="fs-12"
                    placeholder="e.g. +1 555 019 2831"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Email Address <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="email"
                    bsSize="sm"
                    className="fs-12"
                    placeholder="e.g. billing@acmeretail.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Physical / Billing Address <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="textarea"
                    rows={2}
                    className="fs-12"
                    placeholder="Physical street address, city and country"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              {selectedCustomer && (
                <Col md={12}>
                  <FormGroup className="mb-0">
                    <Label className="fs-12 fw-semibold text-dark">
                      Account Status (Credit Hold)
                    </Label>
                    <Input
                      type="select"
                      bsSize="sm"
                      className="form-select fs-12"
                      value={isActiveForm ? "true" : "false"}
                      onChange={(e) => setIsActiveForm(e.target.value === "true")}
                    >
                      <option value="true">Active Account</option>
                      <option value="false">On Hold / Credit Suspended</option>
                    </Input>
                  </FormGroup>
                </Col>
              )}
            </Row>
          </ModalBody>

          <ModalFooter className="bg-light p-3 border-top">
            <Button
              color="light"
              size="sm"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="border-0 px-3"
              style={{ backgroundColor: CORPORATE_NAVY }}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Saving...
                </>
              ) : selectedCustomer ? (
                "Update Customer File"
              ) : (
                "Save Customer"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* ==================== INSPECT DRAWER (OFFCANVAS) ==================== */}
      <Offcanvas
        isOpen={isDrawerOpen}
        toggle={() => setIsDrawerOpen(!isDrawerOpen)}
        direction="end"
        className="border-0 shadow"
        style={{ width: "450px" }}
      >
        <OffcanvasHeader
          toggle={() => setIsDrawerOpen(false)}
          className="bg-light border-bottom p-3"
        >
          <div className="d-flex align-items-center gap-2">
            <i className="ri-profile-line text-primary fs-18"></i>
            <span className="fs-14 fw-bold text-dark">Customer Master Profile</span>
          </div>
        </OffcanvasHeader>
        <OffcanvasBody className="p-4">
          {selectedCustomer && (
            <div className="d-flex flex-column gap-4">
              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                <div>
                  <Badge color="light" className="text-dark border font-monospace mb-1">
                    {selectedCustomer.customerCode}
                  </Badge>
                  <h5 className="fs-15 fw-bold text-dark mb-0">
                    {selectedCustomer.customerName}
                  </h5>
                </div>
                <Badge
                  color={selectedCustomer.isActive ? "success" : "danger"}
                  className="px-2 py-1 rounded-pill fs-11"
                >
                  {selectedCustomer.isActive ? "Active" : "On Hold"}
                </Badge>
              </div>

              <div>
                <h6 className="fs-11 fw-bold text-uppercase text-muted mb-2 tracking-wider">
                  Accounts Receivable Terms
                </h6>
                <div className="border rounded-3 p-3 bg-white d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between fs-12">
                    <span className="text-muted">Tax PIN / Reg No:</span>
                    <span className="font-monospace fw-bold text-dark">
                      {selectedCustomer.taxNumber || "N/A"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between fs-12">
                    <span className="text-muted">Credit Facility Limit:</span>
                    <span className="fw-bold text-primary font-monospace">
                      {formatCurrency(selectedCustomer.creditLimit)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h6 className="fs-11 fw-bold text-uppercase text-muted mb-2 tracking-wider">
                  Contact & Location Details
                </h6>
                <div className="border rounded-3 p-3 bg-white d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-2 fs-12">
                    <i className="ri-user-3-line text-primary fs-16"></i>
                    <div>
                      <div className="text-muted fs-10">Contact Person</div>
                      <div className="fw-semibold text-dark">
                        {selectedCustomer.contactName}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 fs-12">
                    <i className="ri-mail-send-line text-primary fs-16"></i>
                    <div>
                      <div className="text-muted fs-10">Email</div>
                      <div className="fw-semibold text-dark">{selectedCustomer.email}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 fs-12">
                    <i className="ri-phone-find-line text-primary fs-16"></i>
                    <div>
                      <div className="text-muted fs-10">Direct Phone</div>
                      <div className="fw-semibold text-dark">{selectedCustomer.phone}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 fs-12">
                    <i className="ri-map-pin-line text-primary fs-16"></i>
                    <div>
                      <div className="text-muted fs-10">Address</div>
                      <div className="fw-semibold text-dark">{selectedCustomer.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedCustomer.createdAt && (
                <div>
                  <h6 className="fs-11 fw-bold text-uppercase text-muted mb-2 tracking-wider">
                    System Record Audit
                  </h6>
                  <div className="border rounded-3 p-3 bg-light d-flex flex-column gap-2 fs-11 text-muted">
                    <div className="d-flex justify-content-between">
                      <span>Created Date:</span>
                      <span>{new Date(selectedCustomer.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex gap-2 pt-2">
                <Button
                  color="primary"
                  className="w-100 fs-12"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleOpenEdit(selectedCustomer);
                  }}
                >
                  <i className="ri-pencil-line me-1"></i> Edit Customer
                </Button>
              </div>
            </div>
          )}
        </OffcanvasBody>
      </Offcanvas>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      <Modal
        isOpen={isDeleteModalOpen}
        toggle={() => setIsDeleteModalOpen(!isDeleteModalOpen)}
        centered
        size="sm"
      >
        <ModalBody className="text-center p-4">
          <div className="avatar-md bg-danger-subtle rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
            <i className="ri-delete-bin-line display-6 text-danger"></i>
          </div>
          <h5 className="fs-15 fw-bold text-dark mb-1">Delete Customer Profile?</h5>
          <p className="text-muted fs-12 mb-3">
            Are you sure you want to delete{" "}
            <strong className="text-dark">{selectedCustomer?.customerName}</strong>?
          </p>

          <div className="d-flex justify-content-center gap-2">
            <Button
              color="light"
              size="sm"
              className="px-3"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              size="sm"
              className="px-3"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner size="sm" /> : "Confirm Delete"}
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default CustomerManagement;