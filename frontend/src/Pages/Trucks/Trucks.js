import React, { useState } from 'react'
import LoaderOverlay from '../../Components/LoaderOverlay/LoaderOverlay'
import { Button, Empty } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import VehicleCard from "../../Components/VehicleCard/VehicleCard";
import VehicleModal from "../../Components/VehicleModal/VehicleModal";
import { useEffect } from 'react';
import { Axios } from '../../Config/Axios/Axios';
import { useContext } from 'react';
import { UserContext } from '../../App';
import { useRef } from 'react';

const Trucks = () => {
    const [contentLoader, setContentLoader] = useState(false)
    const [isError, setIsError] = useState(false);
    const [trucks, setTrucks] = useState([]);

    const { user } = useContext(UserContext);

    useEffect(() => {
        setContentLoader(true);
        Axios.get(`/api/v1/app/truck/getAllTrucksByUser/${user.userId}`, {
            params: {
                addedBy: user.userId,
            },
            headers: {
                authorization: `bearer ${localStorage.getItem('token')}`,
            },
        })
            .then((res) => {
                setTrucks(res.data);
                setContentLoader(false);
            })
            .catch((err) => {
                setIsError(true);
                setContentLoader(false);
            });

        return () => { };
    }, []);

    const vehicleModalRef = useRef();

    const callVehicleModal = () => {
        if (vehicleModalRef.current) {
            vehicleModalRef.current.showLoading();
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex flex-column">
                    <b style={{ fontSize: "26px" }}>Trucks</b>
                    <span style={{ fontSize: "14px", color: "#939393" }}>Efficiently manage the trucks you own.</span>
                </div>
                <div>
                    <Button className="primary rounded-5 p-4" onClick={callVehicleModal}><PlusOutlined /> Add Vehicle</Button>
                </div>
            </div>
            <LoaderOverlay isVisible={contentLoader} />
            {(!contentLoader && trucks.length === 0) ? (
                <div
                    style={{
                        width: "100%",
                        minHeight: "40vh",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Empty description="No trucks added yet" />
                </div>
            ) : (
                <div className="dashboard-grid-container vehicleCard pb-5">
                    {trucks?.map((truck) => (
                        <VehicleCard key={truck._id} data={truck} />
                    ))}
                </div>
            )}
            <VehicleModal
                ref={vehicleModalRef}
                setTrucks={setTrucks}
                trucks={trucks}
                vehicleData={null}
            />
        </div>
    )
}

export default Trucks
