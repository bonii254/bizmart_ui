import React, { useState } from "react";
import { useUser } from "../Components/Hooks/useAuth";

const Navdata = () => {
  const { data: user } = useUser();
  const role = user?.role_name;

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const roleAccess: Record<string, string[]> = {
    ATTENDANT: [
      "pos",
      "dashboard",
      "sales",
      "finance",
      "crm",
      "reports"
    ],
    QAE: [
      "dashboard",
      "inventory",
      "purchasing",
      "reports",
      "administration"
    ],
    ADMIN: [
      "pos", "dashboard", "sales", "inventory", "purchasing", 
      "finance", "crm", "reports", "administration"
    ],
  };

  const allowedItems = roleAccess[role as keyof typeof roleAccess] || [];

  const handleToggle = (id: string) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  const dashboardItems = [
    // ----------------------------------------------------
    // FRONT-OF-HOUSE (POS TERMINAL)
    // ----------------------------------------------------
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "ri-dashboard-line",
      link: "/dashboard",
    },

    {
      id: "pos",
      label: "Point of Sale (POS)",
      icon: "ri-shopping-cart-2-line",
      link: "/pos",
      badgeColor: "danger",
      badgeName: "Terminal",
    },

    // ----------------------------------------------------
    // SALES & TRANSACTIONS
    // ----------------------------------------------------
    {
      id: "sales",
      label: "Sales Management",
      icon: "ri-receipt-line",
      link: "/#",
      click: (e: React.MouseEvent) => {
        e.preventDefault();
        handleToggle("sales");
      },
      subItems: [
        { id: "sales-history", label: "Sales History", link: "/sales-history" },
        { id: "quotations", label: "Quotations / Estimates", link: "/quotations" },
        { id: "refunds", label: "Returns & Refunds", link: "/refunds" },
      ],
    },

    // ----------------------------------------------------
    // INVENTORY & STOCK
    // ----------------------------------------------------
    {
      id: "inventory",
      label: "Inventory",
      icon: "ri-store-2-line",
      link: "/#",
      click: (e: React.MouseEvent) => {
        e.preventDefault();
        handleToggle("inventory");
      },
      subItems: [
        { id: "products", label: "Product Catalog", link: "/inventory/products" },
        { id: "stock-take", label: "Stock Take / Audits", link: "/inventory/stock-take" },
      ],
    },

    // ----------------------------------------------------
    // PURCHASING & SUPPLY CHAIN
    // ----------------------------------------------------
    {
      id: "purchasing",
      label: "Purchasing",
      icon: "ri-truck-line",
      link: "/#",
      click: (e: React.MouseEvent) => {
        e.preventDefault();
        handleToggle("purchasing");
      },
      subItems: [
        { id: "grn", label: "Goods Received Note", link: "/grn" },
        { id: "suppliers", label: "Suppliers Directory", link: "/suppliers" },
        { id: "purchase-orders", label: "Purchase Orders", link: "/purchase-orders" },
      ],
    },

    // ----------------------------------------------------
    // FINANCE & CASH MANAGEMENT
    // ----------------------------------------------------
    {
      id: "finance",
      label: "Finance & Cash",
      icon: "ri-money-dollar-circle-line",
      link: "/#",
      click: (e: React.MouseEvent) => {
        e.preventDefault();
        handleToggle("finance");
      },
      subItems: [
        { id: "cash-withdrawal", label: "Cash Withdrawals", link: "/cash-withdrawal" },
        { id: "cash-drawer", label: "Cash Drawer Logs", link: "/finance/drawer-logs" },
        { id: "banks", label: "Bank Accounts", link: "/banks" },
        { id: "expenses", label: "Operating Expenses", link: "/finance/expenses" },
      ],
    },

    // ----------------------------------------------------
    // CRM (CUSTOMER RELATIONSHIP)
    // ----------------------------------------------------
    {
      id: "crm",
      label: "Customers",
      icon: "ri-user-shared-2-line",
      link: "/customers",
    },

    // ----------------------------------------------------
    // REPORTS & ANALYTICS
    // ----------------------------------------------------
    {
      id: "reports",
      label: "Reports",
      icon: "ri-bar-chart-box-line",
      link: "/#",
      click: (e: React.MouseEvent) => {
        e.preventDefault();
        handleToggle("reports");
      },
      subItems: [
        { id: "eod-reports", label: "End of Day (Z-Reports)", link: "/reports/eod" },
        { id: "sales-reports", label: "Sales Analytics", link: "/reports/sales" },
        { id: "inventory-reports", label: "Inventory Valuation", link: "/reports/inventory" },
      ],
    },

    // ----------------------------------------------------
    // SYSTEM ADMINISTRATION
    // ----------------------------------------------------
    {
      id: "administration",
      label: "Administration",
      icon: "ri-settings-4-line",
      link: "/#",
      click: (e: React.MouseEvent) => {
        e.preventDefault();
        handleToggle("administration");
      },
      subItems: [
        { id: "settings", label: "System Settings", link: "/settings" },
        { id: "users", label: "User Management", link: "/users" },
        { id: "audit-logs", label: "Audit Logs", link: "/audit-logs" },
      ],
    },
  ];

  // Filter based on roles. ADMIN sees everything.
  const filteredDashboardItems =
    role === "ADMIN"
      ? dashboardItems
      : dashboardItems.filter((item) => allowedItems.includes(item.id));

  const menuItems = [
    { label: "Main Navigation", isHeader: true },
    ...filteredDashboardItems.map((item) => ({
      ...item,
      isOpen: item.id === activeMenu,
    })),
  ];

  return <>{menuItems}</>;
};

export default Navdata;