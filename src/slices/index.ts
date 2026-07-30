import { combineReducers } from "redux";

import LayoutReducer from "./layouts/reducer";

import LoginReducer from "./auth/login/reducer";
import AccountReducer from "./auth/register/reducer";
import ForgetPasswordReducer from "./auth/forgetpwd/reducer";
import ProfileReducer from "./auth/profile/reducer";


import DashboardEcommerceReducer from "./dashboardEcommerce/reducer";


const rootReducer = combineReducers({
    Layout: LayoutReducer,
    Login: LoginReducer,
    Account: AccountReducer,
    ForgetPassword: ForgetPasswordReducer,
    Profile: ProfileReducer,
    DashboardEcommerce: DashboardEcommerceReducer,
});

export default rootReducer;