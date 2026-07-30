import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Modal, ModalHeader, ModalBody, ModalFooter, 
  Form, FormGroup, Label, Input, FormFeedback, Spinner, Alert,
  UncontrolledTooltip
} from 'reactstrap';
import { useWarehouseStock } from '../../../Components/Hooks/useWarehouseStock';
import { useCoolers } from '../../../Components/Hooks/useCoolers'; 
import { useStockItems } from '../../../Components/Hooks/useStockItems'; 
import { 
  InitializeStockPayload, 
  UpdateStockQtyPayload,
   WarehouseStock 
} from '../../../types/warehouseStock';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { handleBackendErrors } from '../../../helpers/form_utils';
import TablePagination from "../../TablePagination";

const WarehouseStockManagement = () => {
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filterWarehouseId, setFilterWarehouseId] = useState<string>('');
  
  const [initModalOpen, setInitModalOpen] = useState<boolean>(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState<boolean>(false);
  const [selectedStock, setSelectedStock] = useState<WarehouseStock | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { 
    balances, 
    isLoading, 
    isInitializing, 
    isAdjusting, 
    isRemoving,
    initializeBalance, 
    modifyStockQty, 
    deleteStockLink 
  } = useWarehouseStock(filterWarehouseId || undefined);

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useCoolers();
  const { data: stockItemsData, isLoading: isLoadingItems } = useStockItems();

  const initFormik = useFormik<InitializeStockPayload>({
    initialValues: {
      warehouse_id: '',
      stock_item_id: '',
      qty_on_hand: '',
      total_value: '',
    },
    validationSchema: Yup.object({
      warehouse_id: Yup.string().required('Please select a warehouse location'),
      stock_item_id: Yup.string().required('Please select a stock item/SKU'),
      qty_on_hand: Yup.number().typeError('Must be a number').min(0, 'Cannot be negative'),
      total_value: Yup.number().typeError('Must be a number').min(0, 'Cannot be negative'),
    }),
    onSubmit: async (values) => {
      try {
        setGlobalError(null);
        const payload = {
          ...values,
          qty_on_hand: values.qty_on_hand === '' ? undefined : values.qty_on_hand,
          total_value: values.total_value === '' ? undefined : values.total_value,
        };
        await initializeBalance(payload);
        setInitModalOpen(false);
        initFormik.resetForm();
      } catch (error: any) {
        handleBackendErrors(error, initFormik.setErrors, setGlobalError);
      }
    }
  });

  const adjustFormik = useFormik<UpdateStockQtyPayload>({
    initialValues: {
      qty_on_hand: '',
      total_value: '',
    },
    validationSchema: Yup.object({
      qty_on_hand: Yup.number().typeError('Must be a number').required('Quantity on hand is required'),
      total_value: Yup.number().typeError('Must be a number').required('Total asset value is required'),
    }),
    onSubmit: async (values) => {
      if (!selectedStock) return;
      try {
        setGlobalError(null);
        await modifyStockQty({ id: selectedStock.id, payload: values });
        setAdjustModalOpen(false);
        setSelectedStock(null);
        adjustFormik.resetForm();
      } catch (error: any) {
        handleBackendErrors(error, adjustFormik.setErrors, setGlobalError);
      }
    }
  });

  const handleRemoveLink = async (stock: WarehouseStock) => {
    if (parseFloat(stock.qty_on_hand) !== 0) {
      setGlobalError(`Cannot delete ledger link: ${stock.stock_item.description} has a non-zero inventory balance.`);
      return;
    }

    if (window.confirm(`Are you sure you want to remove the stock link for ${stock.stock_item.description}?`)) {
      try {
        setGlobalError(null);
        await deleteStockLink(stock.id);
      } catch (error: any) {
        setGlobalError(error.message || "An unexpected error occurred during record deletion.");
      }
    }
  };

  const paginatedRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return balances.slice(start, start + pageSize);
  }, [balances, pageIndex, pageSize]);

  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => { 
      setPageSize(size); 
      setPageIndex(0); 
    },
    previousPage: () => setPageIndex(prev => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex(prev => Math.min(prev + 1, Math.ceil(balances.length / pageSize) - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < Math.ceil(balances.length / pageSize) - 1,
    getPageCount: () => Math.ceil(balances.length / pageSize) || 1,
    getRowModel: () => ({ rows: paginatedRows }),
    getPrePaginationRowModel: () => ({ rows: balances }),
  };

  return (
    <React.Fragment>
      {globalError && <Alert color="danger" toggle={() => setGlobalError(null)} fade={false}>{globalError}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
        <div>
          <h5 className="mb-0">Warehouse Inventory Balances</h5>
          <p className="text-muted mb-0 fs-12">Track real-time stock levels, valuations, and ledger links across locations</p>
        </div>
        
        <div className="d-flex align-items-center gap-2">
          <div style={{ minWidth: '220px' }}>
            <Input
              type="select"
              id="filterWarehouse"
              className="form-select"
              value={filterWarehouseId}
              onChange={(e) => {
                setFilterWarehouseId(e.target.value);
                setPageIndex(0);
              }}
            >
              <option value="">All Warehouses / Centers</option>
              {warehousesData?.warehouses?.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Input>
          </div>

          <Button 
            color="primary" 
            onClick={() => {
              initFormik.resetForm();
              setGlobalError(null);
              setInitModalOpen(true);
            }}
          >
            <i className="ri-add-box-line align-bottom me-1"></i> Initialize Link
          </Button>
        </div>
      </div>

      <Table hover responsive className="align-middle custom-datatable">
        <thead className="table-light">
          <tr>
            <th>Cooler</th>
            <th>Item / SKU Profile</th>
            <th className="text-end">Qty On Hand</th>
            <th className="text-end">Unit Cost</th>
            <th className="text-end">Total Asset Value</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="text-center p-5">
                <Spinner color="primary" size="sm" className="me-2" /> Loading ledger positions...
              </td>
            </tr>
          ) : paginatedRows.length > 0 ? (
            paginatedRows.map((item: WarehouseStock) => {
              const isDeletable = parseFloat(item.qty_on_hand) === 0;
              return (
                <tr key={item.id}>
                  <td>
                    <span className="text-body fw-bold">{item.warehouse?.name || "Unknown Location"}</span>
                    <p className="text-muted mb-0 fs-11">Route: {item.warehouse?.route || "N/A"}</p>
                  </td>
                  <td>
                    <span className="text-info fw-bold">{item.stock_item?.description || "Unmapped Item"}</span>
                    <p className="text-muted mb-0 fs-11">
                      SKU: {item.stock_item?.stock_code || "N/A"} | UOM: <span className="badge bg-light text-dark">{item.stock_item?.uom}</span>
                    </p>
                  </td>
                  <td className="text-end fw-medium text-dark">
                    {parseFloat(item.qty_on_hand).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                  </td>
                  <td className="text-end text-muted">
                    KES {parseFloat(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-end fw-semibold text-primary">
                    KES {parseFloat(item.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      <Button 
                        size="sm" 
                        color="soft-warning" 
                        onClick={() => {
                          setSelectedStock(item);
                          adjustFormik.setValues({
                            qty_on_hand: item.qty_on_hand,
                            total_value: item.total_value
                          });
                          setGlobalError(null);
                          setAdjustModalOpen(true);
                        }}
                      >
                        Adjust
                      </Button>
                      
                      <span id={`delete-wrapper-${item.id}`} className="d-inline-block">
                        <Button 
                          size="sm" 
                          color="soft-danger" 
                          onClick={() => handleRemoveLink(item)}
                          disabled={isRemoving}
                        >
                          Delete
                        </Button>
                      </span>
                      {!isDeletable && (
                        <UncontrolledTooltip target={`delete-wrapper-${item.id}`}>
                          Cannot delete connection containing assets on hand. Must clear quantities to 0 first.
                        </UncontrolledTooltip>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="text-center p-4 text-muted">No warehouse stock configurations found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <TablePagination table={tableInstance} />

      <Modal isOpen={initModalOpen} toggle={() => setInitModalOpen(false)} centered>
        <ModalHeader toggle={() => setInitModalOpen(false)} className="bg-light p-3">
          Initialize Location Stock Connection
        </ModalHeader>
        <Form onSubmit={initFormik.handleSubmit}>
          <ModalBody>
            <FormGroup className="mb-3">
              <Label for="warehouse_id">Target Warehouse</Label>
              <Input 
                id="warehouse_id"
                type="select"
                {...initFormik.getFieldProps('warehouse_id')}
                invalid={!!(initFormik.touched.warehouse_id && initFormik.errors.warehouse_id)}
              >
                <option value="">Select Destination Center...</option>
                {isLoadingWarehouses ? <option disabled>Loading centers...</option> : 
                  warehousesData?.warehouses?.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.warehouse_code})</option>
                  ))
                }
              </Input>
              <FormFeedback>{initFormik.errors.warehouse_id}</FormFeedback>
            </FormGroup>

            <FormGroup className="mb-3">
              <Label for="stock_item_id">Inventory Item / SKU</Label>
              <Input 
                id="stock_item_id"
                type="select"
                {...initFormik.getFieldProps('stock_item_id')}
                invalid={!!(initFormik.touched.stock_item_id && initFormik.errors.stock_item_id)}
              >
                <option value="">Select SKU Profile...</option>
                {isLoadingItems ? <option disabled>Loading items...</option> : 
                  stockItemsData?.catalog?.map((item: any) => (
                    <option key={item.id} value={item.id}>{item.description} ({item.stock_code})</option>
                  ))
                }
              </Input>
              <FormFeedback>{initFormik.errors.stock_item_id}</FormFeedback>
            </FormGroup>

            <hr className="text-muted my-3" />
            <p className="text-muted fs-12 mb-2">Optional Initial Metrics (Defaults to 0 on database creation):</p>

            <div className="row">
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label for="qty_on_hand">Opening Balance Qty</Label>
                  <Input 
                    id="qty_on_hand"
                    placeholder="0.0000"
                    {...initFormik.getFieldProps('qty_on_hand')}
                    invalid={!!(initFormik.touched.qty_on_hand && initFormik.errors.qty_on_hand)}
                  />
                  <FormFeedback>{initFormik.errors.qty_on_hand}</FormFeedback>
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label for="total_value">Total Value (KES)</Label>
                  <Input 
                    id="total_value"
                    placeholder="0.00"
                    {...initFormik.getFieldProps('total_value')}
                    invalid={!!(initFormik.touched.total_value && initFormik.errors.total_value)}
                  />
                  <FormFeedback>{initFormik.errors.total_value}</FormFeedback>
                </FormGroup>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" color="link" onClick={() => setInitModalOpen(false)}>Cancel</Button>
            <Button type="submit" color="primary" disabled={isInitializing}>
              {isInitializing ? <Spinner size="sm" /> : "Establish Ledger Link"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Modal: Manual Adjustments Editor (PATCH) */}
      <Modal isOpen={adjustModalOpen} toggle={() => setAdjustModalOpen(false)} centered>
        <ModalHeader toggle={() => setAdjustModalOpen(false)} className="bg-light p-3">
          Manual Adjustment: {selectedStock?.stock_item.description}
        </ModalHeader>
        <Form onSubmit={adjustFormik.handleSubmit}>
          <ModalBody>
            <Alert color="warning" className="fs-12 border-0 shadow-none">
              <i className="ri-alert-line me-2 fw-bold"></i>
              Warning: Direct changes alter physical balance metrics and will modify asset book unit cost valuations.
            </Alert>

            <FormGroup className="mb-3">
              <Label for="adjust_qty">Physical Quantity On Hand</Label>
              <Input 
                id="adjust_qty"
                {...adjustFormik.getFieldProps('qty_on_hand')}
                invalid={!!(adjustFormik.touched.qty_on_hand && adjustFormik.errors.qty_on_hand)}
              />
              <FormFeedback>{adjustFormik.errors.qty_on_hand}</FormFeedback>
            </FormGroup>

            <FormGroup className="mb-0">
              <Label for="adjust_value">Total Inventory Ledger Value (KES)</Label>
              <Input 
                id="adjust_value"
                {...adjustFormik.getFieldProps('total_value')}
                invalid={!!(adjustFormik.touched.total_value && adjustFormik.errors.total_value)}
              />
              <FormFeedback>{adjustFormik.errors.total_value}</FormFeedback>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button type="button" color="link" onClick={() => setAdjustModalOpen(false)}>Cancel</Button>
            <Button type="submit" color="warning" disabled={isAdjusting}>
              {isAdjusting ? <Spinner size="sm" /> : "Commit Ledger Correction"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

export default WarehouseStockManagement;