import React, { useRef, useEffect } from 'react';
import '../styles/OTPInput.css';

const OTPInput = ({ length = 6, value, onChange, autoFocus = true }) => {
    const inputRefs = useRef([]);

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    const handleChange = (index, e) => {
        const val = e.target.value;
        
        // Only allow digits
        if (val && !/^\d$/.test(val)) return;
        
        const newValue = value.split('');
        newValue[index] = val;
        const newOtp = newValue.join('');
        onChange(newOtp);

        // Move to next input
        if (val && index < length - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').slice(0, length);
        if (/^\d+$/.test(pasteData)) {
            onChange(pasteData.padEnd(length, ''));
            const lastIndex = Math.min(pasteData.length - 1, length - 1);
            inputRefs.current[lastIndex]?.focus();
        }
    };

    return (
        <div className="otp-input-container">
            {Array.from({ length }, (_, index) => (
                <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-digit"
                    value={value[index] || ''}
                    onChange={e => handleChange(index, e)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    pattern="\d*"
                />
            ))}
        </div>
    );
};

export default OTPInput;
