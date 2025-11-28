import React, { useContext, useEffect, useRef, useState } from "react";
import { Button, ConfigProvider, FloatButton, Table, Select } from "antd";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { PlusOutlined, FileExcelOutlined } from "@ant-design/icons";
import ExpenseModal from "../../Components/ExpenseModal/ExpenseModal";
import { Axios } from "../../Config/Axios/Axios";
import LoaderOverlay from "../../Components/LoaderOverlay/LoaderOverlay";
import { DatePicker, Space } from "antd";
import dayjs from "dayjs";
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";
import { ArrowRightIcon, DownloadIcon, PencilIcon, TrashIcon } from "@primer/octicons-react";
import { UserContext } from "../../App";
import { add } from "date-fns";

const { RangePicker } = DatePicker;

const formFields = {
  fuelExpenses: [
    {
      type: "date",
      name: "date",
      label: "Choose Date",
      rules: [{ required: true, message: "Please choose the date" }],
    },
    {
      type: "input",
      name: "currentKM",
      label: "Current KM",
      textType: "number",
      rules: [{ required: true, message: "Please enter the current KM" }],
    },
    {
      type: "input",
      name: "litres",
      label: "Fuel Litres",
      textType: "number",
      rules: [
        { required: true, message: "Please enter the litres of fuel filled" },
      ],
    },
    {
      type: "input",
      name: "cost",
      label: "Fuel Cost",
      textType: "number",
      rules: [{ required: true, message: "Please enter the cost of fuel" }],
    },
    { type: "input", name: "note", label: "Note", textType: "text" },
  ],
  defExpenses: [
    {
      type: "date",
      name: "date",
      label: "Choose Date",
      rules: [{ required: true, message: "Please choose the date" }],
    },
    {
      type: "input",
      name: "currentKM",
      label: "Current KM",
      textType: "number",
      rules: [{ required: true, message: "Please enter the current KM" }],
    },
    {
      type: "input",
      name: "litres",
      label: "Def Litres",
      textType: "number",
      rules: [
        { required: true, message: "Please enter the litres of def filled" },
      ],
    },
    {
      type: "input",
      name: "cost",
      label: "Def Cost",
      textType: "number",
      rules: [{ required: true, message: "Please enter the cost of def" }],
    },
    { type: "input", name: "note", label: "Note", textType: "text" },
  ],
  otherExpenses: [
    {
      type: "date",
      name: "date",
      label: "Choose Date",
      rules: [{ required: true, message: "Please choose the date" }],
    },
    {
      type: "select",
      name: "category",
      label: "Category",
      placeholder: "Choose category",
      rules: [{ required: true, message: "Please select a category" }],
      options: [
        { value: "toll", label: "Toll" },
        { value: "pollution", label: "Pollution" },
        { value: "insurance", label: "Insurance" },
        { value: "service&Maintenance", label: "Service & Maintenance" },
        { value: "salary&incentives", label: "Salary & Incentives" },
        { value: "other", label: "Other" },
      ],
    },
    {
      type: "input",
      name: "other",
      label: "Other",
      textType: "text",
      rules: [{ required: true, message: "Please enter other category" }],
    },
    {
      type: "input",
      name: "cost",
      label: "Cost",
      textType: "number",
      rules: [{ required: true, message: "Please enter the cost" }],
    },
    { type: "input", name: "note", label: "Note", textType: "text" },
  ],
  income: [
    {
      type: "date",
      name: "date",
      label: "Choose Date",
      rules: [{ required: true, message: "Please choose the date" }],
    },
    {
      type: "input",
      name: "amount",
      label: "Amount",
      textType: "number",
      rules: [{ required: true, message: "Please enter the amount" }],
    },
    { type: "input", name: "note", label: "Note", textType: "text" },
  ],
};

