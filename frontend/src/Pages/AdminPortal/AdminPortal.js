import React, { useEffect, useState } from "react";
import "../../App.css";
import {
  Table,
  Button,
  Card,
  Typography,
  message,
  Input,
  Space,
  Tag,
  Row,
  Col,
  Select,
  Popconfirm,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  UserAddOutlined,
  FilterOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Axios } from "../../Config/Axios/Axios";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function AdminPortal() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await Axios.get("/api/v1/app/admin/getAlluser", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const filteredUsers = res.data.data.filter((user) => !user.isAdmin)?.map((user) => ({ ...user, id: user._id }));
      setUsers(filteredUsers);
    } catch (err) {
      message.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const deleteTestUsers = async () => {
    try {
      setDeleteLoading(true);
      const res = await Axios.delete("/api/v1/app/admin/deleteTestUsers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      message.success(res.data.message);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      message.error("Failed to delete test users");
    } finally {
      setDeleteLoading(false);
    }
  };

  const manageSubscription = async (userId, action) => {
    try {
      await Axios.put(
        `/api/v1/app/admin/manageSubscription`,
        { userId },
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUsers((prev) =>
        prev?.map((user) =>
          user.id === userId ? { ...user, isSubscribed: !user.isSubscribed } : user
        )
      );
      message.success(
        `User successfully ${action === "subscribe" ? "subscribed" : "unsubscribed"}`
      );
    } catch (err) {
      message.error("Failed to update subscription status");
    }
  };

  const confirmAction = (userId, action) => {
    manageSubscription(userId, action);
  };

  const columns = [
    {
      title: <div style={{ textAlign: "center" }}>Name</div>,
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
      fixed: 'left',
      width: 100,
    },
    {
      title: <div style={{ textAlign: "center" }}>Email</div>,
      dataIndex: "email",
      key: "email",
      width: 180,
    },
    {
      title: <div style={{ textAlign: "center" }}>Created On</div>,
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date) => (
        <div>
          <div>{date?.split("T")[0]}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {date?.split("T")[1]?.split(".")[0]}
          </Text>
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: "center" }}>Status</div>,
      key: "status",
      width: 110,
      render: (_, record) =>
        record.isSubscribed ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Active
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Inactive
          </Tag>
        ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 120,
      render: (_, record) =>
        record.isSubscribed ? (
          <Popconfirm
            title="Unsubscribe user?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => confirmAction(record.id, "unsubscribe")}
            placement="topRight"
          >
            <Button
              type="primary"
              danger
              size="small"
              block
              icon={<CloseCircleOutlined />}
            >
              Unsubscribe
            </Button>
          </Popconfirm>
        ) : (
          <Popconfirm
            title="Subscribe user?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => confirmAction(record.id, "subscribe")}
            placement="topRight"
          >
            <Button type="primary" size="small" block icon={<UserAddOutlined />}>
              Subscribe
            </Button>
          </Popconfirm>
        ),
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "subscribed"
          ? user.isSubscribed
          : !user.isSubscribed;
    return matchesSearch && matchesFilter;
  });

  // Count test users
  const testUsersCount = users.filter(user => user.email?.startsWith('testuser_')).length;

  return (
    <div>
      <div className="d-flex flex-column" style={{ marginBottom: "1rem" }}>
        <b style={{ fontSize: "clamp(20px, 5vw, 26px)" }}>Admin Dashboard</b>
        <span style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "#939393" }}>
          Manage users & subscriptions
        </span>
      </div>

      <Card
        bordered={false}
        style={{
          marginBottom: "1.5rem",
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={12} lg={testUsersCount > 0 ? 10 : 14}>
            <Search
              placeholder="Search users by name"
              allowClear
              enterButton="Search"
              size="large"
              onSearch={(value) => setSearchTerm(value)}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={12} md={6} lg={testUsersCount > 0 ? 4 : 5}>
            <Select
              size="large"
              value={filter}
              onChange={(value) => setFilter(value)}
              style={{ width: "100%" }}
            >
              <Option value="all">All Users</Option>
              <Option value="subscribed">Subscribed</Option>
              <Option value="unsubscribed">Unsubscribed</Option>
            </Select>
          </Col>
          <Col xs={12} sm={12} md={6} lg={testUsersCount > 0 ? 4 : 5}>
            <Button
              icon={<ReloadOutlined />}
              type="default"
              size="large"
              onClick={fetchUsers}
              loading={loading}
              style={{ width: "100%" }}
            >
              Refresh
            </Button>
          </Col>
          {testUsersCount > 0 && (
            <Col xs={24} sm={24} md={12} lg={6}>
              <Popconfirm
                title={`Delete ${testUsersCount} test users?`}
                description="This will delete all users with email starting with 'testuser_'"
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                onConfirm={deleteTestUsers}
                placement="topRight"
              >
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  size="large"
                  loading={deleteLoading}
                  style={{ width: "100%" }}
                >
                  Delete Test Users
                </Button>
              </Popconfirm>
            </Col>
          )}
        </Row>
      </Card>

      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          overflowX: "auto",
        }}
      >
        <Table
          bordered
          dataSource={filteredUsers?.map((user) => ({ ...user, key: user.id }))}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: 10,
            responsive: true,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`
          }}
          rowClassName={(_, index) =>
            index % 2 === 0 ? "table-row-light" : "table-row-dark"
          }
          scroll={{ x: 'max-content' }}
          style={{ background: "white" }}
        />
      </Card>
    </div>
  );
}