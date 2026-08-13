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

import { useWarehouseStock } from "../../Components/Hooks/useWarehouseStock";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { WarehouseStock } from "../../types/warehouseStock";
import TablePagination from "../TablePagination";

const StockBalanceOverview: React.FC = () => {
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
  const { balances, isLoading } = useWarehouseStock(
    selectedWarehouseId || undefined
  );
  const { data: warehouseData } = useWarehouses(true);

  const warehouseList = useMemo(
    () => warehouseData?.warehouses || [],
    [warehouseData]
  );

  // Client-side Filter by Search Term (Stock code or description)
  const filteredBalances = useMemo(() => {
    if (!searchTerm) return balances;
    const lower = searchTerm.toLowerCase();
    return balances.filter(
      (b: WarehouseStock) =>
        b.stockItem?.itemCode?.toLowerCase().includes(lower) ||
        b.stockItem?.description?.toLowerCase().includes(lower)
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

  document.title = "Stock Balance Overview | Inventory";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card id="stockBalanceList" className="shadow-sm border-0">
                {/* Clean, Spacious Header with Aligned Controls */}
                <CardHeader className="border-bottom py-3 px-3 bg-white">
                  <Row className="g-3 align-items-center justify-content-between">
                    {/* Left: Title & Warehouse Dropdown */}
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
                            {warehouseList.map((wh: any) => (
                              <option key={wh.warehouseId} value={wh.warehouseId}>
                                {wh.warehouseName} ({wh.warehouseCode})
                              </option>
                            ))}
                          </Input>
                        </div>
                      </div>
                    </Col>

                    {/* Right: Search Input & Badge */}
                    <Col lg={7} md={6} sm={12}>
                      <div className="d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
                        <div
                          className="search-box position-relative flex-grow-1 flex-md-grow-0"
                          style={{ minWidth: "250px" }}
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
                          color="primary-subtle"
                          className="text-primary border border-primary-subtle fs-11 px-2.5 py-1.5 rounded-2 fw-medium text-nowrap"
                        >
                          <i className="ri-list-check me-1 align-middle"></i>
                          {filteredBalances.length} Records
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </CardHeader>

                <CardBody className="p-0">
                  {/* Compact High-Density Datatable */}
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
                            <td colSpan={6} className="text-center py-4">
                              <Spinner size="sm" color="primary" className="me-2" />
                              <span className="text-muted fs-12">
                                Loading records...
                              </span>
                            </td>
                          </tr>
                        ) : paginatedRows.length > 0 ? (
                          paginatedRows.map((item: WarehouseStock) => (
                            <tr key={item.id} className="align-middle">
                              {/* 1. Stock Code */}
                              <td className="py-1.5 ps-3">
                                <span className="fw-semibold text-primary font-monospace fs-11">
                                  {item.stockItem?.itemCode || "N/A"}
                                </span>
                              </td>

                              {/* 2. Description (Truncated single-line) */}
                              <td className="py-1.5">
                                <span
                                  className="text-dark fw-medium text-truncate d-inline-block align-middle"
                                  style={{ maxWidth: "340px" }}
                                  title={item.stockItem?.description}
                                >
                                  {item.stockItem?.description || "N/A"}
                                </span>
                              </td>

                              {/* 3. UOM */}
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
                                  {item.stockItem?.uom || "N/A"}
                                </Badge>
                              </td>

                              {/* 5. Unit Cost (Selling Price) */}
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

                              {/* 4. Quantity On Hand */}
                              <td className="py-1.5 text-start fw-semibold text-dark font-monospace">
                                {Number(item.qtyOnHand).toLocaleString()}
                              </td>

                              {/* 5. Unit Cost (Selling Price) */}
                              <td className="py-1.5 text-start fw-medium text-body font-monospace">
                                Ksh{" "}
                                {Number(item.unitCost || 0).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>

                              {/* 6. Total Value */}
                              <td className="py-1.5 text-start pe-3 fw-semibold text-success font-monospace">
                                Ksh{" "}
                                {Number(item.totalValue).toLocaleString(
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
                            <td colSpan={6} className="text-center py-4 text-muted fs-12">
                              <i className="ri-inbox-line display-6 d-block text-muted mb-1"></i>
                              No stock balance records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  {/* Compact Table Footer */}
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