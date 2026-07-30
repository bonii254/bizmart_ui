import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    Card, CardBody, CardHeader, Col, Row, Badge, 
    UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem 
} from 'reactstrap';
import CountUp from 'react-countup';

// Mock Data - This matches your SQLAlchemy Loan models
const loanData = [
    { id: 1, employee: "John Doe", type: "Car Loan", principal: 1500000, tenure: 24, rate: 12.5, status: "APPROVED", date: "10 Feb 2026" },
    { id: 2, employee: "Jane Smith", type: "Salary Advance", principal: 45000, tenure: 1, rate: 5.0, status: "PENDING", date: "14 Feb 2026" },
    { id: 3, employee: "Michael Brown", type: "Personal Loan", principal: 300000, tenure: 12, rate: 10.0, status: "PENDING", date: "05 Jan 2026" },
    { id: 4, employee: "Alice Wang", type: "Education Loan", principal: 120000, tenure: 6, rate: 8.0, status: "REJECTED", date: "20 Dec 2025" },
    { id: 5, employee: "Robert Wilson", type: "Personal Loan", principal: 500000, tenure: 18, rate: 10.0, status: "PENDING", date: "15 Nov 2025" },
];

const RecentLoanActivity = () => {

    const pendingStats = useMemo(() => {
        const pendingItems = loanData.filter(l => l.status === "PENDING");
        
        let totalPrincipal = 0;
        let totalInterest = 0;

        pendingItems.forEach(loan => {
            totalPrincipal += loan.principal;
            totalInterest += (loan.principal * loan.rate * loan.tenure) / 1200;
        });

        return {
            count: pendingItems.length,
            principal: totalPrincipal,
            interest: totalInterest,
            total: totalPrincipal + totalInterest
        };
    }, []);

    // 2. Helper for Status Colors
    const getStatusColor = (status: string) => {
        switch(status) {
            case "APPROVED": return "success";
            case "PENDING": return "warning";
            case "REJECTED": return "danger";
            case "CLOSED": return "info";
            default: return "primary";
        }
    };

    return (
        <React.Fragment>
            <Col xl={12}>
                {/* --- TOP SUMMARY SECTION --- */}
                <Row className="mb-4">
                    <Col md={3}>
                        <div className="p-3 border border-dashed rounded bg-warning-subtle border-warning">
                            <p className="text-uppercase fw-semibold fs-12 text-warning mb-1">Pending Requests</p>
                            <h4 className="mb-0"><CountUp end={pendingStats.count} /></h4>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="p-3 border border-dashed rounded bg-light">
                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Pending Principal</p>
                            <h4 className="mb-0">Kes <CountUp end={pendingStats.principal} decimals={2} separator="," /></h4>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="p-3 border border-dashed rounded bg-light">
                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Expected Interest</p>
                            <h4 className="mb-0 text-success">Kes <CountUp end={pendingStats.interest} decimals={2} separator="," /></h4>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="p-3 border border-dashed rounded bg-primary-subtle border-primary">
                            <p className="text-uppercase fw-semibold fs-12 text-primary mb-1">Total Payable</p>
                            <h4 className="mb-0 text-primary">Kes <CountUp end={pendingStats.total} decimals={2} separator="," /></h4>
                        </div>
                    </Col>
                </Row>

                {/* --- ACTIVITY TABLE SECTION --- */}
                <Card>
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Loan Management Activity</h4>
                        <div className="flex-shrink-0">
                             <UncontrolledDropdown className="card-header-dropdown">
                                <DropdownToggle tag="a" className="text-reset" role="button">
                                    <span className="text-muted">Sort: Recent <i className="mdi mdi-chevron-down ms-1"></i></span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-end">
                                    <DropdownItem>Newest First</DropdownItem>
                                    <DropdownItem>Highest Amount</DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </div>
                    </CardHeader>

                    <CardBody>
                        <div className="table-responsive table-card">
                            <table className="table table-hover table-centered align-middle table-nowrap mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Employee & Date</th>
                                        <th>Loan Type</th>
                                        <th>Principal (Kes)</th>
                                        <th>Term</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loanData.map((loan, key) => (
                                        <tr key={key}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-xs bg-light rounded p-1 me-2">
                                                        <i className={`ri-bank-card-line text-${getStatusColor(loan.status)} fs-16`}></i>
                                                    </div>
                                                    <div>
                                                        <h5 className="fs-13 my-0">{loan.employee}</h5>
                                                        <small className="text-muted">{loan.date}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{loan.type}</td>
                                            <td className="fw-medium">{loan.principal.toLocaleString()}</td>
                                            <td>{loan.tenure} Months</td>
                                            <td>
                                                <Badge color={getStatusColor(loan.status)} className="badge-soft-dark">
                                                    {loan.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Link to={`/loan/${loan.id}`} className="btn btn-sm btn-soft-primary">View</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default RecentLoanActivity;