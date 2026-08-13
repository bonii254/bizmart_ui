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
import { UOM_VALUES, UOM } from "../../../types/stockitem";
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
        b.stockItem?.itemCode?.toLowerCase().includes(lower) ||
        b.stockItem?.description?.toLowerCase().includes(lower) ||
        b.warehouse?.warehouseName?.toLowerCase().includes(lower) ||
        b.warehouse?.warehouseCode?.toLowerCase().includes(lower)
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
  // Formik 1: Initialize Stock Modal
  // ---------------------------------------------------------------------------
  const initFormik = useFormik<InitializeStockPayload>({
    initialValues: {
      warehouseId: "",
      stockItemId: "",
      qtyOnHand: 0,
      unitCost: 0,
      sellingPrice: "",
      totalValue: 0,
      alternateUom: null,
      alternateUomConversionFactor: "",
    },
    validationSchema: Yup.object({
      warehouseId: Yup.string().required("Warehouse selection is required"),
      stockItemId: Yup.string().required("Stock item selection is required"),
      qtyOnHand: Yup.number().min(0, "Quantity cannot be negative").required("Quantity is required"),
      unitCost: Yup.number().min(0, "Unit cost cannot be negative").required("Unit cost is required"),
      sellingPrice: Yup.number().min(0, "Selling price cannot be negative").nullable().optional(),
      totalValue: Yup.number().min(0, "Total value cannot be negative").optional(),
      alternateUom: Yup.string().nullable().optional(),
      alternateUomConversionFactor: Yup.number().min(0.0001, "Factor must be greater than 0").nullable().optional(),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        const calculatedTotal = Number(values.qtyOnHand || 0) * Number(values.unitCost || 0);
        
        const payload: InitializeStockPayload = {
          warehouseId: values.warehouseId,
          stockItemId: values.stockItemId,
          qtyOnHand: Number(values.qtyOnHand),
          unitCost: Number(values.unitCost),
          sellingPrice: values.sellingPrice !== "" ? Number(values.sellingPrice) : null,
          totalValue: values.totalValue ? Number(values.totalValue) : calculatedTotal,
          alternateUom: (values.alternateUom as UOM) || null,
          alternateUomConversionFactor: values.alternateUomConversionFactor !== "" 
            ? Number(values.alternateUomConversionFactor) 
            : null,
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
      qtyOnHand: 0,
      unitCost: 0,
      totalValue: 0,
      sellingPrice: "",
      alternateUom: null,
      alternateUomConversionFactor: "",
    },
    validationSchema: Yup.object({
      qtyOnHand: Yup.number().min(0, "Quantity cannot be negative").optional(),
      unitCost: Yup.number().min(0, "Unit cost cannot be negative").optional(),
      totalValue: Yup.number().min(0, "Total value cannot be negative").optional(),
      sellingPrice: Yup.number().min(0, "Selling price cannot be negative").nullable().optional(),
      alternateUom: Yup.string().nullable().optional(),
      alternateUomConversionFactor: Yup.number().min(0.0001, "Factor must be greater than 0").nullable().optional(),
    }),
    onSubmit: async (values) => {
      if (!selectedRecord) return;
      try {
        setGlobalError(null);
        
        const payload: UpdateStockQtyPayload = {
          qtyOnHand: Number(values.qtyOnHand),
          unitCost: Number(values.unitCost),
          totalValue: Number(values.totalValue),
          sellingPrice: values.sellingPrice !== "" && values.sellingPrice !== null ? Number(values.sellingPrice) : null,
          alternateUom: (values.alternateUom as UOM) || null,
          alternateUomConversionFactor: values.alternateUomConversionFactor !== "" && values.alternateUomConversionFactor !== null
            ? Number(values.alternateUomConversionFactor) 
            : null,
        };

        await modifyStockQty({ id: selectedRecord.id, payload });
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
        qtyOnHand: Number(record.qtyOnHand) || 0,
        unitCost: Number(record.unitCost) || 0,
        totalValue: Number(record.totalValue) || 0,
        sellingPrice: record.sellingPrice ?? "",
        alternateUom: record.alternateUom || null,
        alternateUomConversionFactor: record.alternateUomConversionFactor ?? "",
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
      <Container fluid className="px-2 px-md-3">
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
                  <Col xl={3} lg={4} md={5} sm={12}>
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
                        <option key={wh.id || wh.warehouseId} value={wh.id || wh.warehouseId}>
                          {wh.warehouseName} ({wh.warehouseCode})
                        </option>
                      ))}
                    </Input>
                  </Col>

                  <Col xl={4} lg={4} md={4} sm={12}>
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

                  <Col xl={5} lg={4} md={3} sm={12} className="text-md-end">
                    <Button
                      color="primary"
                      size="sm"
                      className="fs-12 fw-medium px-3 text-nowrap w-100 w-md-auto"
                      onClick={() => {
                        setGlobalError(null);
                        initFormik.resetForm({
                          values: {
                            warehouseId: selectedWarehouseId || "",
                            stockItemId: "",
                            qtyOnHand: 0,
                            unitCost: 0,
                            sellingPrice: "",
                            totalValue: 0,
                            alternateUom: null,
                            alternateUomConversionFactor: "",
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
                  <Table hover size="sm" className="align-middle mb-0 custom-datatable table-sm">
                    <thead className="table-light text-muted text-uppercase fs-10">
                      <tr>
                        <th className="ps-3 py-2 text-nowrap">Stock Code</th>
                        <th className="py-2">Description</th>
                        <th className="py-2 text-nowrap">Warehouse</th>
                        <th className="py-2 text-nowrap">UOM</th>
                        <th className="text-start py-2 text-nowrap">Qty On Hand</th>
                        <th className="text-start py-2 text-nowrap">Unit Price</th>
                        <th className="text-start py-2 text-nowrap">Selling Price</th>
                        <th className="text-end pe-3 py-2 text-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="fs-12">
                      {isLoading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4">
                            <Spinner size="sm" color="primary" />
                          </td>
                        </tr>
                      ) : paginatedRows.length > 0 ? (
                        paginatedRows.map((item: WarehouseStock) => (
                          <tr key={item.id} className="align-middle">
                            <td className="py-2 ps-3 text-nowrap">
                              <span className="fw-semibold text-primary font-monospace fs-11">
                                {item.stockItem?.itemCode || "N/A"}
                              </span>
                            </td>
                            <td className="py-2">
                              <span
                                className="text-dark fw-medium text-truncate d-inline-block mw-100"
                                style={{ maxWidth: "220px" }}
                                title={item.stockItem?.description}
                              >
                                {item.stockItem?.description || "N/A"}
                              </span>
                            </td>
                            <td className="py-2 text-nowrap">
                              <div className="d-flex align-items-center">
                                <i className="ri-building-line text-muted me-1 fs-13"></i>
                                <span className="fw-medium text-body">
                                  {item.warehouse?.warehouseName || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 text-nowrap">
                              <Badge color="light" className="text-secondary border fs-10 fw-normal px-1.5 py-0.5 me-1">
                                Base: {item.uom || item.stockItem?.uom || "N/A"}
                              </Badge>
                            </td>
                            <td className="py-2 text-start fw-semibold text-dark font-monospace text-nowrap">
                              {Number(item.qtyOnHand || 0).toLocaleString()}
                            </td>
                            <td className="py-2 text-start text-dark fw-medium font-monospace text-nowrap">
                              {item.unitCost 
                                ? `Ksh ${Number(item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                                : "-"}
                            </td>
                            <td className="py-2 text-start fw-semibold text-success font-monospace text-nowrap">
                              Ksh {Number(item.sellingPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-end pe-3 py-2 text-nowrap">
                              <div className="hstack gap-1 justify-content-end flex-nowrap">
                                <Button
                                  size="sm"
                                  color="soft-info"
                                  className="btn-icon waves-effect waves-light"
                                  style={{ width: "26px", height: "26px", padding: 0 }}
                                  onClick={() => handleOpenAdjustModal(item)}
                                  title="Adjust Quantities & Prices"
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
                          <td colSpan={8} className="text-center py-4 text-muted fs-12">
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
          <ModalBody className="p-3 p-md-4">
            <Row className="g-3">
              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Warehouse <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    bsSize="sm"
                    {...initFormik.getFieldProps("warehouseId")}
                    invalid={!!(initFormik.touched.warehouseId && initFormik.errors.warehouseId)}
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouseList.map((wh: any) => (
                      <option key={wh.id || wh.warehouseId} value={wh.id || wh.warehouseId}>
                        {wh.warehouseName} ({wh.warehouseCode})
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{initFormik.errors.warehouseId}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Stock Item <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    bsSize="sm"
                    {...initFormik.getFieldProps("stockItemId")}
                    invalid={!!(initFormik.touched.stockItemId && initFormik.errors.stockItemId)}
                  >
                    <option value="">Select Stock Item...</option>
                    {stockCatalog.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.itemCode} - {item.description} ({item.uom})
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{initFormik.errors.stockItemId}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Initial Quantity On Hand <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    bsSize="sm"
                    placeholder="0"
                    {...initFormik.getFieldProps("qtyOnHand")}
                    invalid={!!(initFormik.touched.qtyOnHand && initFormik.errors.qtyOnHand)}
                  />
                  <FormFeedback>{initFormik.errors.qtyOnHand}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Unit Cost (Ksh) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    placeholder="0.00"
                    {...initFormik.getFieldProps("unitCost")}
                    invalid={!!(initFormik.touched.unitCost && initFormik.errors.unitCost)}
                  />
                  <FormFeedback>{initFormik.errors.unitCost}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Selling Price (Ksh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    placeholder="0.00 (Optional)"
                    {...initFormik.getFieldProps("sellingPrice")}
                    invalid={!!(initFormik.touched.sellingPrice && initFormik.errors.sellingPrice)}
                  />
                  <FormFeedback>{initFormik.errors.sellingPrice}</FormFeedback>
                </FormGroup>
              </Col>

              {/* Secondary / Dual-UOM Controls */}
              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Alternate UOM (Optional)</Label>
                  <Input
                    type="select"
                    bsSize="sm"
                    {...initFormik.getFieldProps("alternateUom")}
                    invalid={!!(initFormik.touched.alternateUom && initFormik.errors.alternateUom)}
                  >
                    <option value="">-- No Alternate UOM --</option>
                    {UOM_VALUES.map((uomVal) => (
                      <option key={uomVal} value={uomVal}>
                        {uomVal}
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{initFormik.errors.alternateUom}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Alt UOM Conversion Factor</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    bsSize="sm"
                    placeholder="e.g. 10 (1 Alt = 10 Base)"
                    {...initFormik.getFieldProps("alternateUomConversionFactor")}
                    invalid={
                      !!(
                        initFormik.touched.alternateUomConversionFactor &&
                        initFormik.errors.alternateUomConversionFactor
                      )
                    }
                  />
                  <FormFeedback>{initFormik.errors.alternateUomConversionFactor}</FormFeedback>
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

      {/* Modal 2: Adjust Stock Quantities & Price Metadata */}
      <Modal isOpen={adjustModalOpen} toggle={() => setAdjustModalOpen(false)} centered size="lg">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setAdjustModalOpen(false)}>
          Adjust Stock Quantities & Pricing
        </ModalHeader>
        <Form onSubmit={adjustFormik.handleSubmit}>
          <ModalBody className="p-3 p-md-4">
            {selectedRecord && (
              <div className="mb-3 p-2 bg-light rounded border fs-12">
                <div>
                  <strong>Item:</strong> {selectedRecord.stockItem?.description} ({selectedRecord.stockItem?.itemCode})
                </div>
                <div>
                  <strong>Warehouse:</strong> {selectedRecord.warehouse?.warehouseName}
                </div>
              </div>
            )}
            <Row className="g-3">
              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Quantity On Hand</Label>
                  <Input
                    type="number"
                    bsSize="sm"
                    {...adjustFormik.getFieldProps("qtyOnHand")}
                    invalid={!!(adjustFormik.touched.qtyOnHand && adjustFormik.errors.qtyOnHand)}
                  />
                  <FormFeedback>{adjustFormik.errors.qtyOnHand}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Unit Cost (Ksh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    {...adjustFormik.getFieldProps("unitCost")}
                    invalid={!!(adjustFormik.touched.unitCost && adjustFormik.errors.unitCost)}
                  />
                  <FormFeedback>{adjustFormik.errors.unitCost}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Total Value (Ksh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    {...adjustFormik.getFieldProps("totalValue")}
                    invalid={!!(adjustFormik.touched.totalValue && adjustFormik.errors.totalValue)}
                  />
                  <FormFeedback>{adjustFormik.errors.totalValue}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Selling Price (Ksh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    {...adjustFormik.getFieldProps("sellingPrice")}
                    invalid={!!(adjustFormik.touched.sellingPrice && adjustFormik.errors.sellingPrice)}
                  />
                  <FormFeedback>{adjustFormik.errors.sellingPrice}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Alternate UOM</Label>
                  <Input
                    type="select"
                    bsSize="sm"
                    {...adjustFormik.getFieldProps("alternateUom")}
                    invalid={!!(adjustFormik.touched.alternateUom && adjustFormik.errors.alternateUom)}
                  >
                    <option value="">-- None --</option>
                    {UOM_VALUES.map((uomVal) => (
                      <option key={uomVal} value={uomVal}>
                        {uomVal}
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{adjustFormik.errors.alternateUom}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={4} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Alt Conversion Factor</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    bsSize="sm"
                    {...adjustFormik.getFieldProps("alternateUomConversionFactor")}
                    invalid={
                      !!(
                        adjustFormik.touched.alternateUomConversionFactor &&
                        adjustFormik.errors.alternateUomConversionFactor
                      )
                    }
                  />
                  <FormFeedback>{adjustFormik.errors.alternateUomConversionFactor}</FormFeedback>
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