import React, { useState } from "react";
import { Col, Container, Row } from "reactstrap";
import Widget from "./Widgets";
import RecentActivity from "./RecentActivity";

const DashboardEcommerce = () => {
  document.title = "Retail managment - Dashboard";

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
                <Row>
                  <Widget />
                </Row>   
              </div>
            </Col>
            <RecentActivity rightColumn={rightColumn} hideRightColumn={toggleRightColumn} />
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DashboardEcommerce;
