import { Divider, Button } from "antd";
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { googleLogout } from "@react-oauth/google";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import { CloseOutlined } from "@ant-design/icons";
import GetHelpModal from "../GetHelpModal/GetHelpModal";
import PrivacyPolicyModal from "../PrivacyPolicyModal/PrivacyPolicyModal";
import AboutUsModal from "../AboutUsModal/AboutUsModal";
import { Axios } from "../../Config/Axios/Axios";
import { UserContext } from "../../App";
import { useNavigate } from "react-router-dom";
import "../../Styles/ProfileDrawer.css";

const ProfileDrawer = ({ profileOpen, setProfileOpen }) => {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileImageLoading, setProfileImageLoading] = useState(true);

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // Reset profile image loading state when user changes
  useEffect(() => {
    setProfileImageLoading(true);
  }, [user?.picture]);

  useEffect(() => {
    // const userCred = jwtDecode(localStorage.getItem("token"));
    // setuserCredentials(userCred);

    if (!user?.userId) return;

    setLoading(true);

    Axios.get(`/api/v1/app/metadata/getProfileMetadataByUserId`, {
      params: {
        userId: user?.userId,
      },
      headers: {
        authorization: `bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        setMetadata(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile metadata:", err);
        setLoading(false);
      });
  }, [user?.userId]);

  const handleCloseMobile = () => {
    setProfileOpen(false);
  };

  const getHelpRef = useRef();
  const privacyPolicyRef = useRef();
  const aboutUsRef = useRef();

  const handleOk = () => {
    googleLogout();
    localStorage.removeItem("token");
    window.location.reload();
  };

  const callGetHelpModal = () => {
    if (privacyPolicyRef.current) privacyPolicyRef.current.hideModal?.();
    if (aboutUsRef.current) aboutUsRef.current.hideModal?.();
    if (getHelpRef.current) getHelpRef.current.showModal();
  };

  const callPrivacyPolicyModal = () => {
    if (getHelpRef.current) getHelpRef.current.hideModal?.();
    if (aboutUsRef.current) aboutUsRef.current.hideModal?.();
    if (privacyPolicyRef.current) privacyPolicyRef.current.showModal();
  };

  const callAboutUsModal = () => {
    if (getHelpRef.current) getHelpRef.current.hideModal?.();
    if (privacyPolicyRef.current) privacyPolicyRef.current.hideModal?.();
    if (aboutUsRef.current) aboutUsRef.current.showModal();
  };

  return (
    <>
      {/* Always show overlay when profile drawer is open - same as sidebar */}
      {profileOpen && (
        <div
          className="sidebar-overlay"
          onClick={handleCloseMobile}
        />
      )}

      <div className={`profile-drawer-container rounded-4 ${profileOpen ? 'profile-drawer-mobile' : ''}`}>
        {/* Close button - always visible, same as sidebar mobile */}
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleCloseMobile}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1503,
            color: '#666'
          }}
        />
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}>
            <div style={{
              width: "30px",
              height: "30px",
              border: "3px solid #f0f0f0",
              borderTop: "3px solid #007bff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
          </div>
        ) : (
          <>
            <div className="profile-drawer-top">
              {/* Profile Section */}
              <div className="text-center">
                <div className="mt-3 mb-4" style={{ position: "relative", display: "inline-block" }}>
                  {profileImageLoading && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100px",
                        height: "100px",
                        backgroundColor: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%"
                      }}
                    >
                      <div style={{
                        width: "20px",
                        height: "20px",
                        border: "2px solid #ccc",
                        borderTop: "2px solid #007bff",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}></div>
                    </div>
                  )}
                  <img
                    key={user?.picture ? `user-${user.picture}}` : 'default-avatar'}
                    src={
                      user?.picture
                        ? user.picture
                        : "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp"
                    }
                    referrerPolicy="no-referrer"
                    className="rounded-circle img-fluid"
                    style={{
                      width: "100px",
                      opacity: profileImageLoading ? 0 : 1,
                      transition: "opacity 0.3s ease"
                    }}
                    alt=""
                    onLoad={() => {
                      console.log("Image loaded successfully:", user?.picture);
                      setProfileImageLoading(false);
                    }}
                    onError={(e) => {
                      console.log("Image failed to load:", user?.picture);
                      if (e.target.src !== "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp") {
                        e.target.src = "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp";
                      }
                      setProfileImageLoading(false);
                    }}
                  />
                </div>
                <h4 className="mb-2">{user?.name}</h4>
                <p className="text-muted mb-4">
                  {user?.email}
                </p>

                <div className="mb-4 pb-2 profile-btn-group">
                  {
                    user?.isAdmin &&
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        navigate("/admin");
                        setProfileOpen(false);
                      }}
                    >
                      Admin Portal
                    </button>
                  }
                  <button
                    type="button"
                    className="btn"
                    onClick={callGetHelpModal}
                  >
                    Get Help
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={callPrivacyPolicyModal}
                  >
                    Privacy Policy
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={callAboutUsModal}
                  >
                    About Us
                  </button>
                  <ConfirmModal
                    title="Confirm Action"
                    content="Are you sure you want to signout?"
                    onOk={handleOk}
                    onCancel={() => { }}
                  >
                    <button
                      type="button"
                      className="btn btn-danger"
                    >
                      Logout
                    </button>
                  </ConfirmModal>
                </div>

                <Divider />

                <div className="d-flex justify-content-between text-center mt-3 mb-2">
                  <div>
                    <p className="mb-2 h5">{metadata.totalTrucks}</p>
                    <p className="text-muted mb-0">Total Trucks</p>
                  </div>
                  <div className="px-3">
                    <p className="mb-2 h5">{metadata.totalKM}</p>
                    <p className="text-muted mb-0">Total KM</p>
                  </div>
                  <div>
                    <p className="mb-2 h5">{metadata.totalDays}</p>
                    <p className="text-muted mb-0">Total Days</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-drawer-bottom">
              <div className="w-100 d-flex justify-content-center">
                <p style={{ color: "#808080", fontSize: 12 }}>Developed by codhub</p>
              </div>
            </div>
          </>
        )}
      </div>

      <GetHelpModal ref={getHelpRef} />
      <PrivacyPolicyModal ref={privacyPolicyRef} />
      <AboutUsModal ref={aboutUsRef} />
    </>
  );
};

export default ProfileDrawer;
