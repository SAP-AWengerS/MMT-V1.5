import React, {
  forwardRef,
  useContext,
  useImperativeHandle,
  useState,
} from "react";
import { Button, Form, Input, Modal, Select, Switch } from "antd";
import { Axios } from "../../Config/Axios/Axios";
import LoaderOverlay from "../LoaderOverlay/LoaderOverlay";
import { useLocation, useParams } from "react-router-dom";
import { UserContext } from "../../App";
import DatePicker from "react-date-picker";
import dayjs from "dayjs";
import moment from "moment";

const { Option } = Select;

const CalculationsModal = forwardRef(
  ({ addCalculation, category, formFields, apis, onSuccess }, ref) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contentLoader, setContentLoader] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isAdditionalCharges, setIsAdditionalCharges] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState("");
    const [form] = Form.useForm();

    const { user } = useContext(UserContext);

    function getApiEndpoints(calculationType) {
      const calculation = apis[calculationType];
      if (calculation) {
        return calculation.addAPI;
      }
    }

    const location = useLocation();
    const { catalog, vehicleId } = useParams();

    const showModal = () => {
      setOpen(true);
      // setLoading(true);
    };

    useImperativeHandle(ref, () => ({
      showModal,
    }));

    const handleCategoryChange = (value) => {
      setSelectedCategory(value);
      if (value !== "other") {
        form.setFieldsValue({ other: "" });
      }
    };

    const handleDateChange = (e) => {
      const dateValue = e.target.value;
      // Convert date string to timestamp
      const timestamp = new Date(dateValue).valueOf();
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
        Axios.post(
          `/api/v1/app/calculateLoan/addLoanCalculation`,
          {
            ...timestampedValues,
            addedBy: user.userId,
            truckId: vehicleId,
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
        setOpen(false); // Close the modal on successful submission
      } catch (error) {
        console.error("Form submission failed:", error);
      }
    };

    const renderFormFields = () => {
      return formFields?.map((field) => {
        if (
          (field.name === "other" && selectedCategory !== "other") ||
          (field.name == "additionalCharges" && !isAdditionalCharges)
        ) {
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
                  placeholder={field.placeholder}
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
          case "switch":
            return (
              <Form.Item
                key={field.name}
                label={field.label}
                name={field.name}
                rules={field.rules}
                initialValue={isAdditionalCharges}
                valuePropName="checked" // Ensure Switch value is properly bound
                getValueFromEvent={(checked) => checked} // Correctly extract the value
              >
                <Switch onChange={(checked) => setIsAdditionalCharges(checked)} />
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
            name="calculations"
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

export default CalculationsModal;
