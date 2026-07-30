import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';

const leaveRequests = [
    { id: "#LV-2541", employee: "Diana Prince", img: "assets/images/users/avatar-3.jpg", type: "Annual Leave", dates: "12 Feb - 15 Feb", days: 3, dept: "Marketing", status: "Pending", balance: 12 },
    { id: "#LV-2542", employee: "Bruce Wayne", img: "assets/images/users/avatar-4.jpg", type: "Sick Leave", dates: "14 Feb", days: 1, dept: "Executive", status: "Approved", balance: 5 },
    { id: "#LV-2543", employee: "Clark Kent", img: "assets/images/users/avatar-5.jpg", type: "Paternity", dates: "01 Mar - 14 Mar", days: 14, dept: "Journalism", status: "Rejected", balance: 0 },
    { id: "#LV-2544", employee: "Barry Allen", img: "assets/images/users/avatar-6.jpg", type: "Compassionate", dates: "11 Feb - 12 Feb", days: 2, dept: "Logistics", status: "Approved", balance: 21 },
    { id: "#LV-2545", employee: "Arthur Curry", img: "assets/images/users/avatar-7.jpg", type: "Unpaid Leave", dates: "20 Feb - 25 Feb", days: 5, dept: "Marine Ops", status: "Pending", balance: 15 },
];

const RecentLeaveRequests = () => {
    const getStatusClass = (status: string) => {
        if (status === "Approved") return "success";
        if (status === "Pending") return "warning";
        return "danger";
    };

    return (
        <React.Fragment>
            <Col xl={8}>
                <Card>
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Recent Leave Requests</h4>
                        <div className="flex-shrink-0">
                            <button type="button" className="btn btn-soft-primary btn-sm me-1">
                                <i className="ri-check-double-line align-middle"></i> Bulk Approve
                            </button>
                            <button type="button" className="btn btn-soft-secondary btn-sm">
                                <i className="ri-file-list-3-line align-middle"></i> Export Report
                            </button>
                        </div>
                    </CardHeader>

                    <CardBody>
                        <div className="table-responsive table-card">
                            <table className="table table-borderless table-centered align-middle table-nowrap mb-0">
                                <thead className="text-muted table-light">
                                    <tr>
                                        <th scope="col">Payroll No</th>
                                        <th scope="col">Employee</th>
                                        <th scope="col">Leave Type</th>
                                        <th scope="col">Duration</th>
                                        <th scope="col">Department</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(leaveRequests || []).map((item, key) => (
                                        <tr key={key}>
                                            <td>
                                                <Link to={`/leave/details/${item.id}`} className="fw-medium text-reset">{item.id}</Link>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="flex-shrink-0 me-2">
                                                        {/* In a real app, handle missing images with initials */}
                                                        <img src={item.img} alt="" className="avatar-xs rounded-circle" />
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h5 className="fs-14 m-0"><Link to="#" className="text-reset">{item.employee}</Link></h5>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{item.type}</td>
                                            <td>
                                                <span className="text-primary fw-medium">{item.days} Days</span>
                                                <div className="text-muted fs-11">{item.dates}</div>
                                            </td>
                                            <td>{item.dept}</td>
                                            <td>
                                                <span className={"badge bg-" + getStatusClass(item.status) + "-subtle text-" + getStatusClass(item.status)}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>
                                                {/* Replaced 'Rating' with 'Leave Balance' */}
                                                <h5 className="fs-14 fw-medium mb-0">
                                                    {item.balance} <span className="text-muted fs-11">rem.</span>
                                                </h5>
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

export default RecentLeaveRequests;