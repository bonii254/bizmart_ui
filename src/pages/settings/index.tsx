import React, { useState, useEffect, useMemo } from "react";
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

import OperatorManagement from "./users";
import RoleManagement from "./roles";
import CategoryManagement from "./Category";
import CompanyManagement from "./Company";
import WarehouseManagement from "./Warehouse";
import StockItemManagement from "./StockItem";
import ItemWarehouseManagement from "./WarehouseStock";
import PriceCodeManagement from "./pricing";

interface TabItem {
  id: string;
  title: string;
  menuLabel: string;
  icon: string;
  component: React.ReactNode;
}

const SettingsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("1");

  useEffect(() => {
    document.title = "System Configuration | Velzon - React Admin & Dashboard Template";
  }, []);

  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: "1",
        title: "Operator Management",
        menuLabel: "Operators",
        icon: "ri-user-settings-line",
        component: <OperatorManagement />,
      },
      {
        id: "2",
        title: "User Roles & Permissions",
        menuLabel: "User Roles",
        icon: "ri-shield-user-line",
        component: <RoleManagement />,
      },
      {
        id: "3",
        title: "Category Management",
        menuLabel: "Categories",
        icon: "ri-folder-2-line",
        component: <CategoryManagement />,
      },
      {
        id: "4",
        title: "Company Management",
        menuLabel: "Companies",
        icon: "ri-building-line",
        component: <CompanyManagement />,
      },
      {
        id: "5",
        title: "Warehouse Management",
        menuLabel: "Warehouses",
        icon: "ri-store-2-line",
        component: <WarehouseManagement />,
      },
      {
        id: "6",
        title: "Price Code Management",
        menuLabel: "Price Codes",
        icon: "ri-price-tag-2-line",
        component: <PriceCodeManagement />,
      },
      {
        id: "7",
        title: "Stock Item Management",
        menuLabel: "Stock Items",
        icon: "ri-box-3-line",
        component: <StockItemManagement />,
      },
      {
        id: "8",
        title: "Warehouse Stock Management",
        menuLabel: "Warehouse Stock",
        icon: "ri-store-2-line",
        component: <ItemWarehouseManagement />,
      },
    ],
    []
  );

  const activeTabItem = tabs.find((tab) => tab.id === activeTab);

  const toggleTab = (tabId: string): void => {
    if (activeTab !== tabId) setActiveTab(tabId);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid className="px-2 px-md-3">
          {/* Mobile & Tablet Horizontal Scrollable Nav (Visible only below lg breakpoint) */}
          <Row className="d-lg-none mb-3">
            <Col xs={12}>
              <Card className="shadow-sm border-0">
                <CardBody className="p-2">
                  <div className="d-flex overflow-auto flex-nowrap pb-1 custom-horizontal-scroll">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => toggleTab(tab.id)}
                          className={classnames(
                            "btn btn-sm text-nowrap me-2 d-flex align-items-center px-3 py-2 fw-medium",
                            {
                              "btn-primary": isActive,
                              "btn-soft-secondary": !isActive,
                            }
                          )}
                          style={{ fontSize: "12px" }}
                        >
                          <i className={`${tab.icon} me-1.5 fs-14`}></i>
                          {tab.menuLabel}
                        </button>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            {/* Desktop Left Vertical Navigation Menu (Hidden on mobile/tablet) */}
            <Col lg={3} className="d-none d-lg-block">
              <Card className="shadow-sm border-0 sticky-top" style={{ top: "80px" }}>
                <CardHeader className="bg-white py-3 border-bottom-dashed">
                  <h5 className="card-title mb-0 fs-14 fw-semibold text-uppercase text-muted">
                    Settings Menu
                  </h5>
                </CardHeader>
                <CardBody className="p-2">
                  <Nav pills vertical className="nav-pills-custom">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <NavItem key={tab.id} className="mb-1">
                          <NavLink
                            style={{ cursor: "pointer" }}
                            className={classnames("rounded-2 py-2 px-3 transition-all", {
                              "active bg-primary-subtle text-primary fw-semibold": isActive,
                              "text-muted hover-bg-light": !isActive,
                            })}
                            onClick={() => toggleTab(tab.id)}
                          >
                            <div className="d-flex align-items-center">
                              <div className="flex-shrink-0">
                                <i
                                  className={classnames(`${tab.icon} fs-16 me-2.5`, {
                                    "text-primary": isActive,
                                  })}
                                />
                              </div>
                              <div className="flex-grow-1">
                                <span className="mb-0 fs-13">{tab.menuLabel}</span>
                              </div>
                            </div>
                          </NavLink>
                        </NavItem>
                      );
                    })}
                  </Nav>
                </CardBody>
              </Card>
            </Col>

            {/* Right Tab Content View */}
            <Col lg={9} xs={12}>
              <Card className="shadow-sm border-0">
                <CardHeader className="align-items-center d-flex border-bottom-dashed bg-white py-3">
                  <h4 className="card-title mb-0 flex-grow-1 fs-16 fw-semibold text-dark">
                    <i className={`${activeTabItem?.icon} me-2 text-primary fs-18 align-middle`}></i>
                    {activeTabItem?.title || "Settings"}
                  </h4>
                </CardHeader>
                <CardBody className="p-3 p-md-4">
                  <TabContent activeTab={activeTab}>
                    {tabs.map((tab) => (
                      <TabPane key={tab.id} tabId={tab.id}>
                        {tab.component}
                      </TabPane>
                    ))}
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