import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Row, Progress } from "reactstrap";
import SimpleBar from "simplebar-react";

// You can use a generic image for "System Admin" or remove images entirely for a cleaner look
import avatarAdmin from "../../assets/images/users/avatar-1.jpg";
import complianceIcon from "../../assets/images/companies/img-1.png"; // Placeholder for KRA/Tax logo

const SystemAuditSidebar = (props: any) => {
  return (
    <React.Fragment>
      <div 
        className={props.rightColumn ? "col-auto layout-rightside-col d-block" : "col-auto layout-rightside-col d-none"} 
        id="layout-rightside-coll"
      >
        <div className="overlay" onClick={props.hideRightColumn}></div>
        <div className="layout-rightside">
          <Card className="h-100 rounded-0">
            <CardBody className="p-0">
              
              {/* Header */}
              <div className="p-3">
                <h6 className="text-muted mb-0 text-uppercase fw-semibold">
                  System Audit & Alerts
                </h6>
              </div>

              {/* SECTION 1: AUDIT LOG (Replaces Activity Timeline) */}
              <SimpleBar style={{ maxHeight: "410px" }} className="p-3 pt-0">
                <div className="acitivity-timeline acitivity-main">
                  
                  {/* Item 1: Critical Payroll Action */}
                  <div className="acitivity-item d-flex">
                    <div className="flex-shrink-0 avatar-xs acitivity-avatar">
                      <div className="avatar-title bg-success-subtle text-success rounded-circle">
                        <i className="bx bx-money"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-1 lh-base">Payroll Batch Committed</h6>
                      <p className="text-muted mb-1">
                        Jan 2026 Salary processed for <span className="fw-semibold">1,024 employees</span>.
                      </p>
                      <small className="mb-0 text-muted">02:14 PM Today</small>
                    </div>
                  </div>

                  {/* Item 2: Data Change (Security Audit) */}
                  <div className="acitivity-item py-3 d-flex">
                    <div className="flex-shrink-0 avatar-xs acitivity-avatar">
                      <div className="avatar-title bg-warning-subtle text-warning rounded-circle">
                        <i className="ri-shield-user-line"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-1 lh-base">
                        Permission Elevation
                      </h6>
                      <p className="text-muted mb-1">
                        Admin granted <span className="fw-semibold">Edit Access</span> to Manager J. Doe for "Loans Module".
                      </p>
                      <small className="mb-0 text-muted">10:45 AM Today</small>
                    </div>
                  </div>

                  {/* Item 3: Bulk Upload */}
                  <div className="acitivity-item py-3 d-flex">
                    <div className="flex-shrink-0">
                      <div className="avatar-xs acitivity-avatar">
                        <div className="avatar-title rounded-circle bg-info-subtle text-info">
                          <i className="ri-file-upload-line"></i>
                        </div>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-1 lh-base">
                        Variable Inputs Uploaded
                      </h6>
                      <p className="text-muted mb-2">
                        Overtime sheet imported via CSV.
                      </p>
                      <small className="mb-0 text-muted">Yesterday</small>
                    </div>
                  </div>

                  {/* Item 4: Comment/Note */}
                  <div className="acitivity-item py-3 d-flex">
                    <div className="flex-shrink-0">
                      <img src={avatarAdmin} alt="" className="avatar-xs rounded-circle acitivity-avatar" />
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="mb-1 lh-base">Finance Director Note</h6>
                      <p className="text-muted mb-2 fst-italic">
                        " Please ensure NSSF rates are updated before the 25th run. "
                      </p>
                      <small className="mb-0 text-muted">26 Aug, 2021</small>
                    </div>
                  </div>
                </div>
              </SimpleBar>

              {/* SECTION 2: PENDING APPROVALS (Replaces Top Categories) */}
              <div className="p-3 mt-2">
                <h6 className="text-muted mb-3 text-uppercase fw-semibold">
                  Pending Actions
                </h6>

                <ol className="ps-3 text-muted">
                    <li className="py-1">
                      <Link to="/leave/approvals" className="text-muted">
                        Leave Requests <span className="float-end badge bg-danger-subtle text-danger">12</span>
                      </Link>
                    </li>
                    <li className="py-1">
                      <Link to="/loans/approvals" className="text-muted">
                        Loan Applications <span className="float-end badge bg-warning-subtle text-warning">5</span>
                      </Link>
                    </li>
                    <li className="py-1">
                      <Link to="/payroll/verify" className="text-muted">
                        Discrepancy Checks <span className="float-end badge bg-info-subtle text-info">3</span>
                      </Link>
                    </li>
                </ol>
                <div className="mt-3 text-center">
                  <Link to="/tasks" className="text-primary text-decoration-underline">
                    View Task Manager
                  </Link>
                </div>
              </div>

              {/* SECTION 3: BUDGET UTILIZATION (Replaces Reviews/Stars) */}
              <div className="p-3">
                <h6 className="text-muted mb-3 text-uppercase fw-semibold">
                  Monthly Budget Health
                </h6>
                
                {/* Visualizing Money instead of Stars */}
                <div className="bg-light px-3 py-2 rounded-2 mb-2">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <span className="fs-12 text-muted">Projected Spend</span>
                      <h6 className="mb-0">Kes 4.5M / 5.0M</h6>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="badge bg-success">Healthy</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  {/* Progress Bar 1 */}
                  <Row className="align-items-center g-2">
                    <div className="col-auto">
                      <div className="p-1"><h6 className="mb-0 fs-12">Salaries</h6></div>
                    </div>
                    <div className="col">
                      <div className="p-1">
                        <div className="progress animated-progess progress-sm">
                          <div className="progress-bar bg-primary" role="progressbar" style={{ width: "85%" }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="p-1"><h6 className="mb-0 text-muted fs-12">85%</h6></div>
                    </div>
                  </Row>

                  {/* Progress Bar 2 */}
                  <Row className="align-items-center g-2">
                    <div className="col-auto">
                      <div className="p-1"><h6 className="mb-0 fs-12">Overtime</h6></div>
                    </div>
                    <div className="col">
                      <div className="p-1">
                        <div className="progress animated-progess progress-sm">
                          {/* Warning color because overtime is high */}
                          <div className="progress-bar bg-warning" role="progressbar" style={{ width: "92%" }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="p-1"><h6 className="mb-0 text-muted fs-12">92%</h6></div>
                    </div>
                  </Row>
                  
                  {/* Progress Bar 3 */}
                  <Row className="align-items-center g-2">
                    <div className="col-auto">
                      <div className="p-1"><h6 className="mb-0 fs-12">Bonuses</h6></div>
                    </div>
                    <div className="col">
                      <div className="p-1">
                        <div className="progress animated-progess progress-sm">
                          <div className="progress-bar bg-success" role="progressbar" style={{ width: "20%" }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="p-1"><h6 className="mb-0 text-muted fs-12">20%</h6></div>
                    </div>
                  </Row>
                </div>
              </div>

              {/* SECTION 4: STATUTORY COMPLIANCE (Replaces Gift Box) */}
              <Card className="sidebar-alert bg-light border-0 text-center mx-4 mb-0 mt-3">
                <CardBody>
                  <i className="ri-calendar-check-fill text-danger fs-30"></i>
                  <div className="mt-2">
                    <h5 className="fs-14 text-danger">Statutory Deadline</h5>
                    <p className="text-muted lh-base fs-12">
                      PAYE & Housing Levy submission deadline is in <span className="fw-bold">3 days</span>.
                    </p>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm btn-label rounded-pill"
                    >
                      <i className="ri-file-download-line label-icon align-middle rounded-pill fs-16 me-2"></i>{" "}
                      Generate P10
                    </button>
                  </div>
                </CardBody>
              </Card>

            </CardBody>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SystemAuditSidebar;