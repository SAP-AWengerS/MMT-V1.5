import React, { useContext, useEffect, useRef, useState } from "react";
import { FloatButton, Table, Select, Dropdown } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import ExpenseModal from "../../Components/ExpenseModal/ExpenseModal";
import { Axios } from "../../Config/Axios/Axios";
import LoaderOverlay from "../../Components/LoaderOverlay/LoaderOverlay";
import dayjs from "dayjs";
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";
import { ArrowRightIcon, PencilIcon, TrashIcon, DownloadIcon } from "@primer/octicons-react";
import { UserContext } from "../../App";
import { FireOutlined, WalletOutlined, BarChartOutlined, CreditCardOutlined } from "@ant-design/icons";

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
  loanExpenses: [
    {
      type: "date",
      name: "date",
      label: "Choose Date",
      rules: [{ required: true, message: "Please choose the date" }],
    },
    {
      type: "input",
      name: "cost",
      label: "Loan Payment",
      textType: "number",
      rules: [{ required: true, message: "Please enter the loan payment amount" }],
    },
    {
      type: "input",
      name: "additionalCharges",
      label: "Additional Charges",
      textType: "number",
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
  loanExpenses: {
    addAPI: "addLoanCalculation",
    getAllExpensesById: "getAllLoanCalculationsByTruckId",
    getAllExpenses: "getAllLoanCalculationsByUserId",
    updateAPI: "updateLoanCalculationById",
    deleteAPI: "deleteLoanCalculationById",
    downloadAPI: "downloadLoanCalculationExcel",
    downloadAllAPI: "downloadAllLoanCalculationExcel",
  },
  totalExpenses: {
    getAllExpensesById: "getAllTotalExpensesByTruckId",
    getAllExpenses: "getAllTotalExpensesByUserId",
    downloadAllAPI: "downloadAllTotalExpensesExcel",
  },
};

const expenseTypeLabels = {
  fuelExpenses: "Fuel Expenses",
  defExpenses: "DEF Expenses",
  otherExpenses: "Other Expenses",
  loanExpenses: "Loan Expenses",
  totalExpenses: "All Expenses",
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

const Expenses = () => {
  const [contentLoader, setContentLoader] = useState(true);
  const [expensesList, setExpensesList] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isError, setIsError] = useState(false);
  const [selectedDates, setSelectedDates] = useState([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);
  const [vehicleRegistrationNo, setVehicleRegistrationNo] = useState("");
  const [trucks, setTrucks] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [selectedExpenseType, setSelectedExpenseType] = useState("totalExpenses");
  const [currentExpenseType, setCurrentExpenseType] = useState("fuelExpenses");

  const expenseModalRef = useRef();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { vehicleId } = useParams();

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

    const apiPath = selectedExpenseType === 'loanExpenses' ? 'calculateLoan' : selectedExpenseType;

    if (activeTruckId) {
      Axios.get(`/api/v1/app/${apiPath}/${getAllByIdApiEndpoints(selectedExpenseType)}`, {
        params: {
          truckId: activeTruckId,
          selectedDates,
        },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          // Handle different response structure for loan expenses
          const expenses = selectedExpenseType === 'loanExpenses'
            ? res.data.calculations
            : res.data.expenses;
          const total = selectedExpenseType === 'loanExpenses'
            ? res.data.totalCalculation
            : res.data.totalExpense;

          setExpensesList(expenses || []);
          setTotalExpense(total || 0);
          setContentLoader(false);
        })
        .catch((err) => {
          setExpensesList([]);
          setTotalExpense(0);
          setIsError(true);
          setContentLoader(false);
        });
    } else {
      Axios.get(`/api/v1/app/${apiPath}/${getAllApiEndpoints(selectedExpenseType)}`, {
        params: {
          userId: user.userId,
          selectedDates,
        },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          // Handle different response structure for loan expenses
          const expenses = selectedExpenseType === 'loanExpenses'
            ? res.data.calculations
            : res.data.expenses;
          const total = selectedExpenseType === 'loanExpenses'
            ? res.data.totalCalculation
            : res.data.totalExpense;

          setExpensesList(expenses || []);
          setTotalExpense(total || 0);
          setContentLoader(false);
        })
        .catch((err) => {
          setExpensesList([]);
          setTotalExpense(0);
          setIsError(true);
          setContentLoader(false);
        });
    }
  }, [selectedDates, selectedExpenseType, activeTruckId, user.userId]);

  const refreshExpenses = () => {
    setContentLoader(true);

    const apiPath = selectedExpenseType === 'loanExpenses' ? 'calculateLoan' : selectedExpenseType;

    if (activeTruckId) {
      Axios.get(`/api/v1/app/${apiPath}/${getAllByIdApiEndpoints(selectedExpenseType)}`, {
        params: {
          truckId: activeTruckId,
          selectedDates,
        },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          // Handle different response structure for loan expenses
          const expenses = selectedExpenseType === 'loanExpenses'
            ? res.data.calculations
            : res.data.expenses;
          const total = selectedExpenseType === 'loanExpenses'
            ? res.data.totalCalculation
            : res.data.totalExpense;

          setExpensesList(expenses || []);
          setTotalExpense(total || 0);
          setContentLoader(false);
        })
        .catch((err) => {
          setExpensesList([]);
          setTotalExpense(0);
          setIsError(true);
          setContentLoader(false);
        });
    } else {
      Axios.get(`/api/v1/app/${apiPath}/${getAllApiEndpoints(selectedExpenseType)}`, {
        params: {
          userId: user.userId,
          selectedDates,
        },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => {
          // Handle different response structure for loan expenses
          const expenses = selectedExpenseType === 'loanExpenses'
            ? res.data.calculations
            : res.data.expenses;
          const total = selectedExpenseType === 'loanExpenses'
            ? res.data.totalCalculation
            : res.data.totalExpense;

          setExpensesList(expenses || []);
          setTotalExpense(total || 0);
          setContentLoader(false);
        })
        .catch((err) => {
          setExpensesList([]);
          setTotalExpense(0);
          setIsError(true);
          setContentLoader(false);
        });
    }
  };

  const handleOk = (id) => {
    const apiPath = selectedExpenseType === 'loanExpenses' ? 'calculateLoan' : selectedExpenseType;

    Axios.delete(
      `/api/v1/app/${apiPath}/${getDeleteApiEndpoints(selectedExpenseType)}/${id}`,
      {
        params: { id },
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      }
    )
      .then(() => {
        refreshExpenses();
      })
      .catch((err) => {
        console.error("Failed to delete expense:", err);
      });
  };

  const callExpenseModal = (expenseType) => {
    setCurrentExpenseType(expenseType);
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

  const handleDateChange = (date, dateString, index) => {
    const newDates = [...selectedDates];
    newDates[index] = dateString;
    setSelectedDates(newDates);
  };

  const handleReportDownload = async () => {
    setContentLoader(true);
    try {
      let response;
      const apiPath = selectedExpenseType === 'loanExpenses' ? 'calculateLoan' : selectedExpenseType;

      // For totalExpenses, always use downloadAllAPI regardless of truck selection
      if (selectedExpenseType === 'totalExpenses') {
        const params = activeTruckId
          ? { truckId: activeTruckId, selectedDates }
          : { userId: user.userId, selectedDates };

        response = await Axios.get(
          `/api/v1/app/${apiPath}/${getDownloadAllApiEndpoints(selectedExpenseType)}`,
          {
            params,
            responseType: "blob",
            headers: {
              authorization: `bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      } else if (activeTruckId) {
        response = await Axios.get(
          `/api/v1/app/${apiPath}/${getDownloadApiEndpoints(selectedExpenseType)}`,
          {
            params: {
              truckId: activeTruckId,
              selectedDates,
            },
            responseType: "blob",
            headers: {
              authorization: `bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      } else {
        response = await Axios.get(
          `/api/v1/app/${apiPath}/${getDownloadAllApiEndpoints(selectedExpenseType)}`,
          {
            params: {
              userId: user.userId,
              selectedDates,
            },
            responseType: "blob",
            headers: {
              authorization: `bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      }

      setContentLoader(false);

      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedExpenseType}.xlsx`);
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading the file:", error);
      setContentLoader(false);
    }
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
              key={`update-${record._id}`}
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
              key={`delete-${record._id}`}
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
        width: 40,
        render: (text, record) => (
          <div className="d-flex gap-2">
            <ConfirmModal
              title="Confirm Action"
              content="Are you sure you want to update?"
              onOk={() => callUpdateExpenseModal(record)}
              key={`update-${record._id}`}
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
        width: 40,
        render: (text, record) => (
          <div className="d-flex gap-2">
            <ConfirmModal
              title="Confirm Action"
              content="Are you sure you want to update?"
              onOk={() => callUpdateExpenseModal(record)}
              key={`update-${record._id}`}
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
    loanExpenses: [
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
        title: "Loan Payment",
        width: 100,
        dataIndex: "cost",
        key: "cost",
      },
      {
        title: "Additional Charges",
        width: 120,
        dataIndex: "additionalCharges",
        key: "additionalCharges",
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
        width: 40,
        render: (text, record) => (
          <div className="d-flex gap-2">
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
        render: (catalog) => {
          // Handle both the API response formats
          if (catalog === "Fuel Expense") return "Fuel";
          if (catalog === "Def Expense") return "DEF";
          if (catalog === "Other Expense") return "Other";
          if (catalog === "Loan Expense") return "Loan";
          return catalog;
        },
      },
      {
        title: "Current KM",
        width: 80,
        dataIndex: "currentKM",
        key: "currentKM",
        render: (value) => value || "-",
      },
      {
        title: "Litres",
        width: 70,
        dataIndex: "litres",
        key: "litres",
        render: (value) => value || "-",
      },
      {
        title: "Category",
        width: 100,
        dataIndex: "category",
        key: "category",
        render: (value) => value || "-",
      },
      {
        title: "Cost",
        width: 80,
        dataIndex: "cost",
        key: "cost",
      },
      {
        title: "Additional Charges",
        width: 100,
        dataIndex: "additionalCharges",
        key: "additionalCharges",
        render: (value) => value || "-",
      },
      {
        title: "Note",
        width: 120,
        dataIndex: "note",
        key: "note",
        render: (value) => value || "-",
      },
    ],
  };

  // Menu items for the floating action button
  const addExpenseMenuItems = [
    {
      key: 'fuelExpenses',
      label: 'Add Fuel Expense',
      icon: <FireOutlined />,
      onClick: () => callExpenseModal('fuelExpenses'),
    },
    {
      key: 'defExpenses',
      label: 'Add DEF Expense',
      icon: <WalletOutlined />,
      onClick: () => callExpenseModal('defExpenses'),
    },
    {
      key: 'otherExpenses',
      label: 'Add Other Expense',
      icon: <BarChartOutlined />,
      onClick: () => callExpenseModal('otherExpenses'),
    },
    {
      key: 'loanExpenses',
      label: 'Add Loan Payment',
      icon: <CreditCardOutlined />,
      onClick: () => callExpenseModal('loanExpenses'),
    },
  ];

  return (
    <div>
      <LoaderOverlay isVisible={contentLoader} />
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
        <div className="d-flex flex-column">
          <b style={{ fontSize: "26px" }}>
            {activeTruckId ? `Expenses for ${vehicleRegistrationNo}` : `All Expenses`}
          </b>
          <span style={{ fontSize: "14px", color: "#939393" }}>
            {activeTruckId
              ? `View and manage all expenses for vehicle ${vehicleRegistrationNo}`
              : `Track all expenses across your fleet`}
          </span>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Select
            style={{ width: "200px" }}
            placeholder="Select expense type"
            value={selectedExpenseType}
            onChange={(value) => setSelectedExpenseType(value)}
            options={[
              { value: "totalExpenses", label: "All Expenses" },
              { value: "fuelExpenses", label: "Fuel Expenses" },
              { value: "defExpenses", label: "DEF Expenses" },
              { value: "otherExpenses", label: "Other Expenses" },
              { value: "loanExpenses", label: "Loan Expenses" },
            ]}
            size="large"
          />
          {trucks.length > 0 && (
            <Select
              style={{ width: "200px" }}
              placeholder="Select a truck"
              allowClear
              value={vehicleId || selectedTruckId}
              onChange={(value) => {
                if (value) {
                  navigate(`/expenses/${value}`);
                } else {
                  navigate(`/expenses`);
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
          )}
        </div>
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
            <b className="text-nowrap">Total Expense</b>
            <div className="p-2 border bg-white rounded fw-bold text-danger">
              {totalExpense.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      <hr />
      <Table
        columns={tableColumns[selectedExpenseType] || tableColumns.totalExpenses}
        dataSource={expensesList}
        scroll={{
          x: 1000,
          y: 500,
        }}
      />
      <div style={{ height: "100px" }}>
        {expensesList?.length > 0 && (
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
        )}
        {activeTruckId && (
          <Dropdown
            menu={{ items: addExpenseMenuItems }}
            placement="topRight"
            trigger={['click']}
          >
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
              icon={<PlusOutlined style={{ fontSize: 20 }} />}
            />
          </Dropdown>
        )}
      </div>
      {currentExpenseType !== 'totalExpenses' && (
        <ExpenseModal
          ref={expenseModalRef}
          setExpensesList={setExpensesList}
          expensesList={expensesList}
          category={expenseTypeLabels[currentExpenseType]}
          formFields={formFields[currentExpenseType]}
          apis={apis}
          onSuccess={refreshExpenses}
          catalog={currentExpenseType}
          vehicleId={activeTruckId}
        />
      )}
    </div>
  );
};

export default Expenses;
