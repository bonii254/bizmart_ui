import React from 'react';
import { Card, CardHeader, Col, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
// You will need to rename 'StoreVisitsCharts' to 'AttendanceChart' in your charts file
import { AttendanceChart } from './DashboardEcommerceCharts'; 

const AttendanceOverview = () => {
    return (
        <React.Fragment>
            <Col xl={4}>
                <Card className="card-height-100">
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Today's Workforce Status</h4>
                        <div className="flex-shrink-0">
                            <UncontrolledDropdown className="card-header-dropdown">
                                <DropdownToggle tag="a" className="text-reset dropdown-btn" role="button">
                                    <span className="text-muted">Report<i className="mdi mdi-chevron-down ms-1"></i></span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-end" end>
                                    <DropdownItem>Download Daily Log</DropdownItem>
                                    <DropdownItem>Export Absenteeism Report</DropdownItem>
                                    <DropdownItem>View Shift Schedule</DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </div>
                    </CardHeader>

                    <div className="card-body">
                        {/* We pass semantic HR colors here:
                           1. Primary/Success (Green) = In Office
                           2. Info (Blue) = Remote Work
                           3. Warning (Orange) = On Leave
                           4. Danger (Red) = Absent/Sick
                           5. Secondary (Grey) = Off Shift
                        */}
                        <AttendanceChart dataColors='["--vz-success", "--vz-info", "--vz-warning", "--vz-danger", "--vz-secondary"]'/>
                        
                        {/* Optional: Add a quick text summary below the chart if needed */}
                        <div className="text-center mt-3">
                            <p className="text-muted mb-0">Total Employees: <span className="fw-bold text-dark">1,240</span></p>
                        </div>
                    </div>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default AttendanceOverview;