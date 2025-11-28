import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Button, Form, Input, Modal, Select } from "antd";
import { Axios } from "../../Config/Axios/Axios";
import LoaderOverlay from "../LoaderOverlay/LoaderOverlay";
import { useLocation, useParams } from "react-router-dom";
import { UserContext } from "../../App";
import DatePicker from "react-date-picker";
import dayjs from "dayjs";
import moment from "moment";
import { set } from "date-fns";

const { Option } = Select;

const ExpenseModal = forwardRef(
  ({ addExpense, category, formFields, apis, onSuccess, catalog, vehicleId }, ref) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contentLoader, setContentLoader] = useState(false);
    const [isError, setIsError] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [form] = Form.useForm();
    const [updateData, setUpdateData] = useState({})

    const { user } = useContext(UserContext);

    function getApiEndpoints(expenseType) {
      const expense = apis[expenseType];
      if (expense) {
        return expense.addAPI;
      }
    }

    function getUpdateApiEndpoints(expenseType) {
      const expense = apis[expenseType];
      if (expense) {
        return expense.updateAPI;
      }
    }

    const location = useLocation();
    const routeParams = useParams();

    // Use catalog prop if provided, otherwise fall back to route params
    const activeCatalog = catalog || routeParams.catalog;
    const activeTruckId = vehicleId || routeParams.vehicleId;

    // Determine the actual API path for loan expenses
    const getApiPath = (cat) => {
      return cat === 'loanExpenses' ? 'calculateLoan' : cat;
    };

    // Get the current catalog to use for API calls
    const currentCatalog = activeCatalog;

    useImperativeHandle(ref, () => ({
      showModal: () => {
        setUpdateData({})
        setOpen(true);
      },
      setFields: (expense) => {
        const formattedExpense = {
          ...expense,
          date: expense.date
            ? moment(expense.date, "DD-MM-YYYY").format("YYYY-MM-DD")
            : null, // Convert to input-friendly format
        };

        setUpdateData(expense);
        form.setFieldsValue(formattedExpense);
      }
    }));

    // useEffect(() => {
    //   if (selectedExpense) {
    //     form.setFieldsValue(selectedExpense); // Pre-fill form fields
    //   }
    // }, [selectedExpense]);

    // const showModal = () => {
    //   setOpen(true);
    // setLoading(true);
    // };

    // useImperativeHandle(ref, () => ({
    //   showModal,
    // }));

    const handleCategoryChange = (value) => {
      setSelectedCategory(value);
      if (value !== "other") {
        form.setFieldsValue({ other: "" });
      }
    };

    const handleDateChange = (e) => {
      const dateValue = e.target.value;
      form.setFieldsValue({ date: dateValue });
    };

    const submitDetails = async () => {
      try {
        const values = await form.validateFields();

        setContentLoader(true);
        // Convert date string to timestamp
        const timestampedValues = {
          ...values,
          date: new Date(values.date).valueOf(),
        };


        if (updateData && updateData._id) {
          const apiPath = getApiPath(currentCatalog);
          Axios.put(
            `/api/v1/app/${apiPath}/${getUpdateApiEndpoints(currentCatalog)}/${updateData._id}`,
            {
              ...timestampedValues,
              id: updateData._id,
            },
            {
              headers: {
                authorization: `bearer ${localStorage.getItem("token")}`,
              },
            }
          )
            .then((res) => {
              setContentLoader(false);
              form.resetFields();
              setUpdateData({})
              setOpen(false);
              onSuccess();
            })
            .catch((err) => {
              console.error("Error:", err); // Log the error details for debugging
              setIsError(true);
              setContentLoader(false); // Hide the loader after an error
            });
        }
        else {
          const apiPath = getApiPath(currentCatalog);
          Axios.post(
            `/api/v1/app/${apiPath}/${getApiEndpoints(currentCatalog)}`,
            {
              ...timestampedValues,
              addedBy: user.userId,
              truckId: activeTruckId,
            },
            {
              headers: {
                authorization: `bearer ${localStorage.getItem("token")}`,
              },
            }
          )
            .then((res) => {
              setContentLoader(false);
              form.resetFields();
              setOpen(false);
              onSuccess();
            })
            .catch((err) => {
              console.error("Error:", err); // Log the error details for debugging
              setIsError(true);
              setContentLoader(false); // Hide the loader after an error
            });
        }
        setOpen(false); // Close the modal on successful submission
      } catch (error) {
        console.error("Form submission failed:", error);
      }
    };

    const renderFormFields = () => {
      return formFields?.map((field) => {
        if (field.name === "other" && selectedCategory !== "other") {
          return null; // Skip rendering if 'other' is disabled
        }
        switch (field.type) {
          case "date":
            return (
              <Form.Item
                key={field.name}
                label={field.label}
                name={field.name}
                rules={field.rules}
                initialValue={moment().format("YYYY-MM-DD")}
              >
                {/* <DatePicker
                  format="YYYY-MM-DD"
                  onChange={(date) => form.setFieldsValue({ [field.name]: date ? date.valueOf() : null })}
                /> */}
                <input
                  type="date"
                  value={updateData.date || moment().format("YYYY-MM-DD")}
                  style={{
                    padding: "10px",
                    width: "100%",
                    border: "1px solid #ddd",
                    borderRadius: "7px",
                  }}
                  onChange={handleDateChange}
                />
              </Form.Item>
            );
          case "input":
            return (
              <Form.Item
                key={field.name}
                label={field.label}
                name={field.name}
                rules={field.rules}
              >
                <Input
                  type={field.textType}
                  disabled={
                    field.name === "other" && selectedCategory !== "other"
                  }
                />
              </Form.Item>
            );
          case "select":
            return (
              <Form.Item
                key={field.name}
                label={field.label}
                name={field.name}
                hasFeedback
                rules={field.rules}
              >
                <Select
                  placeholder={field.placeholder}
                  onChange={handleCategoryChange}
                >
                  {field?.options?.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            );
          default:
            return <></>;
        }
      });
    };

    const initialValues = formFields?.reduce((acc, field) => {
      if (field.type === "date") {
        acc[field.name] = dayjs().format("YYYY-MM-DD");
      }
      return acc;
    }, {});

    return (
      <>
        <LoaderOverlay isVisible={contentLoader} />
        <Modal
          title={`Add ${category}`}
          footer={
            <Button type="primary" onClick={submitDetails}>
              Submit
            </Button>
          }
          open={open}
          onCancel={() => {
            setOpen(false);
            form.resetFields();
            setIsError(false);
          }}
          loading={loading}
        >
          {isError && (
            <b className="text-danger">
              Something went wrong! Check your entry...
            </b>
          )}
          <Form
            form={form}
            name="expenses"
            labelCol={{ flex: "110px" }}
            labelAlign="left"
            labelWrap
            wrapperCol={{ flex: 1 }}
            colon={false}
            style={{ maxWidth: 600, marginTop: 50 }}
            initialValues={initialValues}
          >
            {renderFormFields()}
          </Form>
        </Modal>
      </>
    );
  }
);

export default ExpenseModal;
