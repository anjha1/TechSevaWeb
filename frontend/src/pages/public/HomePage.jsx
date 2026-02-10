/**
 * Home Page - TechSeva
 * Landing page with all sections from HTML design
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedAppliance, setSelectedAppliance] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [diagnosisResult, setDiagnosisResult] = useState('');
    const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);
    const [activeFaq, setActiveFaq] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const floatingDevicesRef = useRef(null);

    // Redirect logged-in users to their dashboard
    useEffect(() => {
        if (user) {
            const roleRoutes = {
                'user': '/user-dashboard',
                'technician': '/technician-dashboard',
                'Superadmin': '/superadmin-dashboard',
                'superadmin': '/superadmin-dashboard',
                'Citymanager': '/citymanager-dashboard',
                'citymanager': '/citymanager-dashboard',
                'Serviceadmin': '/serviceadmin-dashboard',
                'serviceadmin': '/serviceadmin-dashboard',
                'Financeofficer': '/financeofficer-dashboard',
                'financeofficer': '/financeofficer-dashboard',
                'Supportagent': '/supportagent-dashboard',
                'supportagent': '/supportagent-dashboard'
            };
            const dashboardRoute = roleRoutes[user.role] || '/user-dashboard';
            navigate(dashboardRoute, { replace: true });
        }
    }, [user, navigate]);

    // Services data
    const services = [
        {
            id: 'AC',
            title: 'AC Repair & Service',
            description: 'Professional AC servicing, gas refilling, and repair for all brands',
            image: '/images/ACRepair.png',
            features: ['Cooling issue resolution', 'Gas leak detection & repair', 'Compressor servicing']
        },
        {
            id: 'Refrigerator',
            title: 'Refrigerator Repair',
            description: 'Expert fridge and freezer repair with genuine replacement parts',
            image: '/images/RefrigeratorRepair.png',
            features: ['Cooling system repair', 'Compressor issues', 'Door seal replacement']
        },
        {
            id: 'Washing Machine',
            title: 'Washing Machine Repair',
            description: 'Expert repair for washing machines, dryers, and all laundry appliances',
            image: '/images/WashingMachineRepair.png',
            features: ['Drum and motor repairs', 'Water leakage fixes', 'Spin cycle issues']
        },
        {
            id: 'Geyser',
            title: 'Geyser Repair',
            description: 'Professional geyser repair and maintenance services',
            image: '/images/GeyserRepair.png',
            features: ['Heating element replacement', 'Thermostat issues', 'Leakage problems']
        },
        {
            id: 'Fan',
            title: 'Fan Repair',
            description: 'Comprehensive fan repair services for all types of fans',
            image: '/images/FanRepair.png',
            features: ['Motor repair and replacement', 'Speed control issues', 'Blade balancing']
        },
        {
            id: 'Computer',
            title: 'Computer Repair',
            description: 'Expert computer repair and maintenance services',
            image: '/images/ComputerRepair.png',
            features: ['Hardware troubleshooting', 'Software installation', 'Virus removal']
        },
        {
            id: 'Laptop',
            title: 'Laptop Repair',
            description: 'Professional laptop repair services for all brands',
            image: '/images/LaptopRepair.png',
            features: ['Screen replacement', 'Keyboard issues', 'Battery replacement']
        },
        {
            id: 'Mobile',
            title: 'Mobile Phone Repair',
            description: 'Expert mobile phone repair services for all models',
            image: '/images/MobilePhoneRepair.png',
            features: ['Screen replacement', 'Battery issues', 'Software problems']
        },
        {
            id: 'Dishwasher',
            title: 'Dishwasher Repair',
            description: 'Professional dishwasher repair and maintenance',
            image: '/images/DishwasherRepair.png',
            features: ['Pump and motor issues', 'Drainage problems', 'Control panel repair']
        },
        {
            id: 'Inverter',
            title: 'Inverter/Battery Repair',
            description: 'Expert inverter and battery repair services',
            image: '/images/InverterBatteryRepair.png',
            features: ['Battery replacement', 'Charging issues', 'Circuit board repair']
        },
        {
            id: 'Electrical',
            title: 'General Electrical Work',
            description: 'Comprehensive electrical repair and installation services',
            image: '/images/GeneralElectricalWork.png',
            features: ['Wiring and rewiring', 'Switchboard repair', 'Lighting installation']
        }
    ];

    // Why Choose Us benefits
    const benefits = [
        { image: '/images/MobilePhoneRepair.png', title: 'Fast Turnaround', description: 'Most repairs completed in under 2 hours at your location with our mobile service vans.' },
        { image: '/images/ComputerRepair.png', title: 'Certified Experts', description: 'Our technicians are trained and certified by leading brands like Apple, Samsung, and Dell.' },
        { image: '/images/InverterBatteryRepair.png', title: 'Transparent Pricing', description: 'No hidden costs. Get upfront quotes with 90-day warranty on all repairs.' },
        { image: '/images/GeneralElectricalWork.png', title: 'Wide Coverage', description: 'Serving in 50+ cities across India with 1000+ skilled technicians.' },
        { image: '/images/GeyserRepair.png', title: '24/7 Support', description: 'Round-the-clock customer support via chat, phone and email for all your queries.' }
    ];

    // Platform features
    const platformFeatures = [
        { image: '/images/ACRepair.png', title: 'App & IVR Booking', description: 'Seamless booking via our mobile app for smartphone users and a dedicated IVR phone system for feature phone users.' },
        { image: '/images/RefrigeratorRepair.png', title: 'Image-Based Diagnosis', description: 'Technicians upload images showing the actual problem before quoting, ensuring transparency and accuracy.' },
        { image: '/images/DishwasherRepair.png', title: 'Dynamic Pricing', description: 'Prices adjust based on parts needed, travel distance, and job complexity, providing fair and transparent costs.' },
        { image: '/images/FanRepair.png', title: 'Regional Language Support', description: 'Our platform is available in Hindi, Tamil, Telugu, Bengali, and other regional languages for broader accessibility.' },
        { image: '/images/LaptopRepair.png', title: 'Verified Technicians', description: 'All technicians undergo rigorous background checks and skill verification to ensure trusted and reliable service.' },
        { image: '/images/QRCode.png', title: 'Digital Invoices', description: 'Receive detailed invoices with warranty information instantly via app, SMS, or email for every service.' }
    ];

    // Testimonials
    const testimonials = [
        {
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            text: '"My iPhone screen was repaired in just 45 minutes at my office. The technician was professional and the quality is perfect! I\'ve used their service three times now and it\'s consistently excellent."',
            author: 'Rahul Sharma',
            role: 'Delhi | Marketing Executive',
            rating: '★★★★★'
        },
        {
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            text: '"Great service! My laptop was fixed the same day and they even gave me tips to maintain it better. The pricing was transparent and much cheaper than the brand service center."',
            author: 'Priya Patel',
            role: 'Mumbai | College Student',
            rating: '★★★★★'
        },
        {
            avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
            text: '"As a partner technician, I\'m earning more than my previous shop job with flexible hours. The support team is always helpful and payments come on time every day."',
            author: 'Vikram Singh',
            role: 'TechSeva Partner | Bangalore',
            rating: '★★★★★'
        },
        {
            avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
            text: '"The technician arrived exactly on time and fixed my washing machine in under an hour. The app made it so easy to book and track the service. Highly recommended!"',
            author: 'Ananya Gupta',
            role: 'Hyderabad | Homemaker',
            rating: '★★★★☆'
        }
    ];

    // FAQ data
    const faqData = [
        {
            question: 'How quickly can you repair my device?',
            answer: 'Most common repairs like screen replacements are completed within 1-2 hours at your location. For more complex issues, we provide a diagnosis within 30 minutes and will give you an accurate time estimate.'
        },
        {
            question: 'Are your technicians certified?',
            answer: 'Yes, all our technicians undergo rigorous training and are certified by leading brands. We also conduct regular skill assessments to ensure the highest quality of service.'
        },
        {
            question: 'What warranty do you provide on repairs?',
            answer: 'All repairs come with a 90-day warranty on both parts and labor. For screen replacements, we offer a 180-day warranty.'
        },
        {
            question: 'How do I become a TechSeva technician?',
            answer: 'Visit our "Become a Technician" section to apply. We provide free training, tools, and flexible earning opportunities. Basic technical knowledge is required.'
        },
        {
            question: 'Do you use genuine parts for repairs?',
            answer: 'We use OEM (Original Equipment Manufacturer) parts that meet or exceed original specifications. You can choose between premium OEM parts or more affordable high-quality alternatives.'
        }
    ];

    // Appliance types for booking
    const applianceTypes = [
        { value: '', label: '-- Select --' },
        { value: 'AC', label: 'AC Repair/Service' },
        { value: 'Refrigerator', label: 'Refrigerator Repair' },
        { value: 'Washing Machine', label: 'Washing Machine Repair' },
        { value: 'TV', label: 'TV Repair' },
        { value: 'Fan', label: 'Fan Repair' },
        { value: 'Geyser', label: 'Geyser Repair' },
        { value: 'Microwave', label: 'Microwave Repair' },
        { value: 'Water Purifier', label: 'Water Purifier Repair' },
        { value: 'Dishwasher', label: 'Dishwasher Repair' },
        { value: 'Inverter', label: 'Inverter/Battery Repair' },
        { value: 'Computer', label: 'Computer Repair' },
        { value: 'Laptop', label: 'Laptop Repair' },
        { value: 'Mobile', label: 'Mobile Phone Repair' },
        { value: 'Electrical', label: 'General Electrical Work' },
        { value: 'Plumbing', label: 'Plumbing Services' },
        { value: 'Carpentry', label: 'Carpentry Services' },
        { value: 'Painting', label: 'Painting Services' },
        { value: 'Other', label: 'Other' }
    ];

    // Floating devices animation
    useEffect(() => {
        let position = 0;
        let direction = 1;
        const interval = setInterval(() => {
            if (floatingDevicesRef.current) {
                position += direction * 0.5;
                if (position > 10 || position < -10) {
                    direction *= -1;
                }
                floatingDevicesRef.current.style.transform = `translateY(${position}px)`;
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Scroll to booking section
    const scrollToBooking = () => {
        const bookingSection = document.getElementById('unauthenticated-book-service');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Handle booking form submission
    const handleBookingSubmit = (e) => {
        e.preventDefault();
        if (!selectedAppliance) {
            alert('Please select an appliance type.');
            return;
        }
        // Redirect to login page
        navigate('/login');
    };

    // Handle AI diagnosis
    const handleDiagnosis = async () => {
        if (!problemDescription.trim()) {
            alert('Please describe the problem with your appliance.');
            return;
        }

        setIsLoadingDiagnosis(true);
        setDiagnosisResult('');

        try {
            const response = await fetch('/api/ai-diagnosis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problemDescription })
            });

            const result = await response.json();
            if (response.ok && result.diagnosis) {
                setDiagnosisResult(result.diagnosis);
            } else {
                setDiagnosisResult(result.message || 'Could not get a diagnosis. Please try again or rephrase.');
            }
        } catch (error) {
            console.error('AI Diagnosis error:', error);
            setDiagnosisResult('An error occurred during diagnosis. Please try again later.');
        } finally {
            setIsLoadingDiagnosis(false);
        }
    };

    // Toggle FAQ
    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <div className="home-page">
            {/* Header */}
            <header className="header">
                <Link to="/" className="logo">
                    <span className="logo-icon">🔧</span> TechSeva
                </Link>
                <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</button>
                <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    <li className="nav-item"><Link to="/" className="active">Home</Link></li>
                    <li className="nav-item"><Link to="/how-it-works">How It Works</Link></li>
                    <li className="nav-item"><Link to="/contact">Contact</Link></li>
                    {user ? (
                        <li className="nav-item"><Link to={`/${user.role}`}>Dashboard</Link></li>
                    ) : (
                        <li className="nav-item"><Link to="/login">Login/Signup</Link></li>
                    )}
                </nav>
            </header>

            <main>
                {/* Hero Section */}
                <section className="hero" id="home">
                    <video autoPlay muted loop playsInline className="hero-video">
                        <source src="/videos/Ac_ad.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1>Your Devices, Our Care</h1>
                        <p>Fast, trusted repair & tech support at your doorstep</p>
                        <div className="cta-buttons">
                            <button onClick={scrollToBooking} className="btn btn-primary">
                                <i className="fas fa-calendar-alt"></i> Book a Repair
                            </button>
                            <Link to="/signup" className="btn btn-secondary">
                                <i className="fas fa-user-plus"></i> Join as Technician
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Appliance Repair Services Section */}
                <section className="appliance-repair">
                    <div className="container">
                        <div className="section-title">
                            <h2>Appliance Repair Services</h2>
                            <p>Professional repair services for all your home appliances by certified technicians</p>
                        </div>
                        
                        <div className="services-grid">
                            {services.map((service) => (
                                <div key={service.id} className="service-card">
                                    <div className="service-image">
                                        <img src={service.image} alt={service.title} />
                                    </div>
                                    <div className="service-content">
                                        <h3 className="service-title">{service.title}</h3>
                                        <p className="service-description">{service.description}</p>
                                        <ul className="service-features">
                                            {service.features.map((feature, idx) => (
                                                <li key={idx}><i className="fas fa-check"></i> {feature}</li>
                                            ))}
                                        </ul>
                                        <button onClick={scrollToBooking} className="select-service-btn">Select Service</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <div className="section-container">
                    <section className="why-choose">
                        <div className="floating-devices" ref={floatingDevicesRef}></div>
                        <div className="container">
                            <div className="section-title">
                                <h2>Why Choose TechSeva?</h2>
                                <p>We're committed to providing the best service experience in the industry</p>
                            </div>
                            <div className="benefits">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="benefit-item">
                                        <div className="benefit-icon">
                                            <div className="benefit-image">
                                                <img src={benefit.image} alt={benefit.title} />
                                            </div>
                                        </div>
                                        <h3>{benefit.title}</h3>
                                        <p>{benefit.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Service Process / Platform Features Section */}
                <div className="section-container">
                    <section className="service-process">
                        <div className="section-title">
                            <h2>Our Platform Features</h2>
                            <p>Designed for Tier-2 & Tier-3 Towns across India</p>
                        </div>
                        
                        <div className="features-grid">
                            {platformFeatures.map((feature, index) => (
                                <div key={index} className="feature-item">
                                    <div className="feature-image">
                                        <img src={feature.image} alt={feature.title} />
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Booking Service Section */}
                <section id="unauthenticated-book-service" className="booking-section">
                    <div className="container">
                        <div className="section-title">
                            <h2>Book a Service</h2>
                            <p>Fill out the details below to book your service. If you're not logged in, you'll be prompted to do so.</p>
                        </div>
                        <form id="unauthenticated-booking-form" onSubmit={handleBookingSubmit}>
                            <div className="form-group">
                                <label htmlFor="unauth-appliance-type">Select Appliance Type:</label>
                                <select
                                    id="unauth-appliance-type"
                                    name="applianceType"
                                    value={selectedAppliance}
                                    onChange={(e) => setSelectedAppliance(e.target.value)}
                                    required
                                >
                                    {applianceTypes.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary btn-form-submit">Book Service</button>
                        </form>
                    </div>
                </section>

                {/* AI Diagnosis Section */}
                <section id="ai-diagnosis-section" className="ai-diagnosis-section">
                    <div className="container">
                        <h2>✨ AI Appliance Diagnoser ✨</h2>
                        <p>Describe your appliance's problem and get an instant preliminary diagnosis from our AI. This can help you understand the issue better before booking a service.</p>
                        <div className="form-group">
                            <label htmlFor="appliance-problem">What's wrong with your appliance?</label>
                            <textarea
                                id="appliance-problem"
                                placeholder="e.g., My refrigerator is not cooling, but the light is on."
                                value={problemDescription}
                                onChange={(e) => setProblemDescription(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleDiagnosis}
                            className="btn btn-primary"
                            disabled={isLoadingDiagnosis}
                        >
                            {isLoadingDiagnosis ? 'Diagnosing...' : 'Get AI Diagnosis ✨'}
                        </button>
                        {diagnosisResult && (
                            <div className="diagnosis-result">
                                {diagnosisResult}
                            </div>
                        )}
                        {isLoadingDiagnosis && <p className="loading-indicator">Diagnosing problem... Please wait.</p>}
                    </div>
                </section>

                {/* Join as Partner Section */}
                <section className="join-section" id="join">
                    <div className="container">
                        <h2>Fix & Earn with TechSeva</h2>
                        <p>Join our network of certified technicians and get flexible work opportunities with daily payouts</p>
                        <div className="benefits-list">
                            <div className="benefit-tag">
                                <i className="fas fa-calendar-alt"></i>
                                <span>Flexible Schedule</span>
                            </div>
                            <div className="benefit-tag">
                                <i className="fas fa-wallet"></i>
                                <span>Daily Payouts</span>
                            </div>
                            <div className="benefit-tag">
                                <i className="fas fa-graduation-cap"></i>
                                <span>Free Training</span>
                            </div>
                            <div className="benefit-tag">
                                <i className="fas fa-tools"></i>
                                <span>Toolkit Provided</span>
                            </div>
                            <div className="benefit-tag">
                                <i className="fas fa-users"></i>
                                <span>Support Team</span>
                            </div>
                            <div className="benefit-tag">
                                <i className="fas fa-chart-line"></i>
                                <span>Growth Opportunities</span>
                            </div>
                        </div>
                        <Link to="/signup" className="btn btn-primary">
                            <i className="fas fa-user-plus"></i> Become a Technician
                        </Link>
                    </div>
                </section>

                {/* Pricing Comparison Section */}
                <div className="section-container">
                    <section className="pricing-comparison">
                        <div className="container">
                            <div className="section-title">
                                <h2>Static vs Dynamic Pricing</h2>
                                <p>Understanding how our pricing model benefits both customers and service providers</p>
                            </div>
                            
                            <div className="comparison-intro">
                                <p>Traditional service companies often use static pricing models that don't account for variations in repair complexity, parts availability, or technician expertise. TechSeva's dynamic pricing model ensures fair pricing for customers while maintaining profitability for our technicians.</p>
                            </div>
                            
                            <div className="comparison-content">
                                <div className="pricing-model static-pricing">
                                    <div className="model-header">
                                        <div className="model-icon">
                                            <img src="/images/InverterBatteryRepair.png" alt="Static Pricing" />
                                        </div>
                                        <h3 className="model-title">Static Pricing</h3>
                                    </div>
                                    <ul className="model-features">
                                        <li>Fixed rates regardless of actual repair complexity</li>
                                        <li>One-size-fits-all approach to service costs</li>
                                        <li>Often includes hidden fees and charges</li>
                                        <li>No consideration for parts availability or cost fluctuations</li>
                                        <li>Limited flexibility for customer budget constraints</li>
                                        <li>Often leads to either overcharging or undercharging</li>
                                    </ul>
                                    <p><strong>Result:</strong> Inefficient pricing that often doesn't reflect the true value of service provided.</p>
                                </div>
                                
                                <div className="pricing-model dynamic-pricing">
                                    <div className="model-header">
                                        <div className="model-icon">
                                            <img src="/images/ComputerRepair.png" alt="Dynamic Pricing" />
                                        </div>
                                        <h3 className="model-title">Dynamic Pricing</h3>
                                    </div>
                                    <ul className="model-features">
                                        <li>Real-time pricing based on actual parts and labor required</li>
                                        <li>Transparent cost breakdown before any work begins</li>
                                        <li>Considers technician expertise and certification levels</li>
                                        <li>Accounts for part availability and market prices</li>
                                        <li>Flexible options for different quality tiers of parts</li>
                                        <li>Distance-based travel fee calculation</li>
                                    </ul>
                                    <p><strong>Result:</strong> Fair pricing that accurately reflects the specific service requirements.</p>
                                </div>
                            </div>
                            
                            <div className="profit-section">
                                <div className="profit-image">
                                    <img src="/images/MobilePhoneRepair.png" alt="Profit with Dynamic Pricing" />
                                </div>
                                <div className="profit-content">
                                    <h3>Increased Profit with Dynamic Pricing</h3>
                                    <ul className="profit-points">
                                        <li><strong>Optimized Resource Allocation:</strong> Dynamic pricing ensures technicians are compensated fairly for their specific expertise and time investment.</li>
                                        <li><strong>Reduced Customer Disputes:</strong> Transparent pricing leads to higher customer satisfaction and fewer payment issues.</li>
                                        <li><strong>Better Inventory Management:</strong> Real-time part pricing helps maintain optimal inventory levels and reduces waste.</li>
                                        <li><strong>Competitive Advantage:</strong> Fair and transparent pricing attracts more customers and builds brand loyalty.</li>
                                        <li><strong>Increased Service Volume:</strong> Satisfied customers are more likely to return and refer others, increasing overall revenue.</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="visual-comparison">
                                <h3 className="section-subtitle">Pricing Model Comparison</h3>
                                <div className="comparison-chart">
                                    <div className="chart-bar">
                                        <div className="bar static-bar">
                                            <div className="bar-label">Static Pricing</div>
                                        </div>
                                        <div className="chart-label">Customer Satisfaction: 65%</div>
                                    </div>
                                    <div className="chart-bar">
                                        <div className="bar dynamic-bar">
                                            <div className="bar-label">Dynamic Pricing</div>
                                        </div>
                                        <div className="chart-label">Customer Satisfaction: 92%</div>
                                    </div>
                                    <div className="chart-bar">
                                        <div className="bar static-bar" style={{height: '70%'}}>
                                            <div className="bar-label">Static Pricing</div>
                                        </div>
                                        <div className="chart-label">Technician Profit Margin: 22%</div>
                                    </div>
                                    <div className="chart-bar">
                                        <div className="bar dynamic-bar" style={{height: '90%'}}>
                                            <div className="bar-label">Dynamic Pricing</div>
                                        </div>
                                        <div className="chart-label">Technician Profit Margin: 35%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* App Download Section */}
                <section className="app-section">
                    <div className="container">
                        <div className="section-title">
                            <h2>TechSeva Mobile App</h2>
                            <p>Track your repair, chat with experts & shop on the go</p>
                        </div>
                        <div className="app-content">
                            <div className="app-image">
                                <img src="/images/TechSevaMobileApp.png" alt="TechSeva Mobile App" />
                            </div>
                            <div className="app-details">
                                <h3>Everything you need in one app</h3>
                                <p>Our mobile app makes it easy to book services, track repair status in real-time, chat with technicians, and purchase accessories - all from your smartphone.</p>
                                
                                <div className="app-features">
                                    <div className="app-feature">
                                        <i className="fas fa-check-circle"></i>
                                        <span>Real-time repair tracking</span>
                                    </div>
                                    <div className="app-feature">
                                        <i className="fas fa-check-circle"></i>
                                        <span>Instant quotes for services</span>
                                    </div>
                                    <div className="app-feature">
                                        <i className="fas fa-check-circle"></i>
                                        <span>Chat directly with technicians</span>
                                    </div>
                                    <div className="app-feature">
                                        <i className="fas fa-check-circle"></i>
                                        <span>Exclusive app-only discounts</span>
                                    </div>
                                </div>
                                
                                <div className="app-badges">
                                    <img src="/images/GooglePlay.png" alt="Google Play" className="app-badge" />
                                    <img src="/images/AppStore.png" alt="App Store" className="app-badge" />
                                </div>
                                
                                <div className="qr-container">
                                    <img src="/images/QRCode.png" alt="QR Code" className="qr-code" />
                                    <div className="qr-text">Scan to download the TechSeva app directly to your device</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* User Types CTA Section */}
                <section className="user-types-cta-section">
                    <div className="container">
                        <div className="section-title">
                            <h2>Who Are You?</h2>
                        </div>
                        <div className="user-cta-grid">
                            <Link to="/login" className="user-cta-card customer">
                                <h3><span className="user-icon">👤</span> I am a Customer</h3>
                                <p>Need a quick and reliable appliance repair? Book a service now!</p>
                                <button className="btn btn-primary" style={{marginTop: '20px'}}>Book Service</button>
                            </Link>
                            <Link to="/signup" className="user-cta-card technician">
                                <h3><span className="user-icon">👷</span> I am a Technician</h3>
                                <p>Grow your business, get more jobs, and earn more with TechSeva.</p>
                                <button className="btn btn-primary" style={{marginTop: '20px'}}>Join Now</button>
                            </Link>
                            <a href="/admin-login" className="user-cta-card admin">
                                <h3><span className="user-icon">👑</span> I am an Admin</h3>
                                <p>Manage users, jobs, and platform operations efficiently.</p>
                                <button className="btn btn-primary" style={{marginTop: '20px'}}>Access Admin</button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="testimonials" id="testimonials">
                    <div className="container">
                        <div className="section-title">
                            <h2>What Our Customers Say</h2>
                            <p>Hear from people who trusted TechSeva with their devices</p>
                        </div>
                        <div className="testimonial-slider">
                            <div className="testimonial-track">
                                {testimonials.map((testimonial, index) => (
                                    <div key={index} className="testimonial-card">
                                        <div className="testimonial-avatar">
                                            <img src={testimonial.avatar} alt={testimonial.author} />
                                        </div>
                                        <p className="testimonial-text">{testimonial.text}</p>
                                        <h4 className="testimonial-author">{testimonial.author}</h4>
                                        <p className="testimonial-role">{testimonial.role}</p>
                                        <div className="testimonial-rating">{testimonial.rating}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="faq" id="faq-section">
                    <div className="container">
                        <div className="section-title">
                            <h2>Frequently Asked Questions</h2>
                            <p>Find quick answers to common questions about our services</p>
                        </div>
                        <div className="faq-container">
                            {faqData.map((faq, index) => (
                                <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                                    <div className="faq-question" onClick={() => toggleFaq(index)}>
                                        <span>{faq.question}</span>
                                        <i className="fas fa-chevron-down"></i>
                                    </div>
                                    <div className="faq-answer" style={{maxHeight: activeFaq === index ? '200px' : '0'}}>
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-wave"></div>
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-column">
                            <h3>TechSeva</h3>
                            <p>India's most trusted tech service and repair platform, bringing expert solutions to your doorstep.</p>
                            <div className="social-links">
                                <a href="#"><i className="fab fa-facebook-f"></i></a>
                                <a href="#"><i className="fab fa-twitter"></i></a>
                                <a href="#"><i className="fab fa-instagram"></i></a>
                                <a href="#"><i className="fab fa-linkedin-in"></i></a>
                                <a href="#"><i className="fab fa-youtube"></i></a>
                            </div>
                        </div>
                        <div className="footer-column">
                            <h3>Services</h3>
                            <ul className="footer-links">
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Smartphone Repair</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Laptop Repair</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> TV & AC Service</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Extended Warranty</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Accessories Shop</a></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h3>Company</h3>
                            <ul className="footer-links">
                                <li><a href="#"><i className="fas fa-chevron-right"></i> About Us</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Careers</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Blog</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Press</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Partner With Us</a></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h3>Support</h3>
                            <ul className="footer-links">
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Help Center</a></li>
                                <li><Link to="/contact"><i className="fas fa-chevron-right"></i> Contact Us</Link></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Privacy Policy</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> Terms of Service</a></li>
                                <li><a href="#"><i className="fas fa-chevron-right"></i> FAQ</a></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h3>Newsletter</h3>
                            <div className="newsletter">
                                <p>Subscribe to get updates on offers and tech tips</p>
                                <form className="newsletter-form">
                                    <input type="email" placeholder="Your email address" />
                                    <button type="submit"><i className="fas fa-paper-plane"></i></button>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <div className="payment-methods">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="payment-method" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="payment-method" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="payment-method" />
                        </div>
                        <p>&copy; 2026 TechSeva Technologies Pvt Ltd. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
