# Styles Organization

This document provides an overview of the CSS organization in this project.

## Structure

All styles have been organized into separate CSS files by page/component to improve maintainability and reduce the size of the main App.css file.

### Global Styles (App.css)
Contains only global styles that apply across the entire application:
- Global button styles (green and red gradients)
- Ant Design global customizations (buttons, spinners, tables, float buttons)
- Global utility styles (animations, shadows, grid containers)
- App-level styling

### Page-Specific Styles

#### Login.css
Contains styles for the Login page:
- `.login-page` - Main login page container
- `.account-block` - Login form block with background
- `.text-theme` - Theme-specific text colors

#### CalculateLoan.css
Contains styles for the Calculate Loan page:
- `.loan-grid-container` - Grid layout for loan statistics cards
- Responsive breakpoints for tablets and laptops

### Component-Specific Styles

#### Dashboard.css
Contains styles for the Dashboard page:
- `.primary` - Primary gradient background
- `.dashboard-card-container` - Card containers with hover effects
- `.statistics-carousel` - Horizontal scrolling carousel for statistics
- Responsive grid layouts

#### LoaderOverlay.css
Contains styles for both loader overlay components:
- `.loader-overlay` - Generic loading overlay
- `.login-loader-overlay` - Enhanced login loader with branding
- All related animations (fadeIn, slideUp, shimmer, pulse, etc.)

#### Sidebar.css
Contains styles for the Sidebar component:
- `.sidebar-container` - Main sidebar container
- `.custom-sidebar-menu` - Sidebar menu customization
- `.sidebar-contact-card` - Bottom contact card
- `.sidebar-overlay` - Overlay for mobile sidebar
- Responsive mobile behavior

#### ProfileDrawer.css
Contains styles for the Profile Drawer component:
- `.profile-drawer-container` - Main drawer container
- `.profile-btn-group` - Button group styling
- Fixed positioning and animations

## Import Structure

Each component/page imports its specific CSS file:

```javascript
// Example in Login.js
import "../../../Styles/Login.css";

// Example in Sidebar.js
import "../../Styles/Sidebar.css";
```

## Benefits of This Organization

1. **Maintainability**: Easier to find and update styles for specific pages/components
2. **Performance**: Smaller CSS files load faster
3. **Scalability**: Easy to add new style files as the project grows
4. **Clarity**: Clear separation between global and component-specific styles
5. **Debugging**: Easier to identify which styles affect which components

## File Structure

```
frontend/src/Styles/
├── README.md              # This file
├── Login.css              # Login page styles
├── LoaderOverlay.css      # Loader overlay components
├── Sidebar.css            # Sidebar component
├── ProfileDrawer.css      # Profile drawer component
├── CalculateLoan.css      # Calculate Loan page
└── Dashboard.css          # Dashboard page (existing)
```

## Migration Notes

- All page/component-specific styles have been extracted from `App.css`
- Import statements have been added to all affected components
- Global styles remain in `App.css` for application-wide consistency
- Existing `Dashboard.css` was preserved and remains unchanged
