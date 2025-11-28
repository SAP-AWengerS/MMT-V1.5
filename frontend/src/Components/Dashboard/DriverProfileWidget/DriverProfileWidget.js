import React, { useState, useEffect, useContext } from 'react';
import { Modal, Button, List, Avatar, Typography, Space, Form, Input, Upload, message, Select, Spin, Popconfirm } from 'antd';
import { UserOutlined, PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Axios } from '../../../Config/Axios/Axios';
import { UserContext } from '../../../App';

const { Text } = Typography;
const { Option } = Select;

const THEME_GREEN = "#1a7f37";



const DriverProfileWidget = () => {
  const { user } = useContext(UserContext);

  // State management
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [photoUrl, setPhotoUrl] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // API Functions
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`/api/v1/app/driverProfiles/getAllDriverProfilesByUser/${user.userId}`, {
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data && response.data.success) {
        setDrivers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      message.error('Failed to load driver profiles');
    } finally {
      setLoading(false);
    }
  };

  const addDriver = async (driverData) => {
    try {
      setSubmitLoading(true);
      const response = await Axios.post('/api/v1/app/driverProfiles/addDriverProfile', {
        ...driverData,
        addedBy: user.userId,
      }, {
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data && response.data.success) {
        setDrivers([...drivers, response.data.data]);
        message.success('Driver profile added successfully');
        return response.data.data;
      }
    } catch (error) {
      console.error('Error adding driver:', error);
      message.error(error.response?.data?.message || 'Failed to add driver profile');
      throw error;
    } finally {
      setSubmitLoading(false);
    }
  };

  const updateDriver = async (driverId, driverData) => {
    try {
      setSubmitLoading(true);
      const response = await Axios.put(`/api/v1/app/driverProfiles/updateDriverProfileById/${driverId}`, driverData, {
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data && response.data.success) {
        setDrivers(drivers?.map(d => d._id === driverId ? response.data.data : d));
        message.success('Driver profile updated successfully');
        return response.data.data;
      }
    } catch (error) {
      console.error('Error updating driver:', error);
      message.error(error.response?.data?.message || 'Failed to update driver profile');
      throw error;
    } finally {
      setSubmitLoading(false);
    }
  };

  const deleteDriver = async (driverId) => {
    try {
      setDeleteLoading(true);
      const response = await Axios.delete(`/api/v1/app/driverProfiles/deleteDriverProfileById/${driverId}`, {
        headers: {
          authorization: `bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data && response.data.success) {
        setDrivers(drivers.filter(d => d._id !== driverId));
        message.success('Driver profile deleted successfully');
        setIsModalVisible(false);
        setSelectedDriver(null);
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      message.error(error.response?.data?.message || 'Failed to delete driver profile');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Load drivers on component mount
  useEffect(() => {
    const loadDrivers = async () => {
      if (user && user.userId) {
        await fetchDrivers();
      }
    };

    loadDrivers();
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const showDriverDetails = (driver) => {
    setSelectedDriver(driver);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedDriver(null);
  };

  const handleAddDriver = () => {
    setIsAddModalVisible(true);
  };

  const handleAddModalClose = () => {
    setIsAddModalVisible(false);
    form.resetFields();
    setPhotoUrl('');
  };

  const handleAddDriverSubmit = async (values) => {
    try {
      const driverData = {
        ...values,
        photo: photoUrl || '/driver.png'
      };

      await addDriver(driverData);
      setIsAddModalVisible(false);
      form.resetFields();
      setPhotoUrl('');
    } catch (error) {
      // Error is already handled in addDriver function
    }
  };

  // Edit functionality
  const handleEditDriver = () => {
    editForm.setFieldsValue(selectedDriver);
    setEditPhotoUrl(selectedDriver.photo);
    setIsEditModalVisible(true);
    setIsModalVisible(false);
  };

  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    editForm.resetFields();
    setEditPhotoUrl('');
    setSelectedDriver(null);
  };

  const handleEditDriverSubmit = async (values) => {
    try {
      const driverData = {
        ...values,
        photo: editPhotoUrl || selectedDriver.photo
      };

      const updatedDriver = await updateDriver(selectedDriver._id, driverData);
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditPhotoUrl('');
      setSelectedDriver(updatedDriver);
      setIsModalVisible(true);
    } catch (error) {
      // Error is already handled in updateDriver function
    }
  };

  // Handle photo upload for add
  const uploadProps = {
    beforeUpload: file => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }
      const reader = new FileReader();
      reader.onload = e => setPhotoUrl(e.target.result);
      reader.readAsDataURL(file);
      return false;
    },
    showUploadList: false,
    accept: "image/*"
  };

  // Handle photo upload for edit
  const editUploadProps = {
    beforeUpload: file => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }
      const reader = new FileReader();
      reader.onload = e => setEditPhotoUrl(e.target.result);
      reader.readAsDataURL(file);
      return false;
    },
    showUploadList: false,
    accept: "image/*"
  };

  // Don't render if user is not available
  if (!user || !user.userId) {
    return (
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "18px 22px",
        boxShadow: "0 2px 8px rgba(22,119,255,0.07)",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="driver-profile-card" style={{
      background: "#fff",
      borderRadius: "12px",
      padding: 26,
      boxShadow: "0 2px 8px rgba(22,119,255,0.07)",
      height: "100%",
      minHeight: 360,
      overflowY: "auto",
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <b style={{
          margin: 0,
          color: "#222",
          fontSize: "16px",
          fontWeight: 700,
          letterSpacing: "0.2px"
        }}>
          Driver Profiles
        </b>
        <Button
          type="primary"
          icon={<PlusOutlined style={{fontSize: 15}} />}
          size="small"
          onClick={handleAddDriver}
          style={{ borderRadius: 16, background: THEME_GREEN, fontWeight: 500, border: "none", fontSize: "14px", padding: "16px" }}
        >
          Add
        </Button>
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Spin size="large" />
        </div>
      ) : (
        drivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#939393' }}>
            <UserOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
            <div>No driver profiles found</div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>Click "Add" to create your first driver profile</div>
            <Button
              type="link"
              onClick={fetchDrivers}
              style={{ color: THEME_GREEN, fontSize: 12 }}
            >
              Refresh
            </Button>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={drivers}
            renderItem={driver => (
          <List.Item
            style={{
              cursor: 'pointer',
              borderRadius: "18px",
              transition: 'background 0.2s',
              marginBottom: 0,
              padding: "6px 8px",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
            onClick={() => showDriverDetails(driver)}
            className="driver-list-item"
          >
            <Space align="center" size="small">
              <Avatar
                src={driver.photo}
                icon={!driver.photo && <UserOutlined />}
                size={48}
                style={{ backgroundColor: THEME_GREEN, color: "#fff" }}
              />
              <div>
                <span style={{
                  fontWeight: 500,
                  fontSize: "14px",
                  color: "#222",
                  letterSpacing: "0.2px"
                }}>
                  {driver.name}
                </span>
                <br />
                <span style={{
                  fontSize: "12px",
                  color: "#939393",
                  fontWeight: 400
                }}>
                  {driver.contact}
                </span>
              </div>
            </Space>
            <span
              style={{
                fontSize: 18,
                color: THEME_GREEN,
                fontWeight: 700,
                marginLeft: 12,
                padding: "0 8px",
                background: "none",
                borderRadius: 0,
                display: "inline-block"
              }}
            >

            </span>
            </List.Item>
          )}
        />
        )
      )}
      {/* Driver Details Modal */}
      <Modal
        title={
          <span style={{ fontWeight: 600, fontSize: 20, color: "#222" }}>
            {selectedDriver?.name}'s Details
          </span>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="edit" icon={<EditOutlined />} style={{ borderRadius: 24, background: THEME_GREEN, border: "none", marginRight: 8 }} onClick={handleEditDriver}>
            Edit
          </Button>,
          <Popconfirm
            key="delete"
            title="Delete Driver Profile"
            description="Are you sure you want to delete this driver profile?"
            onConfirm={() => deleteDriver(selectedDriver._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              style: { background: '#ff4d4f', borderColor: '#ff4d4f' },
              loading: deleteLoading
            }}
          >
            <Button
              icon={<DeleteOutlined />}
              style={{ borderRadius: 24, background: '#ff4d4f', border: "none", color: 'white', marginRight: 8 }}
              loading={deleteLoading}
              danger
            >
              Delete
            </Button>
          </Popconfirm>,
          <Button key="close" type="primary" style={{ borderRadius: 24, background: THEME_GREEN, border: "none" }} onClick={handleModalClose}>
            Close
          </Button>
        ]}
        centered
        bodyStyle={{ fontSize: 16, padding: 24, background: "#fff" }}
      >
        {selectedDriver && (
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <img
              src={selectedDriver.photo || "https://randomuser.me/api/portraits/lego/1.jpg"}
              alt={selectedDriver.name}
              style={{
                width: "96px",
                height: "auto",
                objectFit: "contain",
                borderRadius: "8px"
              }}
            />
            <div style={{ textAlign: "left", flex: 1 }}>
              <Text><b>Name:</b> {selectedDriver.name}</Text><br />
              <Text><b>Gender:</b> {selectedDriver.gender}</Text><br />
              <Text><b>Contact:</b> {selectedDriver.contact}</Text><br />
              <Text><b>Age:</b> {selectedDriver.age}</Text><br />
              <Text><b>Experience:</b> {selectedDriver.experience}</Text><br />
              <Text><b>License:</b> {selectedDriver.license}</Text>
            </div>
          </div>
        )}
      </Modal>
      {/* Add Driver Modal */}
      <Modal
        title={
          <span style={{ fontWeight: 600, fontSize: 20, color: THEME_GREEN }}>
            Add New Driver
          </span>
        }
        open={isAddModalVisible}
        onCancel={handleAddModalClose}
        footer={null}
        centered
        bodyStyle={{ fontSize: 16, padding: 24, background: "#fff" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddDriverSubmit}
        >
          <Form.Item label="Photo" name="photo">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Upload License</Button>
            </Upload>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Preview"
                style={{
                  marginTop: 12,
                  marginLeft: 24,
                  width: "64px",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "8px"
                }}
              />
            )}
          </Form.Item>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter driver name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Gender"
            name="gender"
            rules={[{ required: true, message: 'Please select gender' }]}
          >
            <Select placeholder="Select gender">
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Contact"
            name="contact"
            rules={[
              { required: true, message: 'Please enter contact number' },
              { pattern: /^\d{10}$/, message: 'Contact number must be exactly 10 digits' }
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input
              maxLength={10}
              inputMode="numeric"
              pattern="\d*"
              placeholder="Enter 10 digit contact number"
              onKeyPress={e => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label="Age"
            name="age"
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Experience"
            name="experience"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="License"
            name="license"
            rules={[{ required: true, message: 'Please enter license number' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={handleAddModalClose} style={{ borderRadius: 24 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitLoading}
                style={{ borderRadius: 24, background: THEME_GREEN, border: "none" }}
              >
                Add Driver
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      {/* Edit Driver Modal */}
      <Modal
        title={
          <span style={{ fontWeight: 600, fontSize: 20, color: THEME_GREEN }}>
            Edit Driver
          </span>
        }
        open={isEditModalVisible}
        onCancel={handleEditModalClose}
        footer={null}
        centered
        bodyStyle={{ fontSize: 16, padding: 24, background: "#fff" }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditDriverSubmit}
        >
          <Form.Item label="Photo" name="photo">
            <Upload {...editUploadProps}>
              <Button icon={<UploadOutlined />}>Upload Passport Photo</Button>
            </Upload>
            {editPhotoUrl && (
              <img
                src={editPhotoUrl}
                alt="Preview"
                style={{
                  marginTop: 12,
                  marginLeft: 24,
                  width: "64px",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "8px"
                }}
              />
            )}
          </Form.Item>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter driver name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Gender"
            name="gender"
            rules={[{ required: true, message: 'Please select gender' }]}
          >
            <Select placeholder="Select gender">
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Contact"
            name="contact"
            rules={[
              { required: true, message: 'Please enter contact number' },
              { pattern: /^\d{10}$/, message: 'Contact number must be exactly 10 digits' }
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input
              maxLength={10}
              inputMode="numeric"
              pattern="\d*"
              placeholder="Enter 10 digit contact number"
              onKeyPress={e => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label="Age"
            name="age"
            rules={[{ required: true, message: 'Please enter age' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Experience"
            name="experience"
            rules={[{ required: true, message: 'Please enter experience' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="License"
            name="license"
            rules={[{ required: true, message: 'Please enter license number' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={handleEditModalClose} style={{ borderRadius: 24 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitLoading}
                style={{ borderRadius: 24, background: THEME_GREEN, border: "none" }}
              >
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      <style>
        {`
          .driver-list-item:hover {
            background: #e0e0e0 !important;
          }
        `}
      </style>
    </div>
  );
};

export default DriverProfileWidget;