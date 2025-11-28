import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Modal } from "antd";

const GetHelpModal = forwardRef((props, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };
  const hideModal = () => {
    setIsModalOpen(false);
  }
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  return (
    <>
      <Modal
        title={
          <div style={{
            textAlign: 'center',
            color: '#1890ff',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            Get Help & Support
          </div>
        }
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={650}
        centered
        style={{ borderRadius: '16px' }}
      >
        <div style={{
          padding: '24px',
          background: '#f8f9fa',
          margin: '-24px -24px 0 -24px'
        }}>

          {/* Hero Section */}
          <div style={{
            background: '#1890ff',
            padding: '30px',
            borderRadius: '8px',
            marginBottom: '24px',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              color: 'white',
              margin: '0 0 12px 0',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              We're Here to Help!
            </h2>
            <p style={{
              fontSize: '16px',
              lineHeight: '1.5',
              margin: 0,
              opacity: 0.95
            }}>
              Need assistance with Manage My Truck? Our support team is ready to help you succeed.
            </p>
          </div>

          {/* Contact Options */}
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              color: '#1890ff',
              marginBottom: '24px',
              textAlign: 'center',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              Contact Our Support Team
            </h3>

            <div style={{ display: 'grid', gap: '20px' }}>



              {/* Email Support */}
              <div style={{
                padding: '24px',
                borderLeft: '4px solid #1890ff',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#1890ff', fontSize: '20px' }}>Email Support</strong>
                </div>
                <p style={{ margin: '0 0 16px 0', color: '#555', lineHeight: '1.6', fontSize: '16px' }}>
                  Get comprehensive technical support and detailed assistance for all your Manage My Truck needs.
                  Our expert support team typically responds within 24 hours with personalized solutions.
                </p>
                <a
                  href="mailto:dev.codhub@gmail.com?subject=MMT Support Request&body=Hello MMT Support Team,%0A%0APlease describe your issue or question:%0A%0A"
                  style={{
                    textDecoration: "none",
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '12px 24px',
                    background: '#1890ff',
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Contact Support Team
                </a>
              </div>

              {/* FAQ Section */}
              <div style={{
                padding: '24px',
                borderLeft: '4px solid #1890ff',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#1890ff', fontSize: '20px' }}>Frequently Asked Questions</strong>
                </div>
                <p style={{ margin: '0 0 16px 0', color: '#555', lineHeight: '1.6', fontSize: '16px' }}>
                  Browse our comprehensive FAQ section for instant answers to common questions about expense tracking,
                  profit analysis, fleet management, and advanced platform features.
                </p>

              </div>

              {/* Documentation */}
              <div style={{
                padding: '24px',
                borderLeft: '4px solid #1890ff',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#1890ff', fontSize: '20px' }}>User Documentation</strong>
                </div>
                <p style={{ margin: '0 0 16px 0', color: '#555', lineHeight: '1.6', fontSize: '16px' }}>
                  Access detailed user guides, step-by-step tutorials, and comprehensive documentation to master
                  all features of Manage My Truck and optimize your fleet operations.
                </p>

              </div>

              {/* Live Chat */}
              <div style={{
                padding: '24px',
                borderLeft: '4px solid #1890ff',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#1890ff', fontSize: '20px' }}>Live Chat Support</strong>
                </div>
                <p style={{ margin: '0 0 16px 0', color: '#555', lineHeight: '1.6', fontSize: '16px' }}>
                  Connect with our support specialists through real-time chat for immediate assistance.
                  Available during business hours for quick problem resolution and guidance.
                </p>

              </div>

            </div>
          </div>

          {/* Support Hours */}
          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            padding: '20px',
            background: '#1890ff',
            borderRadius: '8px',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '18px' }}>
              Support Hours
            </h3>
            <p style={{ margin: 0, opacity: 0.95, fontSize: '14px' }}>
              Monday - Friday: 9:00 AM - 6:00 PM (EST) | Weekend: Email support only
            </p>
          </div>

        </div>
      </Modal>
    </>
  );
});
export default GetHelpModal;
