/**
 * Dashboard Grid Configuration Utility
 *
 * This utility provides predefined responsive column configurations for different card sizes
 * and a helper function to create custom layouts.
 */

// Predefined responsive configurations for common use cases
export const DASHBOARD_LAYOUTS = {
  // Full width - takes entire row
  FULL: { xs: 24 },

  // Half width on mobile, full on desktop
  HALF: { xs: 24, sm: 12 },

  // Large card - 2/3 width on desktop, full on smaller screens
  LARGE: { xs: 24, lg: 16, xl: 16 },

  // Medium card - 1/2 width on tablet, 1/3 on desktop
  MEDIUM: { xs: 24, sm: 12, md: 8, lg: 8, xl: 8 },

  // Small card - 1/2 width on mobile, 1/4 on desktop
  SMALL: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6 },

  // Extra small card - 1/3 on mobile, 1/6 on desktop
  EXTRA_SMALL: { xs: 8, sm: 6, md: 4, lg: 4, xl: 4 },

  // Statistics card - optimized for metric display
  STAT: { xs: 24, sm: 12, md: 8, lg: 6, xl: 4 },

  // Chart card - good for graphs and visualizations
  CHART: { xs: 24, md: 12, lg: 12, xl: 12 },

  // Widget card - for smaller interactive components
  WIDGET: { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 }
};

/**
 * Create a custom responsive layout configuration
 *
 * @param {Object} config - Breakpoint configuration
 * @param {number} config.xs - Extra small screens (< 576px)
 * @param {number} config.sm - Small screens (≥ 576px)
 * @param {number} config.md - Medium screens (≥ 768px)
 * @param {number} config.lg - Large screens (≥ 992px)
 * @param {number} config.xl - Extra large screens (≥ 1200px)
 * @param {number} config.xxl - Extra extra large screens (≥ 1600px)
 * @returns {Object} Ant Design Col props configuration
 */
export const createCustomLayout = (config) => {
  return {
    xs: 24, // Default to full width on mobile
    ...config
  };
};

/**
 * Dashboard card size presets with semantic names
 */
export const CARD_SIZES = {
  HERO: DASHBOARD_LAYOUTS.FULL,
  PRIMARY: DASHBOARD_LAYOUTS.LARGE,
  SECONDARY: DASHBOARD_LAYOUTS.MEDIUM,
  TERTIARY: DASHBOARD_LAYOUTS.SMALL,
  METRIC: DASHBOARD_LAYOUTS.STAT,
  VISUALIZATION: DASHBOARD_LAYOUTS.CHART,
  CONTROL: DASHBOARD_LAYOUTS.WIDGET
};

/**
 * Utility function to get responsive grid props based on content type
 *
 * @param {string} type - The type of content ('hero', 'chart', 'stat', 'widget', etc.)
 * @param {Object} override - Optional override for specific breakpoints
 * @returns {Object} Ant Design Col props
 */
export const getResponsiveProps = (type = 'medium', override = {}) => {
  const layouts = {
    hero: DASHBOARD_LAYOUTS.FULL,
    large: DASHBOARD_LAYOUTS.LARGE,
    medium: DASHBOARD_LAYOUTS.MEDIUM,
    small: DASHBOARD_LAYOUTS.SMALL,
    stat: DASHBOARD_LAYOUTS.STAT,
    chart: DASHBOARD_LAYOUTS.CHART,
    widget: DASHBOARD_LAYOUTS.WIDGET,
    full: DASHBOARD_LAYOUTS.FULL,
    half: DASHBOARD_LAYOUTS.HALF
  };

  return {
    ...layouts[type] || DASHBOARD_LAYOUTS.MEDIUM,
    ...override
  };
};

const dashboardLayoutUtils = {
  DASHBOARD_LAYOUTS,
  CARD_SIZES,
  createCustomLayout,
  getResponsiveProps
};

export default dashboardLayoutUtils;