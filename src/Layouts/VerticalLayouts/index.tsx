import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Collapse } from 'reactstrap';
import navdata from "../LayoutMenuData";
import { withTranslation } from "react-i18next";
import withRouter from "../../Components/Common/withRouter";
import { useSelector } from "react-redux";
import { createSelector } from 'reselect';

const VerticalLayout = (props: any) => {
    const navData = navdata().props.children;
    const path = props.router.location.pathname;

    // 🔥 NEW STATE (controls dropdown)
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const toggleMenu = (id: string) => {
        setActiveMenu(prev => prev === id ? null : id);
    };

    const selectLayoutProperties = createSelector(
        (state: any) => state.Layout,
        (layout) => ({
            leftsidbarSizeType: layout.leftsidbarSizeType,
            sidebarVisibilitytype: layout.sidebarVisibilitytype,
            layoutType: layout.layoutType
        })
    );

    const {
        leftsidbarSizeType, sidebarVisibilitytype, layoutType
    } = useSelector(selectLayoutProperties);

    const resizeSidebarMenu = useCallback(() => {
        var windowSize = document.documentElement.clientWidth;
        const humberIcon = document.querySelector(".hamburger-icon") as HTMLElement;
        var hamburgerIcon = document.querySelector(".hamburger-icon");

        if (windowSize >= 1025) {
            document.documentElement.setAttribute("data-sidebar-size", leftsidbarSizeType);
            if ((sidebarVisibilitytype === "show" || layoutType === "vertical" || layoutType === "twocolumn")) {
                hamburgerIcon?.classList.remove("open");
            } else {
                hamburgerIcon?.classList.add("open");
            }
        } else {
            document.documentElement.setAttribute("data-sidebar-size", "sm");
            humberIcon?.classList.add("open");
        }
    }, [leftsidbarSizeType, sidebarVisibilitytype, layoutType]);

    useEffect(() => {
        window.addEventListener("resize", resizeSidebarMenu, true);
        return () => window.removeEventListener("resize", resizeSidebarMenu);
    }, [resizeSidebarMenu]);

    return (
        <>
            {(navData || []).map((item: any, key: number) => (
                <React.Fragment key={key}>

                    {/* HEADER */}
                    {item.isHeader ? (
                        <li className="menu-title">
                            <span>{props.t(item.label)}</span>
                        </li>
                    ) : item.subItems ? (

                        /* 🔥 DROPDOWN FIX */
                        <li className="nav-item">
                            <Link
                                to="#"
                                className="nav-link menu-link"
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleMenu(item.id);
                                }}
                            >
                                <i className={item.icon}></i>
                                <span>{props.t(item.label)}</span>
                            </Link>

                            <Collapse
                                className="menu-dropdown"
                                isOpen={activeMenu === item.id}  // ✅ FIX
                            >
                                <ul className="nav nav-sm flex-column">
                                    {item.subItems.map((subItem: any, subKey: number) => (
                                        <li className="nav-item" key={subKey}>
                                            <Link
                                                to={subItem.link}
                                                className="nav-link"
                                            >
                                                {props.t(subItem.label)}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </Collapse>
                        </li>

                    ) : (

                        /* NORMAL LINK */
                        <li className="nav-item">
                            <Link
                                className="nav-link menu-link"
                                to={item.link || "/#"}
                            >
                                <i className={item.icon}></i>
                                <span>{props.t(item.label)}</span>
                            </Link>
                        </li>

                    )}
                </React.Fragment>
            ))}
        </>
    );
};

VerticalLayout.propTypes = {
    location: PropTypes.object,
    t: PropTypes.any,
};

export default withRouter(withTranslation()(VerticalLayout));