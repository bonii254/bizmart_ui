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
  Card,
  CardBody,
  CardHeader,
  Container,
} from "reactstrap";
import { useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useItemWarehouseStock } from "../../../Components/Hooks/useWarehouseStock";
import { useWarehouses } from "../../../Components/Hooks/useWarehouse";
import { useStockItems } from "../../../Components/Hooks/useStockItems";
import { StockItem } from "../../../types/stockitem";
import { ItemWarehouseStock } from "../../../types/warehouseStock";
import { handleBackendErrors } from "../../../helpers/form_utils";
import TablePagination from "../../TablePagination";

interface AssignItemFormValues {
  itemId: string;
  quantityOnHand: number;
  averageCost: number;
}

const WarehouseStockManagement: React.FC = () => {
  const { warehouseId: urlWarehouseId } = useParams<{ warehouseId: string }>();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(urlWarehouseId || "");
  const activeWarehouseId = urlWarehouseId || selectedWarehouseId;

  useEffect(() => {
    if (urlWarehouseId) {
      setSelectedWarehouseId(urlWarehouseId);
    }
  }, [urlWarehouseId]);

  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Search filter state
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!globalError) return;
    const timer = setTimeout(() => {
      setGlobalError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [globalError]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: masterWarehousesData, isLoading: isLoadingWarehouses } = useWarehouses();

  // Safely extract master warehouse list
  const masterWarehousesList = useMemo(() => {
    if (!masterWarehousesData) return [];
    if (Array.isArray(masterWarehousesData)) return masterWarehousesData;
    return (
      (masterWarehousesData as { warehouses?: any[]; data?: any[] }).warehouses ||
      (masterWarehousesData as { warehouses?: any[]; data?: any[] }).data ||
      []
    );
  }, [masterWarehousesData]);

  // Fetch stock items assigned to activeWarehouseId
  const {
    warehouseItems,
    isLoading: isLoadingStock,
    isAssigning,
    isRemoving,
    assignWarehouse,
    removeWarehouse,
  } = useItemWarehouseStock({ warehouseId: activeWarehouseId });

  // Fetch Master Stock Items list for assignment modal dropdown
  const { data: stockItemsData } = useStockItems();

  // Extract master list of stock items safely
  const stockItemsList = useMemo(() => {
    if (!stockItemsData) return [];
    if (Array.isArray(stockItemsData)) return stockItemsData;
    return (stockItemsData as { data?: StockItem[] }).data || [];
  }, [stockItemsData]);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");

  // Filter out stock items that are already assigned to this warehouse
  const unassignedStockItems = useMemo(() => {
    const assignedItemIds = new Set((warehouseItems || []).map((w) => w.itemId));
    return stockItemsList.filter((item) => {
      const id = item.itemId || item.id || "";
      return !assignedItemIds.has(id);
    });
  }, [stockItemsList, warehouseItems]);

  // Filter warehouse items based on search term
  const filteredStock = useMemo(() => {
    let list: ItemWarehouseStock[] = warehouseItems || [];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.itemCode?.toLowerCase().includes(lowerSearch) ||
          item.warehouseName?.toLowerCase().includes(lowerSearch) ||
          item.itemDescription?.toLowerCase().includes(lowerSearch)
      );
    }

    return list;
  }, [warehouseItems, searchTerm]);

  // Pagination Calculations
  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredStock.slice(start, start + pageSize);
  }, [filteredStock, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredStock.length / pageSize) || 1;

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
    getPageCount: () => totalPages,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: filteredStock }),
  };

  const formik = useFormik<AssignItemFormValues>({
    initialValues: {
      itemId: "",
      quantityOnHand: 0,
      averageCost: 0,
    },
    validationSchema: Yup.object({
      itemId: Yup.string().required("Please select a stock item"),
      quantityOnHand: Yup.number()
        .typeError("Quantity must be a number")
        .min(0, "Quantity cannot be negative")
        .optional(),
      averageCost: Yup.number()
        .typeError("Average cost must be a number")
        .min(0, "Average cost cannot be negative")
        .optional(),
    }),
    onSubmit: async (values) => {
      if (!activeWarehouseId) {
        setGlobalError("Please select a Warehouse before adding stock.");
        return;
      }
      try {
        setGlobalError(null);
        await assignWarehouse({
          itemId: values.itemId,
          payload: {
            warehouseId: activeWarehouseId,
            quantityOnHand: values.quantityOnHand,
            averageCost: values.averageCost,
          },
        });
        setModalOpen(false);
        formik.resetForm();
      } catch (error: unknown) {
        handleBackendErrors(error, formik.setErrors, setGlobalError);
      }
    },
  });

  const confirmDelete = async () => {
    if (!activeWarehouseId || !selectedItemId || deleteConfirmation !== "DELETE") return;
    try {
      await removeWarehouse({
        itemId: selectedItemId,
        warehouseId: activeWarehouseId,
      });
      setDeleteModal(false);
      setDeleteConfirmation("");
      setSelectedItemId(null);
    } catch (error: unknown) {
      handleBackendErrors(error, () => {}, setGlobalError);
    }
  };

  document.title = "Warehouse Stock | Inventory Management";

  return (
    <React.Fragment>
      <Container fluid className="px-2 px-md-3">
        <Row>
          <Col lg={12}>
            {globalError && (
              <Alert
                color="danger"
                className="mb-3 border-0 shadow-sm alert-dismissible fade show"
                toggle={() => setGlobalError(null)}
              >
                <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
                {globalError}
              </Alert>
            )}

            <Card className="shadow-sm border-0">
              <CardHeader className="border-bottom py-3 px-3 bg-white">
                <Row className="g-2 align-items-center justify-content-between">
                  {/* Warehouse Selection Dropdown */}
                  {!urlWarehouseId && (
                    <Col xl={4} lg={4} md={5} sm={12}>
                      <FormGroup className="mb-0">
                        <Input
                          type="select"
                          bsSize="sm"
                          className="fs-12 fw-medium border-primary"
                          value={selectedWarehouseId}
                          onChange={(e) => setSelectedWarehouseId(e.target.value)}
                          disabled={isLoadingWarehouses}
                        >
                          <option value="">-- Select Warehouse --</option>
                          {masterWarehousesList.map((wh: any) => {
                            const id = wh.id || wh.warehouseId || "";
                            const code = wh.code || wh.warehouseCode || "";
                            const name = wh.name || wh.warehouseName || "";
                            return (
                              <option key={id} value={id}>
                                {code ? `[${code}] ` : ""}
                                {name}
                              </option>
                            );
                          })}
                        </Input>
                      </FormGroup>
                    </Col>
                  )}

                  {/* Stock Item Search Filter */}
                  <Col xl={urlWarehouseId ? 4 : 4} lg={4} md={4} sm={12}>
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control form-control-sm fs-12 ps-4"
                        placeholder="Filter item code or description..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        disabled={!activeWarehouseId}
                      />
                      <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-13"></i>
                    </div>
                  </Col>

                  {/* Assign Stock Item Action */}
                  <Col xl={3} lg={3} md={3} sm={12} className="text-md-end">
                    <Button
                      color="primary"
                      size="sm"
                      className="fs-12 fw-medium px-3 text-nowrap w-100 w-md-auto"
                      disabled={!activeWarehouseId}
                      onClick={() => {
                        setGlobalError(null);
                        formik.resetForm();
                        setModalOpen(true);
                      }}
                    >
                      <i className="ri-add-line align-bottom me-1"></i> Add Item Stock
                    </Button>
                  </Col>
                </Row>
              </CardHeader>

              <CardBody className="p-0">
                <div className="table-responsive">
                  <Table hover size="sm" className="align-middle mb-0 custom-datatable table-sm">
                    <thead className="table-light text-muted text-uppercase fs-10">
                      <tr>
                        <th className="ps-3 py-2 text-nowrap">Item Code</th>
                        <th className="py-2">Item Description</th>
                        <th className="py-2 text-nowrap">Qty On Hand</th>
                        <th className="py-2 text-nowrap">Average Cost</th>
                        <th className="py-2 text-nowrap">Inventory Value</th>
                        <th className="text-end pe-3 py-2 text-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="fs-12">
                      {!activeWarehouseId ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted fs-12">
                            Please select a warehouse above to view its stock inventory items.
                          </td>
                        </tr>
                      ) : isLoadingStock ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4">
                            <Spinner size="sm" color="primary" />
                          </td>
                        </tr>
                      ) : paginatedRows.length > 0 ? (
                        paginatedRows.map((item: ItemWarehouseStock) => (
                          <tr key={item.itemId} className="align-middle">
                            <td className="py-2 ps-3 text-nowrap">
                              <span className="fw-semibold text-primary font-monospace fs-11">
                                {item.itemCode || "N/A"}
                              </span>
                            </td>
                            <td className="py-2">
                              <span className="text-dark fw-medium">
                                {item.itemDescription || "N/A"}
                              </span>
                            </td>
                            <td className="py-2 text-nowrap font-monospace">
                              {Number(item.quantityOnHand || 0).toLocaleString()}
                            </td>
                            <td className="py-2 text-nowrap font-monospace">
                              {Number(item.averageCost || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2 text-nowrap font-monospace fw-medium text-success">
                              {Number(item.inventoryValue || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-end pe-3 py-2 text-nowrap">
                              <div className="hstack gap-1 justify-content-end flex-nowrap">
                                <Button
                                  size="sm"
                                  color="soft-danger"
                                  className="btn-icon waves-effect waves-light"
                                  style={{ width: "26px", height: "26px", padding: 0 }}
                                  onClick={() => {
                                    setSelectedItemId(item.itemId);
                                    setDeleteConfirmation("");
                                    setDeleteModal(true);
                                  }}
                                  title="Remove Item from Warehouse"
                                >
                                  <i className="ri-delete-bin-line fs-13"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted fs-12">
                            No stock items found in this warehouse matching your filters.
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

      {/* Modal: Add Item Stock to Warehouse */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size="md">
        <ModalHeader className="bg-light p-3 border-bottom-dashed" toggle={() => setModalOpen(false)}>
          Add Stock Item to Warehouse
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody className="p-3 p-md-4">
            <Row className="g-3">
              <Col md={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">
                    Stock Item <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    bsSize="sm"
                    {...formik.getFieldProps("itemId")}
                    invalid={!!(formik.touched.itemId && formik.errors.itemId)}
                  >
                    <option value="">-- Select Stock Item --</option>
                    {unassignedStockItems.map((item: StockItem) => {
                      const id = item.itemId || item.id || "";
                      return (
                        <option key={id} value={id}>
                          [{item.itemCode}] {item.description}
                        </option>
                      );
                    })}
                  </Input>
                  <FormFeedback>{formik.errors.itemId}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Initial Qty On Hand</Label>
                  <Input
                    type="number"
                    bsSize="sm"
                    placeholder="0"
                    {...formik.getFieldProps("quantityOnHand")}
                    invalid={!!(formik.touched.quantityOnHand && formik.errors.quantityOnHand)}
                  />
                  <FormFeedback>{formik.errors.quantityOnHand}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6} sm={12}>
                <FormGroup>
                  <Label className="form-label fs-12 fw-medium">Average Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    bsSize="sm"
                    placeholder="0.00"
                    {...formik.getFieldProps("averageCost")}
                    invalid={!!(formik.touched.averageCost && formik.errors.averageCost)}
                  />
                  <FormFeedback>{formik.errors.averageCost}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light p-3">
            <Button color="link" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="primary" size="sm" disabled={isAssigning}>
              {isAssigning ? <Spinner size="sm" /> : "Add Item Stock"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete/Remove Confirmation Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered>
        <ModalBody className="p-4 text-center">
          <i className="ri-error-warning-line display-4 text-warning"></i>
          <div className="mt-3">
            <h5 className="mb-2 fs-15">Remove Item from Warehouse?</h5>
            <p className="text-muted fs-12">
              Type <strong>DELETE</strong> to confirm removing this stock item allocation from the warehouse.
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
                onClick={confirmDelete}
                disabled={isRemoving || deleteConfirmation !== "DELETE"}
              >
                {isRemoving ? <Spinner size="sm" /> : "Confirm Removal"}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default WarehouseStockManagement;