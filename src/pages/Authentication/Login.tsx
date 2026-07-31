import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Card, Col, Container, Input, Label, 
    Row, Button, FormFeedback, Form, Alert,
    Spinner
} from 'reactstrap';
import AuthSlider from '../AuthenticationInner/authCarousel';
import withRouter from "../../Components/Common/withRouter";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useLogin } from "../../Components/Hooks/useAuth";

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

    document.title = "Login | Retail Managment System";

    return (
        <React.Fragment>
            <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
                <div className="bg-overlay"></div>
                <div className="auth-page-content overflow-hidden pt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <Card className="overflow-hidden">
                                    <Row className="g-0">
                                        <AuthSlider />

                                        <Col lg={6}>
                                            <div className="p-lg-5 p-4">
                                                <div>
                                                    <h5 className="text-primary">Welcome Back !</h5>
                                                    <h5 className="text-plain">Retail Managment System.</h5>
                                                </div>

                                                {/* React Query Errror */}
                                                {loginMutation.isError && (
                                                    <Alert color="danger">
                                                        {String(loginMutation.error)}
                                                    </Alert>
                                                )}

                                                <div className="mt-4">
                                                    <Form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            validation.handleSubmit();
                                                            return false;
                                                        }}
                                                        action="#">

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
                                                                <Link to="/auth-pass-reset-cover" className="text-muted">
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
                                                                {validation.touched.password && validation.errors.password ? (
                                                                    <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                                                                ) : null}

                                                                <button 
                                                                  className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon" 
                                                                  type="button" 
                                                                  id="password-addon" 
                                                                  onClick={() => setPasswordShow(!passwordShow)}
                                                                >
                                                                  <i className="ri-eye-fill align-middle"></i>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="form-check">
                                                            <Input className="form-check-input" type="checkbox" value="" id="auth-remember-check" />
                                                            <Label className="form-check-label" htmlFor="auth-remember-check">Remember me</Label>
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

                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>

                <footer className="footer">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center">
                                    <p className="mb-0">&copy; {new Date().getFullYear()} Retail Managment System</p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </footer>

            </div>
        </React.Fragment>
    );
};

export default withRouter(Login);