import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Button, Form, Input, Modal, Switch, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Axios } from "../../Config/Axios/Axios";
import LoaderOverlay from "../LoaderOverlay/LoaderOverlay";
import { UserContext } from "../../App";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import { is } from "date-fns/locale";

const VehicleModal = forwardRef(({ setTrucks, trucks, vehicleData }, ref) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentLoader, setContentLoader] = useState(false);
  const [truck, setTruck] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isError, setIsError] = useState(false);
  const [deleteBtn, setDeleteBtn] = useState(false);
  const [form] = Form.useForm();
  const [deleteForm] = Form.useForm();
  const [isFinancedBtn, setIsFinancedBtn] = useState(vehicleData?(vehicleData.isFinanced):false);

  const { user } = useContext(UserContext);

  useEffect(() => {
    setLoading(true);
    // if(vehicleData)
    // {
    //   Axios.get("/api/v1/app/truck/getTruckById", {
    //     params: {
    //       id: vehicleData?._id,
    //     },
    //   })
    //     .then((res) => {
    //       console.log(res);
    //       setTruck(res.data);
    //       setLoading(false);
    //     })
    //     .catch((err) => {
    //       setIsError(true);
    //       setLoading(false);
    //     });
    // }
    setLoading(false);
    return () => {};
  }, []);

  const showLoading = () => {
    setOpen(true);
    // setLoading(true);
  };

  useImperativeHandle(ref, () => ({
    showLoading,
  }));

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleUpperCase = (e) => {
    const { name, value } = e.target;

    form.setFieldsValue({
      [name]: value.toUpperCase(),
    });
  };

  const handleDeleteForm = (e) => {
    setDeleteBtn(false);
    const { name, value } = e.target;

    form.setFieldsValue({
      [name]: value.toUpperCase(),
    });

    if (value.toUpperCase() === vehicleData?.registrationNo.toUpperCase()) {
      setDeleteBtn(true);
    }
  };

  const submitDetails = async () => {
    try {
      const values = await form.validateFields(); // Validate and get form values
      
      setContentLoader(true);
      if (vehicleData) {
        Axios.put(
          `/api/v1/app/truck/updateTruckById/${vehicleData?._id}`,
          {
            values,
          },
          {
            headers: {
              authorization: `bearer ${localStorage.getItem('token')}`,
            },
          }
        )
          .then((res) => {
            const updatedTruck = res.data;
            // setTrucks((prevTrucks) =>
            //   prevTrucks.map((truck) =>
            //     truck._id === updatedTruck._id ? updatedTruck : truck
            //   )
            // );

            setContentLoader(false);
            setOpen(false);
            form.resetFields();
            window.location.reload();
          })
          .catch((err) => {
            setIsError(true);
            setContentLoader(false);
          });
      } else {
        Axios.post(
          "/api/v1/app/truck/addTruck",
          {
            ...values,
            addedBy: user.userId,
          },
          {
            headers: {
              authorization: `bearer ${localStorage.getItem('token')}`,
            },
          }
        )
          .then((res) => {
            setTrucks([...trucks, res.data]);
            setContentLoader(false);
            form.resetFields();
            setOpen(false);
          })
          .catch((err) => {
            console.error("Error:", err); // Log the error details for debugging
            setIsError(true);
            setContentLoader(false); // Hide the loader after an error
          });
      }
      // addNewVehicle(values);
      // setOpen(false);
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  const deleteTruck = () => {
    if (deleteTruck) {
      Axios.delete(`/api/v1/app/truck/deleteTruckById/${vehicleData._id}`, {
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      })
        .then(() => {
          setShowDeleteConfirm(false);
          setOpen(false);
          window.location.reload();
        })
        .catch((err) => {
          console.error("Failed to delete truck:", err);
        });
    }
  };

  const handleOk = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <>
      <LoaderOverlay isVisible={contentLoader} />
      <Modal
        title="Vehicle Details"
        footer={
          vehicleData
            ? [
                <ConfirmModal
                  title="Confirm Action"
                  content="Are you sure you want to delete?"
                  onOk={handleOk}
                  onCancel={() => {}}
                >
                  <Button type="primary" danger>
                    Delete
                  </Button>
                </ConfirmModal>,
                <Button type="primary" onClick={submitDetails}>
                  Update Truck
                </Button>,
              ]
            : [
                <Button type="primary" onClick={submitDetails}>
                  Submit
                </Button>,
              ]
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
          name="imgURL"
          labelCol={{ flex: "110px" }}
          labelAlign="left"
          labelWrap
          wrapperCol={{ flex: 1 }}
          colon={false}
          style={{ maxWidth: 600, marginTop: 50 }}
        >
          <Form.Item
            label="Upload Vehicle Image"
            name="imgURL"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            initialValue={
              vehicleData && vehicleData.imgURL && vehicleData.imgURL.length > 0
                ? [vehicleData.imgURL[0]]
                : []
            }
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              showUploadList={{ showRemoveIcon: true }}
              accept="image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item
            label="Registration Number"
            name="registrationNo"
            initialValue={vehicleData ? vehicleData.registrationNo : ""}
            rules={[
              {
                required: true,
                message: "Please enter the Registration Number",
              },
            ]}
          >
            <Input
              disabled={vehicleData ? true : false}
              name="registrationNo"
              onChange={handleUpperCase}
            />
          </Form.Item>
          <Form.Item
            label="Chassis Number"
            name="chassisNo"
            initialValue={vehicleData ? vehicleData.chassisNo : ""}
          >
            <Input name="chassisNo" onChange={handleUpperCase} />
          </Form.Item>
          <Form.Item
            label="Engine Number"
            name="engineNo"
            initialValue={vehicleData ? vehicleData.engineNo : ""}
          >
            <Input name="engineNo" onChange={handleUpperCase} />
          </Form.Item>
          <Form.Item
            label="Make"
            name="make"
            initialValue={vehicleData ? vehicleData.make : ""}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Model"
            name="model"
            initialValue={vehicleData ? vehicleData.model : ""}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Year"
            name="year"
            initialValue={vehicleData ? vehicleData.year : ""}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="desc"
            initialValue={vehicleData ? vehicleData.desc : ""}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Finance"
            name="isFinanced"
            initialValue={vehicleData ? vehicleData.isFinanced : false}
            valuePropName="checked" // Ensure Switch value is properly bound
            getValueFromEvent={(checked) => checked} // Correctly extract the value
          >
            <Switch onChange={(checked) => setIsFinancedBtn(checked)} />
          </Form.Item>

          {isFinancedBtn &&(
            <Form.Item
              label="Finance Amount"
              name="financeAmount"
              initialValue={vehicleData ? vehicleData.financeAmount : ""}
            >
              <Input />
            </Form.Item>
          )}
        </Form>
      </Modal>
      <Modal
        title="Delete Truck"
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={deleteTruck}
            disabled={!deleteBtn}
          >
            Delete
          </Button>,
        ]}
      >
        <p>
          To confirm, type "<b>{vehicleData?.registrationNo}</b>" in the box
          below.
        </p>
        <Form
          form={deleteForm}
          name="deleteForm"
          labelCol={{ flex: "110px" }}
          labelAlign="left"
          labelWrap
          wrapperCol={{ flex: 1 }}
          colon={false}
        >
          <Form.Item name="deleteText">
            <Input name="deleteText" onChange={handleDeleteForm} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
});

export default VehicleModal;
