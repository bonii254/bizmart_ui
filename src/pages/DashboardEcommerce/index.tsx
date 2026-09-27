import React, { useState } from "react";
import { Col, Container, Row } from "reactstrap";
import Widgets from "./Widgets";
import Revenue from "./Revenue";
import SalesByCategory from "./SalesByLocations";
import BestSellingProducts from "./BestSellingProducts";
import RecentActivity from "./RecentActivity";

const DashboardEcommerce: React.FC = () => {
  document.title = "Dashboard | Velzon - React Admin & Dashboard Template";

  const [rightColumn, setRightColumn] = useState<boolean>(false);
  const toggleRightColumn = () => {
    setRightColumn(!rightColumn);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col>
              <div className="h-100">
                {/* Top 4 Stat Widgets */}
                <Row className="g-3 mb-3">
                  <Widgets />
                </Row>

                {/* Sales Analytics & Category Breakdown (Aligned side-by-side down to 10" / lg breakpoint) */}
                <Row className="g-3 mb-3 align-items-stretch">
                  <Col lg={8} xl={8} className="d-flex flex-column">
                    <Revenue />
                  </Col>
                  <Col lg={4} xl={4} className="d-flex flex-column">
                    <SalesByCategory />
                  </Col>
                </Row>

                {/* Best Selling Products */}
                <Row className="g-3">
                  <Col xl={12}>
                    <BestSellingProducts />
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Recent Activity Drawer / Column */}
            <RecentActivity rightColumn={rightColumn} hideRightColumn={toggleRightColumn} />
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DashboardEcommerce;