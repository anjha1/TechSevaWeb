/**
 * Public Layout
 * Minimal wrapper for public pages
 * Pages handle their own Header/Footer components
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
    return (
        <div className="app-layout public-layout">
            <Outlet />
        </div>
    );
};

export default PublicLayout;
