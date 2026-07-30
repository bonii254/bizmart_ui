import React from 'react';
import { Routes, Route } from "react-router-dom";

import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import AuthProtected from './AuthProtected';

const Index = () => {
    return (
        <React.Fragment>
            <Routes>
                {/* --- Public Routes (Login, Register, etc.) --- */}
                <Route>
                    {publicRoutes.map((route: any, idx: number) => {
                        const Component = route.component; 
                        return (
                            <Route
                                path={route.path}
                                element={
                                    <NonAuthLayout>
                                        {/* 2. Render as JSX Element */}
                                        {route.component}
                                    </NonAuthLayout>
                                }
                                key={idx}
                            />
                        )
                    })}
                </Route>

                {/* --- Authenticated Routes (Dashboard, Profile, etc.) --- */}
                <Route>
                    {authProtectedRoutes.map((route: any, idx: number) => {
                        const Component = route.component;
                        return (
                            <Route
                                path={route.path}
                                element={
                                    <AuthProtected>
                                        <VerticalLayout>
                                            {/* 2. Render as JSX Element */}
                                            {route.component}
                                        </VerticalLayout>
                                    </AuthProtected>
                                }
                                key={idx}
                            />
                        )
                    })}
                </Route>
            </Routes>
        </React.Fragment>
    );
};

export default Index;