import React, { useState } from "react";
import { useUser } from "../Components/Hooks/useAuth";

const Navdata = () => {
  const { data: user } = useUser();
  const role = user?.role_name;

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const roleAccess: Record<string, string[]> = {
    ATTENDANT: [
      "blog",
      "grn" ,
      "reports", 
      "requisition", 
      "consumption"
    ],
    QAE: [
      "blog", 
      "grn", 
      "settings", 
      "reports", 
      "requisition", 
      "consumption"
    ],
    ADMIN: [
      "blog",
      "briquette-audit",
      "fuel-audit",
      "settings",
      "reports",
      "audit-logs",
    ],
  };

  const allowedItems = roleAccess[role as keyof typeof roleAccess] || [];

  const handleToggle = (id: string) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  const dashboardItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "ri-dashboard-line",
      link: "/dashboard",
      badgeColor: "success",
      badgeName: "New",
    },
    {
      id: "grn",
      label: "Goods Received Note",
      icon: "ri-file-add-line",
      link: "/grn",
    },
    {
      id: "requisition",
      label: "Requisition",
      icon: "ri-download-cloud-line",
      link: "/requisition",
    },
    {
      id: "consumption",
      label: "Consumption",
      icon: "ri-box-3-line",
      link: "/consumption"
    },
    {
      id: "reports",
      label: "Reports",
      icon: "ri-bar-chart-line",
      link: "/#",
      click: (e: React.MouseEvent) => {
        e.preventDefault();
        handleToggle("reports");
      },
      subItems: [
        {
          id: "CoolersSummary-report",
          label: "Coolers Summary Report",
          icon: "ri-file-line",
          link: "/CoolersSummaryReport",
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: "ri-settings-3-line",
      link: "/settings",
    },
    {
      id: "audit-logs",
      label: "Audit Logs",
      icon: "ri-file-list-3-line",
      link: "/audit-logs",
    },
  ];

  const filteredDashboardItems =
    role === "ADMIN"
      ? dashboardItems
      : dashboardItems.filter((item) => allowedItems.includes(item.id));

  const menuItems = [
    { label: "Menu", isHeader: true },
    ...filteredDashboardItems.map((item) => ({
      ...item,
      isOpen: item.id === activeMenu,
    })),
  ];

  return <>{menuItems}</>;
};

export default Navdata;