import React, { useState, useEffect } from "react";
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
} from "reactstrap";
import classnames from "classnames";

import UserManagement from "./users";
import CategoryManagement from "./Category";
import StockItemManagement from "./StockItem";
import WarehouseManagement from "./Warehouse";
import CompanyManagement from "./Company";
import WarehouseStockManagement from "./WarehouseStock";

const SettingsHub = () => {
  const [activeTab, setActiveTab] = useState("1");

  // Velzon dynamic document title sync
  useEffect(() => {
    document.title = "System Configuration | Velzon - React Admin & Dashboard Template";
  }, []);

  const getActiveTitle = () => {
    switch (activeTab) {
      case "1":
        return "User Roles & Permissions";
      case "2":
        return "Category Management";
      case "3":
        return "Company Management";
      case "4":
        return "Warehouse Management";
      case "5":
        return "Stock Item Management";
      case "6":
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
          {/* Standardized Velzon Header & Breadcrumb */}
          {/* <BreadCrumb title="Settings" pageTitle="System Configuration" /> */}

          <Row>
            <Col lg={3}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Settings Menu</h5>
                </CardHeader>
                <CardBody>
                  <Nav pills vertical className="nav-pills-custom">
                    <div className="p-2 text-muted text-uppercase fw-bold fs-11 mb-2">
                      Users, Categories & Companies
                    </div>

                    {/* Tab 1: User Roles */}
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
                                { "text-primary": activeTab === "1" }
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

                    {/* Tab 2: Category Management */}
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
                                "ri-folder-2-line fs-18 me-3",
                                { "text-primary": activeTab === "2" }
                              )}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0 fs-13">Categories</h5>
                            <p className="mb-0 fs-12 text-muted">
                              Master category listing
                            </p>
                          </div>
                        </div>
                      </NavLink>
                    </NavItem>

                    {/* Tab 3: Company Management */}
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
                                "ri-building-line fs-18 me-3",
                                { "text-primary": activeTab === "3" }
                              )}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0 fs-13">Companies</h5>
                            <p className="mb-0 fs-12 text-muted">
                              Manage companies
                            </p>
                          </div>
                        </div>
                      </NavLink>
                    </NavItem>

                    {/* Tab 4: Warehouse Management */}
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
                                "ri-store-2-line fs-18 me-3",
                                { "text-primary": activeTab === "4" }
                              )}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0 fs-13">Warehouses</h5>
                            <p className="mb-0 fs-12 text-muted">
                              Manage warehouse
                            </p>
                          </div>
                        </div>
                      </NavLink>
                    </NavItem>

                    {/* Tab 5: Stock Item Management */}
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
                                "ri-box-3-line fs-18 me-3",
                                { "text-primary": activeTab === "5" }
                              )}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0 fs-13">Stock Items</h5>
                            <p className="mb-0 fs-12 text-muted">
                              Manage stock items
                            </p>
                          </div>
                        </div>
                      </NavLink>
                    </NavItem>

                    {/* Tab 6: Warehouse Stock Management */}
                    <NavItem className="mb-2">
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({
                          "active bg-primary-subtle": activeTab === "6",
                        })}
                        onClick={() => toggleTab("6")}
                      >
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i
                              className={classnames(
                                "ri-store-2-line fs-18 me-3",
                                { "text-primary": activeTab === "6" }
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
                      <CategoryManagement />
                    </TabPane>

                    <TabPane tabId="3">
                      <CompanyManagement />
                    </TabPane>

                    <TabPane tabId="4">
                      <WarehouseManagement />
                    </TabPane>
                    <TabPane tabId="5">
                      <StockItemManagement />
                    </TabPane>
                    <TabPane tabId="6">
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