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
import { useItemWarehouseStock } from "../../Components/Hooks/useWarehouseStock";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { useStockItems } from "../../Components/Hooks/useStockItems";

import { CreateStockTakeRequest, StockTakeLineRequest } from "../../types/stocktake";
import { Warehouse } from "../../types/warehouse";
import { StockItem } from "../../types/stockitem";
import { getLoggedinUser } from "../../helpers/api_helper";

import TablePagination from "../TablePagination";

interface StockTakeAuditLine extends StockTakeLineRequest {
  itemCode: string;
  itemDescription: string;
  stockUom: string;
  systemQuantity: number;
}

const NewStockTake: React.FC = () => {
  const navigate = useNavigate();

  const [newWarehouseId, setNewWarehouseId] = useState<string>("");
  const { data: user } = getLoggedinUser();
  const operatorId = user?.operatorId || user?.id || "";

  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(25);

  const [countFormLines, setCountFormLines] = useState<StockTakeAuditLine[]>([]);

  const { createStockTakeRecord, isCreating } = useStockTake();

  // 1. Memoize hook parameters to prevent object reference changes on every render
  const warehouseStockParams = useMemo(
    () => ({ warehouseId: newWarehouseId || undefined }),
    [newWarehouseId]
  );

  const { stockItems: rawStockItems, isLoading: isStockLoading } =
    useItemWarehouseStock(warehouseStockParams);
  const { data: warehouseData } = useWarehouses();
  const { data: stockCatalogData } = useStockItems();

  const warehouseList: Warehouse[] = useMemo(() => {
    if (Array.isArray(warehouseData)) return warehouseData;
    if (warehouseData && Array.isArray((warehouseData as any).data)) return (warehouseData as any).data;
    if (warehouseData && Array.isArray((warehouseData as any).warehouses)) return (warehouseData as any).warehouses;
    return [];
  }, [warehouseData]);

  const stockCatalogMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    const catalog = Array.isArray(stockCatalogData)
      ? stockCatalogData
      : (stockCatalogData as any)?.data || [];

    if (Array.isArray(catalog)) {
      catalog.forEach((item: any) => {
        const id = item.itemId || item.id || item.item_id;
        const code = item.itemCode || item.code || item.item_code;
        if (id) map.set(String(id), item);
        if (code) map.set(String(code), item);
      });
    }
    return map;
  }, [stockCatalogData]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // 2. Derive stable primitive signature for rawStockItems to prevent infinite loops
  const stockItemsSignature = useMemo(() => {
    if (!rawStockItems || !Array.isArray(rawStockItems)) return "";
    return rawStockItems
      .map(
        (s: any) =>
          `${s.itemId || s.id || s.item_id}_${s.quantityOnHand ?? s.quantity_on_hand ?? 0}`
      )
      .join("|");
  }, [rawStockItems]);

  // 3. Populate audit form lines safely when stock item data changes
  useEffect(() => {
    if (!newWarehouseId) {
      setCountFormLines([]);
      return;
    }

    if (rawStockItems && Array.isArray(rawStockItems) && rawStockItems.length > 0) {
      const initialLines: StockTakeAuditLine[] = rawStockItems.map((stock: any) => {
        const itemId = String(stock.itemId || stock.id || stock.item_id || "");
        const itemCode = stock.itemCode || stock.code || stock.item_code || "N/A";
        const itemDescription =
          stock.itemDescription || stock.description || stock.item_description || "N/A";

        const catalogItem = stockCatalogMap.get(itemId) || stockCatalogMap.get(itemCode);
        const sysQty = Number(stock.quantityOnHand ?? stock.quantity_on_hand ?? stock.quantity ?? 0);
        const cost = Number(stock.averageCost ?? stock.average_cost ?? stock.unitCost ?? 0);

        return {
          itemId,
          itemCode,
          itemDescription,
          stockUom: catalogItem?.stockUom || stock.uom || stock.stockUom || "EA",
          systemQuantity: sysQty,
          countedQuantity: sysQty,
          unitCost: cost,
        };
      });

      setCountFormLines(initialLines);
      setPageIndex(0);
    } else {
      setCountFormLines([]);
    }
  }, [stockItemsSignature, newWarehouseId, stockCatalogMap]);

  const filteredCountLines = useMemo(() => {
    if (!searchTerm) return countFormLines;
    const lower = searchTerm.toLowerCase();
    return countFormLines.filter(
      (line) =>
        line.itemCode.toLowerCase().includes(lower) ||
        line.itemDescription.toLowerCase().includes(lower)
    );
  }, [countFormLines, searchTerm]);

  const paginatedCountLines = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredCountLines.slice(start, start + pageSize);
  }, [filteredCountLines, pageIndex, pageSize]);

  const pageCount = Math.ceil(filteredCountLines.length / pageSize) || 1;
  const tableInstance = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    setPageSize: (size: number) => {
      setPageSize(size);
      setPageIndex(0);
    },
    previousPage: () => setPageIndex((prev) => Math.max(prev - 1, 0)),
    nextPage: () => setPageIndex((prev) => Math.min(prev + 1, pageCount - 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < pageCount - 1,
    getPageCount: () => pageCount,
    getRowModel: () => ({ rows: paginatedCountLines }),
    getPrePaginationRowModel: () => ({ rows: filteredCountLines }),
  };

  const handleCountQtyChange = (itemId: string, val: string) => {
    const numVal = val === "" ? 0 : Number(val);
    setCountFormLines((prev) =>
      prev.map((line) =>
        line.itemId === itemId ? { ...line, countedQuantity: numVal } : line
      )
    );
  };

  const handleCreateStockTake = async () => {
    if (!newWarehouseId) return;

    const payload: CreateStockTakeRequest = {
      warehouseId: newWarehouseId,
      operatorId: operatorId,
      lines: countFormLines.map((line) => {
        const qty = parseFloat(String(line.countedQuantity));
        const cost = parseFloat(String(line.unitCost));
        return {
          itemId: line.itemId,
          countedQuantity: Number.isNaN(qty) ? 0 : qty,
          unitCost: Number.isNaN(cost) ? 0 : cost,
        };
      }),
    };

    try {
      await createStockTakeRecord(payload);
      navigate("/inventory/stock-take");
    } catch (err) {
      // Handled by notification handler in hook
    }
  };

  document.title = "New Stock Take | Inventory";

  return (
    <div className="page-content position-relative">
      <Container fluid className="p-0">
        <Row>
          <Col lg={12}>
            <Card className="shadow-sm border-0 mb-0">
              <CardHeader className="border-bottom py-2 px-3 bg-white">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      color="light"
                      size="sm"
                      className="btn-icon waves-effect py-0 px-1"
                      onClick={() => navigate("/inventory/stock-take")}
                    >
                      <i className="ri-arrow-left-line fs-13"></i>
                    </Button>
                    <div>
                      <h6 className="card-title mb-0 fs-13 fw-semibold text-dark">
                        New Stock Take Audit Session
                      </h6>
                      <small className="text-muted fs-10">
                        Perform physical count and submit audit lines
                      </small>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-1.5">
                    <Button
                      color="light"
                      size="sm"
                      className="fs-11 py-1 px-2"
                      onClick={() => navigate("/inventory/stock-take")}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      className="fs-11 fw-medium py-1 px-2.5"
                      disabled={
                        !newWarehouseId ||
                        countFormLines.length === 0 ||
                        isCreating
                      }
                      onClick={handleCreateStockTake}
                    >
                      {isCreating ? (
                        <Spinner size="sm" className="me-1" />
                      ) : (
                        <i className="ri-save-line me-1"></i>
                      )}
                      Save Stock Audit
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="p-2.5">
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
                      {warehouseList.map((wh: any) => {
                        const whId = wh.warehouseId || wh.id || wh.warehouse_id;
                        const whName = wh.warehouseName || wh.name || wh.warehouse_name;
                        const whCode = wh.warehouseCode || wh.code || wh.warehouse_code;
                        return (
                          <option key={whId} value={whId}>
                            {whName} ({whCode})
                          </option>
                        );
                      })}
                    </Input>
                  </Col>

                  {newWarehouseId && (
                    <Col md={9} sm={12} className="d-flex align-items-end">
                      <div className="search-box position-relative w-100">
                        <Input
                          type="text"
                          className="form-control form-control-sm fs-11 ps-4 py-1"
                          placeholder="Search stock code or description..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-12"></i>
                      </div>
                    </Col>
                  )}
                </Row>

                {newWarehouseId ? (
                  isStockLoading ? (
                    <div className="text-center py-4">
                      <Spinner size="sm" color="primary" className="me-2" />
                      <span className="text-muted fs-11">
                        Loading warehouse stock balances...
                      </span>
                    </div>
                  ) : countFormLines.length > 0 ? (
                    <>
                      <div className="table-responsive border rounded mb-2">
                        <Table
                          hover
                          responsive
                          size="sm"
                          className="align-middle mb-0 custom-datatable table-sm"
                        >
                          <thead
                            className="table-light text-muted text-uppercase fs-9 border-bottom sticky-top"
                            style={{ zIndex: 1 }}
                          >
                            <tr>
                              <th style={{ width: "16%" }} className="ps-3 py-1.5">
                                Stock Code
                              </th>
                              <th style={{ width: "36%" }} className="py-1.5">
                                Description
                              </th>
                              <th style={{ width: "8%" }} className="py-1.5">
                                UOM
                              </th>
                              <th style={{ width: "12%" }} className="text-end py-1.5">
                                System Qty
                              </th>
                              <th style={{ width: "14%" }} className="text-end py-1.5">
                                Counted Qty
                              </th>
                              <th
                                style={{ width: "14%" }}
                                className="text-end pe-3 py-1.5"
                              >
                                Variance
                              </th>
                            </tr>
                          </thead>
                          <tbody className="fs-11 font-monospace">
                            {paginatedCountLines.map((line) => {
                              const exp = line.systemQuantity;
                              const cnt = line.countedQuantity;
                              const variance = cnt - exp;

                              return (
                                <tr key={line.itemId}>
                                  <td className="py-1 ps-3 fw-semibold text-primary">
                                    {line.itemCode}
                                  </td>
                                  <td
                                    className="py-1 font-sans-serif text-truncate"
                                    style={{ maxWidth: "340px" }}
                                  >
                                    {line.itemDescription}
                                  </td>
                                  <td className="py-1">
                                    <Badge
                                      color="light"
                                      className="text-secondary border fs-9 fw-normal px-1 py-0"
                                    >
                                      {line.stockUom}
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
                                      style={{
                                        maxWidth: "100px",
                                        marginLeft: "auto",
                                      }}
                                      value={line.countedQuantity}
                                      onChange={(e) =>
                                        handleCountQtyChange(
                                          line.itemId,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                  <td
                                    className={`py-1 text-end pe-3 fw-semibold ${
                                      variance < 0
                                        ? "text-danger"
                                        : variance > 0
                                        ? "text-success"
                                        : "text-muted"
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