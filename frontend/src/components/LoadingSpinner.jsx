import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
    return (
        <div className={`loading-spinner ${size}`}>
            <div className="spinner"></div>
            {text && <p>{text}</p>}
        </div>
    );
};

export const PageLoader = () => (
    <div className="page-loader">
        <LoadingSpinner size="large" text="Loading..." />
    </div>
);

export const ButtonLoader = () => (
    <span className="button-loader">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
    </span>
);

export default LoadingSpinner;
