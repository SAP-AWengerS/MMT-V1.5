import React from 'react';
import { Col } from 'antd';
import '../../Styles/Dashboard.css';

/**
 * DashboardCard - A flexible wrapper component for dashboard content
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render inside the card
 * @param {Object} props.colProps - Ant Design Col component props for responsive behavior
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {string} props.title - Optional title for the card
 * @param {React.ReactNode} props.extra - Optional extra content (like buttons) in the header
 *
 * @example
 * // Small card (1/4 width on desktop)
 * <DashboardCard colProps={{ xs: 24, sm: 12, md: 8, lg: 6, xl: 6 }}>
 *   <YourComponent />
 * </DashboardCard>
 *
 * // Medium card (1/3 width on desktop)
 * <DashboardCard colProps={{ xs: 24, sm: 12, md: 8, lg: 8, xl: 8 }}>
 *   <YourComponent />
 * </DashboardCard>
 *
 * // Large card (2/3 width on desktop)
 * <DashboardCard colProps={{ xs: 24, lg: 16, xl: 16 }}>
 *   <YourComponent />
 * </DashboardCard>
 *
 * // Full width card
 * <DashboardCard colProps={{ xs: 24 }}>
 *   <YourComponent />
 * </DashboardCard>
 */
const DashboardCard = ({
  children,
  colProps = { xs: 24, sm: 12, md: 8, lg: 8, xl: 8 },
  className = '',
  style = {},
  title,
  extra
}) => {
  return (
    <Col {...colProps}>
      <div className={`dashboard-card-container ${className}`} style={style}>
        {(title || extra) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '8px'
          }}>
            {title && (
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                {title}
              </h3>
            )}
            {extra && <div>{extra}</div>}
          </div>
        )}
        {children}
      </div>
    </Col>
  );
};

export default DashboardCard;