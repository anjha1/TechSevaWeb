import React from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '../../components';
import '../../styles/HowItWorks.css';

const HowItWorksPage = () => {
    return (
        <div className="how-it-works-page">
            <Header />
            
            {/* Hero Section */}
            <section className="hiw-hero">
                <div className="container">
                    <h1>How TechSeva Works</h1>
                    <p>Connecting you to trusted technicians in just a few simple steps</p>
                </div>
            </section>

            {/* Customer Flow */}
            <section className="customer-flow">
                <div className="container">
                    <div className="section-title">
                        <h2>For Customers</h2>
                        <p>Get your appliances repaired hassle-free</p>
                    </div>

                    <div className="steps-timeline">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h3>Select Your Service</h3>
                                <p>Browse through our wide range of appliance repair services. Select the appliance that needs repair and describe the issue you're facing.</p>
                                <div className="step-image">
                                    <i className="fas fa-laptop-medical"></i>
                                </div>
                            </div>
                        </div>

                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h3>Choose Time & Location</h3>
                                <p>Select a convenient time slot for the technician visit. Enter your address and any specific instructions for the technician.</p>
                                <div className="step-image">
                                    <i className="fas fa-calendar-check"></i>
                                </div>
                            </div>
                        </div>

                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h3>Get Matched with a Technician</h3>
                                <p>Our system automatically assigns the best available technician near your location. You'll receive the technician's details and confirmation.</p>
                                <div className="step-image">
                                    <i className="fas fa-user-check"></i>
                                </div>
                            </div>
                        </div>

                        <div className="step-item">
                            <div className="step-number">4</div>
                            <div className="step-content">
                                <h3>Diagnosis & Repair</h3>
                                <p>The technician arrives at your location, diagnoses the issue, and provides a transparent cost estimate. Upon your approval, the repair begins.</p>
                                <div className="step-image">
                                    <i className="fas fa-tools"></i>
                                </div>
                            </div>
                        </div>

                        <div className="step-item">
                            <div className="step-number">5</div>
                            <div className="step-content">
                                <h3>Pay & Review</h3>
                                <p>After successful repair, pay securely through our platform. Share your feedback to help other customers and improve our services.</p>
                                <div className="step-image">
                                    <i className="fas fa-star"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technician Flow */}
            <section className="technician-flow">
                <div className="container">
                    <div className="section-title">
                        <h2>For Technicians</h2>
                        <p>Join our network and grow your business</p>
                    </div>

                    <div className="tech-steps-grid">
                        <div className="tech-step">
                            <div className="tech-step-icon">
                                <i className="fas fa-user-plus"></i>
                            </div>
                            <h3>Register & Verify</h3>
                            <p>Sign up on our platform with your details, Aadhaar, PAN, and skills. Complete the KYC verification process.</p>
                        </div>

                        <div className="tech-step">
                            <div className="tech-step-icon">
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <h3>Set Your Availability</h3>
                            <p>Define your working hours and service areas. Our system matches you with nearby job requests.</p>
                        </div>

                        <div className="tech-step">
                            <div className="tech-step-icon">
                                <i className="fas fa-bell"></i>
                            </div>
                            <h3>Receive Job Requests</h3>
                            <p>Get notified of new job requests in your area. Accept jobs that fit your schedule and expertise.</p>
                        </div>

                        <div className="tech-step">
                            <div className="tech-step-icon">
                                <i className="fas fa-money-bill-wave"></i>
                            </div>
                            <h3>Complete & Earn</h3>
                            <p>Complete the job, get rated by customers, and earn money directly to your bank account.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features-section">
                <div className="container">
                    <div className="section-title">
                        <h2>Platform Features</h2>
                        <p>What makes TechSeva different</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-item">
                            <i className="fas fa-shield-alt"></i>
                            <h3>Verified Technicians</h3>
                            <p>All technicians undergo background verification and skill assessment</p>
                        </div>

                        <div className="feature-item">
                            <i className="fas fa-clock"></i>
                            <h3>On-Time Service</h3>
                            <p>Technicians arrive at your scheduled time slot</p>
                        </div>

                        <div className="feature-item">
                            <i className="fas fa-rupee-sign"></i>
                            <h3>Transparent Pricing</h3>
                            <p>No hidden charges - upfront diagnosis and pricing</p>
                        </div>

                        <div className="feature-item">
                            <i className="fas fa-redo"></i>
                            <h3>Warranty on Repairs</h3>
                            <p>Quality assurance with warranty on all repairs</p>
                        </div>

                        <div className="feature-item">
                            <i className="fas fa-mobile-alt"></i>
                            <h3>Track in Real-Time</h3>
                            <p>Track your technician's arrival in real-time</p>
                        </div>

                        <div className="feature-item">
                            <i className="fas fa-headset"></i>
                            <h3>24/7 Support</h3>
                            <p>Round-the-clock customer support available</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="hiw-cta">
                <div className="container">
                    <h2>Ready to Get Started?</h2>
                    <p>Book your first service or join as a technician today</p>
                    <div className="cta-buttons">
                        <Link to="/login" className="btn btn-primary">
                            <i className="fas fa-calendar-alt"></i> Book a Service
                        </Link>
                        <Link to="/signup" className="btn btn-secondary">
                            <i className="fas fa-tools"></i> Join as Technician
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HowItWorksPage;
