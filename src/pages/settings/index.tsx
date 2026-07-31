import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Breadcrumb,
  BreadcrumbItem,
} from "reactstrap";
import classnames from "classnames";
import { Link } from "react-router-dom";

import UserManagement from "./users";
import CoolerManagement from "./cooler";
import AssignmentManagement from "./assignment";
import StockItemManagement from "./stockitem";
import WarehouseStockManagement from "./warehouseStock";

const SettingsHub = () => {
  const [activeTab, setActiveTab] = useState("1");

  const getActiveTitle = () => {
    switch (activeTab) {
      case "1":
        return "User Roles & Permissions";
      case "2":
        return "Cooler Center Management";
      case "3":
        return "Staff Deployments";
      case "4":
        return "Master Stock Items";
      case "5":
        return "Warehouse Stock Management";
      default:
        return "Settings";
    }
  };

  const toggleTab = (tab: string): void => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col xs={12}>
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 className="mb-sm-0">System Configuration</h4>
                <div className="page-title-right">
                  <Breadcrumb listClassName="m-0">
                    <BreadcrumbItem>
                      <Link to="/dashboard">Dashboard</Link>
                    </BreadcrumbItem>
                    <BreadcrumbItem active>Settings</BreadcrumbItem>
                  </Breadcrumb>
                </div>
              </div>
            </Col>
          </Row>

          <Row>
            <Col lg={3}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Settings Menu</h5>
                </CardHeader>
                <CardBody>
                  <Nav pills vertical className="nav-pills-custom">
                    <div className="p-2 text-muted text-uppercase fw-bold fs-11 mb-2">
                      Users, Coolers and Assignments
                    </div>

                    <NavItem className="mb-2">
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({
                          "active bg-primary-subtle": activeTab === "1",
                        })}
                        onClick={() => toggleTab("1")}
                      >
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i
                              className={classnames(
                                "ri-shield-user-line fs-18 me-3",
                                { "text-primary": activeTab === "1" },
                              )}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0 fs-13">User Roles</h5>
                            <p className="mb-0 fs-12 text-muted">
                              Access & Permissions
                            </p>
                          </div>
                        </div>
                      </NavLink>
                    </NavItem>

                    <NavItem className="mb-2">
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({
                          "active bg-primary-subtle": activeTab === "2",
                        })}
                        onClick={() => toggleTab("2")}
                      >
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i
                              className={classnames(
                                "ri-fridge-line fs-18 me-3",
                                { "text-primary": activeTab === "2" },
                              )}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0 fs-13">Cooler Centers</h5>
                            <p className="mb-0 fs-12 text-muted">
                              Warehouse listing
                            </p>
                          </div>
                        </div>
                      </NavLink>
                    </NavItem>
                    <NavItem className="mb-2">
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({
                          "active bg-primary-subtle": activeTab === "3",
                        })}
                        onClick={() => toggleTab("3")}
                      >
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i
                              className={classnames(
                                "ri-user-location-line fs-18 me-3",
                                { "text-primary": activeTab === "3" },
                              )}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0 fs-13">Deployments</h5>
                            <p className="mb-0 fs-12 text-muted">
                              Assign Attendants
                            </p>
                          </div>
                        </div>
                      </NavLink>
                    </NavItem>

                    <NavItem className="mb-2">
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({
                          "active bg-primary-subtle": activeTab === "4",
                        })}
                        onClick={() => toggleTab("4")}
                      >
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i
                              className={classnames(
                                "ri-stack-line fs-18 me-3",
                                { "text-primary": activeTab === "4" },
                              )}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0 fs-13">Master Stock Items</h5>
                            <p className="mb-0 fs-12 text-muted">
                              Manage stock items
                            </p>
                          </div>
                        </div>
                      </NavLink>

                      <NavItem className="mb-2">
                        <NavLink
                          style={{ cursor: "pointer" }}
                          className={classnames({
                            "active bg-primary-subtle": activeTab === "5",
                          })}
                          onClick={() => toggleTab("5")}
                        >
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <i
                                className={classnames(
                                  "ri-store-line fs-18 me-3",
                                  { "text-primary": activeTab === "5" },
                                )}
                              ></i>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="mb-0 fs-13">Warehouse Stock</h5>
                              <p className="mb-0 fs-12 text-muted">
                                Manage warehouse stock
                              </p>
                            </div>
                          </div>
                        </NavLink>
                      </NavItem>
                    </NavItem>
                  </Nav>
                </CardBody>
              </Card>
            </Col>

            <Col lg={9}>
              <Card>
                <CardHeader className="align-items-center d-flex border-bottom-dashed">
                  <h4 className="card-title mb-0 flex-grow-1">
                    {getActiveTitle()}
                  </h4>
                </CardHeader>
                <CardBody className="p-4">
                  <TabContent activeTab={activeTab}>
                    <TabPane tabId="1">
                      <UserManagement />
                    </TabPane>

                    <TabPane tabId="2">
                      <CoolerManagement />
                    </TabPane>

                    <TabPane tabId="3">
                      <AssignmentManagement />
                    </TabPane>
                    <TabPane tabId="4">
                      <StockItemManagement />
                    </TabPane>
                    <TabPane tabId="5">
                      <WarehouseStockManagement />
                    </TabPane>
                  </TabContent>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SettingsHub;
