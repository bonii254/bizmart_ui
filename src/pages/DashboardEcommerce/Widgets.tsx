import React, { useMemo } from 'react';
import CountUp from "react-countup";
import { Card, CardBody, Col, Spinner } from 'reactstrap';

// POS Hook & Types
import { useSalesTransactions } from "../../Components/Hooks/usePOS";
import { SalesTransaction } from "../../types/POS";

const Widgets: React.FC = () => {
  // Fetch real-time sales transactions
  const { data: salesResponse, isLoading } = useSalesTransactions({});

  // Parse transaction list reliably matching salesHistory structure
  const salesList: SalesTransaction[] = useMemo(() => {
    if (!salesResponse) return [];
    if (Array.isArray(salesResponse.data)) return salesResponse.data;
    if (Array.isArray(salesResponse)) return salesResponse;
    return [];
  }, [salesResponse]);

  // Compute live current-day metrics
  const todayStats = useMemo(() => {
    const todayStr = new Date().toDateString();

    // Filter strictly for today's completed transactions
    const todaySales = salesList.filter((sale) => {
      if (!sale.sold_at) return false;
      return new Date(sale.sold_at).toDateString() === todayStr;
    });

    // 1. Today's Total Revenue
    const todayRevenue = todaySales.reduce((acc, curr) => acc + (curr.total || 0), 0);

    // 2. Today's Transaction Count
    const todayTxns = todaySales.length;

    // 3. Today's Average Basket Value
    const avgBasket = todayTxns > 0 ? todayRevenue / todayTxns : 0;

    // 4. Today's M-PESA / Mobile Money Revenue
    const mpesaSales = todaySales
      .filter((sale) => {
        const method = sale.payment_method_code?.toUpperCase() || '';
        return method.includes('MOBILE') || method.includes('MPESA') || method.includes('M-PESA');
      })
      .reduce((acc, curr) => acc + (curr.total || 0), 0);

    return {
      todayRevenue,
      todayTxns,
      avgBasket,
      mpesaSales,
    };
  }, [salesList]);

  // Dynamic widget configurations aligned with live stats
  const dynamicWidgets = useMemo(
    () => [
      {
        id: 1,
        cardColor: "success",
        label: "Today's Revenue",
        badge: "ri-arrow-up-line",
        badgeClass: "success",
        percentage: "Today",
        counter: todayStats.todayRevenue,
        bgcolor: "success",
        icon: "bx bx-dollar-circle",
        decimals: 2,
        prefix: "Ksh ",
        separator: ",",
        suffix: "",
      },
      {
        id: 2,
        cardColor: "primary",
        label: "Average Basket Value",
        badge: "ri-line-chart-line",
        badgeClass: "primary",
        percentage: "Per Sale",
        counter: todayStats.avgBasket,
        bgcolor: "primary",
        icon: "bx bx-bar-chart-square",
        decimals: 2,
        prefix: "Ksh ",
        separator: ",",
        suffix: "",
      },
      {
        id: 3,
        cardColor: "info",
        label: "Total Transactions",
        badge: "ri-shopping-bag-line",
        badgeClass: "info",
        percentage: "Today",
        counter: todayStats.todayTxns,
        bgcolor: "info",
        icon: "bx bx-package",
        decimals: 0,
        prefix: "",
        separator: ",",
        suffix: " txns",
      },
      {
        id: 6,
        cardColor: "secondary",
        label: "M-PESA Sales",
        badge: "ri-smartphone-line",
        badgeClass: "secondary",
        percentage: "Mobile Money",
        counter: todayStats.mpesaSales,
        bgcolor: "secondary",
        icon: "bx bx-mobile-alt",
        decimals: 2,
        prefix: "Ksh ",
        separator: ",",
        suffix: "",
      },
    ],
    [todayStats]
  );

  return (
    <React.Fragment>
      {dynamicWidgets.map((item) => (
        <Col xl={3} md={6} key={item.id}>
          <Card className="card-animate border-0 shadow-sm">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    {item.label}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <h5 className={`fs-14 mb-0 text-${item.badgeClass}`}>
                    {item.badge && <i className={`fs-13 align-middle me-1 ${item.badge}`}></i>}
                    {item.percentage}
                  </h5>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-20 fw-semibold ff-secondary mb-0">
                    {isLoading ? (
                      <Spinner size="sm" color={item.cardColor} />
                    ) : (
                      <CountUp
                        start={0}
                        prefix={item.prefix}
                        suffix={item.suffix}
                        separator={item.separator}
                        end={item.counter}
                        decimals={item.decimals}
                        duration={1.5}
                      />
                    )}
                  </h4>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className={`avatar-title rounded fs-3 bg-${item.bgcolor}-subtle`}>
                    <i className={`text-${item.cardColor} ${item.icon}`}></i>
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </React.Fragment>
  );
};

export default Widgets;