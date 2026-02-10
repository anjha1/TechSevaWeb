import React, { useState, useEffect, createContext, useContext } from 'react';
import '../styles/MessageBox.css';

// Message Context for global notifications
const MessageContext = createContext();

export const useMessage = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessage must be used within MessageProvider');
    }
    return context;
};

export const MessageProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);

    const showMessage = (text, type = 'success', duration = 4500) => {
        const id = Date.now();
        setMessages(prev => [...prev, { id, text, type }]);
        
        setTimeout(() => {
            setMessages(prev => prev.filter(msg => msg.id !== id));
        }, duration);
    };

    const clearMessages = () => setMessages([]);

    return (
        <MessageContext.Provider value={{ showMessage, clearMessages }}>
            {children}
            <MessageContainer messages={messages} />
        </MessageContext.Provider>
    );
};

const MessageContainer = ({ messages }) => {
    if (messages.length === 0) return null;

    return (
        <div className="message-container">
            {messages.map(msg => (
                <div key={msg.id} className={`message-box ${msg.type}`}>
                    {msg.type === 'success' && <i className="fas fa-check-circle"></i>}
                    {msg.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                    {msg.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                    {msg.type === 'info' && <i className="fas fa-info-circle"></i>}
                    <span>{msg.text}</span>
                </div>
            ))}
        </div>
    );
};

export default MessageContainer;
