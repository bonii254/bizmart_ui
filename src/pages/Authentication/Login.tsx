import React, { useState } from 'react';
import { 
    Card, 
    CardBody, 
    Col, 
    Container, 
    Input, Label, Row, Button, Form, FormFeedback, Alert, 
    Spinner 
} from 'reactstrap';
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { Link } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";

import * as Yup from "yup";
import { useFormik } from "formik";

import { useLogin } from "../../Components/Hooks/useAuth";

import logoLight from "../../assets/images/freshalogo.png";

const Login = (props: any) => {

    const loginMutation = useLogin();

    const [passwordShow, setPasswordShow] = useState<boolean>(false);

    const validation: any = useFormik({
        enableReinitialize: true,
        initialValues: {
            email: "",
            password: "",
        },
        validationSchema: Yup.object({
            email: Yup.string().required("Please Enter Your Email"),
            password: Yup.string().required("Please Enter Your Password"),
        }),
        onSubmit: (values) => {

            loginMutation.mutate(values, {
                onSuccess: () => {
                    props.router.navigate('/dashboard');
                }
            });
        }
    });;

    document.title = "Login | Fuel and Briquette Management System";

    return (
        <React.Fragment>
            <ParticlesAuth>
                <div className="auth-page-content mt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4 text-white">
                                    <div>
                                        <Link to="/" className="d-inline-block auth-logo">
                                            <img src={logoLight} alt="" height="100" />
                                        </Link>
                                    </div>
                                    <p className="mt-3 fs-15 fw-medium">QAE Fuel and Briquette Management System</p>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4">
                                    <CardBody className="p-4">
                                        <div className="text-center mt-2">
                                            <h5 className="text-primary">Welcome Back !</h5>
                                        </div>

                                        {/* ✅ React Query Error */}
                                        {loginMutation.isError && (
                                            <Alert color="danger">
                                                {String(loginMutation.error)}
                                            </Alert>
                                        )}

                                        <div className="p-2 mt-4">
                                            <Form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    validation.handleSubmit();
                                                    return false;
                                                }}
                                                action="#"
                                            >

                                                <div className="mb-3">
                                                    <Label htmlFor="email" className="form-label">Email</Label>
                                                    <Input
                                                        name="email"
                                                        className="form-control"
                                                        placeholder="Enter email"
                                                        type="email"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.email || ""}
                                                        invalid={
                                                            validation.touched.email && validation.errors.email ? true : false
                                                        }
                                                    />
                                                    {validation.touched.email && validation.errors.email && (
                                                        <FormFeedback type="invalid">
                                                            {validation.errors.email}
                                                        </FormFeedback>
                                                    )}
                                                </div>

                                                <div className="mb-3">
                                                    <div className="float-end">
                                                        <Link to="/forgot-password" className="text-muted">
                                                            Forgot password?
                                                        </Link>
                                                    </div>
                                                    <Label className="form-label" htmlFor="password-input">
                                                        Password
                                                    </Label>
                                                    <div className="position-relative auth-pass-inputgroup mb-3">
                                                        <Input
                                                            name="password"
                                                            value={validation.values.password || ""}
                                                            type={passwordShow ? "text" : "password"}
                                                            className="form-control pe-5"
                                                            placeholder="Enter Password"
                                                            onChange={validation.handleChange}
                                                            onBlur={validation.handleBlur}
                                                            invalid={
                                                                validation.touched.password && validation.errors.password ? true : false
                                                            }
                                                        />
                                                        {validation.touched.password && validation.errors.password && (
                                                            <FormFeedback type="invalid">
                                                                {validation.errors.password}
                                                            </FormFeedback>
                                                        )}

                                                        <button
                                                            className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                                            type="button"
                                                            onClick={() => setPasswordShow(!passwordShow)}
                                                        >
                                                            <i className="ri-eye-fill align-middle"></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="form-check">
                                                    <Input className="form-check-input" type="checkbox" id="auth-remember-check" />
                                                    <Label className="form-check-label" htmlFor="auth-remember-check">
                                                        Remember me
                                                    </Label>
                                                </div>

                                                <div className="mt-4">
                                                    <Button
                                                        color="success"
                                                        disabled={loginMutation.isPending}
                                                        className="btn btn-success w-100"
                                                        type="submit"
                                                    >
                                                        {loginMutation.isPending && (
                                                            <Spinner size="sm" className="me-2">
                                                                Loading...
                                                            </Spinner>
                                                        )}
                                                        Sign In
                                                    </Button>
                                                </div>

                                            </Form>
                                        </div>
                                    </CardBody>
                                </Card>

                            </Col>
                        </Row>
                    </Container>
                </div>
            </ParticlesAuth>
        </React.Fragment>
    );
};

export default withRouter(Login);