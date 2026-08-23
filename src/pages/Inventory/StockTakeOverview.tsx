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
} from "reactstrap";

import { useStockTake } from "../../Components/Hooks/useStocktake";
import { useWarehouses } from "../../Components/Hooks/useWarehouse";
import { StockTakeVarianceItem } from "../../types/stocktake";
import { Warehouse } from "../../types/warehouse";

const StockTakeList: React.FC = () => {
  const navigate = useNavigate();

  // Component States
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Variance Audit Modal State
  const [activeModalTakeId, setActiveModalTakeId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Hook Integrations
  const { data: warehouseData } = useWarehouses();
  const warehouseList: Warehouse[] = useMemo(() => {
    if (Array.isArray(warehouseData)) return warehouseData;
    return warehouseData || [];
  }, [warehouseData]);

  // Query stock take variance details for active modal ID
  const {
    varianceData = [],
    isVarianceLoading,
  } = useStockTake(activeModalTakeId || undefined);

  // Filtered variance lines inside detail modal
  const filteredVarianceItems = useMemo(() => {
    if (!searchTerm) return varianceData;
    const lower = searchTerm.toLowerCase();
    return varianceData.filter(
      (item: StockTakeVarianceItem) =>
        item.itemCode?.toLowerCase().includes(lower) ||
        item.itemDescription?.toLowerCase().includes(lower)
    );
  }, [varianceData, searchTerm]);

  document.title = "Stock Take Audits | Inventory";

  return (
    <React.Fragment>
      <div className="page-content position-relative">
        <Container fluid className="p-0">
          <Row>
            <Col lg={12}>
              <Card id="stockTakeList" className="shadow-sm border-0 mb-0">
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
                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
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
                        <div
                          className="search-box position-relative flex-grow-1 flex-md-grow-0"
                          style={{ minWidth: "180px" }}
                        >
                          <Input
                            type="text"
                            className="form-control form-control-sm fs-11 ps-4 py-1"
                            placeholder="Search document ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                          />
                          <i className="ri-search-line search-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-12"></i>
                        </div>

                        <Button
                          color="primary"
                          size="sm"
                          className="fs-11 fw-medium text-nowrap py-1 px-2"
                          onClick={() => navigate("/inventory/stock-take/new")}
                        >
                          <i className="ri-add-line me-1 align-middle"></i> New Stock Take
                        </Button>
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
                      <thead className="table-light text-muted text-uppercase fs-10 border-bottom">
                        <tr>
                          <th style={{ width: "20%" }} className="ps-3 py-1.5">
                            Document #
                          </th>
                          <th style={{ width: "25%" }} className="py-1.5">
                            Warehouse
                          </th>
                          <th style={{ width: "20%" }} className="py-1.5">
                            Status
                          </th>
                          <th style={{ width: "20%" }} className="py-1.5">
                            Date
                          </th>
                          <th style={{ width: "15%" }} className="text-end pe-3 py-1.5">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="fs-11">
                        <tr>
                          <td colSpan={5} className="text-center py-5 text-muted fs-11">
                            <i className="ri-inbox-line display-5 d-block text-muted mb-2"></i>
                            No stock take records found.
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Stock Take Variance Modal */}
      <Modal
        isOpen={!!activeModalTakeId}
        toggle={() => setActiveModalTakeId(null)}
        size="lg"
        centered
      >
        <ModalHeader
          toggle={() => setActiveModalTakeId(null)}
          className="bg-light py-2 px-3 fs-13 fw-semibold"
        >
          Stock Take Variance Report
        </ModalHeader>
        <ModalBody className="p-2.5">
          {isVarianceLoading ? (
            <div className="text-center py-4">
              <Spinner size="sm" color="primary" className="me-2" />
              <span className="text-muted fs-11">Calculating stock variances...</span>
            </div>
          ) : filteredVarianceItems.length > 0 ? (
            <div
              className="table-responsive border rounded"
              style={{ maxHeight: "350px" }}
            >
              <Table size="sm" className="align-middle mb-0 table-sm">
                <thead className="table-light fs-9 text-uppercase sticky-top">
                  <tr>
                    <th className="ps-2 py-1">Stock Code</th>
                    <th className="py-1">Description</th>
                    <th className="text-end py-1">System Qty</th>
                    <th className="text-end py-1">Counted Qty</th>
                    <th className="text-end py-1">Variance Qty</th>
                    <th className="text-end pe-2 py-1">Variance Value</th>
                  </tr>
                </thead>
                <tbody className="fs-11 font-monospace">
                  {filteredVarianceItems.map((item: StockTakeVarianceItem, index: number) => {
                    const varianceQty = Number(item.varianceQuantity || 0);
                    const varianceVal = Number(item.varianceValue || 0);

                    return (
                      <tr key={item.itemId || index}>
                        <td className="ps-2 py-1 text-primary fw-semibold">
                          {item.itemCode || "N/A"}
                        </td>
                        <td
                          className="font-sans-serif py-1 text-truncate"
                          style={{ maxWidth: "220px" }}
                        >
                          {item.itemDescription || "N/A"}
                        </td>
                        <td className="text-end py-1">
                          {Number(item.systemQuantity || 0).toLocaleString()}
                        </td>
                        <td className="text-end py-1 fw-semibold">
                          {Number(item.countedQuantity || 0).toLocaleString()}
                        </td>
                        <td
                          className={`text-end py-1 fw-semibold ${
                            varianceQty < 0
                              ? "text-danger"
                              : varianceQty > 0
                              ? "text-success"
                              : "text-muted"
                          }`}
                        >
                          {varianceQty > 0 ? `+${varianceQty}` : varianceQty}
                        </td>
                        <td
                          className={`text-end pe-2 py-1 fw-semibold ${
                            varianceVal < 0
                              ? "text-danger"
                              : varianceVal > 0
                              ? "text-success"
                              : "text-muted"
                          }`}
                        >
                          {varianceVal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted fs-11 border rounded">
              <i className="ri-checkbox-circle-line display-6 d-block text-success mb-1"></i>
              No variance items calculated for this stock take session.
            </div>
          )}
        </ModalBody>
        <ModalFooter className="py-1.5 px-3 bg-light">
          <Button
            color="light"
            size="sm"
            className="fs-11 py-1"
            onClick={() => setActiveModalTakeId(null)}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default StockTakeList;