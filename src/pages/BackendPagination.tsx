import React from "react";
import { Row, Col, Button } from "reactstrap";

interface BackendPaginationProps {
    pagination: {
        total: number;
        pages: number;
        current_page: number;
        has_next: boolean;
        has_prev: boolean;
    };
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    pageSize: number;
    currentLength: number;
}

const TablePagination = ({ 
    pagination, 
    onPageChange, 
    onLimitChange, 
    pageSize, 
    currentLength 
}: BackendPaginationProps) => {
    return (
        <Row className="align-items-center mt-4 g-3 text-center text-sm-start">
            <Col sm>
                <div className="text-muted">
                    Showing <span className="fw-semibold">{currentLength}</span> of{" "}
                    <span className="fw-semibold">{pagination.total}</span> Results
                </div>
            </Col>
            <Col sm="auto">
                <div className="d-flex gap-2 justify-content-center align-items-center">
                    <select
                        className="form-select form-select-sm w-auto"
                        value={pageSize}
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                    >
                        {[
                            10,
                            20,
                            30,
                            40,
                            50
                        ].map((size) => (
                            <option key={size} value={size}>Show {size}</option>
                        ))}
                    </select>

                    <div className="pagination-wrap hstack gap-2">
                        <Button
                            className="btn btn-sm btn-light border"
                            onClick={() => onPageChange(pagination.current_page - 1)}
                            disabled={!pagination.has_prev}
                        >
                            <i className="ri-arrow-left-s-line align-middle"></i>
                        </Button>

                        <ul className="pagination mb-0">
                            <li className="page-item active">
                                <span className="page-link">{pagination.current_page}</span>
                            </li>
                            <li className="page-item disabled">
                                <span className="page-link">of</span>
                            </li>
                            <li className="page-item">
                                <span className="page-link">{pagination.pages}</span>
                            </li>
                        </ul>

                        <Button
                            className="btn btn-sm btn-light border"
                            onClick={() => onPageChange(pagination.current_page + 1)}
                            disabled={!pagination.has_next}
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