const apis = {
  fuelExpenses: {
    addAPI: "addFuelExpense",
    getAllExpensesById: "getAllFuelExpensesByTruckId",
    getAllExpenses: "getAllFuelExpensesByUserId",
    updateAPI: "updateFuelExpenseByTruckId",
    deleteAPI: "deleteFuelExpenseById",
    downloadAPI: "downloadFuelExpensesExcel",
    downloadAllAPI: "downloadAllFuelExpensesExcel",
  },
  defExpenses: {
    addAPI: "addDefExpense",
    getAllExpensesById: "getAllDefExpensesByTruckId",
    getAllExpenses: "getAllDefExpensesByUserId",
    updateAPI: "updateDefExpenseByTruckId",
    deleteAPI: "deleteDefExpenseById",
    downloadAPI: "downloadDefExpensesExcel",
    downloadAllAPI: "downloadAllDefExpensesExcel",
  },
  otherExpenses: {
    addAPI: "addOtherExpense",
    getAllExpensesById: "getAllOtherExpensesByTruckId",
    getAllExpenses: "getAllOtherExpensesByUserId",
    updateAPI: "updateOtherExpenseByTruckId",
    deleteAPI: "deleteOtherExpenseById",
    downloadAPI: "downloadOtherExpensesExcel",
    downloadAllAPI: "downloadAllOtherExpensesExcel",
  },
  income: {
    addAPI: "addIncome",
    getAllExpensesById: "getAllIncomesByTruckId",
    getAllExpenses: "getAllIncomesByUserId",
    updateAPI: "updateIncomeByTruckId",
    deleteAPI: "deleteIncomeById",
    downloadAPI: "downloadIncomesExcel",
    downloadAllAPI: "downloadAllIncomesExcel",
  },
  totalExpenses: {
    getAllExpensesById: "getAllTotalExpensesByTruckId",
    getAllExpenses: "getAllTotalExpensesByUserId",
    downloadAllAPI: "downloadAllTotalExpensesExcel",
  },
};

function getDeleteApiEndpoints(expenseType) {
  const expense = apis[expenseType];
  if (expense) {
    return expense.deleteAPI;
  }
}

function getUpdateApiEndpoints(expenseType) {
  const expense = apis[expenseType];
  if (expense) {
    return expense.updateAPI;
  }
}

function getAllByIdApiEndpoints(expenseType) {
  const expense = apis[expenseType];
  if (expense) {
    return expense.getAllExpensesById;
  }
}

function getAllApiEndpoints(expenseType) {
  const expense = apis[expenseType];
  if (expense) {
    return expense.getAllExpenses;
  }
}

function getDownloadApiEndpoints(expenseType) {
  const expense = apis[expenseType];
  if (expense) {
    return expense.downloadAPI;
  }
}

function getDownloadAllApiEndpoints(expenseType) {
  const expense = apis[expenseType];
  if (expense) {
    return expense.downloadAllAPI;
  }
}

