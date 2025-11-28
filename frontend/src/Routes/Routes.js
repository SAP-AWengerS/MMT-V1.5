import React, { useContext } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './Home'
import Login from '../Pages/Auth/Login/Login'
import { UserContext } from '../App'
import Signup from '../Pages/Auth/Signup/Signup'
import UnauthorizedAccess from '../Pages/UnauthorizedAccess/UnauthorizedAccess'

const AppRoutes = () => {
    const { user } = useContext(UserContext)

    return (
        <BrowserRouter>
            <Routes>
                {user ? (
                    user.isSubscribed ? (
                        <Route path="/*" element={<Home />} />
                    ) : (
                        <Route path="/*" element={<UnauthorizedAccess />} />
                    )
                ) : (
                    <>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/*" element={<Login />} />
                    </>
                )}
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes
