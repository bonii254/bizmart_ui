import React, { useState, useEffect } from "react";
import { 
  Container, Row, Col, Card, CardHeader, CardBody, 
  Table, Badge, Input, Label, Spinner, Alert 
} from "reactstrap";
import { useAuditLogs } from "../../Components/Hooks/useAuditLogs";
import TablePagination from "../BackendPagination";
import { LoginLog, ChangeLog, AuditLogEntry } from "../../types/audit";
import moment from "moment";

const AuditLogs = () => {
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [selectedDate]);

  const { data, isLoading, isError, error } = useAuditLogs(selectedDate, page, perPage);

  const handlePageChange = (p: number) => setPage(p);
  const handleLimitChange = (l: number) => {
    setPerPage(l);
    setPage(1);
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "---";
    
    const cleanedTs = typeof ts === 'string' && ts.includes('+') 
      ? ts.replace('Z', '') 
      : ts;

    const m = moment(cleanedTs);
    return m.isValid() ? m.format("DD MMM, YYYY HH:mm:ss") : "Invalid Date";
  };

  const renderLogDetails = (log: AuditLogEntry) => {
    if ("event" in log) {
      const login = log as LoginLog;
      return (
        <div>
          <h6 className="fs-14 mb-1">{login.email}</h6>
          <p className="text-muted mb-0">IP: {login.ip}</p>
        </div>
      );
    } 
    const change = log as ChangeLog;
    return (
      <div>
        <h6 className="fs-14 mb-1">
          {change.entity} <span className="text-primary">#{change.target_name || change.target_id.slice(0, 8)}</span>
        </h6>
        <p className="text-muted mb-0">Actor: {change.actor_name || change.actor_id}</p>
      </div>
    );
  };

  const renderBadge = (log: AuditLogEntry) => {
    if ("status" in log) {
      return (
        <Badge color={log.status === "success" ? "success" : "danger"} className="text-uppercase">
          {log.event.replace("_", " ")}
        </Badge>
      );
    }
    return <Badge color="info" className="text-uppercase">{log.action}</Badge>;
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="border-0">
                <div className="d-flex align-items-center">
                  <h5 className="card-title mb-0 flex-grow-1">System Audit Logs</h5>
                  <div className="flex-shrink-0">
                    <div className="d-flex align-items-center gap-2">
                      <Label htmlFor="date-filter" className="mb-0 text-nowrap">Filter Date:</Label>
                      <Input
                        type="date"
                        id="date-filter"
                        className="form-control-sm"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="pt-0">
                <div className="table-responsive table-card mb-1">
                  <Table className="align-middle table-nowrap">
                    <thead className="table-light text-muted">
                      <tr>
                        <th style={{ width: "20%" }}>Timestamp</th>
                        <th style={{ width: "15%" }}>Event / Action</th>
                        <th style={{ width: "30%" }}>User / Entity</th>
                        <th style={{ width: "35%" }}>Metadata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={4} className="text-center py-5"><Spinner color="primary" /></td></tr>
                      ) : isError ? (
                        <tr><td colSpan={4}><Alert color="danger" className="text-center mb-0">Error: {(error as any).message}</Alert></td></tr>
                      ) : data?.data.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-5 text-muted">No logs found for this date.</td></tr>
                      ) : (
                        data?.data.map((log: AuditLogEntry, idx: number) => (
                          <tr key={`${selectedDate}-${idx}`}>
                            <td className="text-muted">{formatTimestamp(log.timestamp)}</td>
                            <td>{renderBadge(log)}</td>
                            <td>{renderLogDetails(log)}</td>
                            <td className="text-muted">
                              {"user_agent" in log ? (
                                <span>
                                  <span className="text-dark">{log.path}</span> <br />
                                  <small className="text-truncate d-inline-block" style={{ maxWidth: '250px' }}>
                                    {log.user_agent}
                                  </small>
                                </span>
                              ) : (
                                <span>Modified: {Object.keys(log.changes).join(", ")}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>

                {data && data.total > 0 && (
                  <TablePagination
                    pageSize={perPage}
                    currentLength={data.data.length}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    pagination={{
                      total: data.total,
                      current_page: page,
                      pages: Math.ceil(data.total / perPage),
                      has_next: page < Math.ceil(data.total / perPage),
                      has_prev: page > 1,
                    }}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AuditLogs;