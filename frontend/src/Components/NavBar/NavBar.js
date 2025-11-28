import React, { useEffect, useState } from "react";
import { Button, Space } from "antd";
import { MenuFoldOutlined, LeftOutlined } from "@ant-design/icons";

import ProfileDrawer from "../ProfileDrawer/ProfileDrawer";
import { useLocation, useNavigate } from "react-router-dom";
import { Axios } from "../../Config/Axios/Axios";
import { useContext } from "react";
import { UserContext } from "../../App";
import { useMobile } from "../MobileContext/MobileContext";

const NavBar = ({ sidebarOpen, setSidebarOpen }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [truckDetails, setTruckDetails] = useState({});
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [expenses] = useState({
    fuelExpenses: "Fuel Expenses",
    defExpenses: "Def Expenses",
    otherExpenses: "Other Expenses",
    totalExpenses: "Total Expenses",
    totalFuelExpenses: "Total Fuel Expenses",
    totalDefExpenses: "Total Def Expenses",
    totalOtherExpenses: "Total Other Expenses",
  });

  const { user } = useContext(UserContext);
  const { isMobile } = useMobile();
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setTruckDetails({});
    const locPath = loc.pathname.split("/")
    const truckId = locPath[1] === "calculateLoan" ? locPath[2] : locPath[3];
    if (truckId) {
      Axios.get(
        `/api/v1/app/truck/getTruckById/${truckId}`,
        {
          headers: {
            authorization: `bearer ${localStorage.getItem("token")}`,
          },
        }
      )
        .then((res) => {
          setTruckDetails(res.data);
        })
        .catch((err) => {
          setTruckDetails({});
        });
    }
  }, [loc.pathname]);

  // Reset image loading state when user changes
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [user?.picture]);

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const showProfileDrawer = () => {
    setProfileOpen(true);
  };

  const registrationNo = truckDetails.registrationNo;

  return (
    <div>
      <Space style={{ background: "#f6f6f6" }} className="p-4 w-100 rounded-4 d-flex justify-content-between">
          <div style={{ width: "40px", height: "40px" }}>
            <Button
              type="dark"
              className="p-2"
              style={{
                background: "white",
                borderRadius: "100%",
                height: "40px",
                width: "40px",
                display: (isMobile && !sidebarOpen) ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={toggleMobileSidebar}
            >
              <MenuFoldOutlined style={{ color: "black", fontSize: 18 }} />
            </Button>
          </div>

          <div className="d-flex">
            <Button
              type="dark"
              style={{
                border: "1px solid black",
                borderRadius: "100%",
                height: "40px",
                width: "40px",
                position: "relative",
                overflow: "hidden"
              }}
              onClick={showProfileDrawer}
            >
              {imageLoading && (
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
                    borderRadius: "50%"
                  }}
                >
                  <div style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid #ccc",
                    borderTop: "2px solid #007bff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                </div>
              )}
              <img
                src={
                  user?.picture
                    ? user?.picture
                    : "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp"
                }
                className="rounded-circle"
                style={{
                  height: "40px",
                  width: "40px",
                  opacity: imageLoading ? 0 : 1,
                  transition: "opacity 0.3s ease"
                }}
                alt=""
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </Button>
            <div className="ms-2 d-flex flex-column">
              <b style={{ fontSize: "14px" }} >{user?.name}</b>
              <span style={{ fontSize: "10px" }}>{user?.email}</span>
            </div>
          </div>
      </Space>
      <ProfileDrawer
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
      />
    </div>
  );
};

export default NavBar;
