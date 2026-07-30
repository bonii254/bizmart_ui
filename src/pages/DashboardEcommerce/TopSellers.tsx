import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';

// Mock Data
const deptCosts = [
    { id: 1, name: "Engineering & IT", head: "Jane Doe", headcount: 150, overtime_hours: 450, total_cost: 12500000, budget_percent: 45 },
    { id: 2, name: "Sales & Marketing", head: "John Smith", headcount: 80, overtime_hours: 120, total_cost: 8200000, budget_percent: 28 },
    { id: 3, name: "Operations", head: "Ali Hassan", headcount: 400, overtime_hours: 2100, total_cost: 6500000, budget_percent: 15 },
    { id: 4, name: "Human Resources", head: "Mary Wambui", headcount: 15, overtime_hours: 10, total_cost: 1200000, budget_percent: 7 },
    { id: 5, name: "Finance", head: "Peter Kamau", headcount: 20, overtime_hours: 50, total_cost: 1800000, budget_percent: 5 },
];

const DepartmentalCostSummary = () => {
    return (
        <React.Fragment>
            <Col xl={6}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Departmental Cost Summary</h4>
                        <div className="flex-shrink-0">
                            <UncontrolledDropdown className="card-header-dropdown">
                                <DropdownToggle tag="a" className="text-reset dropdown-btn" role="button">
                                    <span className="text-muted">Report<i className="mdi mdi-chevron-down ms-1"></i></span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-end" end>
                                    <DropdownItem>Download PDF</DropdownItem>
                                    <DropdownItem>Export CSV</DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </div>
                    </CardHeader>

                    <CardBody>
                        <div className="table-responsive table-card">
                            <table className="table table-centered table-hover align-middle table-nowrap mb-0">
                                <thead className="text-muted table-light">
                                    <tr>
                                        <th>Department</th>
                                        <th>Headcount</th>
                                        <th>Overtime (Hrs)</th>
                                        <th>Total Cost (CTC)</th>
                                        <th>% of Budget</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deptCosts.map((item, key) => (
                                        <tr key={key}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {/* Replaced User Avatar with Department Initial or Icon */}
                                                    <div className="flex-shrink-0 me-2">
                                                        <div className="avatar-sm bg-light rounded p-2 text-center">
                                                            <span className="text-primary fw-bold fs-16">{item.name.charAt(0)}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h5 className="fs-14 my-1 fw-medium">
                                                            <Link to={`/department/${item.id}`} className="text-reset">{item.name}</Link>
                                                        </h5>
                                                        <span className="text-muted">Head: {item.head}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-muted">{item.headcount} Staff</span>
                                            </td>
                                            <td>
                                                <p className={`mb-0 ${item.overtime_hours > 500 ? 'text-danger' : 'text-muted'}`}>
                                                    {item.overtime_hours} hrs
                                                </p>
                                                <span className="text-muted fs-11">Month-to-date</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 mb-0 fw-normal">Kes {(item.total_cost / 1000000).toFixed(2)}M</h5>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 mb-0">
                                                    {item.budget_percent}%
                                                    {/* Logic to color the bar based on consumption */}
                                                    <i className={`ri-bar-chart-fill fs-16 align-middle ms-2 
                                                        ${item.budget_percent > 40 ? 'text-warning' : 'text-success'}`}>
                                                    </i>
                                                </h5>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination Footer - Keep generic or remove if showing Top 5 only */}
                        <div className="align-items-center mt-4 pt-2 justify-content-between row text-center text-sm-start">
                            <div className="col-sm">
                                <div className="text-muted">Showing <span className="fw-semibold">5</span> Top Departments</div>
                            </div>
                            <div className="col-sm-auto mt-3 mt-sm-0">
                                <Link to="/reports/cost-center" className="text-decoration-underline">View Full Cost Report</Link>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </Col>

        </React.Fragment>
    );
};

export default DepartmentalCostSummary;