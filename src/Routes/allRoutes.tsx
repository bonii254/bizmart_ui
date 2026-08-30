import React from "react";
import { Navigate } from "react-router-dom";


import GoodsReceipt from "../pages/GRN/GoodReceivedNote";
import SalesHistory from "../pages/POS/salesHistory"
import StockBalanceOverview from "../pages/Inventory";
import StockTakeList from "../pages/Inventory/StockTakeOverview";
import NewStockTake from "../pages/Inventory/NewStockTake";
import CustomerManagement from "../pages/Customers/customerManagement";
import SupplierManagement from "../pages/Suppliers/SupplierManagement";
import BankManagement from "../pages/Bank/BankManagement";
import CashWithdrawal from "../pages/Withdraw/CashWithdrawal";
import PointOfSale from "../pages/POS/PointOfSale";
import SettingsHub from "../pages/settings/index";
import AuditLogs from "../pages/AuditLogs/AuditLogs";

import StockTakeReport from "../pages/Report/StockTakeReport";
import InventoryTransactions from "../pages/Report/InventoryTransactions"
import SalesPerItem from "../pages/Report/SalesPerItem/SalesPerItem"

import DashboardEcommerce from "../pages/DashboardEcommerce";

import BasicSignIn from "../pages/AuthenticationInner/Login/BasicSignIn";
import CoverSignIn from "../pages/AuthenticationInner/Login/CoverSignIn";
import BasicSignUp from "../pages/AuthenticationInner/Register/BasicSignUp";
import CoverSignUp from "../pages/AuthenticationInner/Register/CoverSignUp";
import BasicPasswReset from "../pages/AuthenticationInner/PasswordReset/BasicPasswReset";
import SimplePage from "../pages/Pages/Profile/SimplePage/SimplePage";
import Settings from "../pages/Pages/Profile/Settings/Settings";

import CoverPasswReset from "../pages/AuthenticationInner/PasswordReset/CoverPasswReset";
import BasicLockScreen from "../pages/AuthenticationInner/LockScreen/BasicLockScr";
import CoverLockScreen from "../pages/AuthenticationInner/LockScreen/CoverLockScr";
import BasicLogout from "../pages/AuthenticationInner/Logout/BasicLogout";
import CoverLogout from "../pages/AuthenticationInner/Logout/CoverLogout";
import BasicSuccessMsg from "../pages/AuthenticationInner/SuccessMessage/BasicSuccessMsg";
import CoverSuccessMsg from "../pages/AuthenticationInner/SuccessMessage/CoverSuccessMsg";
import BasicTwosVerify from "../pages/AuthenticationInner/TwoStepVerification/BasicTwosVerify";
import CoverTwosVerify from "../pages/AuthenticationInner/TwoStepVerification/CoverTwosVerify";
import Basic404 from "../pages/AuthenticationInner/Errors/Basic404";
import Cover404 from "../pages/AuthenticationInner/Errors/Cover404";
import Alt404 from "../pages/AuthenticationInner/Errors/Alt404";
import Error500 from "../pages/AuthenticationInner/Errors/Error500";

import BasicPasswCreate from "../pages/AuthenticationInner/PasswordCreate/BasicPasswCreate";
import CoverPasswCreate from "../pages/AuthenticationInner/PasswordCreate/CoverPasswCreate";
import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";

import Login from "../pages/Authentication/Login";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";



import UserProfile from "../pages/Authentication/user-profile";
import { components } from "react-select";


const authProtectedRoutes = [
  { path: "/dashboard", component: <DashboardEcommerce /> },
  { path: "/index", component: <DashboardEcommerce /> },

  { path: "/grn", component: <GoodsReceipt/> },
  { path: "/pos", component: <PointOfSale/> },
  { path: "/sales-history", component: <SalesHistory/>},
  { path: "/inventory/products", component: <StockBalanceOverview/> },
  { path: "/inventory/stock-take", component: <StockTakeList /> },
  { path: "/inventory/stock-take/new", component: <NewStockTake /> },
  { path: "/customers", component: <CustomerManagement/> },
  { path: "/suppliers", component: <SupplierManagement/> },
  { path: "/banks", component: <BankManagement/> },
  { path: "/cash-withdrawal", component: <CashWithdrawal /> },
  { path: "/reports/sales-transactions", component: <SalesHistory />},
  { path: "/settings", component: <SettingsHub /> },
  { path: "/audit-logs", component: <AuditLogs /> },

  { path: "/reports/stocktake-transactions", component: <StockTakeReport /> },
  { path: "/reports/inventory-transactions", component: <InventoryTransactions /> },
  { path: "/reports/sales-per-item", component: <SalesPerItem />},

  { path: "/pages-profile", component: <SimplePage /> },
  { path: "/pages-profile-settings", component: <Settings /> },

  { path: "/profile", component: <UserProfile /> },

  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
  { path: "*", component: <Navigate to="/dashboard" /> },
];

const publicRoutes: any = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPasswordPage /> },
  { path: "/register", component: <Register /> },

  { path: "/auth-signin-basic", component: <BasicSignIn /> },
  { path: "/auth-signin-cover", component: <CoverSignIn /> },
  { path: "/auth-signup-basic", component: <BasicSignUp /> },
  { path: "/auth-signup-cover", component: <CoverSignUp /> },
  { path: "/auth-pass-reset-basic", component: <BasicPasswReset /> },
  { path: "/auth-pass-reset-cover", component: <CoverPasswReset /> },
  { path: "/auth-lockscreen-basic", component: <BasicLockScreen /> },
  { path: "/auth-lockscreen-cover", component: <CoverLockScreen /> },
  { path: "/auth-logout-basic", component: <BasicLogout /> },
  { path: "/auth-logout-cover", component: <CoverLogout /> },
  { path: "/auth-success-msg-basic", component: <BasicSuccessMsg /> },
  { path: "/auth-success-msg-cover", component: <CoverSuccessMsg /> },
  { path: "/auth-twostep-basic", component: <BasicTwosVerify /> },
  { path: "/auth-twostep-cover", component: <CoverTwosVerify /> },
  { path: "/auth-404-basic", component: <Basic404 /> },
  { path: "/auth-404-cover", component: <Cover404 /> },
  { path: "/auth-404-alt", component: <Alt404 /> },
  { path: "/auth-500", component: <Error500 /> },

  { path: "/auth-pass-change-basic", component: <BasicPasswCreate /> },
  { path: "/auth-pass-change-cover", component: <CoverPasswCreate /> },
  { path: "/auth-offline", component: <Offlinepage /> },
];

export { authProtectedRoutes, publicRoutes };