const ExpenseSummary = () => {
  const [expenses, setExpenses] = useState({
    fuelExpenses: "Fuel Expenses",
    defExpenses: "Def Expenses",
    otherExpenses: "Other Expenses",
    income: "Income",
    totalExpenses: "Total Expenses",
    totalFuelExpenses: "Total Fuel Expenses",
    totalDefExpenses: "Total Def Expenses",
    totalOtherExpenses: "Total Other Expenses",
  });
  const [contentLoader, setContentLoader] = useState(true);
  const [expensesList, setExpensesList] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [isError, setIsError] = useState(false);
  const [selectedDates, setSelectedDates] = useState([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);
  const [vehicleRegistrationNo, setVehicleRegistrationNo] = useState("");
  const [trucks, setTrucks] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(null);

  const expenseModalRef = useRef();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const { catalog, vehicleId } = useParams();

  // Fetch all trucks for the user
  useEffect(() => {
    Axios.get(`/api/v1/app/truck/getAllTrucksByUser/${user.userId}`, {
      params: {
        addedBy: user.userId,
      },
      headers: {
        authorization: `bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        setTrucks(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch trucks:", err);
        setTrucks([]);
      });
  }, [user.userId]);

  // Determine which truck ID to use (from params or dropdown)
  const activeTruckId = vehicleId || selectedTruckId;

  // Fetch vehicle registration number when activeTruckId is available
  useEffect(() => {
    if (activeTruckId) {
      Axios.get(`/api/v1/app/truck/getTruckById/${activeTruckId}`, {
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          setVehicleRegistrationNo(res.data.registrationNo || "Truck");
        })
        .catch((err) => {
          console.error("Failed to fetch vehicle details:", err);
          setVehicleRegistrationNo("Truck");
        });
    }
  }, [activeTruckId]);

  useEffect(() => {
    setContentLoader(true);
    if (activeTruckId) {
      Axios.get(`/api/v1/app/${catalog}/${getAllByIdApiEndpoints(catalog)}`, {
        params: {
          truckId: activeTruckId,
          selectedDates,
        },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          setExpensesList(res.data.expenses);
          setTotalExpense(res.data.totalExpense || 0);
          setTotalProfit(res.data.totalProfit || 0);
          setContentLoader(false);
        })
        .catch((err) => {
          setExpensesList([]);
          setTotalExpense(0);
          setTotalProfit(0);
          setIsError(true);
          setContentLoader(false);
        });
    } else {
      Axios.get(`/api/v1/app/${catalog}/${getAllApiEndpoints(catalog)}`, {
        params: {
          userId: user.userId,
          selectedDates,
        },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          setExpensesList(res.data.expenses);
          setTotalExpense(res.data.totalExpense || 0);
          setTotalProfit(res.data.totalProfit || 0);
          setContentLoader(false);
        })
        .catch((err) => {
          setExpensesList([]);
          setTotalExpense(0);
          setTotalProfit(0);
          setIsError(true);
          setContentLoader(false);
        });
    }
  }, [selectedDates, catalog, activeTruckId, user.userId]);

  const refreshExpenses = () => {
    setContentLoader(true);
    if (activeTruckId) {
      Axios.get(`/api/v1/app/${catalog}/${getAllByIdApiEndpoints(catalog)}`, {
        params: {
          truckId: activeTruckId,
          selectedDates,
        },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          setExpensesList(res.data.expenses);
          setTotalExpense(res.data.totalExpense || 0);
          setTotalProfit(res.data.totalProfit || 0);
          setContentLoader(false);
        })
        .catch((err) => {
          setExpensesList([]);
          setTotalExpense(0);
          setTotalProfit(0);
          setIsError(true);
          setContentLoader(false);
        });
    } else {
      Axios.get(`/api/v1/app/${catalog}/${getAllApiEndpoints(catalog)}`, {
        params: {
          userId: user.userId,
          selectedDates,
        },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          setExpensesList(res.data.expenses);
          setTotalExpense(res.data.totalExpense || 0);
          setTotalProfit(res.data.totalProfit || 0);
          setContentLoader(false);
        })
        .catch((err) => {
          setExpensesList([]);
          setTotalExpense(0);
          setTotalProfit(0);
          setIsError(true);
          setContentLoader(false);
        });
    }
  };

  const handleOk = (id) => {
    Axios.delete(
      `/api/v1/app/${catalog}/${getDeleteApiEndpoints(catalog)}/${id}`,
      {
        params: { id },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      }
    )
      .then(() => {
        refreshExpenses()
        // setSelectedDates([dayjs().subtract(1, "month"), dayjs()]);
      })
      .catch((err) => {
        console.error("Failed to delete expense:", err);
      });
  };

  const handleUpdate = (id) => {
    Axios.put(
      `/api/v1/app/${catalog}/${getUpdateApiEndpoints(catalog)}/${id}`,
      {
        params: id,
      },
      {
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      }
    )
      .then(() => {
        refreshExpenses()
        // setSelectedDates([dayjs().subtract(1, "month"), dayjs()]);
      })
      .catch((err) => {
        console.error("Failed to update expense:", err);
      });
  }

  const callExpenseModal = () => {
    if (expenseModalRef.current) {
      expenseModalRef.current.showModal();
    }
  };

  const callUpdateExpenseModal = (expense) => {
    if (expenseModalRef.current) {
      expenseModalRef.current.showModal();
      expenseModalRef.current.setFields(expense);
    }
  };

  const maxDate = new Date();

  const handleDateChange = (date, dateString, index) => {
    const newDates = [...selectedDates];
    newDates[index] = dateString;

    setSelectedDates(newDates);
    refreshExpenses();
  };

  const handleReportDownload = async () => {
    setContentLoader(true);
    try {
      let response;

      if (activeTruckId) {
        response = await Axios.get(
          `/api/v1/app/${catalog}/${getDownloadApiEndpoints(catalog)}`,
          {
            params: {
              truckId: activeTruckId,
              selectedDates,
            },
            responseType: "blob", // Important to receive response as Blob
            headers: {
              authorization: `bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      } else {
        response = await Axios.get(
          `/api/v1/app/${catalog}/${getDownloadAllApiEndpoints(catalog)}`,
          {
            params: {
              userId: user.userId,
              selectedDates,
            },
            responseType: "blob", // Important to receive response as Blob
            headers: {
              authorization: `bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      }

      setContentLoader(false);

      // Create a URL for the Blob
      const url = URL.createObjectURL(new Blob([response.data]));

      // Create a link element and simulate a click to download the file
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${catalog}.xlsx`);
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

  const addRegistrationNoColumn = (columns) => {
    if (vehicleId) {
      return [
        {
          title: "Registration No.",
          width: 100,
          dataIndex: "registrationNo",
          key: "registrationNo",
        },
        ...columns,
      ];
    }
    return columns;
  };

  const tableColumns = {
    fuelExpenses: [
      {
        title: "Date",
        width: 70,
        dataIndex: "date",
        key: "date",
        fixed: "left",
      },
      ...(!activeTruckId
        ? [
          {
            title: "Registration No.",
            width: 100,
            dataIndex: "registrationNo",
            key: "registrationNo",
          },
        ]
        : []),
      {
        title: "Current KM",
        width: 100,
        dataIndex: "currentKM",
        key: "currentKM",
      },
      {
        title: "Litres",
        width: 100,
        dataIndex: "litres",
        key: "litres",
      },
      {
        title: "Cost",
        width: 100,
        dataIndex: "cost",
        key: "cost",
      },
      ...(activeTruckId
        ? [
          {
            title: "Range",
            width: 100,
            dataIndex: "range",
            key: "range",
          },
          {
            title: "Mileage",
            width: 100,
            dataIndex: "mileage",
            key: "mileage",
          },
        ]
        : []),
      {
        title: "Action",
        key: "operation",
        width: 40,
        render: (text, record) => (
          <div className="d-flex gap-2">
            <ConfirmModal
              title="Confirm Action"
              content="Are you sure you want to update?"
              onOk={() => callUpdateExpenseModal(record)}
              key={`update-${record._id}`}  // Unique key for update modal
              onCancel={() => { }}
            >
              <button
                type="button"
                className="btn btn-primary btn-rounded btn-floating"
              >
                <PencilIcon size={16} />
              </button>
            </ConfirmModal>
            <ConfirmModal
              title="Confirm Action"
              content="Are you sure you want to delete?"
              onOk={() => handleOk(record._id)}
              key={`delete-${record._id}`}  // Unique key for delete modal
              onCancel={() => { }}
            >
              <button
                type="button"
                className="btn btn-danger btn-rounded btn-floating"
              >
                <TrashIcon size={16} />
              </button>
            </ConfirmModal>
          </div>
        ),
      },
    ],
    defExpenses: [
      {
        title: "Date",
        width: 70,
        dataIndex: "date",
        key: "date",
        fixed: "left",
      },
      ...(!activeTruckId
        ? [
          {
            title: "Registration No.",
            width: 100,
            dataIndex: "registrationNo",
            key: "registrationNo",
          },
        ]
        : []),
      {
        title: "Current KM",
        width: 100,
        dataIndex: "currentKM",
        key: "currentKM",
      },
      {
        title: "Litres",
        width: 100,
        dataIndex: "litres",
        key: "litres",
      },
      ...(activeTruckId
        ? [
          {
            title: "Range",
            width: 100,
            dataIndex: "range",
            key: "range",
          },
        ]
        : []),
      {
        title: "Cost",
        width: 100,
        dataIndex: "cost",
        key: "cost",
      },
      {
        title: "Action",
        key: "operation",
        //   fixed: "right",
        width: 40,
        render: (text, record) => (
          <div className="d-flex gap-2">
            <ConfirmModal
              title="Confirm Action"
              content="Are you sure you want to update?"
              onOk={() => callUpdateExpenseModal(record)}
              key={`update-${record._id}`}  // Unique key for update modal
              onCancel={() => { }}
            >
              <button
                type="button"
                className="btn btn-primary btn-rounded btn-floating"
              >
                <PencilIcon size={16} />
              </button>
            </ConfirmModal>
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
                <TrashIcon size={16} />
              </button>
            </ConfirmModal>
          </div>
        ),
      },
    ],
    otherExpenses: [
      {
        title: "Date",
        width: 70,
        dataIndex: "date",
        key: "date",
        fixed: "left",
      },
      ...(!activeTruckId
        ? [
          {
            title: "Registration No.",
            width: 100,
            dataIndex: "registrationNo",
            key: "registrationNo",
          },
        ]
        : []),
      {
        title: "Category",
        width: 100,
        dataIndex: "category",
        key: "category",
      },
      {
        title: "Cost",
        width: 100,
        dataIndex: "cost",
        key: "cost",
      },
      {
        title: "Note",
        width: 100,
        dataIndex: "note",
        key: "note",
      },
      {
        title: "Action",
        key: "operation",
        //   fixed: "right",
        width: 40,
        render: (text, record) => (
          <div className="d-flex gap-2">
            <ConfirmModal
              title="Confirm Action"
              content="Are you sure you want to update?"
              onOk={() => callUpdateExpenseModal(record)}
              key={`update-${record._id}`}  // Unique key for update modal
              onCancel={() => { }}
            >
              <button
                type="button"
                className="btn btn-primary btn-rounded btn-floating"
              >
                <PencilIcon size={16} />
              </button>
            </ConfirmModal>
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
                <TrashIcon size={16} />
              </button>
            </ConfirmModal>
          </div>
        ),
      },
    ],
    income: [
      {
        title: "Date",
        width: 70,
        dataIndex: "date",
        key: "date",
        fixed: "left",
      },
      ...(!activeTruckId
        ? [
          {
            title: "Registration No.",
            width: 100,
            dataIndex: "registrationNo",
            key: "registrationNo",
          },
        ]
        : []),
      {
        title: "Amount",
        width: 100,
        dataIndex: "amount",
        key: "amount",
      },
      {
        title: "Note",
        width: 100,
        dataIndex: "note",
        key: "note",
      },
      {
        title: "Action",
        key: "operation",
        //   fixed: "right",
        width: 40,
        render: (text, record) => (
          <div className="d-flex gap-2">
            <ConfirmModal
              title="Confirm Action"
              content="Are you sure you want to update?"
              onOk={() => callUpdateExpenseModal(record)}
              key={`update-${record._id}`}  // Unique key for update modal
              onCancel={() => { }}
            >
              <button
                type="button"
                className="btn btn-primary btn-rounded btn-floating"
              >
                <PencilIcon size={16} />
              </button>
            </ConfirmModal>
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
                <TrashIcon size={16} />
              </button>
            </ConfirmModal>
          </div>
        ),
      },
    ],
    totalExpenses: [
      {
        title: "Date",
        width: 70,
        dataIndex: "date",
        key: "date",
        fixed: "left",
      },
      {
        title: "Registration No.",
        width: 100,
        dataIndex: "registrationNo",
        key: "registrationNo",
      },
      {
        title: "Type",
        width: 100,
        dataIndex: "catalog",
        key: "catalog",
      },
      {
        title: "Cost",
        width: 100,
        dataIndex: "cost",
        key: "cost",
      },
      {
        title: "Note",
        width: 100,
        dataIndex: "note",
        key: "note",
      },
    ],
  };

  return (
    <div>
      <LoaderOverlay isVisible={contentLoader} />
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
        <div className="d-flex flex-column">
          <b style={{ fontSize: "26px" }}>{activeTruckId ? `${expenses[catalog]} for ${vehicleRegistrationNo}` : `Overall ${expenses[catalog]}`}</b>
          <span style={{ fontSize: "14px", color: "#939393" }}>
            {activeTruckId
              ? `View and manage ${expenses[catalog]} for vehicle ${vehicleRegistrationNo}`
              : `Track all ${expenses[catalog]} across your fleet`}
          </span>
        </div>
        {trucks.length > 0 && (
          <div style={{ width: "100%", maxWidth: "300px" }}>
            <Select
              style={{ width: "100%" }}
              placeholder="Select a truck to view details"
              allowClear
              value={vehicleId || selectedTruckId}
              onChange={(value) => {
                if (value) {
                  navigate(`/expenseSummary/${catalog}/${value}`);
                } else {
                  navigate(`/expenseSummary/${catalog}`);
                }
              }}
              options={[
                { value: null, label: "All Trucks" },
                ...trucks?.map((truck) => ({
                  value: truck._id,
                  label: truck.registrationNo,
                })),
              ]}
              size="large"
            />
          </div>
        )}
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
        <div className="d-flex flex-column flex-md-row gap-3 align-items-center mb-3 mb-md-0">
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
        <div className="d-flex flex-column flex-md-row gap-2">
          <div
            className="w-100 d-flex border align-items-center p-2 ps-3 rounded gap-3 justify-content-between"
            style={{ background: "#fafafa" }}
          >
            <b className="text-nowrap">Total {catalog === "income" ? "Income" : "Expense"}</b>
            <div className="p-2 border bg-white rounded fw-bold text-danger">
              {totalExpense.toFixed(2)}
            </div>
          </div>
          {
            catalog === "income" &&
            <div
              className="w-100 d-flex border align-items-center p-2 ps-3 rounded gap-3 justify-content-between"
              style={{ background: "#fafafa" }}
            >
              <b className="text-nowrap">Total Profit</b>
              <div className="p-2 border bg-white rounded fw-bold text-danger">
                {totalProfit.toFixed(2)}
              </div>
            </div>
          }
        </div>
      </div>
      <hr></hr>
      <Table
        columns={tableColumns[catalog]}
        dataSource={expensesList}
        scroll={{
          x: 1000,
          y: 500,
        }}
      />
      <div style={{ height: "100px" }}>
       {
          expensesList?.length > 0 &&
          <FloatButton
            shape="circle"
            type="default"
            style={{
              height: 80,
              width: 80,
              color: "white",
              insetInlineEnd: activeTruckId && expensesList?.length > 0 ? "calc(6% + 90px)" : "6%",
            }}
            onClick={handleReportDownload}
            icon={<DownloadIcon size={20} />}
          />
        }
        {
          activeTruckId &&
          <FloatButton
            shape="circle"
            type="primary"
            style={{
              height: 80,
              width: 80,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              insetInlineEnd: "6%",
            }}
            onClick={callExpenseModal}
            icon={<PlusOutlined style={{ fontSize: 20 }} />}
          />
        }
      </div>
      <ExpenseModal
        ref={expenseModalRef}
        setExpensesList={setExpensesList}
        expensesList={expensesList}
        category={expenses[catalog]}
        formFields={formFields[catalog]}
        apis={apis}
        onSuccess={refreshExpenses}
      />
    </div>
  );
};

export default ExpenseSummary;
