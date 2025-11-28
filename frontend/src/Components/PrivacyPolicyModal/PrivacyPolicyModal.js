import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Modal } from "antd";

const PrivacyPolicyModal = forwardRef((props, ref) => {
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
    <Modal
      title={
        <div style={{
          textAlign: 'center',
          color: '#1890ff',
          fontSize: '24px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          🔒 Privacy Policy
        </div>
      }
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={null}
      width={800}
      centered
      style={{ borderRadius: '16px', maxHeight: '90vh' }}
      bodyStyle={{ padding: 0, maxHeight: '70vh', overflow: 'auto' }}
    >
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
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
            Privacy Policy
          </h2>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.5',
            margin: 0,
            opacity: 0.95
          }}>
            We are committed to protecting your personal information and being transparent about how we use it.
          </p>
        </div>

        {/* Privacy Sections */}
        <div style={{
          background: '#fff',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: '20px'
        }}>

          {/* Information We Collect */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #1890ff'
            }}>
              <h3 style={{ color: '#1890ff', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                Information We Collect
              </h3>
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Personal Info:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>Name, email, phone number for account management.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Truck Data:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>Expenses, maintenance, and operational details you provide.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Usage Data:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>Interaction data, IP addresses, and cookies for analytics.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Location Data:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>If enabled, for location-based features and route optimization.</span>
                </div>
              </div>
            </div>
          </div>

          {/* How We Use Information */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #1890ff'
            }}>
              <h3 style={{ color: '#1890ff', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                How We Use Your Information
              </h3>
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Service Provision:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>To operate, maintain, and improve our platform features.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Communication:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>For account updates, support, and important notifications.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Analytics:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>To understand usage patterns and improve user experience.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Support:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>To respond to your inquiries and provide technical assistance.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Information Sharing */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #1890ff'
            }}>
              <h3 style={{ color: '#1890ff', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                Information Sharing
              </h3>
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Service Providers:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>With trusted third-party services that help us operate our platform.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Legal Compliance:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>When required by law or to protect our rights and users.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Business Transfers:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>In case of a merger, acquisition, or sale of business assets.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #1890ff'
            }}>
              <h3 style={{ color: '#1890ff', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                Your Rights & Controls
              </h3>
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Access & Correction:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>Update your personal information anytime through your account settings.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Opt-Out:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>Unsubscribe from promotional communications at any time.</span>
                </div>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #1890ff'
                }}>
                  <strong style={{ color: '#1890ff' }}>Account Deletion:</strong>
                  <span style={{ marginLeft: '8px', color: '#555' }}>Request complete account and data deletion by contacting our support team.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Policies */}
          <div style={{ display: 'grid', gap: '20px', marginBottom: '32px' }}>
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #1890ff'
            }}>
              <h4 style={{ color: '#1890ff', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                Third-Party Links
              </h4>
              <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>
                Our platform may contain links to external websites. We are not responsible for the privacy practices
                or content of these third-party sites. Please review their privacy policies before sharing any information.
              </p>
            </div>

            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #1890ff'
            }}>
              <h4 style={{ color: '#1890ff', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                Children's Privacy
              </h4>
              <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>
                Our platform is designed for business use and is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children under 13.
              </p>
            </div>

            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #1890ff'
            }}>
              <h4 style={{ color: '#1890ff', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                Data Security
              </h4>
              <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>
                We implement industry-standard security measures to protect your information, including encryption,
                secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.
              </p>
            </div>
          </div>

        </div>

        {/* Contact & Updates Section */}
        <div style={{
          background: '#1890ff',
          padding: '30px',
          borderRadius: '8px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '20px' }}>
            Questions or Concerns?
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px 0', opacity: 0.95 }}>
              <strong>Manage My Truck (MMT)</strong>
            </p>
            <p style={{ margin: '0 0 8px 0', opacity: 0.95 }}>
              Email: dev.codhub@gmail.com
            </p>

          </div>
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>
              <strong>Policy Updates:</strong> We may update this privacy policy from time to time.
              We will notify you of any significant changes through our platform or via email.
            </p>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              <strong>Last Updated:</strong> November 2024
            </p>
          </div>
        </div>

      </div>
    </Modal>
  );
});

export default PrivacyPolicyModal;
