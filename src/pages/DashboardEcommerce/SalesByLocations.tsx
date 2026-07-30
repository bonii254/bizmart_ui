import React from 'react';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';

const EmployeesByDepartment = () => {
    // Extended data to demonstrate scrolling
    const deptHeadcount = [
        { name: "Engineering", count: 124, percentage: 45, color: "primary" },
        { name: "Sales & Marketing", count: 82, percentage: 30, color: "success" },
        { name: "Customer Support", count: 41, percentage: 15, color: "info" },
        { name: "Administration", count: 27, percentage: 10, color: "warning" },
        { name: "Logistics", count: 15, percentage: 5, color: "danger" },
        { name: "Legal", count: 8, percentage: 3, color: "secondary" },
        { name: "Research & Dev", count: 22, percentage: 8, color: "primary" },
        { name: "Product Design", count: 18, percentage: 6, color: "info" },
    ];

    return (
        <React.Fragment>
            <Col xl={4}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Headcount Distribution</h4>
                        <div className="flex-shrink-0">
                            <button type="button" className="btn btn-soft-info btn-sm">
                                View All
                            </button>
                        </div>
                    </CardHeader>

                    <CardBody>
                        {/* THE TOP SUMMARY AREA (Replacing Map) */}
                        <div 
                            className="text-center bg-light rounded-3 d-flex flex-column justify-content-center"
                            style={{ height: "180px", marginBottom: "20px" }}
                        >
                            <h2 className="display-5 fw-bold text-primary mb-0">337</h2>
                            <p className="text-muted text-uppercase fw-semibold">Active Staff</p>
                        </div>

                        {/* THE SCROLLABLE SECTION */}
                        <div 
                            style={{ 
                                height: "280px", // Fixed height to force scroll
                                overflowY: "auto", // Enables vertical scrolling
                                paddingRight: "10px", // Prevents scrollbar from touching text
                                overflowX: "hidden"
                            }} 
                            className="custom-scrollbar"
                        >
                            {deptHeadcount.map((dept, index) => (
                                <div 
                                    key={index} 
                                    className="mb-3 department-row" 
                                    style={{ transition: "all 0.2s ease" }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <h6 className="fs-13 mb-0">{dept.name}</h6>
                                        <span className="fs-12 text-muted fw-medium">
                                            {dept.count} <span className="ms-1">({dept.percentage}%)</span>
                                        </span>
                                    </div>
                                    <div className="progress progress-sm" style={{ height: "7px" }}>
                                        <div 
                                            className={`progress-bar bg-${dept.color}`} 
                                            role="progressbar"
                                            style={{ 
                                                width: `${dept.percentage}%`,
                                                borderRadius: "10px",
                                                cursor: "pointer"
                                            }}
                                            title={`${dept.name}: ${dept.count} Employees`}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </Col>
            
            {/* Adding simple CSS for the scrollbar styling */}
            <style>
                {`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #f1f1f1;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #ccc;
                        border-radius: 10px;
                    }
                    .department-row:hover {
                        transform: translateX(5px);
                    }
                `}
            </style>
        </React.Fragment>
    );
};

export default EmployeesByDepartment;