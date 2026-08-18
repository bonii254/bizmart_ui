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

interface TabItem {
  id: string;
  title: string;
  menuLabel: string;
  menuSubtitle: string;
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
        menuSubtitle: "Manage system operators",
        icon: "ri-user-settings-line",
        component: <OperatorManagement />,
      },
      {
        id: "2",
        title: "User Roles & Permissions",
        menuLabel: "User Roles",
        menuSubtitle: "Access & Permissions",
        icon: "ri-shield-user-line",
        component: <RoleManagement />,
      },
      {
        id: "3",
        title: "Category Management",
        menuLabel: "Categories",
        menuSubtitle: "Master category listing",
        icon: "ri-folder-2-line",
        component: <CategoryManagement />,
      },
      {
        id: "4",
        title: "Company Management",
        menuLabel: "Companies",
        menuSubtitle: "Manage companies",
        icon: "ri-building-line",
        component: <CompanyManagement />,
      },
      {
        id: "5",
        title: "Warehouse Management",
        menuLabel: "Warehouses",
        menuSubtitle: "Manage warehouse",
        icon: "ri-store-2-line",
        component: <WarehouseManagement />,
      },
      {
        id: "6",
        title: "Stock Item Management",
        menuLabel: "Stock Items",
        menuSubtitle: "Manage stock items",
        icon: "ri-box-3-line",
        component: <StockItemManagement />,
      },
      {
        id: "7",
        title: "Warehouse Stock Management",
        menuLabel: "Warehouse Stock",
        menuSubtitle: "Manage warehouse stock",
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
        <Container fluid>
          <Row>
            {/* Left Navigation Menu */}
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

                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <NavItem key={tab.id} className="mb-2">
                          <NavLink
                            style={{ cursor: "pointer" }}
                            className={classnames({
                              "active bg-primary-subtle": isActive,
                            })}
                            onClick={() => toggleTab(tab.id)}
                          >
                            <div className="d-flex align-items-center">
                              <div className="flex-shrink-0">
                                <i
                                  className={classnames(`${tab.icon} fs-18 me-3`, {
                                    "text-primary": isActive,
                                  })}
                                />
                              </div>
                              <div className="flex-grow-1">
                                <h5 className="mb-0 fs-13">{tab.menuLabel}</h5>
                                <p className="mb-0 fs-12 text-muted">
                                  {tab.menuSubtitle}
                                </p>
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
            <Col lg={9}>
              <Card>
                <CardHeader className="align-items-center d-flex border-bottom-dashed">
                  <h4 className="card-title mb-0 flex-grow-1">
                    {activeTabItem?.title || "Settings"}
                  </h4>
                </CardHeader>
                <CardBody className="p-4">
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