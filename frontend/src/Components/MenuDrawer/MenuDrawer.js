import { Drawer, FloatButton, Menu } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    HomeOutlined,
    CalendarOutlined,
    BarChartOutlined,
    TeamOutlined,
    SettingOutlined,
    QuestionCircleOutlined,
    LogoutOutlined,
    TruckOutlined
} from "@ant-design/icons";

const MenuDrawer = ({ navOpen, setNavOpen }) => {
  const [current, setCurrent] = useState();
  const [logoLoading, setLogoLoading] = useState(true);
  const nav = useNavigate();

  const onNavClose = () => {
    setNavOpen(false);
  };

  const items = [
    {
      type: "group",
      label: "MENU",
      children: [
        { label: "Dashboard", key: "dashboard", icon: <HomeOutlined /> },
        { label: "Trucks", key: "trucks", icon: <TruckOutlined /> },
        { label: "Drivers", key: "drivers", icon: <TeamOutlined /> },
        { label: "Calendar", key: "calendar", icon: <CalendarOutlined /> },
        { label: "Analytics", key: "analytics", icon: <BarChartOutlined /> },
        { label: "Team", key: "team", icon: <TeamOutlined /> }
      ]
    },
    {
      type: "group",
      label: "GENERAL",
      children: [
        { label: "Settings", key: "settings", icon: <SettingOutlined /> },
        { label: "Help", key: "help", icon: <QuestionCircleOutlined /> },
        { label: "Logout", key: "logout", icon: <LogoutOutlined /> }
      ]
    }
  ];

  const onClick = (e) => {
    nav(`/${e.key}`);
    setCurrent(e.key);
    setNavOpen(false); // Close drawer after navigation
  };

  return (
    <Drawer
      placement={"left"}
      closable={false}
      onClose={onNavClose}
      open={navOpen}
      style={{ padding: 0, height: "100vh" }}
      key={"left"}
      width={280}
    >
      <div className="sidebar-container" style={{ height: "100%", width: "100%", margin: 0, borderRadius: 0 }}>
        <div className="sidebar-top">
          {/* Logo */}
          <div className="d-flex gap-2 align-items-center mb-4" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
            <div style={{ width: 50, height: 50, position: "relative" }}>
              {logoLoading && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px"
                  }}
                >
                  <div style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #ccc",
                    borderTop: "2px solid #007bff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                </div>
              )}
              <img
                src="/favicon.png"
                alt=""
                style={{
                  width: 50,
                  height: 50,
                  opacity: logoLoading ? 0 : 1,
                  transition: "opacity 0.3s ease"
                }}
                onLoad={() => setLogoLoading(false)}
                onError={() => setLogoLoading(false)}
              />
            </div>
            <div><b className="fs-8">Manage My Truck</b></div>
          </div>

          {/* Menu */}
          <Menu
            onClick={onClick}
            selectedKeys={[current]}
            mode="vertical"
            items={items}
            className="custom-sidebar-menu"
            style={{ paddingLeft: "20px", paddingRight: "20px" }}
          />
        </div>

        <div className="sidebar-bottom" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          {/* Contact Card */}
          <div className="sidebar-contact-card">
            <div className="sidebar-contact-overlay"></div>

            <div className="contact-card-content">
              <div className="contact-title">Need Tweaks?</div>
              <div className="contact-subtitle">
                Reach out to us for customizations or tailored solutions.
              </div>

              <button className="contact-btn">Contact Us</button>
            </div>
          </div>
        </div>
      </div>

      <FloatButton
        shape="circle"
        type="dark"
        style={{
          insetInlineStart: 240,
          top: 16,
        }}
        onClick={onNavClose}
        icon={<CloseOutlined />}
      />
    </Drawer>
  );
};

export default MenuDrawer;
