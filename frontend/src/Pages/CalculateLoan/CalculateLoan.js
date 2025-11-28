import React, { useContext, useEffect, useRef, useState } from "react";
import StatisticCard from "../../Components/StatisticCard/StatisticCard";
import dayjs from "dayjs";
import { useLocation, useParams } from "react-router-dom";
import { UserContext } from "../../App";
import { Axios } from "../../Config/Axios/Axios";
import { PlusOutlined, FileExcelOutlined } from "@ant-design/icons";
import LoaderOverlay from "../../Components/LoaderOverlay/LoaderOverlay";
import { ArrowRightIcon, DownloadIcon } from "@primer/octicons-react";
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";
import { Button, FloatButton, Table } from "antd";
import CalculationsModal from "../../Components/CalculationsModal/CalculationsModal";
import "../../Styles/CalculateLoan.css";

const CalculateLoan = () => {
  const [contentLoader, setContentLoader] = useState(true);
  const [calculationsList, setCalculationsList] = useState([]);
  const [totalCalculation, setTotalCalculation] = useState(0);
  const [metaData, setMetaData] = useState({});
  const [isError, setIsError] = useState(false);
  const [selectedDates, setSelectedDates] = useState([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const location = useLocation();
  const calculationModalRef = useRef();
  const { user } = useContext(UserContext);
  const { vehicleId } = useParams();

  const tableColumns = [
    {
      title: "Date",
      width: 50,
      dataIndex: "date",
      key: "date",
      fixed: "left",
    },
    {
      title: "Cost",
      width: 100,
      dataIndex: "cost",
      key: "cost",
    },
    {
      title: "Additional Charges",
      width: 100,
      dataIndex: "additionalCharges",
      key: "additionalCharges",
    },
    {
      title: "Notes",
      width: 100,
      dataIndex: "note",
      key: "note",
    },
    {
      title: "Action",
      key: "operation",
      width: 40,
      render: (text, record) => (
        <ConfirmModal
          title="Confirm Action"
          content="Are you sure you want to delete?"
          onOk={() => handleOk(record._id)}
          key={record._id}
          onCancel={() => { }}
        >
          <button
            type="button"
            className="btn btn-danger btn-rounded btn-floating"
          >
            Delete
          </button>
        </ConfirmModal>
      ),
    },
  ];

  const formFields = [
    {
      type: "date",
      name: "date",
      label: "Choose Date",
      rules: [{ required: true, message: "Please choose the date" }],
    },
    {
      type: "input",
      name: "cost",
      label: "Cost",
      textType: "number",
      rules: [{ required: true, message: "Please enter the cost" }],
    },
    { type: "input", name: "note", label: "Note", textType: "text" },
    {
      type: "switch",
      name: "isAdditionalCharges",
      label: "Additional Charges",
      textType: "switch",
    },
    {
      type: "input",
      name: "additionalCharges",
      label: "Amount",
      placeholder: "Enter if any additional charges included in the amount paid",
      textType: "number",
    },
  ];

  useEffect(() => {
    setContentLoader(true);
    Axios.get(`/api/v1/app/calculateLoan/getAllLoanCalculationsByTruckId`, {
      params: {
        truckId: vehicleId,
        selectedDates,
      },
      headers: {
        authorization: `bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        setCalculationsList(res.data.calculations);
        setTotalCalculation(res.data.totalCalculation || 0);
        setMetaData({
          totalFinanceAmount: res.data.totalFinanceAmount,
          recentPayment: res.data.recentPayment,
          paymentLeft: res.data.paymentLeft,
          totalAdditionalCharges: res.data.totalAdditionalCharges,
        });
        setContentLoader(false);
      })
      .catch((err) => {
        setCalculationsList([]);
        setTotalCalculation(0);
        setIsError(true);
        setContentLoader(false);
      });
  }, []);

  const callCalcucationModal = () => {
    if (calculationModalRef.current) {
      calculationModalRef.current.showModal();
    }
  };

  const handleDateChange = (date, dateString, index) => {
    const newDates = [...selectedDates];
    newDates[index] = dateString;

    setSelectedDates(newDates);
    refreshCalculations();
  };

  const handleReportDownload = async () => {
    setContentLoader(true);
    try {
      let response;
      response = await Axios.get(
        `/api/v1/app/calculateLoan/downloadLoanCalculationExcel`,
        {
          params: {
            truckId: vehicleId,
            selectedDates,
          },
          responseType: "blob", // Important to receive response as Blob
          headers: {
            authorization: `bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setContentLoader(false);

      // Create a URL for the Blob
      const url = URL.createObjectURL(new Blob([response.data]));

      // Create a link element and simulate a click to download the file
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `loan.xlsx`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading the file:", error);
      setContentLoader(false);
    }
  };

  const handleOk = (id) => {
    Axios.delete(`/api/v1/app/calculateLoan/deleteLoanCalculationById/${id}`, {
      params: { id },
      headers: {
        authorization: `bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(() => {
        refreshCalculations();
        // setSelectedDates([dayjs().subtract(1, "month"), dayjs()]);
      })
      .catch((err) => {
        console.error("Failed to delete calculation:", err);
      });
  };

  const refreshCalculations = () => {
    setContentLoader(true);
    Axios.get(`/api/v1/app/calculateLoan/getAllLoanCalculationsByTruckId`, {
      params: {
        truckId: vehicleId,
        selectedDates,
      },
      headers: {
        authorization: `bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        setCalculationsList(res.data.calculations);
        setTotalCalculation(res.data.totalCalculation || 0);
        setMetaData({
          totalFinanceAmount: res.data.totalFinanceAmount,
          recentPayment: res.data.recentPayment,
          paymentLeft: res.data.paymentLeft,
          totalAdditionalCharges: res.data.totalAdditionalCharges,
        });
        setContentLoader(false);
      })
      .catch((err) => {
        setCalculationsList([]);
        setTotalCalculation(0);
        setIsError(true);
        setContentLoader(false);
      });
  };

  return (
    <div>
      <div className="d-flex flex-column">
        <b style={{ fontSize: "26px" }}>Loan Calculation</b>
        <span style={{ fontSize: "14px", color: "#939393" }}>Track and manage your vehicle loan payments and expenses</span>
      </div>
      <div className="loan-grid-container mb-2 mt-3 display-grid w-100 justify-content-center">
        <StatisticCard
          cardType="primary"
          title="Total Finance Amount"
          value={metaData?.totalFinanceAmount}
          thisMonth={0}
          route={""}
        />
        <StatisticCard
          title="Total Additional Charges"
          value={metaData?.totalAdditionalCharges}
          thisMonth={0}
          route={""}
        />
        <StatisticCard
          title="Recent Payment"
          subtitle={metaData.recentPayment?.date?.split("T")[0]}
          value={metaData.recentPayment?.cost}
          thisMonth={0}
          route={""}
        />
        <StatisticCard
          title="Payment left"
          value={metaData?.paymentLeft}
          thisMonth={0}
          route={""}
        />
      </div>
      <hr></hr>
      <>
        <LoaderOverlay isVisible={contentLoader} />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <div className="d-flex flex-column flex-md-row gap-3 align-items-center mb-md-0">
            <input
              type="date"
              className="form-control"
              style={{
                padding: "10px",
                borderRadius: "7px",
              }}
              onChange={(e) =>
                handleDateChange(e.target.value, e.target.value, 0)
              }
              value={selectedDates[0]}
            />
            <ArrowRightIcon size={16} />
            <input
              type="date"
              className="form-control"
              style={{
                padding: "10px",
                borderRadius: "7px",
              }}
              onChange={(e) =>
                handleDateChange(e.target.value, e.target.value, 1)
              }
              value={selectedDates[1]}
            />
          </div>
        </div>
        <hr></hr>
        <Table
          columns={tableColumns}
          dataSource={calculationsList}
          scroll={{
            x: 1000,
            y: 500,
          }}
        />
        {vehicleId && (
          <>
            {
              calculationsList.length > 0 &&
              <FloatButton
                shape="circle"
                type="default"
                style={{
                  insetInlineEnd: "calc(6% + 100px)",
                  height: 80,
                  width: 80,
                  color: "white",
                }}
                onClick={handleReportDownload}
                disabled={calculationsList.length ? false : true}
                icon={<DownloadIcon size={20} />}
              />
            }
            <FloatButton
              shape="circle"
              type="success"
              style={{
                insetInlineEnd: "6%",
                height: 80,
                width: 80,
                backgroundColor: "#158141",
                color: "white",
              }}
              onClick={callCalcucationModal}
              icon={<PlusOutlined style={{ fontSize: 20 }} />}
            />
          </>
        )}
        <CalculationsModal
          ref={calculationModalRef}
          setCalculationsList={setCalculationsList}
          calculationsList={calculationsList}
          category={"Loan Calculations"}
          formFields={formFields}
          onSuccess={refreshCalculations}
        />
      </>
    </div>
  );
};

export default CalculateLoan;
