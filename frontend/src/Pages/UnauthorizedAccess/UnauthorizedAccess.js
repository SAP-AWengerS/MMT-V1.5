import React, { useRef } from "react";
import { Button, Result } from "antd";
import GetHelpModal from "../../Components/GetHelpModal/GetHelpModal";
import { googleLogout } from "@react-oauth/google";
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";

const UnauthorizedAccess = () => {
  const getHelpRef = useRef();

  const callGetHelpModal = () => {
    if (getHelpRef.current) {
      getHelpRef.current.showModal();
    }
  };

  const handleOk = () => {
    googleLogout();
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div
      className="w-100 d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <div className="d-flex justify-content-center gap-2">
            <Button type="primary" onClick={callGetHelpModal}>
              Contact
            </Button>
            <ConfirmModal
              title="Confirm Action"
              content="Are you sure you want to signout?"
              onOk={handleOk}
              onCancel={()=>{}}
            >
              <Button type="primary" danger>
                Signout
              </Button>
            </ConfirmModal>
            <GetHelpModal ref={getHelpRef} />
          </div>
        }
      />
    </div>
  );
};
export default UnauthorizedAccess;
