import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Modal } from "antd";

const AboutUsModal = forwardRef((props, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const hideModal = () => {
    setIsModalOpen(false);
  }
  const handleOk = () => setIsModalOpen(false);
  const handleCancel = () => setIsModalOpen(false);

  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  return (
    <Modal
        title={
          <div style={{
            textAlign: 'center',
            color: '#1890ff',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            About Manage My Truck
          </div>
        }
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={null}
      width={700}
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
            margin: '0 0 16px 0',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            Manage My Truck (MMT)
          </h2>
          <p style={{
            fontSize: '18px',
            lineHeight: '1.6',
            margin: 0,
            opacity: 0.95
          }}>
            Your comprehensive platform for efficient truck fleet management,
            expense tracking, and profit optimization.
          </p>
        </div>

        {/* Features Grid */}
        <div style={{
          background: '#fff',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            color: '#1890ff',
            marginBottom: '24px',
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: 'bold'
          }}>
            Key Features & Benefits
          </h3>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{
              padding: '20px',
              borderLeft: '4px solid #1890ff',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#1890ff', fontSize: '18px' }}>Smart Expense Tracking</strong>
              </div>
              <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>
                Monitor and categorize all your truck-related expenses with detailed insights,
                automated calculations, and real-time reporting for better financial control.
              </p>
            </div>

            <div style={{
              padding: '20px',
              borderLeft: '4px solid #1890ff',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#1890ff', fontSize: '18px' }}>Advanced Profit Analysis</strong>
              </div>
              <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>
                Analyze your profits over different periods with interactive charts,
                trend analysis, and predictive insights to maximize your earnings.
              </p>
            </div>

            <div style={{
              padding: '20px',
              borderLeft: '4px solid #1890ff',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#1890ff', fontSize: '18px' }}>Comprehensive Cost Management</strong>
              </div>
              <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>
                Track and manage all costs associated with truck operation, maintenance,
                fuel, and logistics with automated alerts and optimization suggestions.
              </p>
            </div>

            <div style={{
              padding: '20px',
              borderLeft: '4px solid #1890ff',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#1890ff', fontSize: '18px' }}>Intuitive User Experience</strong>
              </div>
              <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>
                Modern, responsive interface built with React, featuring mobile-first design,
                dark mode support, and accessibility compliance for seamless operation.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          padding: '24px',
          background: '#1890ff',
          borderRadius: '8px',
          color: '#fff',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '20px' }}>
            Ready to Transform Your Truck Business?
          </h3>
          <p style={{ margin: 0, opacity: 0.95, fontSize: '16px' }}>
            Start managing your fleet more efficiently and profitably today!
          </p>
        </div>

      </div>
    </Modal>
  );
});

export default AboutUsModal;
