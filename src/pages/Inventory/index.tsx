import React, { useState, useMemo, useEffect } from "react";
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
} from "reactstrap";

import { useItemWarehouseStock } from "../../Components/Hooks/useWarehouseStock";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { useStockItems } from "../../Components/Hooks/useStockItems";

import { ItemWarehouseStock } from "../../types/warehouseStock";
import { Warehouse } from "../../types/warehouse";
import { StockItem } from "../../types/stockitem";

import TablePagination from "../TablePagination";
import qz from 'qz-tray';

export interface EnrichedWarehouseStock extends ItemWarehouseStock {
  sellingPrice?: number;
  stockUom?: string;
  alternateUom?: string | null;
  totalValue?: number;
}

const StockBalanceOverview: React.FC = () => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);
  
  const { stockItems: rawStockItems, isLoading: isStockLoading } = useItemWarehouseStock({
    warehouseId: selectedWarehouseId || undefined,
  });
  const { data: warehouseData, isLoading: isWarehouseLoading } = useWarehouses();
  const { data: stockCatalog } = useStockItems();

  const warehouseList: Warehouse[] = useMemo(
    () => warehouseData || [],
    [warehouseData]
  );

  useEffect(() => {
    if (warehouseList.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouseList[0].warehouseId);
    }
  }, [warehouseList, selectedWarehouseId]);

  const stockCatalogMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    if (stockCatalog && Array.isArray(stockCatalog)) {
      stockCatalog.forEach((item) => {
        if (item.itemId) map.set(item.itemId, item);
        if (item.itemCode) map.set(item.itemCode, item);
      });
    }
    return map;
  }, [stockCatalog]);

  const enrichedStockBalances = useMemo<EnrichedWarehouseStock[]>(() => {
    if (!rawStockItems) return [];
    return rawStockItems.map((stock: ItemWarehouseStock) => {
      const catalogItem = stockCatalogMap.get(stock.itemId) || stockCatalogMap.get(stock.itemCode);
      const qtyOnHand = Number(stock.quantityOnHand ?? 0);
      const unitCost = Number(stock.averageCost ?? 0);
      
      // Compute total inventory value as Quantity On Hand * Unit Cost
      const calculatedTotalValue = (qtyOnHand * unitCost);

      return {
        ...stock,
        sellingPrice: catalogItem?.sellingPrice ?? 0,
        stockUom: catalogItem?.stockUom || "N/A",
        alternateUom: catalogItem?.alternateUom || "N/A",
        totalValue: calculatedTotalValue,
      };
    });
  }, [rawStockItems, stockCatalogMap]);
  
  const filteredBalances = useMemo(() => {
    if (!searchTerm) return enrichedStockBalances;
    const lower = searchTerm.toLowerCase();
    return enrichedStockBalances.filter(
      (b: EnrichedWarehouseStock) =>
        b.itemCode?.toLowerCase().includes(lower) ||
        b.itemDescription?.toLowerCase().includes(lower)
    );
  }, [enrichedStockBalances, searchTerm]);

  const totalWarehouseValue = useMemo(() => {
    return filteredBalances.reduce(
      (sum, item) => sum + Number(item.totalValue || 0),
      0
    );
  }, [filteredBalances]);

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

  const isLoading = isStockLoading || isWarehouseLoading;

  document.title = "Stock Balance Overview | Inventory";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card id="stockBalanceList" className="shadow-sm border-0">
                <CardHeader className="border-bottom py-3 px-3 bg-white">
                  <Row className="g-3 align-items-center justify-content-between">
                    <Col lg={5} md={6} sm={12}>
                      <div className="d-flex align-items-center gap-3">
                        <h5 className="card-title mb-0 fs-15 fw-semibold text-dark text-nowrap">
                          Stock Balances
                        </h5>
                        <div className="flex-grow-1" style={{ maxWidth: "240px" }}>
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
                            {warehouseList.map((wh: Warehouse) => (
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
                        {/* Auto-scaling Search Input Container */}
                        <div
                          className="search-box position-relative flex-grow-1 flex-md-grow-0"
                          style={{ minWidth: "200px", maxWidth: "100%" }}
                        >
                          <Input
                            type="text"
                            className="form-control form-control-sm fs-12 ps-4"
                            placeholder="Search stock code or item..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                          />
                          <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-13"></i>
                        </div>
  
                        <Badge
                          color="success-subtle"
                          className="text-success border border-success-subtle fs-11 px-2.5 py-1.5 rounded-2 fw-semibold text-nowrap d-inline-flex align-items-center"
                        >
                          <i className="ri-money-dollar-circle-line me-1 fs-13 lh-1"></i>
                          <span>
                            Total Value: Ksh{" "}
                            {totalWarehouseValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </CardHeader>

                <CardBody className="p-0">
                  <div className="table-responsive">
                    <Table
                      hover
                      responsive
                      size="sm"
                      className="align-middle mb-0 custom-datatable table-sm"
                    >
                      <thead className="table-light text-muted text-uppercase fs-10">
                        <tr>
                          <th style={{ width: "10%" }} className="ps-3 py-2">
                            Stock Code
                          </th>
                          <th style={{ width: "20%" }} className="py-2">
                            Description
                          </th>
                          <th style={{ width: "10%" }} className="py-2">
                            Alternative UOM
                          </th>
                          <th style={{ width: "10%" }} className="py-2">
                            UOM
                          </th>
                          <th style={{ width: "10%" }} className="text-start py-2">
                            Selling Price
                          </th>
                          <th style={{ width: "10%" }} className="text-start py-2">
                            Qty On Hand
                          </th>
                          <th style={{ width: "15%" }} className="text-start py-2">
                            Unit Cost
                          </th>
                          <th style={{ width: "15%" }} className="text-start pe-3 py-2">
                            Total Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="fs-12">
                        {isLoading ? (
                          <tr>
                            <td colSpan={8} className="text-center py-4">
                              <Spinner size="sm" color="primary" className="me-2" />
                              <span className="text-muted fs-12">
                                Loading records...
                              </span>
                            </td>
                          </tr>
                        ) : paginatedRows.length > 0 ? (
                          paginatedRows.map((item: EnrichedWarehouseStock) => (
                            <tr key={`${item.warehouseId}-${item.itemId}`} className="align-middle">
                              <td className="py-1.5 ps-3">
                                <span className="fw-semibold text-primary font-monospace fs-11">
                                  {item.itemCode || "N/A"}
                                </span>
                              </td>

                              <td className="py-1.5">
                                <span
                                  className="text-dark fw-medium text-truncate d-inline-block align-middle"
                                  style={{ maxWidth: "340px" }}
                                  title={item.itemDescription}
                                >
                                  {item.itemDescription || "N/A"}
                                </span>
                              </td>

                              <td className="py-1.5">
                                <Badge
                                  color="light"
                                  className="text-secondary border fs-10 fw-normal px-1.5 py-0.5"
                                >
                                  {item.alternateUom || "N/A"}
                                </Badge>
                              </td>

                              <td className="py-1.5">
                                <Badge
                                  color="light"
                                  className="text-secondary border fs-10 fw-normal px-1.5 py-0.5"
                                >
                                  {item.stockUom || "N/A"}
                                </Badge>
                              </td>

                              <td className="py-1.5 text-start fw-medium text-body font-monospace">
                                Ksh{" "}
                                {Number(item.sellingPrice || 0).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>

                              <td className="py-1.5 text-start fw-semibold text-dark font-monospace">
                                {Number(item.quantityOnHand ?? 0).toLocaleString()}
                              </td>

                              <td className="py-1.5 text-start fw-medium text-body font-monospace">
                                Ksh{" "}
                                {Number(item.averageCost ?? 0).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>

                              <td className="py-1.5 text-start pe-3 fw-semibold text-success font-monospace">
                                Ksh{" "}
                                {Number(item.totalValue ?? 0).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="text-center py-4 text-muted fs-12">
                              <i className="ri-inbox-line display-6 d-block text-muted mb-1"></i>
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
      </div>
    </React.Fragment>
  );
};

export default StockBalanceOverview;