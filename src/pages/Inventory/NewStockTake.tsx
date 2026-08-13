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
  Label,
} from "reactstrap";

import { useStockTake } from "../../Components/Hooks/useStocktake";
import { useWarehouseStock } from "../../Components/Hooks/useWarehouseStock";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { CreateStockTakeLinePayload } from "../../types/stocktake";
import { WarehouseStock } from "../../types/warehouseStock";
import TablePagination from "../TablePagination";

const NewStockTake: React.FC = () => {
  const navigate = useNavigate();

  // Component States
  const [newWarehouseId, setNewWarehouseId] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // High-density pagination
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(25);

  const [countFormLines, setCountFormLines] = useState<
    (CreateStockTakeLinePayload & { stock_code?: string; description?: string; uom?: string })[]
  >([]);

  // Hook Integrations
  const { createStockTakeRecord, isCreating } = useStockTake();
  const { balances: liveWarehouseStock, isLoading: isStockLoading } = useWarehouseStock(newWarehouseId || undefined);
  const { data: warehouseData } = useWarehouses(true);

  const warehouseList = useMemo(() => warehouseData?.warehouses || [], [warehouseData]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0); 
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Auto-populate counting form when target warehouse changes
  useEffect(() => {
    if (liveWarehouseStock && liveWarehouseStock.length > 0) {
      const initialLines = liveWarehouseStock.map((stock: WarehouseStock) => ({
        item_id: stock.id,
        expected_quantity: String(stock.qtyOnHand || 0),
        counted_quantity: String(stock.qtyOnHand || 0),
        stock_code: stock.stockItem?.itemCode || "N/A",
        description: stock.stockItem?.description || "N/A",
        uom: stock.stockItem?.uom || "EA",
      }));
      setCountFormLines(initialLines);
      setPageIndex(0);
    } else {
      setCountFormLines([]);
    }
  }, [liveWarehouseStock]);

  // Filter Master List
  const filteredCountLines = useMemo(() => {
    if (!searchTerm) return countFormLines;
    const lower = searchTerm.toLowerCase();
    return countFormLines.filter(
      (line) =>
        line.stock_code?.toLowerCase().includes(lower) ||
        line.description?.toLowerCase().includes(lower)
    );
  }, [countFormLines, searchTerm]);

  // Slice Filtered List for Pagination View
  const paginatedCountLines = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredCountLines.slice(start, start + pageSize);
  }, [filteredCountLines, pageIndex, pageSize]);

  // Table Instance for TablePagination
  const pageCount = Math.ceil(filteredCountLines.length / pageSize) || 1;
  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => { setPageSize(size); setPageIndex(0); },
    previousPage: () => setPageIndex((prev) => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex((prev) => Math.min(prev + 1, pageCount - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < pageCount - 1,
    getPageCount: () => pageCount,
    getRowModel: () => ({ rows: paginatedCountLines }),
    getPrePaginationRowModel: () => ({ rows: filteredCountLines }),
  };

  const handleCountQtyChange = (itemId: string, val: string) => {
    setCountFormLines((prev) =>
      prev.map((line) =>
        line.item_id === itemId ? { ...line, counted_quantity: val } : line
      )
    );
  };

  const handleCreateStockTake = async () => {
    if (!newWarehouseId) return;
    try {
      await createStockTakeRecord({
        warehouse_id: newWarehouseId,
        lines: countFormLines.map((line) => ({
          item_id: line.item_id,
          counted_quantity: line.counted_quantity,
          expected_quantity: line.expected_quantity,
        })),
      });
      navigate('/inventory/stock-take');
    } catch (err) {}
  };

  document.title = "New Stock Take | Inventory";

  return (
    /* Standard Velzon Page Content Wrapper with Safe Structural Padding */
    <div className="page-content position-relative">
      <Container fluid className="p-0">
        <Row>
          <Col lg={12}>
            <Card className="shadow-sm border-0 mb-0">
              {/* Compact Header Bar */}
              <CardHeader className="border-bottom py-2 px-3 bg-white">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Button color="light" size="sm" className="btn-icon waves-effect py-0 px-1" onClick={() => navigate('/inventory/stock-take')}>
                      <i className="ri-arrow-left-line fs-13"></i>
                    </Button>
                    <div>
                      <h6 className="card-title mb-0 fs-13 fw-semibold text-dark">
                        New Stock Take Audit Session
                      </h6>
                      <small className="text-muted fs-10">
                        Perform physical count and compute variance live
                      </small>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-1.5">
                    <Button color="light" size="sm" className="fs-11 py-1 px-2" onClick={() => navigate('/inventory/stock-take')}>
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      className="fs-11 fw-medium py-1 px-2.5"
                      disabled={!newWarehouseId || countFormLines.length === 0 || isCreating}
                      onClick={handleCreateStockTake}
                    >
                      {isCreating ? <Spinner size="sm" className="me-1" /> : <i className="ri-save-line me-1"></i>}
                      Save Stock Audit
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="p-2.5">
                {/* Compact Control Row */}
                <Row className="g-2 mb-2">
                  <Col md={3} sm={12}>
                    <Label className="form-label fs-11 fw-medium text-muted mb-0.5">
                      Target Warehouse <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="select"
                      className="form-select form-select-sm fs-11 py-1"
                      value={newWarehouseId}
                      onChange={(e) => {
                        setNewWarehouseId(e.target.value);
                        setSearchInput("");
                      }}
                    >
                      <option value="">-- Select Warehouse --</option>
                      {warehouseList.map((wh: any) => (
                        <option key={wh.warehouseId} value={wh.warehouseId}>
                          {wh.warehouseName} ({wh.warehouseCode})
                        </option>
                      ))}
                    </Input>
                  </Col>

                  {newWarehouseId && (
                    <Col md={9} sm={12} className="d-flex align-items-end">
                      <div className="search-box position-relative w-100">
                        <Input
                          type="text"
                          className="form-control form-control-sm fs-11 ps-4 py-1"
                          placeholder="Search item code or description in selected warehouse..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-12"></i>
                      </div>
                    </Col>
                  )}
                </Row>

                {/* Ultra-Dense Item Counting Grid */}
                {newWarehouseId ? (
                  isStockLoading ? (
                    <div className="text-center py-4">
                      <Spinner size="sm" color="primary" className="me-2" />
                      <span className="text-muted fs-11">Loading warehouse stock balances...</span>
                    </div>
                  ) : countFormLines.length > 0 ? (
                    <>
                      <div className="table-responsive border rounded mb-2">
                        <Table hover responsive size="sm" className="align-middle mb-0 custom-datatable table-sm">
                          <thead className="table-light text-muted text-uppercase fs-9 border-bottom sticky-top" style={{ zIndex: 1 }}>
                            <tr>
                              <th style={{ width: "16%" }} className="ps-3 py-1.5">Stock Code</th>
                              <th style={{ width: "40%" }} className="py-1.5">Description</th>
                              <th style={{ width: "8%" }} className="py-1.5">UOM</th>
                              <th style={{ width: "12%" }} className="text-end py-1.5">System Qty</th>
                              <th style={{ width: "12%" }} className="text-end py-1.5">Counted Qty</th>
                              <th style={{ width: "12%" }} className="text-end pe-3 py-1.5">Variance</th>
                            </tr>
                          </thead>
                          <tbody className="fs-11 font-monospace">
                            {paginatedCountLines.map((line) => {
                              const exp = Number(line.expected_quantity || 0);
                              const cnt = Number(line.counted_quantity || 0);
                              const variance = cnt - exp;

                              return (
                                <tr key={line.item_id}>
                                  <td className="py-1 ps-3 fw-semibold text-primary">{line.stock_code}</td>
                                  <td className="py-1 font-sans-serif text-truncate" style={{ maxWidth: "340px" }}>
                                    {line.description}
                                  </td>
                                  <td className="py-1">
                                    <Badge color="light" className="text-secondary border fs-9 fw-normal px-1 py-0">
                                      {line.uom}
                                    </Badge>
                                  </td>
                                  <td className="py-1 text-end fw-semibold text-dark">
                                    {exp.toLocaleString()}
                                  </td>
                                  <td className="py-1 text-end">
                                    <Input
                                      type="number"
                                      bsSize="sm"
                                      className="form-control-sm text-end font-monospace fs-11 py-0 px-1 border-primary-subtle"
                                      style={{ maxWidth: "100px", marginLeft: "auto" }}
                                      value={line.counted_quantity}
                                      onChange={(e) => handleCountQtyChange(line.item_id, e.target.value)}
                                    />
                                  </td>
                                  <td
                                    className={`py-1 text-end pe-3 fw-semibold ${
                                      variance < 0 ? "text-danger" : variance > 0 ? "text-success" : "text-muted"
                                    }`}
                                  >
                                    {variance > 0 ? `+${variance}` : variance}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>

                      <TablePagination table={tableInstance} />
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted fs-11 border rounded">
                      <i className="ri-inbox-line display-6 d-block text-muted mb-1"></i>
                      No stock inventory items found in this warehouse.
                    </div>
                  )
                ) : (
                  <div className="text-center py-4 text-muted fs-11 border rounded bg-light-subtle">
                    <i className="ri-building-line display-6 d-block text-muted mb-1"></i>
                    Please select a warehouse above to load live stock balances.
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NewStockTake;