import PropTypes from "prop-types";
import React, { useState } from "react";
import { Row, Col, Alert, Card, CardBody, Container, FormFeedback, Input, Label, Form, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";

import * as Yup from "yup";
import { useFormik } from "formik";

import { useUserMutation } from "../../Components/Hooks/useUsers"; 

import logoLight from "../../assets/images/freshalogo.png";
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";

const ForgetPasswordPage = (props: any) => {
  const { forgotPassword, isUpdating } = useUserMutation();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email format").required("Please Enter Your Email"),
    }),
    onSubmit: async (values) => {
      try {
        const response = await forgotPassword({ email: values.email });
        setSuccessMsg(response.message || "Instructions sent to your email!");
      } catch (error) {
        setSuccessMsg(null);
      }
    }
  });

  document.title = "Reset Password | QAE Management System";

  return (
    <ParticlesAuth>
      <div className="auth-page-content mt-lg-5">
        <Container>
          <Row>
            <Col lg={12}>
              <div className="text-center mt-sm-5 mb-4 text-white-50">
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
                    <h5 className="text-primary">Forgot Password?</h5>
                    <p className="text-muted">Reset your password</p>
                    <i className="ri-mail-send-line display-5 text-success mb-3"></i>
                  </div>

                  <Alert className="border-0 alert-warning text-center mb-2 mx-2" role="alert">
                    Enter your email and instructions will be sent to you!
                  </Alert>

                  <div className="p-2">
                    {/* Success Message display */}
                    {successMsg && (
                      <Alert color="success" style={{ marginTop: "13px" }}>
                        {successMsg}
                      </Alert>
                    )}

                    <Form
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                      }}
                    >
                      <div className="mb-4">
                        <Label className="form-label">Email</Label>
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
                        {validation.touched.email && validation.errors.email ? (
                          <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                        ) : null}
                      </div>

                      <div className="text-center mt-4">
                        <button 
                          className="btn btn-success w-100" 
                          type="submit" 
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Spinner size="sm" className="me-2" /> : null}
                          Send Reset Link
                        </button>
                      </div>
                    </Form>
                  </div>
                </CardBody>
              </Card>

              <div className="mt-4 text-center">
                <p className="mb-0">
                  Wait, I remember my password...{" "}
                  <Link to="/login" className="fw-semibold text-primary text-decoration-underline"> 
                    Click here 
                  </Link> 
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </ParticlesAuth>
  );
};

ForgetPasswordPage.propTypes = {
  history: PropTypes.object,
};

export default withRouter(ForgetPasswordPage);
