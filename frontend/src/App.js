import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import React, { useState, useEffect } from "react";
import { ToastProvider } from "./Components/ToastContext/ToastContext";
import { MobileProvider } from "./Components/MobileContext/MobileContext";
import "./App.css";
import Routes from "./Routes/Routes";
import { Axios } from "./Config/Axios/Axios";
import LoginLoaderOverlay from "./Components/LoginLoaderOverlay/LoginLoaderOverlay";

import { GoogleOAuthProvider } from "@react-oauth/google";

export const UserContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await Axios.post(
            "/api/v1/app/auth/whoami",
            {},
            {
              headers: {
                authorization: `bearer ${token}`,
              },
            }
          );
          setUser(response.data.user);
        }
      } catch (err) {
        console.log("Session check failed:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkSession();
  }, []);

  // Don't render anything until auth check is complete
  if (!authChecked) {
    return <LoginLoaderOverlay isVisible={true} />;
  }

  return (
    <div className="d-flex App">
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_URL}>
        <UserContext.Provider value={{ user, setUser }}>
          <MobileProvider>
            <ToastProvider>
              <Routes />
            </ToastProvider>
          </MobileProvider>
        </UserContext.Provider>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
