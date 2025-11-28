import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Mobile Context
const MobileContext = createContext();

// Custom hook to use the Mobile Context
export const useMobile = () => {
    const context = useContext(MobileContext);
    if (!context) {
        throw new Error('useMobile must be used within a MobileProvider');
    }
    return context;
};

// Mobile Provider Component
export const MobileProvider = ({ children }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width <= 768);
            setIsTablet(width > 768 && width <= 1024);
        };

        // Initial check
        checkScreenSize();

        // Add event listener for window resize
        window.addEventListener('resize', checkScreenSize);

        // Cleanup event listener on unmount
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const value = {
        isMobile,
        isTablet,
        breakpoint: 768,
        tabletBreakpoint: 1024,
    };

    return (
        <MobileContext.Provider value={value}>
            {children}
        </MobileContext.Provider>
    );
};

export default MobileContext;