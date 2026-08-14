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
  useSuppliers,
  useSupplierMutation,
} from "../../Components/Hooks/useSuppliers"; // Adjust to your hook import path
import {
  Supplier,
  SupplierPayload,
  UpdateSupplierRequest,
} from "../../types/supplier";

// Velzon Corporate Theme Branding Colors
const CORPORATE_NAVY = "#042e6d";
const CORPORATE_NAVY_SUBTLE = "rgba(4, 46, 109, 0.08)";

const INITIAL_FORM_STATE: SupplierPayload = {
  supplierCode: "",
  supplierName: "",
  contactName: "",
  phone: "",
  email: "",
  taxNumber: "",
  paymentTermsDays: 30,
};

export const SupplierListing: React.FC = () => {
  // --- Query Parameters & State ---
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [termsFilter, setTermsFilter] = useState<string>("ALL");

  // TanStack Query & Mutations
  const { data: supplierListResponse, isLoading, refetch } = useSuppliers(page, perPage);
  const {
    createSupplier,
    updateSupplier,
    deleteSupplier,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSupplierMutation();

  // --- Modal & Drawer States ---
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierPayload>(INITIAL_FORM_STATE);
  const [isActiveForm, setIsActiveForm] = useState<boolean>(true);

  // Extract vendors list
  const suppliers: Supplier[] = supplierListResponse?.suppliers ?? [];
  const totalCount: number = supplierListResponse?.total ?? 0;

  // --- Filtered Data Computation ---
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.supplierName.toLowerCase().includes(q) ||
        item.supplierCode.toLowerCase().includes(q) ||
        item.contactName.toLowerCase().includes(q) ||
        item.taxNumber.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? item.isActive
          : !item.isActive;

      const matchesTerms =
        termsFilter === "ALL"
          ? true
          : termsFilter === "COD"
          ? item.paymentTermsDays === 0
          : termsFilter === "30"
          ? item.paymentTermsDays <= 30 && item.paymentTermsDays > 0
          : item.paymentTermsDays > 30;

      return matchesSearch && matchesStatus && matchesTerms;
    });
  }, [suppliers, searchTerm, statusFilter, termsFilter]);

  // --- Executive KPI Metrics ---
  const metrics = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.isActive).length;
    const inactive = total - active;
    const avgTerms = total
      ? Math.round(suppliers.reduce((acc, s) => acc + s.paymentTermsDays, 0) / total)
      : 0;

    return { total, active, inactive, avgTerms };
  }, [suppliers]);

  // --- Event Handlers ---
  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormData(INITIAL_FORM_STATE);
    setIsActiveForm(true);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      taxNumber: supplier.taxNumber,
      paymentTermsDays: supplier.paymentTermsDays,
    });
    setIsActiveForm(supplier.isActive);
    setIsFormModalOpen(true);
  };

  const handleOpenInspect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDrawerOpen(true);
  };

  const handleOpenDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        const updatePayload: UpdateSupplierRequest = {
          ...formData,
          isActive: isActiveForm,
        };
        await updateSupplier({ id: selectedSupplier.supplierId, data: updatePayload });
      } else {
        await createSupplier(formData);
      }
      setIsFormModalOpen(false);
    } catch {
    }
  };

  const handleQuickStatusToggle = async (supplier: Supplier) => {
    try {
      await updateSupplier({
        id: supplier.supplierId,
        data: { isActive: !supplier.isActive },
      });
    } catch {
      // Error handling managed inside mutation toasts
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;
    try {
      await deleteSupplier(selectedSupplier.supplierId);
      setIsDeleteModalOpen(false);
      setSelectedSupplier(null);
    } catch {
      // Error handling managed inside mutation toasts
    }
  };

  // Quick Export to CSV Functionality
  const handleExportCSV = () => {
    if (!filteredSuppliers.length) return;
    const headers = "Supplier Code,Name,Contact Person,Email,Phone,Tax Number,Payment Terms (Days),Status\n";
    const rows = filteredSuppliers
      .map(
        (s) =>
          `"${s.supplierCode}","${s.supplierName}","${s.contactName}","${s.email}","${s.phone}","${s.taxNumber}",${s.paymentTermsDays},"${s.isActive ? "Active" : "On Hold"}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Supplier_Master_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
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
                    <i className="ri-building-3-line text-primary fs-22"></i>
                    Supplier Master Directory
                  </h4>
                  <p className="text-muted fs-12 mb-0">
                    Accounts Payable (AP) Vendor Ledger, Credit Terms
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
                    <span className="fw-semibold fs-12">New Supplier</span>
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
                        Registered Suppliers
                      </p>
                      <h4 className="mt-1 mb-0 fs-22 fw-bold font-monospace text-dark">
                        {metrics.total}
                      </h4>
                    </div>
                    <div
                      className="avatar-sm rounded-3 d-flex align-items-center justify-content-center"
                      style={{ backgroundColor: CORPORATE_NAVY_SUBTLE }}
                    >
                      <i className="ri-store-2-line fs-20" style={{ color: CORPORATE_NAVY }}></i>
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
                        Active Trading Accounts
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
                        On Hold / Blocked
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
                        Avg AP Payment Window
                      </p>
                      <h4 className="mt-1 mb-0 fs-22 fw-bold font-monospace text-info">
                        {metrics.avgTerms} Days
                      </h4>
                    </div>
                    <div className="avatar-sm bg-info-subtle rounded-3 d-flex align-items-center justify-content-center">
                      <i className="ri-calendar-todo-fill fs-20 text-info"></i>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Main Table Card Container */}
          <Card className="shadow-sm border-0 mb-4">
            {/* Filter Bar */}
            <CardHeader className="bg-white border-bottom py-3 px-3">
              <Row className="g-2 align-items-center justify-content-between">
                {/* Search Field */}
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

                {/* Filters */}
                <Col lg={8} md={7}>
                  <div className="d-flex align-items-center gap-2 justify-content-md-end flex-wrap">
                    {/* Status Tabs */}
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

                    {/* Credit Terms Filter */}
                    <Input
                      type="select"
                      bsSize="sm"
                      className="form-select form-select-sm fs-12 w-auto"
                      value={termsFilter}
                      onChange={(e) => setTermsFilter(e.target.value)}
                    >
                      <option value="ALL">All Terms</option>
                      <option value="COD">COD / Immediate</option>
                      <option value="30">Up to 30 Days</option>
                      <option value="60">Over 30 Days</option>
                    </Input>

                    {/* Page Size Selector */}
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

            {/* Datatable */}
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 fs-12 border-0 align-middle">
                  <thead className="table-light fs-11 text-muted text-uppercase sticky-top">
                    <tr>
                      <th style={{ width: "12%" }}>Vendor Code</th>
                      <th style={{ width: "26%" }}>Supplier Name & Tax ID</th>
                      <th style={{ width: "24%" }}>Contact Details</th>
                      <th style={{ width: "14%" }}>Payment Terms</th>
                      <th style={{ width: "10%" }}>Status</th>
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
                            Retrieving SYSPRO Master Data...
                          </span>
                        </td>
                      </tr>
                    ) : filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          <i className="ri-inbox-archive-line display-5 opacity-50 mb-2"></i>
                          <h6 className="fs-13 fw-semibold text-dark mb-1">
                            No Suppliers Found
                          </h6>
                          <span className="fs-11">
                            Adjust search criteria or create a new vendor record.
                          </span>
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((sup) => (
                        <tr key={sup.supplierId}>
                          {/* Vendor Code */}
                          <td>
                            <Badge
                              color="light"
                              className="text-dark border font-monospace fs-11 px-2 py-1 cursor-pointer"
                              onClick={() => handleOpenInspect(sup)}
                            >
                              <i className="ri-truck-line me-1 text-muted"></i>
                              {sup.supplierCode}
                            </Badge>
                          </td>

                          {/* Name & Tax ID */}
                          <td>
                            <div
                              className="fw-bold text-dark fs-12 cursor-pointer hover-text-primary"
                              onClick={() => handleOpenInspect(sup)}
                            >
                              {sup.supplierName}
                            </div>
                  
                          </td>

                          {/* Contact Info */}
                          <td>
                            <div className="fw-bold text-dark fs-12">
                              {sup.contactName}
                            </div>
                          </td>

                          {/* Payment Terms */}
                          <td>
                            <Badge
                              className="px-2 py-1 fs-11 fw-semibold font-poppins"
                              style={{
                                backgroundColor:
                                  sup.paymentTermsDays === 0
                                    ? "primary"
                                    : "primary)",
                                color: sup.paymentTermsDays === 0 ? "secondary" : "secondary",
                              }}
                            >
                              {sup.paymentTermsDays === 0
                                ? "COD / Immediate"
                                : `Net ${sup.paymentTermsDays} Days`}
                            </Badge>
                          </td>

                          {/* Status */}
                          <td>
                            <Badge
                              color={sup.isActive ? "success" : "danger"}
                              className="fs-10 px-2 py-1 rounded-pill cursor-pointer"
                              onClick={() => handleQuickStatusToggle(sup)}
                              title="Click to toggle hold status"
                            >
                              <i
                                className={`ri-record-circle-line me-1 ${
                                  sup.isActive ? "text-white" : "text-white"
                                }`}
                              ></i>
                              {sup.isActive ? "Active" : "On Hold"}
                            </Badge>
                          </td>

                          {/* Actions Dropdown */}
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
                                  onClick={() => handleOpenInspect(sup)}
                                  className="d-flex align-items-center gap-2"
                                >
                                  <i className="ri-eye-line text-info fs-14"></i>
                                  <span>View Master Profile</span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() => handleOpenEdit(sup)}
                                  className="d-flex align-items-center gap-2"
                                >
                                  <i className="ri-pencil-line text-primary fs-14"></i>
                                  <span>Edit Supplier</span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() => handleQuickStatusToggle(sup)}
                                  className="d-flex align-items-center gap-2"
                                >
                                  <i className="ri-toggle-line text-warning fs-14"></i>
                                  <span>
                                    {sup.isActive ? "Put On Hold" : "Activate Account"}
                                  </span>
                                </DropdownItem>
                                <DropdownItem divider />
                                <DropdownItem
                                  onClick={() => handleOpenDelete(sup)}
                                  className="d-flex align-items-center gap-2 text-danger"
                                >
                                  <i className="ri-delete-bin-line fs-14"></i>
                                  <span>Delete Supplier</span>
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

              {/* Pagination Bar */}
              <div className="p-3 border-top border-light-subtle d-flex align-items-center justify-content-between fs-12 text-muted">
                <div>
                  Showing <strong className="text-dark">{filteredSuppliers.length}</strong> of{" "}
                  <strong className="text-dark">{totalCount}</strong> supplier records
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
            <i className="ri-building-line text-primary fs-18"></i>
            <span className="fs-15 fw-bold text-dark">
              {selectedSupplier ? "Edit Supplier Master Data" : "Register New Supplier"}
            </span>
          </div>
        </ModalHeader>

        <Form onSubmit={handleFormSubmit}>
          <ModalBody className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Supplier Code <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    className="font-monospace fw-bold fs-12"
                    placeholder="e.g. SUP-00101"
                    value={formData.supplierCode}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierCode: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Registered Business Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    className="fs-12"
                    placeholder="e.g. Acme Industrial Logistics Ltd"
                    value={formData.supplierName}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierName: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Tax Number / VAT / PIN <span className="text-danger">*</span>
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
                    Payment Terms (Days) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    bsSize="sm"
                    min="0"
                    className="font-monospace fs-12"
                    placeholder="0 for Cash On Delivery (COD)"
                    value={formData.paymentTermsDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentTermsDays: Number(e.target.value),
                      })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Contact Person Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    className="fs-12"
                    placeholder="e.g. Jane Doe"
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
                    Direct Telephone <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    className="fs-12"
                    placeholder="e.g. +254 700 000 000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fs-12 fw-semibold text-dark">
                    Accounts Payable Email <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="email"
                    bsSize="sm"
                    className="fs-12"
                    placeholder="e.g. accounts@supplier.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </FormGroup>
              </Col>

              {selectedSupplier && (
                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="fs-12 fw-semibold text-dark">
                      Account Status (Hold Control)
                    </Label>
                    <Input
                      type="select"
                      bsSize="sm"
                      className="form-select fs-12"
                      value={isActiveForm ? "true" : "false"}
                      onChange={(e) => setIsActiveForm(e.target.value === "true")}
                    >
                      <option value="true">Active Trading</option>
                      <option value="false">On Hold / Blocked</option>
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
              ) : selectedSupplier ? (
                "Update Supplier Master"
              ) : (
                "Save Supplier"
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
            <i className="ri-shield-user-line text-primary fs-18"></i>
            <span className="fs-14 fw-bold text-dark">Supplier Master File</span>
          </div>
        </OffcanvasHeader>
        <OffcanvasBody className="p-4">
          {selectedSupplier && (
            <div className="d-flex flex-column gap-4">
              {/* Main Badge Header */}
              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                <div>
                  <Badge color="light" className="text-dark border font-monospace mb-1">
                    {selectedSupplier.supplierCode}
                  </Badge>
                  <h5 className="fs-15 fw-bold text-dark mb-0">
                    {selectedSupplier.supplierName}
                  </h5>
                </div>
                <Badge
                  color={selectedSupplier.isActive ? "success" : "danger"}
                  className="px-2 py-1 rounded-pill fs-11"
                >
                  {selectedSupplier.isActive ? "Active" : "On Hold"}
                </Badge>
              </div>

              {/* Financial & AP Terms */}
              <div>
                <h6 className="fs-11 fw-bold text-uppercase text-muted mb-2 tracking-wider">
                  Accounts Payable Configuration
                </h6>
                <div className="border rounded-3 p-3 bg-white d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between fs-12">
                    <span className="text-muted">Tax PIN / VAT Reg:</span>
                    <span className="font-monospace fw-bold text-dark">
                      {selectedSupplier.taxNumber || "N/A"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between fs-12">
                    <span className="text-muted">Payment Credit Terms:</span>
                    <span className="fw-bold text-primary">
                      {selectedSupplier.paymentTermsDays === 0
                        ? "COD (Cash On Delivery)"
                        : `Net ${selectedSupplier.paymentTermsDays} Days`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Profile */}
              <div>
                <h6 className="fs-11 fw-bold text-uppercase text-muted mb-2 tracking-wider">
                  Direct Representative Contact
                </h6>
                <div className="border rounded-3 p-3 bg-white d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-2 fs-12">
                    <i className="ri-user-3-line text-primary fs-16"></i>
                    <div>
                      <div className="text-muted fs-10">Contact Person</div>
                      <div className="fw-semibold text-dark">
                        {selectedSupplier.contactName}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 fs-12">
                    <i className="ri-mail-send-line text-primary fs-16"></i>
                    <div>
                      <div className="text-muted fs-10">AP Email</div>
                      <div className="fw-semibold text-dark">
                        {selectedSupplier.email}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 fs-12">
                    <i className="ri-phone-find-line text-primary fs-16"></i>
                    <div>
                      <div className="text-muted fs-10">Phone Line</div>
                      <div className="fw-semibold text-dark">
                        {selectedSupplier.phone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Audit Information */}
              <div>
                <h6 className="fs-11 fw-bold text-uppercase text-muted mb-2 tracking-wider">
                  System Audit Log
                </h6>
                <div className="border rounded-3 p-3 bg-light d-flex flex-column gap-2 fs-11 text-muted">
                  <div className="d-flex justify-content-between">
                    <span>Supplier :</span>
                    <span className="font-monospace text-truncate ms-2" style={{ maxWidth: "200px" }}>
                      {selectedSupplier.supplierCode}
                    </span>
                  </div>
                  {selectedSupplier.createdAt && (
                    <div className="d-flex justify-content-between">
                      <span>Created On:</span>
                      <span>{new Date(selectedSupplier.createdAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedSupplier.updatedAt && (
                    <div className="d-flex justify-content-between">
                      <span>Last Updated:</span>
                      <span>{new Date(selectedSupplier.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons in Drawer */}
              <div className="d-flex gap-2 pt-2">
                <Button
                  color="primary"
                  className="w-100 fs-12"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleOpenEdit(selectedSupplier);
                  }}
                >
                  <i className="ri-pencil-line me-1"></i> Edit Supplier
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
          <h5 className="fs-15 fw-bold text-dark mb-1">Delete Supplier Master?</h5>
          <p className="text-muted fs-12 mb-3">
            Are you sure you want to remove{" "}
            <strong className="text-dark">{selectedSupplier?.supplierName}</strong>? This
            will unlink associated purchase orders.
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

export default SupplierListing;