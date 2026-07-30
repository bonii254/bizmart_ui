import React, { useEffect, useState } from "react";
import { Row, Col, CardBody, Card, Alert, Container, Input, Label, Form, FormFeedback, Button, Spinner } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

// Notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import { registerUser, resetRegisterFlag } from "../../slices/thunks";

// Assets
import logoLight from "../../assets/images/logo-light.png";
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";

const Register = () => {
    const navigate = useNavigate();
    const dispatch: any = useDispatch();
    const [loader, setLoader] = useState<boolean>(false);

    // 1. Selector for Account State
    const selectAccountData = createSelector(
        (state: any) => state.Account,
        (account) => ({
            success: account?.success,
            error: account?.error,
            isUserLogout: account?.isUserLogout
        })
    );
    const { error, success } = useSelector(selectAccountData);

    // 2. Formik Setup
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            email: '',
            first_name: '',
            password: '',
            confirm_password: ''
        },
        validationSchema: Yup.object({
            email: Yup.string().email("Invalid email").required("Please Enter Your Email"),
            first_name: Yup.string().required("Please Enter Your Username"),
            password: Yup.string().min(8, "Password must be at least 8 characters").required("Please enter your password"),
            confirm_password: Yup.string()
                .oneOf([Yup.ref("password")], "Passwords do not match")
                .required("Please confirm your password"),
        }),
        onSubmit: (values) => {
            setLoader(true);
            dispatch(registerUser(values));
        }
    });

    useEffect(() => {
        if (success) {
            setLoader(false);
            toast.success("Registration Successful! Redirecting to login...", { autoClose: 2000 });
            const timer = setTimeout(() => {
                navigate("/login");
                dispatch(resetRegisterFlag());
            }, 3000);
            return () => clearTimeout(timer);
        }

        if (error) {
            setLoader(false);
            const timer = setTimeout(() => dispatch(resetRegisterFlag()), 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error, navigate, dispatch]);

    document.title = "Basic SignUp | Velzon - React Admin & Dashboard Template";

    return (
        <React.Fragment>
            <ParticlesAuth>
                <div className="auth-page-content mt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4 text-white-50">
                                    <Link to="/" className="d-inline-block auth-logo">
                                        <img src={logoLight} alt="" height="20" />
                                    </Link>
                                    <p className="mt-3 fs-15 fw-medium">Premium Admin & Dashboard Template</p>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4">
                                    <CardBody className="p-4">
                                        <div className="text-center mt-2">
                                            <h5 className="text-primary">Create New Account</h5>
                                            <p className="text-muted">Get your free velzon account now</p>
                                        </div>

                                        <div className="p-2 mt-4">
                                            <Form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    validation.handleSubmit();
                                                }}
                                                className="needs-validation"
                                            >
                                                {success && (
                                                    <Alert color="success">
                                                        Registration successful! Redirecting to login...
                                                    </Alert>
                                                )}

                                                {error && (
                                                    <Alert color="danger">
                                                        {typeof error === 'string' ? error : "Email already registered or server error."}
                                                    </Alert>
                                                )}

                                                <div className="mb-3">
                                                    <Label htmlFor="email" className="form-label">Email <span className="text-danger">*</span></Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        placeholder="Enter email address"
                                                        type="email"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.email}
                                                        invalid={!!(validation.touched.email && validation.errors.email)}
                                                    />
                                                    {validation.touched.email && validation.errors.email && (
                                                        <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                                                    )}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="first_name" className="form-label">Username <span className="text-danger">*</span></Label>
                                                    <Input
                                                        id="first_name"
                                                        name="first_name"
                                                        type="text"
                                                        placeholder="Enter username"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.first_name}
                                                        invalid={!!(validation.touched.first_name && validation.errors.first_name)}
                                                    />
                                                    {validation.touched.first_name && validation.errors.first_name && (
                                                        <FormFeedback type="invalid">{validation.errors.first_name}</FormFeedback>
                                                    )}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="password" className="form-label">Password <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="password"
                                                        type="password"
                                                        placeholder="Enter Password"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.password}
                                                        invalid={!!(validation.touched.password && validation.errors.password)}
                                                    />
                                                    {validation.touched.password && validation.errors.password && (
                                                        <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                                                    )}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="confirm_password" className="form-label">Confirm Password <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="confirm_password"
                                                        type="password"
                                                        placeholder="Confirm Password"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.confirm_password}
                                                        invalid={!!(validation.touched.confirm_password && validation.errors.confirm_password)}
                                                    />
                                                    {validation.touched.confirm_password && validation.errors.confirm_password && (
                                                        <FormFeedback type="invalid">{validation.errors.confirm_password}</FormFeedback>
                                                    )}
                                                </div>

                                                <div className="mt-4">
                                                    <Button color="success" className="w-100" type="submit" disabled={loader}>
                                                        {loader && <Spinner size="sm" className='me-2' />} Sign Up
                                                    </Button>
                                                </div>
                                            </Form>
                                        </div>
                                    </CardBody>
                                </Card>
                                <div className="mt-4 text-center">
                                    <p className="mb-0">Already have an account ? <Link to="/login" className="fw-semibold text-primary text-decoration-underline"> Signin </Link> </p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </ParticlesAuth>
            <ToastContainer />
        </React.Fragment>
    );
};

export default Register;