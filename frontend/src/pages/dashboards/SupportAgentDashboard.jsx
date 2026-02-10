/**
 * Support Agent Dashboard
 * Manages support tickets and customer inquiries
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';

const SupportAgentDashboard = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [contactMessages, setContactMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ticketsRes, messagesRes] = await Promise.all([
                adminAPI.getTickets(),
                adminAPI.getContactMessages()
            ]);
            setTickets(ticketsRes.data.tickets || []);
            setContactMessages(messagesRes.data.messages || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveTicket = async (ticketId) => {
        try {
            await adminAPI.resolveTicket(ticketId);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to resolve');
        }
    };

    const handleCloseTicket = async (ticketId) => {
        try {
            await adminAPI.closeTicket(ticketId);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to close');
        }
    };

    const handleDeleteMessage = async (id) => {
        if (window.confirm('Delete this message?')) {
            try {
                await adminAPI.deleteContactMessage(id);
                fetchData();
            } catch (error) {
                alert('Failed to delete');
            }
        }
    };

    const openTickets = tickets.filter(t => t.status === 'Open');
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress');
    const resolvedTickets = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status));
    const unreadMessages = contactMessages.filter(m => !m.isRead);

    const getStatusBadge = (status) => {
        const colors = { 'Open': 'warning', 'In Progress': 'info', 'Escalated': 'danger', 'Resolved': 'success', 'Closed': 'secondary' };
        return `badge badge-${colors[status] || 'default'}`;
    };

    const getPriorityBadge = (priority) => {
        const colors = { 'Low': 'success', 'Medium': 'warning', 'High': 'danger', 'Critical': 'danger' };
        return `badge badge-${colors[priority] || 'secondary'}`;
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="support-dashboard">
            <h2>Support Agent Dashboard</h2>

            <div className="tab-nav">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>Tickets ({openTickets.length} open)</button>
                <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>Contact Messages ({unreadMessages.length})</button>
            </div>

            {activeTab === 'overview' && (
                <div className="dashboard-overview">
                    <div className="stats-grid">
                        <div className="stat-card warning"><h3>{openTickets.length}</h3><p>Open Tickets</p></div>
                        <div className="stat-card"><h3>{inProgressTickets.length}</h3><p>In Progress</p></div>
                        <div className="stat-card highlight"><h3>{resolvedTickets.length}</h3><p>Resolved</p></div>
                        <div className="stat-card"><h3>{unreadMessages.length}</h3><p>Unread Messages</p></div>
                    </div>

                    <div className="two-columns">
                        <div className="recent-section">
                            <h3>Recent Open Tickets</h3>
                            {openTickets.slice(0, 5).map(ticket => (
                                <div key={ticket._id} className="ticket-item" onClick={() => { setSelectedTicket(ticket); setActiveTab('tickets'); }}>
                                    <div className="ticket-header">
                                        <span className="ticket-id">#{ticket.ticketId}</span>
                                        <span className={getPriorityBadge(ticket.priority)}>{ticket.priority}</span>
                                    </div>
                                    <h4>{ticket.subject}</h4>
                                    <p className="ticket-meta">By: {ticket.raisedByDisplay} • {ticket.serviceType}</p>
                                </div>
                            ))}
                        </div>

                        <div className="recent-section">
                            <h3>Recent Contact Messages</h3>
                            {contactMessages.slice(0, 5).map(msg => (
                                <div key={msg._id} className="message-item">
                                    <h4>{msg.subject || 'No Subject'}</h4>
                                    <p><strong>{msg.name}</strong> ({msg.email})</p>
                                    <p className="message-preview">{msg.message?.substring(0, 100)}...</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tickets' && (
                <div className="tickets-section">
                    <h3>All Tickets</h3>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr><th>ID</th><th>Subject</th><th>Raised By</th><th>Type</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {tickets.map(ticket => (
                                    <tr key={ticket._id}>
                                        <td>{ticket.ticketId}</td>
                                        <td>
                                            <strong>{ticket.subject}</strong>
                                            <p className="text-muted small">{ticket.description?.substring(0, 50)}...</p>
                                        </td>
                                        <td>{ticket.raisedByDisplay}</td>
                                        <td>{ticket.serviceType}</td>
                                        <td><span className={getPriorityBadge(ticket.priority)}>{ticket.priority}</span></td>
                                        <td><span className={getStatusBadge(ticket.status)}>{ticket.status}</span></td>
                                        <td>
                                            <div className="action-buttons">
                                                {ticket.status === 'Open' && (
                                                    <button className="btn btn-sm btn-info" onClick={() => handleResolveTicket(ticket.ticketId)}>Resolve</button>
                                                )}
                                                {ticket.status === 'Resolved' && (
                                                    <button className="btn btn-sm btn-secondary" onClick={() => handleCloseTicket(ticket.ticketId)}>Close</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'messages' && (
                <div className="messages-section">
                    <h3>Contact Form Messages</h3>
                    <div className="messages-list">
                        {contactMessages.length === 0 ? (
                            <p className="no-data">No messages</p>
                        ) : (
                            contactMessages.map(msg => (
                                <div key={msg._id} className="message-card">
                                    <div className="message-header">
                                        <h4>{msg.subject || 'No Subject'}</h4>
                                        <span className="message-date">{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="message-sender">
                                        <p><strong>From:</strong> {msg.name}</p>
                                        <p><strong>Email:</strong> {msg.email}</p>
                                        {msg.phone && <p><strong>Phone:</strong> {msg.phone}</p>}
                                    </div>
                                    <div className="message-body">
                                        <p>{msg.message}</p>
                                    </div>
                                    <div className="message-actions">
                                        <a href={`mailto:${msg.email}?subject=Re: ${msg.subject}`} className="btn btn-sm btn-primary">Reply</a>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteMessage(msg._id)}>Delete</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportAgentDashboard;
