import React from "react";
import { Row, Col, Button, Input } from "reactstrap";

interface PaginationProps {
  table: any;
}

const TablePagination = ({ table }: PaginationProps) => {
  const {
    getState,
    setPageSize,
    previousPage,
    nextPage,
    getCanPreviousPage,
    getCanNextPage,
    getPageCount,
  } = table;

  const { pagination } = getState();

  return (
    <Row className="align-items-center mt-4 g-3 text-center text-sm-start">
      <Col sm>
        <div className="text-muted">
          Showing <span className="fw-semibold">{table.getRowModel().rows.length}</span> of{" "}
          <span className="fw-semibold">{table.getPrePaginationRowModel().rows.length}</span> Results
        </div>
      </Col>
      <Col sm="auto">
        <div className="d-flex gap-2 justify-content-center align-items-center">
          <select
            className="form-select form-select-sm w-auto"
            value={pagination.pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>

          <div className="pagination-wrap hstack gap-2">
            <Button
              className="btn btn-sm btn-light border"
              onClick={() => previousPage()}
              disabled={!getCanPreviousPage()}
            >
              <i className="ri-arrow-left-s-line align-middle"></i>
            </Button>

            <ul className="pagination mb-0">
                <li className="page-item active">
                    <span className="page-link">
                        {pagination.pageIndex + 1}
                    </span>
                </li>
                <li className="page-item disabled">
                    <span className="page-link">of</span>
                </li>
                <li className="page-item">
                    <span className="page-link">
                        {getPageCount()}
                    </span>
                </li>
            </ul>

            <Button
              className="btn btn-sm btn-light border"
              onClick={() => nextPage()}
              disabled={!getCanNextPage()}
            >
              <i className="ri-arrow-right-s-line align-middle"></i>
            </Button>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default TablePagination;