import React, { useState } from 'react'
import { Navigate, Route, Routes as Switch } from 'react-router-dom'
import Dashboard from '../Pages/Dashboard/Dashboard'
import NavBar from '../Components/NavBar/NavBar'
import ExpenseSummary from '../Pages/ExpenseSummary/ExpenseSummary'
import Expenses from '../Pages/Expenses/Expenses'
import CalculateLoan from '../Pages/CalculateLoan/CalculateLoan'
import AdminPortal from '../Pages/AdminPortal/AdminPortal'
import SideBar from '../Components/SideBar/SideBar'
import Trucks from '../Pages/Trucks/Trucks'

const Home = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div style={{ height: "100vh", width: "100vw", padding: 16, overflow: "hidden" }}>
            <div className='h-100 d-flex gap-3'>
                <SideBar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                <div className='w-100 d-flex flex-column gap-3 main-content' style={{ height: "100%", overflowY: "auto" }}>
                    <NavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                    <div className="flex-grow-1 p-4 rounded-4 d-flex flex-column gap-3" style={{ background: "#f6f6f6", minHeight: 0, overflowY: "auto" }}>
                        <Switch>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/trucks" element={<Trucks />} />
                            <Route path="/expenses/:vehicleId?" element={<Expenses />} />
                            <Route path="/admin" element={<AdminPortal />} />,
                            <Route path="/calculateLoan/:vehicleId?" element={<CalculateLoan />} />
                            <Route path="/expenseSummary/:catalog/:vehicleId?" element={<ExpenseSummary />} />
                            <Route path="/incomeSummary/:catalog/:vehicleId?" element={<ExpenseSummary />} />
                            <Route path="/*" element={<Navigate to="/dashboard" replace />} />
                        </Switch>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
