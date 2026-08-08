import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Input,
  Spinner,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Container,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
} from "reactstrap";

import { useStockTake } from "../../Components/Hooks/useStocktake";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { StockTakeHeaderDetail, StockTakeStatus, StockTakeLineItem } from "../../types/stocktake";
import TablePagination from "../TablePagination";

const StockTakeList: React.FC = () => {
  const navigate = useNavigate();

  // Audit List State
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Audit Line Details Modal State
  const [activeModalTakeId, setActiveModalTakeId] = useState<string | null>(null);
  const [postingNotes, setPostingNotes] = useState<string>("");
  const [isPostConfirmOpen, setIsPostConfirmOpen] = useState<boolean>(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Hook Integrations
  const {
    stockTakes,
    paginationMeta,
    currentStockTake,
    isLoading: isAuditLoading,
    isPosting,
    isCancelling,
    postStockTakeRecord,
    cancelStockTakeRecord,
  } = useStockTake(
  );

  console.log("Stock Takes:", stockTakes);
  const { data: warehouseData } = useWarehouses(true);
  const warehouseList = useMemo(() => warehouseData?.warehouses || [], [warehouseData]);

  // Client Filter for Main Audit List
  const filteredStockTakes = useMemo(() => {
    if (!searchTerm) return stockTakes;
    const lower = searchTerm.toLowerCase();
    return stockTakes.filter(
      (st: StockTakeHeaderDetail) =>
        st.stock_take_number?.toLowerCase().includes(lower) ||
        st.warehouse_name?.toLowerCase().includes(lower) ||
        st.operator_name?.toLowerCase().includes(lower)
    );
  }, [stockTakes, searchTerm]);

  // Pagination Table Instance
  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => { setPageSize(size); setPageIndex(0); },
    previousPage: () => setPageIndex((prev) => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex((prev) => Math.min(prev + 1, paginationMeta.pages - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < paginationMeta.pages - 1,
    getPageCount: () => paginationMeta.pages || 1,
    getRowModel: () => ({ rows: filteredStockTakes }),
    getPrePaginationRowModel: () => ({ rows: filteredStockTakes }),
  };

  const getStatusBadge = (status?: StockTakeStatus) => {
    switch (status) {
      case "Draft": return <Badge color="secondary-subtle" className="text-secondary border border-secondary-subtle fs-10 px-1 py-0">Draft</Badge>;
      case "In Progress": return <Badge color="warning-subtle" className="text-warning border border-warning-subtle fs-10 px-1 py-0">In Progress</Badge>;
      case "Completed": return <Badge color="info-subtle" className="text-info border border-info-subtle fs-10 px-1 py-0">Completed</Badge>;
      case "Posted": return <Badge color="success-subtle" className="text-success border border-success-subtle fs-10 px-1 py-0">Posted</Badge>;
      case "Cancelled": return <Badge color="danger-subtle" className="text-danger border border-danger-subtle fs-10 px-1 py-0">Cancelled</Badge>;
      default: return <Badge color="light" className="text-body border fs-10 px-1 py-0">N/A</Badge>;
    }
  };

  const handleConfirmPost = async () => {
    if (!activeModalTakeId) return;
    try {
      await postStockTakeRecord({
        id: activeModalTakeId,
        payload: { stock_take_id: activeModalTakeId, notes: postingNotes },
      });
      setIsPostConfirmOpen(false);
      setActiveModalTakeId(null);
      setPostingNotes("");
    } catch (err) {}
  };

  const handleCancelStockTake = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this stock take session?")) {
      try {
        await cancelStockTakeRecord(id);
      } catch (err) {}
    }
  };

  document.title = "Stock Take Audits | Inventory";

  return (
    <React.Fragment>
      {/* Standard Velzon Page Content Wrapper with Safe Structural Padding */}
      <div className="page-content position-relative">
        <Container fluid className="p-0">
          <Row>
            <Col lg={12}>
              <Card id="stockTakeList" className="shadow-sm border-0 mb-0">
                {/* Ultra-Compact Card Header */}
                <CardHeader className="border-bottom py-2 px-3 bg-white">
                  <Row className="g-2 align-items-center justify-content-between">
                    <Col lg={5} md={6} sm={12}>
                      <div className="d-flex align-items-center gap-2">
                        <h6 className="card-title mb-0 fs-13 fw-semibold text-dark text-nowrap">
                          Stock Take Audits
                        </h6>
                        <div className="flex-grow-1" style={{ maxWidth: "210px" }}>
                          <Input
                            type="select"
                            className="form-select form-select-sm fs-11 py-1"
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
                      </div>
                    </Col>

                    <Col lg={7} md={6} sm={12}>
                      <div className="d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
                        <div className="search-box position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "180px" }}>
                          <Input
                            type="text"
                            className="form-control form-control-sm fs-11 ps-4 py-1"
                            placeholder="Search ref or operator..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                          />
                          <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-12"></i>
                        </div>

                        <Button
                          color="primary"
                          size="sm"
                          className="fs-11 fw-medium text-nowrap py-1 px-2"
                          onClick={() => navigate('/inventory/stock-take/new')}
                        >
                          <i className="ri-add-line me-1 align-middle"></i> New Stock Take
                        </Button>

                        <Badge color="primary-subtle" className="text-primary border border-primary-subtle fs-10 px-2 py-1 rounded-2 fw-medium text-nowrap">
                          {filteredStockTakes.length} Audits
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </CardHeader>

                <CardBody className="p-0">
                  <div className="table-responsive">
                    <Table hover responsive size="sm" className="align-middle mb-0 custom-datatable table-sm">
                      <thead className="table-light text-muted text-uppercase fs-10 border-bottom">
                        <tr>
                          <th style={{ width: "15%" }} className="ps-3 py-1.5">Stock Take #</th>
                          <th style={{ width: "22%" }} className="py-1.5">Warehouse</th>
                          <th style={{ width: "18%" }} className="py-1.5">Operator</th>
                          <th style={{ width: "12%" }} className="py-1.5">Status</th>
                          <th style={{ width: "18%" }} className="py-1.5">Posted Date</th>
                          <th style={{ width: "15%" }} className="text-end pe-3 py-1.5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="fs-11">
                        {isAuditLoading ? (
                          <tr>
                            <td colSpan={6} className="text-center py-3">
                              <Spinner size="sm" color="primary" className="me-2" />
                              <span className="text-muted fs-11">Loading audit records...</span>
                            </td>
                          </tr>
                        ) : filteredStockTakes.length > 0 ? (
                          filteredStockTakes.map((st: StockTakeHeaderDetail) => (
                            <tr key={st.stock_take_id} className="align-middle">
                              <td className="py-1 ps-3">
                                <span className="fw-semibold text-primary font-monospace fs-11">{st.stock_take_number}</span>
                              </td>
                              <td className="py-1">
                                <span className="text-dark fw-medium text-truncate d-inline-block align-middle" style={{ maxWidth: "200px" }}>
                                  {st.warehouse_name || "N/A"}
                                </span>
                              </td>
                              <td className="py-1 text-body">{st.operator_name || "System Operator"}</td>
                              <td className="py-1">{getStatusBadge(st.status)}</td>
                              <td className="py-1 text-muted font-monospace fs-10">
                                {st.posted_at ? new Date(st.posted_at).toLocaleString() : "Not Posted"}
                              </td>
                              <td className="py-1 text-end pe-3">
                                <div className="d-flex justify-content-end gap-1">
                                  <Button
                                    color="light"
                                    size="sm"
                                    className="btn-icon waves-effect fs-11 py-0 px-1"
                                    title="View Line Items"
                                    onClick={() => setActiveModalTakeId(st.stock_take_id)}
                                  >
                                    <i className="ri-eye-line text-secondary"></i>
                                  </Button>
                                  {st.status !== "Posted" && st.status !== "Cancelled" && (
                                    <>
                                      <Button
                                        color="success-subtle"
                                        size="sm"
                                        className="btn-icon waves-effect fs-11 py-0 px-1"
                                        title="Post Stock Take"
                                        onClick={() => {
                                          setActiveModalTakeId(st.stock_take_id);
                                          setIsPostConfirmOpen(true);
                                        }}
                                      >
                                        <i className="ri-check-double-line text-success"></i>
                                      </Button>
                                      <Button
                                        color="danger-subtle"
                                        size="sm"
                                        className="btn-icon waves-effect fs-11 py-0 px-1"
                                        title="Cancel Stock Take"
                                        disabled={isCancelling}
                                        onClick={() => handleCancelStockTake(st.stock_take_id)}
                                      >
                                        <i className="ri-close-circle-line text-danger"></i>
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-3 text-muted fs-11">
                              <i className="ri-inbox-line display-6 d-block text-muted mb-1"></i>
                              No stock take records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                  <div className="px-3 py-1.5 border-top">
                    <TablePagination table={tableInstance} />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Details & Posting Modal */}
      <Modal isOpen={!!activeModalTakeId} toggle={() => { setActiveModalTakeId(null); setIsPostConfirmOpen(false); }} size="lg" centered>
        <ModalHeader toggle={() => { setActiveModalTakeId(null); setIsPostConfirmOpen(false); }} className="bg-light py-2 px-3 fs-13 fw-semibold">
          Stock Take Audit: {currentStockTake?.stock_take_number || "Loading..."}
        </ModalHeader>
        <ModalBody className="p-2.5">
          {!currentStockTake ? (
            <div className="text-center py-3">
              <Spinner size="sm" color="primary" className="me-2" />
              <span className="text-muted fs-11">Fetching line item breakdown...</span>
            </div>
          ) : (
            <>
              <Row className="g-2 mb-2 bg-light p-2 rounded border fs-11">
                <Col md={4}><strong>Warehouse:</strong> {currentStockTake.warehouse_name || "N/A"}</Col>
                <Col md={4}><strong>Operator:</strong> {currentStockTake.operator_name || "N/A"}</Col>
                <Col md={4} className="text-md-end"><strong>Status:</strong> {getStatusBadge(currentStockTake.status)}</Col>
              </Row>
              <h6 className="fs-11 fw-semibold text-uppercase text-muted mb-1">Counted Line Items</h6>
              <div className="table-responsive mb-2 border rounded" style={{ maxHeight: "300px" }}>
                <Table size="sm" className="align-middle mb-0 table-sm">
                  <thead className="table-light fs-9 text-uppercase sticky-top">
                    <tr>
                      <th className="ps-2 py-1">Stock Code</th>
                      <th className="py-1">Description</th>
                      <th className="py-1">UOM</th>
                      <th className="text-end py-1">Expected</th>
                      <th className="text-end py-1">Counted</th>
                      <th className="text-end pe-2 py-1">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="fs-11 font-monospace">
                    {currentStockTake.lines?.map((line: StockTakeLineItem) => {
                      const varianceNum = Number(line.variance || 0);
                      return (
                        <tr key={line.stock_take_detail_id}>
                          <td className="ps-2 py-1 text-primary fw-semibold">{line.stock_code || "N/A"}</td>
                          <td className="font-sans-serif py-1 text-truncate" style={{ maxWidth: "250px" }}>{line.description || "N/A"}</td>
                          <td className="py-1"><Badge color="light" className="text-body border fs-9 fw-normal px-1 py-0">{line.uom || "EA"}</Badge></td>
                          <td className="text-end py-1">{Number(line.expected_quantity).toLocaleString()}</td>
                          <td className="text-end py-1 fw-semibold">{Number(line.counted_quantity).toLocaleString()}</td>
                          <td className={`text-end pe-2 py-1 fw-semibold ${varianceNum < 0 ? "text-danger" : varianceNum > 0 ? "text-success" : "text-muted"}`}>
                            {varianceNum > 0 ? `+${varianceNum}` : varianceNum}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              {isPostConfirmOpen && (
                <div className="bg-warning-subtle p-2 rounded border border-warning-subtle">
                  <h6 className="fs-12 fw-semibold text-warning mb-1">
                    <i className="ri-alert-line me-1"></i> Confirm Posting to Ledger
                  </h6>
                  <p className="fs-11 text-muted mb-1">
                    Posting will commit all inventory variance quantities permanently to live warehouse balances.
                  </p>
                  <FormGroup className="mb-0">
                    <Label className="fs-11 fw-medium mb-1">Posting Notes / Audit Log</Label>
                    <Input type="textarea" rows={2} className="form-control-sm fs-11" placeholder="Add administrative notes..." value={postingNotes} onChange={(e) => setPostingNotes(e.target.value)} />
                  </FormGroup>
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter className="py-1.5 px-3 bg-light">
          <Button color="light" size="sm" className="fs-11 py-1" onClick={() => { setActiveModalTakeId(null); setIsPostConfirmOpen(false); }}>Close</Button>
          {isPostConfirmOpen && (
            <Button color="success" size="sm" className="fs-11 fw-medium py-1" disabled={isPosting} onClick={handleConfirmPost}>
              {isPosting ? <Spinner size="sm" className="me-1" /> : <i className="ri-check-double-line me-1"></i>} Commit & Post Ledger
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default StockTakeList;