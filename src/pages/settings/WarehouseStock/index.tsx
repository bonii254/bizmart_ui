import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Spinner,
  Alert,
  Row,
  Col,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Container,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useWarehouseStock } from "../../../Components/Hooks/useWarehouseStock";
import { useWarehouses } from "../../../Components/Hooks/useWarehouse";
import { useStockItems } from "../../../Components/Hooks/useStockItems";
import {
  WarehouseStock,
  InitializeStockPayload,
  UpdateStockQtyPayload,
} from "../../../types/warehouseStock";
import { handleBackendErrors } from "../../../helpers/form_utils";
import TablePagination from "../../TablePagination";

const InitializeStockManagement: React.FC = () => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Debounced auto-search state
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // React Query Custom Hooks
  const {
    balances,
    isLoading,
    isInitializing,
    isAdjusting,
    isRemoving,
    initializeBalance,
    modifyStockQty,
    deleteStockLink,
  } = useWarehouseStock(selectedWarehouseId || undefined);

  const { data: warehouseData } = useWarehouses(true);
  const { data: stockItemCatalog } = useStockItems("", true);

  // Modal & Component State
  const [initModalOpen, setInitModalOpen] = useState<boolean>(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<WarehouseStock | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");

  const warehouseList = useMemo(() => warehouseData?.warehouses || [], [warehouseData]);
  const stockCatalog = useMemo(() => stockItemCatalog?.catalog || [], [stockItemCatalog]);

  // Client-side Filter by Search Term
  const filteredBalances = useMemo(() => {
    if (!searchTerm) return balances;
    const lower = searchTerm.toLowerCase();
    return balances.filter(
      (b: WarehouseStock) =>
        b.stock_item?.stock_code?.toLowerCase().includes(lower) ||
        b.stock_item?.description?.toLowerCase().includes(lower) ||
        b.warehouse?.name?.toLowerCase().includes(lower) ||
        b.warehouse?.warehouse_code?.toLowerCase().includes(lower)
    );
  }, [balances, searchTerm]);

  // Pagination Math
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredBalances.slice(start, start + pageSize);
  }, [filteredBalances, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredBalances.length / pageSize);

  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => {
      setPageSize(size);
      setPageIndex(0);
    },
    previousPage: () => setPageIndex((prev) => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < totalPages - 1,
    getPageCount: () => totalPages || 1,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: filteredBalances }),
  };

  // ---------------------------------------------------------------------------
  // Formik 1: Initialize Stock Modal (Fixed Validation Schema)
  // ---------------------------------------------------------------------------
  const initFormik = useFormik<InitializeStockPayload & { unit_cost: number }>({
    initialValues: {
      warehouse_id: "",
      stock_item_id: "",
      qty_on_hand: 0,
      unit_cost: 0,
      total_value: 0,
    },
    validationSchema: Yup.object({
      warehouse_id: Yup.string().required("Warehouse selection is required"),
      stock_item_id: Yup.string().required("Stock item selection is required"),
      qty_on_hand: Yup.number().min(0, "Quantity cannot be negative").required("Quantity is required"),
      unit_cost: Yup.number().min(0, "Unit cost cannot be negative").required("Unit cost is required"),
      total_value: Yup.number().min(0, "Total value cannot be negative").optional(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        // Automatically compute total_value if not provided
        const payload = {
          ...values,
          total_value: values.total_value || (Number(values.qty_on_hand) * Number(values.unit_cost)),
        };
        await initializeBalance(payload);
        setInitModalOpen(false);
      } catch (error: any) {
        handleBackendErrors(error, initFormik.setErrors, setGlobalError);
      }
    },
  });

  // ---------------------------------------------------------------------------
  // Formik 2: Adjust Stock Modal
  // ---------------------------------------------------------------------------
  const adjustFormik = useFormik<UpdateStockQtyPayload>({
    initialValues: {
      qty_on_hand: 0,
      total_value: 0,
    },
    validationSchema: Yup.object({
      qty_on_hand: Yup.number().min(0, "Quantity cannot be negative").required("Quantity is required"),
      total_value: Yup.number().min(0, "Total value cannot be negative").required("Total value is required"),
    }),
    onSubmit: async (values) => {
      if (!selectedRecord) return;
      try {
        setGlobalError(null);
        await modifyStockQty({ id: selectedRecord.id, payload: values });
        setAdjustModalOpen(false);
        setSelectedRecord(null);
      } catch (error: any) {
        handleBackendErrors(error, adjustFormik.setErrors, setGlobalError);
      }
    },
  });

  const handleOpenAdjustModal = (record: WarehouseStock) => {
    setSelectedRecord(record);
    adjustFormik.resetForm({
      values: {
        qty_on_hand: Number(record.qty_on_hand) || 0,
        total_value: Number(record.total_value) || 0,
      },
    });
    setAdjustModalOpen(true);
  };

  const confirmDeleteLink = async () => {
    if (!selectedRecord || deleteConfirmation !== "DELETE") return;
    try {
      await deleteStockLink(selectedRecord.id);
      setDeleteModal(false);
      setDeleteConfirmation("");
      setSelectedRecord(null);
    } catch (error: any) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  document.title = "Initialize Stock Management | Inventory";

  return (
    <React.Fragment>
        <Container fluid>
          <Row>
            <Col lg={12}>
              {globalError && (
                <Alert color="danger" className="mb-3">
                  {globalError}
                </Alert>
              )}

              <Card className="shadow-sm border-0">
                <CardHeader className="border-bottom py-3 px-3 bg-white">
                  <Row className="g-2 align-items-center justify-content-between">
                    <Col lg={3} md={4} sm={12}>
                      <Input
                        type="select"
                        className="form-select form-select-sm fs-12"
                        value={selectedWarehouseId}
                        onChange={(e) => {
                          setSelectedWarehouseId(e.target.value);
                          setPageIndex(0);
                        }}
                      >
                        <option value="">All Warehouses</option>
                        {warehouseList.map((wh: any) => (
                          <option key={wh.warehouseId} value={wh.warehouseId}>
                            {wh.warehouseName} ({wh.warehouseCode})
                          </option>
                        ))}
                      </Input>
                    </Col>

                    <Col lg={4} md={4} sm={12}>
                      <div className="search-box position-relative">
                        <Input
                          type="text"
                          className="form-control form-control-sm fs-12 ps-4"
                          placeholder="Filter code, item, or warehouse..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-13"></i>
                      </div>
                    </Col>

                    <Col lg={5} md={4} sm={12} className="text-md-end">
                      <Button
                        color="primary"
                        size="sm"
                        className="fs-12 fw-medium px-3"
                        onClick={() => {
                          setGlobalError(null);
                          initFormik.resetForm({
                            values: {
                              warehouse_id: selectedWarehouseId || "",
                              stock_item_id: "",
                              qty_on_hand: 0,
                              unit_cost: 0,
                              total_value: 0,
                            },
                          });
                          setInitModalOpen(true);
                        }}
                      >
                        <i className="ri-add-line align-bottom me-1"></i> Initialize Stock Balance
                      </Button>
                    </Col>
                  </Row>
                </CardHeader>

                <CardBody className="p-0">
                  <div className="table-responsive">
                    <Table hover responsive size="sm" className="align-middle mb-0 custom-datatable table-sm">
                      <thead className="table-light text-muted text-uppercase fs-10">
                        <tr>
                          <th style={{ width: "12%" }} className="ps-3 py-2">Stock Code</th>
                          <th style={{ width: "28%" }} className="py-2">Description</th>
                          <th style={{ width: "20%" }} className="py-2">Warehouse</th>
                          <th style={{ width: "10%" }} className="py-2">UOM</th>
                          <th style={{ width: "10%" }} className="text-start py-2">Qty On Hand</th>
                          <th style={{ width: "12%" }} className="text-start py-2">Total Value</th>
                          <th style={{ width: "8%" }} className="text-end pe-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="fs-12">
                        {isLoading ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4">
                              <Spinner size="sm" color="primary" />
                            </td>
                          </tr>
                        ) : paginatedRows.length > 0 ? (
                          paginatedRows.map((item: WarehouseStock) => (
                            <tr key={item.id} className="align-middle">
                              <td className="py-1.5 ps-3">
                                <span className="fw-semibold text-primary font-monospace fs-11">
                                  {item.stock_item?.stock_code || "N/A"}
                                </span>
                              </td>
                              <td className="py-1.5">
                                <span
                                  className="text-dark fw-medium text-truncate d-inline-block"
                                  style={{ maxWidth: "280px" }}
                                  title={item.stock_item?.description}
                                >
                                  {item.stock_item?.description || "N/A"}
                                </span>
                              </td>
                              <td className="py-1.5">
                                <div className="d-flex align-items-center">
                                  <i className="ri-building-line text-muted me-1 fs-13"></i>
                                  <span className="fw-medium text-body">
                                    {item.warehouse?.name || "N/A"}
                                  </span>
                                  {item.warehouse?.warehouse_code && (
                                    <Badge color="light" className="text-muted ms-1 border fs-10 fw-normal">
                                      {item.warehouse.warehouse_code}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-1.5">
                                <Badge color="light" className="text-secondary border fs-10 fw-normal px-1.5 py-0.5">
                                  {item.stock_item?.uom || "N/A"}
                                </Badge>
                              </td>
                              <td className="py-1.5 text-start fw-semibold text-dark font-monospace">
                                {Number(item.qty_on_hand).toLocaleString()}
                              </td>
                              <td className="py-1.5 text-start fw-semibold text-success font-monospace">
                                Ksh {Number(item.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="text-end pe-3 py-1.5">
                                <div className="d-flex gap-1 justify-content-end">
                                  <Button
                                    size="sm"
                                    color="soft-info"
                                    className="btn-icon waves-effect waves-light"
                                    style={{ width: "26px", height: "26px", padding: 0 }}
                                    onClick={() => handleOpenAdjustModal(item)}
                                    title="Adjust Quantities"
                                  >
                                    <i className="ri-edit-box-line fs-13"></i>
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="soft-danger"
                                    className="btn-icon waves-effect waves-light"
                                    style={{ width: "26px", height: "26px", padding: 0 }}
                                    onClick={() => {
                                      setSelectedRecord(item);
                                      setDeleteConfirmation("");
                                      setDeleteModal(true);
                                    }}
                                    title="Remove Stock Link"
                                  >
                                    <i className="ri-delete-bin-line fs-13"></i>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted fs-12">
                              No stock balance records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  <div className="px-3 py-2 border-top">
                    <TablePagination table={tableInstance} />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>

      {/* Modal 1: Initialize Stock Balance */}
      <Modal isOpen={initModalOpen} toggle={() => setInitModalOpen(false)} centered size="lg">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setInitModalOpen(false)}>
          Initialize Stock Balance
        </ModalHeader>
        <Form onSubmit={initFormik.handleSubmit}>
          <ModalBody className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Warehouse</Label>
                  <Input
                    type="select"
                    bsSize="sm"
                    {...initFormik.getFieldProps("warehouse_id")}
                    invalid={!!(initFormik.touched.warehouse_id && initFormik.errors.warehouse_id)}
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouseList.map((wh: any) => (
                      <option key={wh.warehouseId} value={wh.warehouseId}>
                        {wh.warehouseName} ({wh.warehouseCode})
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{initFormik.errors.warehouse_id}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Stock Item</Label>
                  <Input
                    type="select"
                    bsSize="sm"
                    {...initFormik.getFieldProps("stock_item_id")}
                    invalid={!!(initFormik.touched.stock_item_id && initFormik.errors.stock_item_id)}
                  >
                    <option value="">Select Stock Item...</option>
                    {stockCatalog.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.stock_code} - {item.description} ({item.uom})
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{initFormik.errors.stock_item_id}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Initial Quantity On Hand</Label>
                  <Input
                    type="number"
                    bsSize="sm"
                    placeholder="0"
                    {...initFormik.getFieldProps("qty_on_hand")}
                    invalid={!!(initFormik.touched.qty_on_hand && initFormik.errors.qty_on_hand)}
                  />
                  <FormFeedback>{initFormik.errors.qty_on_hand}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Unit Cost (Ksh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    placeholder="0.00"
                    {...initFormik.getFieldProps("unit_cost")}
                    invalid={!!(initFormik.touched.unit_cost && initFormik.errors.unit_cost)}
                  />
                  <FormFeedback>{initFormik.errors.unit_cost}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" size="sm" onClick={() => setInitModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" size="sm" type="submit" disabled={isInitializing}>
              {isInitializing ? <Spinner size="sm" /> : "Link & Initialize"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Modal 2: Adjust Stock Quantities */}
      <Modal isOpen={adjustModalOpen} toggle={() => setAdjustModalOpen(false)} centered>
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setAdjustModalOpen(false)}>
          Adjust Stock Quantities
        </ModalHeader>
        <Form onSubmit={adjustFormik.handleSubmit}>
          <ModalBody className="p-4">
            {selectedRecord && (
              <div className="mb-3 p-2 bg-light rounded border fs-12">
                <div>
                  <strong>Item:</strong> {selectedRecord.stock_item?.description} ({selectedRecord.stock_item?.stock_code})
                </div>
                <div>
                  <strong>Warehouse:</strong> {selectedRecord.warehouse?.name}
                </div>
              </div>
            )}
            <Row className="g-3">
              <Col md={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Quantity On Hand</Label>
                  <Input
                    type="number"
                    bsSize="sm"
                    {...adjustFormik.getFieldProps("qty_on_hand")}
                    invalid={!!(adjustFormik.touched.qty_on_hand && adjustFormik.errors.qty_on_hand)}
                  />
                  <FormFeedback>{adjustFormik.errors.qty_on_hand}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Total Value (Ksh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    {...adjustFormik.getFieldProps("total_value")}
                    invalid={!!(adjustFormik.touched.total_value && adjustFormik.errors.total_value)}
                  />
                  <FormFeedback>{adjustFormik.errors.total_value}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" size="sm" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" size="sm" type="submit" disabled={isAdjusting}>
              {isAdjusting ? <Spinner size="sm" /> : "Save Adjustments"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Modal 3: Delete / Unlink Confirmation */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
        <ModalBody className="p-4 text-center">
          <i className="ri-error-warning-line display-4 text-warning"></i>
          <div className="mt-3">
            <h5 className="mb-2 fs-15">Unlink Stock Record?</h5>
            <p className="text-muted fs-12">
              Type <strong>DELETE</strong> to confirm removing this stock record link from the warehouse.
            </p>
            <Input
              type="text"
              bsSize="sm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="text-center mb-3 fs-12"
              placeholder="Enter DELETE"
            />
            <div className="hstack gap-2 justify-content-center">
              <Button color="light" size="sm" onClick={() => setDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                color="danger"
                size="sm"
                onClick={confirmDeleteLink}
                disabled={isRemoving || deleteConfirmation !== "DELETE"}
              >
                {isRemoving ? <Spinner size="sm" /> : "Confirm Unlink"}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default InitializeStockManagement;