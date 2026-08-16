import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  CardBody,
  Button,
  Label,
  Input,
  FormFeedback,
  Form,
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import { editProfile, resetProfileFlag } from "../../slices/thunks";
import { getLoggedinUser } from "../../helpers/api_helper";

import avatar from "../../assets/images/users/avatar-1.jpg";

const UserProfile = () => {
  const dispatch: any = useDispatch();
  
  const { data: userData } =getLoggedinUser();

  const profileSelector = createSelector(
    (state: any) => state.Profile,
    (profile) => ({
      success: profile.success,
      error: profile.error
    })
  );
  const { success, error } = useSelector(profileSelector);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: userData?.username || 'Admin',
      idx: userData?._id || userData?.id || '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required("Please Enter Your UserName"),
    }),
    onSubmit: (values) => {
      dispatch(editProfile(values));
    }
  });

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(resetProfileFlag());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [dispatch, success]);

  document.title = "Profile | Velzon - React Admin & Dashboard Template";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg="12">
              {error && <Alert color="danger">{error}</Alert>}
              {success && <Alert color="success">Username Updated Successfully!</Alert>}

              <Card>
                <CardBody>
                  <div className="d-flex">
                    <div className="mx-3">
                      <img
                        src={avatar}
                        alt=""
                        className="avatar-md rounded-circle img-thumbnail"
                      />
                    </div>
                    <div className="flex-grow-1 align-self-center">
                      <div className="text-muted">
                        <h5>{userData?.username || "Admin"}</h5>
                        <p className="mb-1">Email Id : {userData?.email || "N/A"}</p>
                        <p className="mb-0">Payroll No : {userData?.payroll_number || "0"}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <h4 className="card-title mb-4">Change User Name</h4>

          <Card>
            <CardBody>
              <Form
                className="form-horizontal"
                onSubmit={(e) => {
                  e.preventDefault();
                  validation.handleSubmit();
                }}
              >
                <div className="form-group">
                  <Label className="form-label">User Name</Label>
                  <Input
                    name="first_name"
                    className="form-control"
                    type="text"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.username}
                    invalid={!!(validation.touched.username && validation.errors.username)}
                  />
                  {validation.touched.username && validation.errors.username && (
                    <FormFeedback type="invalid">{String(validation.errors.username)}</FormFeedback>
                  )}
                  <Input name="idx" value={validation.values.idx} type="hidden" />
                </div>
                <div className="text-center mt-4">
                  <Button type="submit" color="danger">
                    Update User Name
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserProfile;