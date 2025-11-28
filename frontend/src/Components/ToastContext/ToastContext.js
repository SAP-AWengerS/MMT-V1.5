import React, { createContext, useContext } from "react";
import { message } from "antd";  // or any toast library like react-toastify

const ToastContext = createContext();

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
  const toastMessage = (type, mssg) => {
    message[type]({
      content: mssg,
    });
  };

  return (
    <ToastContext.Provider value={toastMessage}>
      {children}
    </ToastContext.Provider>
  );
};