import React, { useContext, useEffect, useRef, useState } from "react";
import { Axios } from "../../Config/Axios/Axios";
import { UserContext } from "../../App";
import { Spin, Row, Col } from "antd";
import StatisticCard from "../../Components/StatisticCard/StatisticCard";
import LoaderOverlay from "../../Components/LoaderOverlay/LoaderOverlay";
import DashboardCard from "../../Components/DashboardCard/DashboardCard";
import { CARD_SIZES, getResponsiveProps } from "../../Utils/dashboardLayoutUtils";
import "../../Styles/Dashboard.css";
import MonthlyChart from "../../Components/Dashboard/MonthlyChart/MonthlyChart";
import AlertsWidget from "../../Components/Dashboard/AlertsWidget/AlertsWidget";
import DriverProfileWidget from "../../Components/Dashboard/DriverProfileWidget/DriverProfileWidget";
import SchedulerWidget from "../../Components/Dashboard/SchedulerWidget/SchedulerWidget";

const Dashboard = () => {
  const [contentLoader, setContentLoader] = useState(true);
  const [isError, setIsError] = useState(false);
  const [analyticsLoader, setAnalyticsLoader] = useState(true);
  const [metadata, setMetadata] = useState([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    setAnalyticsLoader(true);

    Axios.get(`/api/v1/app/metadata/getMetadataByUserId`, {
      params: {
        userId: user.userId,
      },
      headers: {
        authorization: `bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        setMetadata(res.data);
        setAnalyticsLoader(false);
        setContentLoader(false);
      })
      .catch((err) => {
        setIsError(true);
        // setContentLoader(false);
      });
  }, []);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex flex-column">
          <b style={{ fontSize: "26px" }}>Dashboard</b>
          <span style={{ fontSize: "14px", color: "#939393" }}>Overview of your truck's performance</span>
        </div>
      </div>
      <LoaderOverlay isVisible={contentLoader} />
      {analyticsLoader ? (
        <div className="w-100 my-5 d-flex align-items-center justify-content-center">
          <b className="me-3">Analyzing metrics</b>
          <Spin size="large" />
        </div>
      ) : (
        <div className="statistics-carousel-container">
          <div className="statistics-carousel">
            <StatisticCard
              cardType="primary"
              title={
                <span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#f6f6f6" }}>
                    Total Expense{" "}
                  </span>
                </span>
              }
              value={metadata.monthlyExpenses?.monthlyGrandTotal}
              thisMonth={metadata.grandTotal}
              route={'/expenses'}
            />
            <StatisticCard
              cardType="primary"
              title={
                <span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#f6f6f6" }}>
                    Fuel Expense{" "}
                  </span>
                </span>
              }
              thisMonth={metadata.fuelTotal}
              value={metadata.monthlyExpenses?.fuel}
              route={'/expenseSummary/fuelExpenses'}
            />
            <StatisticCard
              cardType="primary"
              title={
                <span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#f6f6f6" }}>
                    Def Expense{" "}
                  </span>
                </span>
              }
              thisMonth={metadata.defTotal}
              value={metadata.monthlyExpenses?.def}
              route={'/expenseSummary/defExpenses'}
            />
            <StatisticCard
              cardType="primary"
              title={
                <span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#f6f6f6" }}>
                    Other Expense{" "}
                  </span>
                </span>
              }
              thisMonth={metadata.otherTotal}
              value={metadata.monthlyExpenses?.other}
              route={'/expenseSummary/otherExpenses'}
            />
            <StatisticCard
              cardType="primary"
              title={
                <span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#f6f6f6" }}>
                    Fuel Consumed{" "}
                  </span>
                </span>
              }
              thisMonth={metadata.fuelUsedTotal}
              value={metadata.monthlyExpenses?.fuelUsed}
              route={null}
            />
          </div>
        </div>
      )}
      <Row gutter={[16, 16]} justify="start" align="stretch" className="dashboard-grid-row">
        <Col {...getResponsiveProps('medium')}>
          <MonthlyChart />
        </Col>

        <Col {...getResponsiveProps('medium')}>
          <DriverProfileWidget />
        </Col>

        <Col {...getResponsiveProps('medium')}>
          {/* <SchedulerWidget /> */}
          <AlertsWidget />
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;
