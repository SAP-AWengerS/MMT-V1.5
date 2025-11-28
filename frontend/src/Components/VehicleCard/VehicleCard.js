import React, { useRef } from "react";
import { EditFilled, FolderOpenFilled } from "@ant-design/icons";
import { Avatar, Card } from "antd";
import VehicleModal from "../VehicleModal/VehicleModal";
import CatalogModal from "../CatalogModal/CatalogModal";
const { Meta } = Card;

const VehicleCard = ({ data }) => {
  const vehicleModalRef = useRef();
  const catalogModalRef = useRef();

  const callVehicleModal = (e) => {
    e.stopPropagation();
    if (vehicleModalRef.current) {
      vehicleModalRef.current.showLoading();
    }
  };

  const callCatalogModal = (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (catalogModalRef.current) {
      catalogModalRef.current.showLoading();
    }
  };

  const addNewVehicle = (newVehicleDetails) => {
    // console.log(newVehicleDetails);
  };

  return (
    <>
      <Card
        hoverable
        bordered
        style={{ border: "1px solid #cbcbcb" }}
        cover={<img alt="truck" height={180} style={{ objectFit: 'cover' }} src={data && data.imgURL && data.imgURL.length > 0
          ? data.imgURL[0]?.thumbUrl : './truck.jpg'} />}
        onClick={callCatalogModal}
        actions={[
          <EditFilled
            key="edit"
            style={{ fontSize: 18 }}
            onClick={callVehicleModal}
          />,
          <FolderOpenFilled
            key="ellipsis"
            style={{ fontSize: 18 }}
            onClick={callCatalogModal}
          />,
        ]}
      >
        <Meta title={data.registrationNo} description={data.desc} style={{ height: '80px', overflow: 'hidden' }} />
      </Card>
      <VehicleModal ref={vehicleModalRef} addNewVehicle={addNewVehicle} vehicleData={data} />
      <CatalogModal ref={catalogModalRef} vehicleId={data._id} isFinanced={data.isFinanced} regNo={data.registrationNo} />
    </>
  );
};
export default VehicleCard;
