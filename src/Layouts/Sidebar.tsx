import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import SimpleBar from "simplebar-react";
import { Container } from "reactstrap";

import logoSm from "../assets/images/logo-sm.png";

// Import Hooks & Types
import { useCompanies } from "../Components/Hooks/useCompanies";

// Import Components
import VerticalLayout from "./VerticalLayouts";
import TwoColumnLayout from "./TwoColumnLayout";
import HorizontalLayout from "./HorizontalLayout";

const Sidebar = ({ layoutType }: any) => {
  const { data: companiesData } = useCompanies();

  const companyName = useMemo(() => {
    if (!companiesData) return "Enterprise ERP";
    const list = Array.isArray(companiesData)
      ? companiesData
      : (companiesData as any)?.data ?? [];
    return list[0]?.companyName || "Enterprise ERP";
  }, [companiesData]);

  useEffect(() => {
    var verticalOverlay = document.getElementsByClassName("vertical-overlay");
    if (verticalOverlay && verticalOverlay[0]) {
      verticalOverlay[0].addEventListener("click", function () {
        document.body.classList.remove("vertical-sidebar-enable");
      });
    }
  }, []);

  const addEventListenerOnSmHoverMenu = () => {
    if (document.documentElement.getAttribute("data-sidebar-size") === "sm-hover") {
      document.documentElement.setAttribute("data-sidebar-size", "sm-hover-active");
    } else if (document.documentElement.getAttribute("data-sidebar-size") === "sm-hover-active") {
      document.documentElement.setAttribute("data-sidebar-size", "sm-hover");
    } else {
      document.documentElement.setAttribute("data-sidebar-size", "sm-hover");
    }
  };

  return (
    <React.Fragment>
      <div className="app-menu navbar-menu">
        <div className="navbar-brand-box px-3 d-flex align-items-center justify-content-between">
         
          <Link to="/" className="logo logo-light text-start d-flex align-items-center gap-2 overflow-hidden text-decoration-none">
            <span className="logo-sm">
              <img src={logoSm} alt="" height="22" />
            </span>
            <span className="logo-lg text-truncate fw-bold fs-14 text-white text-uppercase tracking-wide">
              {companyName}
            </span>
          </Link>

          <button
            onClick={addEventListenerOnSmHoverMenu}
            type="button"
            className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover"
          >
            <i className="ri-record-circle-line"></i>
          </button>
        </div>

        {layoutType === "horizontal" ? (
          <div id="scrollbar">
            <Container fluid>
              <div id="two-column-menu"></div>
              <ul className="navbar-nav" id="navbar-nav">
                <HorizontalLayout />
              </ul>
            </Container>
          </div>
        ) : layoutType === "twocolumn" ? (
          <React.Fragment>
            <TwoColumnLayout layoutType={layoutType} />
            <div className="sidebar-background"></div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <SimpleBar id="scrollbar" className="h-100">
              <Container fluid>
                <div id="two-column-menu"></div>
                <ul className="navbar-nav" id="navbar-nav">
                  <VerticalLayout layoutType={layoutType} />
                </ul>
              </Container>
            </SimpleBar>
            <div className="sidebar-background"></div>
          </React.Fragment>
        )}
      </div>
      <div className="vertical-overlay"></div>
    </React.Fragment>
  );
};

export default Sidebar;