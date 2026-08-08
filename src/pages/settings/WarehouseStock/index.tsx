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

  const { data: warehouseData, isLoading: isLoadingWarehouses } = useWarehouses(true);
  const { data: stockItemCatalog, isLoading: isLoadingStockItems } = useStockItems("", true);

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

  // Formik: Initialize Stock Modal
  const initFormik = useFormik<InitializeStockPayload>({
    initialValues: {
      warehouse_id: "",
      stock_item_id: "",
      qty_on_hand: 0,
      unit_cost: 0,
    },
    validationSchema: Yup.object({
      warehouse_id: Yup.string().required("Warehouse selection is required"),
      stock_item_id: Yup.string().required("Stock item selection is required"),
      qty_on_hand: Yup.number().min(0, "Quantity cannot be negative").required("Quantity is required"),
      total_value: Yup.number().min(0, "Total value cannot be negative").required("Total value is required"),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        await initializeBalance(values);
        setInitModalOpen(false);
      } catch (error: any) {
        handleBackendErrors(error, initFormik.setErrors, setGlobalError);
      }
    },
  });

  // Formik: Adjust Stock Modal
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

  return (
    <React.Fragment>
      {globalError && (
        <Alert color="danger" className="mb-3">
          {globalError}
        </Alert>
      )}

      {/* Ultra-Compact Single-Line Control Toolbar */}
      <div className="row g-2 align-items-center mb-3">
        {/* 1. Warehouse Dropdown */}
        <div className="col-12 col-sm-6 col-md-3">
          <Input
            type="select"
            className="form-select form-select-sm fs-13"
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
        </div>

        {/* 2. Compact Search Input */}
        <div className="col-12 col-sm-6 col-md-4">
          <div className="search-box position-relative">
            <Input
              type="text"
              className="form-control form-control-sm fs-13 ps-4"
              placeholder="Filter code, item, or warehouse..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-14"></i>
          </div>
        </div>

        {/* 3. Action Button Aligned End */}
        <div className="col-12 col-md-5 text-md-end">
          <Button
            color="primary"
            size="sm"
            className="fs-13 fw-medium px-3"
            onClick={() => {
              setGlobalError(null);
              initFormik.resetForm({
                values: {
                  warehouse_id: selectedWarehouseId || "",
                  stock_item_id: "",
                  qty_on_hand: 0,
                  unit_cost: 0,
                },
              });
              setInitModalOpen(true);
            }}
          >
            <i className="ri-add-line align-bottom me-1"></i> Initialize Stock Balance
          </Button>
        </div>
      </div>

      {/* High-Density Compact Data Table */}
      <Table hover responsive className="align-middle table-nowrap mb-0 custom-datatable">
        <thead className="table-light text-muted text-uppercase fs-11">
          <tr>
            <th style={{ width: "12%" }}>Stock Code</th>
            <th style={{ width: "28%" }}>Description</th>
            <th style={{ width: "20%" }}>Warehouse</th>
            <th style={{ width: "10%" }}>UOM</th>
            <th style={{ width: "10%" }} className="text-end">Qty On Hand</th>
            <th style={{ width: "12%" }} className="text-start">Total Value</th>
            <th style={{ width: "8%" }} className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody className="fs-13">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="text-center py-4">
                <Spinner size="sm" color="primary" />
              </td>
            </tr>
          ) : paginatedRows.length > 0 ? (
            paginatedRows.map((item: WarehouseStock) => (
              <tr key={item.id} className="align-middle">
                {/* 1. Stock Code */}
                <td className="py-2">
                  <span className="fw-semibold text-primary font-monospace fs-12">
                    {item.stock_item?.stock_code || "N/A"}
                  </span>
                </td>

                {/* 2. Description */}
                <td className="py-2">
                  <span
                    className="text-dark fw-medium text-truncate d-inline-block"
                    style={{ maxWidth: "300px" }}
                    title={item.stock_item?.description}
                  >
                    {item.stock_item?.description || "N/A"}
                  </span>
                </td>

                {/* 3. Warehouse */}
                <td className="py-2">
                  <div className="d-flex align-items-center">
                    <i className="ri-building-line text-muted me-1 fs-14"></i>
                    <span className="fw-medium text-body">
                      {item.warehouse?.name || "N/A"}
                    </span>
                    {item.warehouse?.warehouse_code && (
                      <Badge color="light" className="text-muted ms-1 border fs-10">
                        {item.warehouse.warehouse_code}
                      </Badge>
                    )}
                  </div>
                </td>

                {/* 4. UOM */}
                <td className="py-2">
                  <span className="badge bg-light text-secondary border fs-11 fw-normal px-2 py-1">
                    {item.stock_item?.uom || "N/A"}
                  </span>
                </td>

                {/* 5. Quantity On Hand */}
                <td className="py-2 text-start fw-semibold text-dark">
                  {Number(item.qty_on_hand).toLocaleString()}
                </td>

                {/* 6. Total Value (Ksh) */}
                <td className="py-2 text-start fw-semibold text-success">
                  Ksh {Number(item.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                {/* 7. Action Buttons */}
                <td className="text-end py-2">
                  <div className="d-flex gap-1 justify-content-end">
                    <Button
                      size="sm"
                      color="soft-info"
                      className="btn-icon waves-effect waves-light"
                      style={{ width: "28px", height: "28px", padding: 0 }}
                      onClick={() => handleOpenAdjustModal(item)}
                      title="Adjust Quantities"
                    >
                      <i className="ri-edit-box-line fs-14"></i>
                    </Button>
                    <Button
                      size="sm"
                      color="soft-danger"
                      className="btn-icon waves-effect waves-light"
                      style={{ width: "28px", height: "28px", padding: 0 }}
                      onClick={() => {
                        setSelectedRecord(item);
                        setDeleteConfirmation("");
                        setDeleteModal(true);
                      }}
                      title="Remove Stock Link"
                    >
                      <i className="ri-delete-bin-line fs-14"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-4 text-muted fs-13">
                No stock balance records found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      {/* Modal 1: Initialize Stock Balance */}
      <Modal
        isOpen={initModalOpen}
        toggle={() => setInitModalOpen(false)}
        centered
        size="lg"
      >
        <ModalHeader
          className="bg-light p-3 border-bottom-dashed"
          toggle={() => setInitModalOpen(false)}
        >
          Initialize Stock Balance
        </ModalHeader>
        <Form onSubmit={initFormik.handleSubmit}>
          <ModalBody className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Warehouse</Label>
                  <Input
                    type="select"
                    {...initFormik.getFieldProps("warehouse_id")}
                    invalid={
                      !!(initFormik.touched.warehouse_id && initFormik.errors.warehouse_id)
                    }
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
                  <Label className="form-label">Stock Item</Label>
                  <Input
                    type="select"
                    {...initFormik.getFieldProps("stock_item_id")}
                    invalid={
                      !!(initFormik.touched.stock_item_id && initFormik.errors.stock_item_id)
                    }
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
                  <Label className="form-label">Initial Quantity On Hand</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    {...initFormik.getFieldProps("qty_on_hand")}
                    invalid={
                      !!(initFormik.touched.qty_on_hand && initFormik.errors.qty_on_hand)
                    }
                  />
                  <FormFeedback>{initFormik.errors.qty_on_hand}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Unit Cost (Ksh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...initFormik.getFieldProps("unit_cost")}
                    invalid={
                      !!(initFormik.touched.unit_cost && initFormik.errors.unit_cost)
                    }
                  />
                  <FormFeedback>{initFormik.errors.unit_cost}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" onClick={() => setInitModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={isInitializing}>
              {isInitializing ? <Spinner size="sm" /> : "Link & Initialize"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Modal 2: Adjust Existing Stock Quantities */}
      <Modal
        isOpen={adjustModalOpen}
        toggle={() => setAdjustModalOpen(false)}
        centered
      >
        <ModalHeader
          className="bg-light p-3 border-bottom-dashed"
          toggle={() => setAdjustModalOpen(false)}
        >
          Adjust Stock Quantities
        </ModalHeader>
        <Form onSubmit={adjustFormik.handleSubmit}>
          <ModalBody className="p-4">
            {selectedRecord && (
              <div className="mb-3 p-2 bg-light rounded border fs-13">
                <div>
                  <strong>Item:</strong> {selectedRecord.stock_item?.description} (
                  {selectedRecord.stock_item?.stock_code})
                </div>
                <div>
                  <strong>Warehouse:</strong> {selectedRecord.warehouse?.name}
                </div>
              </div>
            )}
            <Row className="g-3">
              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">Quantity On Hand</Label>
                  <Input
                    type="number"
                    {...adjustFormik.getFieldProps("qty_on_hand")}
                    invalid={
                      !!(adjustFormik.touched.qty_on_hand && adjustFormik.errors.qty_on_hand)
                    }
                  />
                  <FormFeedback>{adjustFormik.errors.qty_on_hand}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">Total Value (Ksh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...adjustFormik.getFieldProps("total_value")}
                    invalid={
                      !!(adjustFormik.touched.total_value && adjustFormik.errors.total_value)
                    }
                  />
                  <FormFeedback>{adjustFormik.errors.total_value}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={isAdjusting}>
              {isAdjusting ? <Spinner size="sm" /> : "Save Adjustments"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Modal 3: Delete / Unlink Confirmation */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
        <ModalBody className="p-5 text-center">
          <i className="ri-error-warning-line display-4 text-warning"></i>
          <div className="mt-4">
            <h4 className="mb-2">Unlink Stock Record?</h4>
            <p className="text-muted fs-14">
              Type <strong>DELETE</strong> to confirm removing this stock record link from the warehouse.
            </p>
            <Input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="text-center mb-4"
              placeholder="Enter DELETE"
            />
            <div className="hstack gap-2 justify-content-center">
              <Button color="light" onClick={() => setDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                color="danger"
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