import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCpu, FiWifi, FiZap, FiArrowRight, FiTerminal, FiCode, FiDatabase, FiServer } from 'react-icons/fi';
import './Home.css';

function Home() {
  const coursesRef = useRef(null);
  const ctaRef = useRef(null);
  const [typedCode, setTypedCode] = useState('');

  const codeSnippet = `#include <esp32.h>
#include <mqtt.h>

void setup() {
  WiFi.begin(SSID, PASS);
  mqtt.connect("broker.io");
  sensor.init(GPIO_4);
}

void loop() {
  float data = sensor.read();
  mqtt.publish("energy", data);
  delay(1000);
}`;

  useEffect(() => {
    // Typing animation for code
    let index = 0;
    const timer = setInterval(() => {
      if (index <= codeSnippet.length) {
        setTypedCode(codeSnippet.slice(0, index));
        index++;
      } else {
        // Reset after pause
        setTimeout(() => {
          index = 0;
          setTypedCode('');
        }, 3000);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe sections
    const fadeElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .scale-in');
    fadeElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const courses = [
    {
      icon: <FiCpu />,
      title: 'Embedded Systems',
      description: 'Master microcontroller programming, bare-metal development, and hardware interfaces.',
      color: 'green',
      link: '/category/embedded-systems',
      tech: ['ARM Cortex', 'RTOS', 'C/C++']
    },
    {
      icon: <FiWifi />,
      title: 'IoT Development',
      description: 'Build connected devices with MQTT, REST APIs, and cloud integration.',
      color: 'blue',
      link: '/category/iot',
      tech: ['ESP32', 'MQTT', 'AWS IoT']
    },
    {
      icon: <FiZap />,
      title: 'Energy Monitoring',
      description: 'Design smart metering systems with real-time data visualization.',
      color: 'orange',
      link: '/category/energy-monitoring',
      tech: ['NILM', 'Power Analysis', 'Modbus']
    }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        {/* Animated Background - Circuit Board Pattern */}
        <div className="hero-bg">
          {/* Circuit Board SVG Pattern */}
          <svg className="circuit-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-green)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--primary-blue)" stopOpacity="0.1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Horizontal circuit traces */}
            <path className="circuit-trace" d="M0,100 H200 L220,120 H400" />
            <path className="circuit-trace delay-1" d="M0,200 H150 L170,180 H350 L370,200 H500" />
            <path className="circuit-trace delay-2" d="M0,350 H100 L120,370 H280" />
            <path className="circuit-trace delay-3" d="M700,100 H900 L920,120 H1200" />
            <path className="circuit-trace delay-4" d="M800,250 H950 L970,270 H1200" />
            <path className="circuit-trace delay-5" d="M850,400 H1000 L1020,380 H1200" />

            {/* Vertical circuit traces */}
            <path className="circuit-trace delay-2" d="M200,0 V150 L220,170 V300" />
            <path className="circuit-trace delay-3" d="M350,0 V100 L370,120 V250" />
            <path className="circuit-trace delay-1" d="M900,0 V180 L920,200 V350" />
            <path className="circuit-trace delay-4" d="M1050,0 V120 L1070,140 V280" />

            {/* Connection nodes (IC pins) */}
            <circle className="circuit-node" cx="200" cy="100" r="4" />
            <circle className="circuit-node delay-1" cx="400" cy="120" r="4" />
            <circle className="circuit-node delay-2" cx="150" cy="200" r="4" />
            <circle className="circuit-node delay-3" cx="500" cy="200" r="4" />
            <circle className="circuit-node delay-4" cx="280" cy="370" r="4" />
            <circle className="circuit-node delay-5" cx="900" cy="100" r="4" />
            <circle className="circuit-node delay-1" cx="950" cy="270" r="4" />
            <circle className="circuit-node delay-2" cx="1000" cy="380" r="4" />
            <circle className="circuit-node delay-3" cx="200" cy="300" r="4" />
            <circle className="circuit-node delay-4" cx="350" cy="250" r="4" />
            <circle className="circuit-node delay-5" cx="920" cy="350" r="4" />

            {/* Data flow pulses on traces */}
            <circle className="data-dot" r="3">
              <animateMotion dur="3s" repeatCount="indefinite" path="M0,100 H200 L220,120 H400" />
            </circle>
            <circle className="data-dot delay-2" r="3">
              <animateMotion dur="4s" repeatCount="indefinite" path="M700,100 H900 L920,120 H1200" />
            </circle>
            <circle className="data-dot delay-4" r="3">
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M200,0 V150 L220,170 V300" />
            </circle>
          </svg>

          {/* Grid overlay */}
          <div className="grid-overlay" />

          {/* Floating tech icons */}
          <div className="floating-icons">
            <div className="float-icon icon-1"><FiCpu /></div>
            <div className="float-icon icon-2"><FiDatabase /></div>
            <div className="float-icon icon-3"><FiServer /></div>
            <div className="float-icon icon-4"><FiCode /></div>
            <div className="float-icon icon-5"><FiWifi /></div>
          </div>
        </div>

        <div className="container hero-content">
          <div className="hero-layout">
            {/* Left side - Main content */}
            <div className="hero-left">
              <div className="hero-badge">
                <FiTerminal className="badge-icon" />
                <span>Build Real Hardware Projects</span>
                <span className="badge-pulse" />
              </div>

              <h1>
                Master <span className="text-gradient animated-gradient">Embedded</span>
                <br /><span className="text-gradient animated-gradient delay">Systems</span> & IoT
              </h1>

              <p className="hero-tagline">
                <span className="typing-text">&gt;</span> Connecting Knowledge. Powering Systems.
              </p>

              <p className="hero-description">
                From bare-metal programming to cloud-connected IoT devices.
                Learn to build smart energy monitoring systems with hands-on projects.
              </p>

              <div className="hero-buttons">
                <Link to="/courses" className="btn btn-primary btn-glow">
                  <FiTerminal /> Start Learning <FiArrowRight />
                </Link>
                <Link to="/about" className="btn btn-secondary btn-tech">
                  <FiCode /> View Projects
                </Link>
              </div>

              {/* Tech stack badges */}
              <div className="tech-stack">
                <span className="tech-badge">ESP32</span>
                <span className="tech-badge">ARM</span>
                <span className="tech-badge">MQTT</span>
                <span className="tech-badge">FreeRTOS</span>
                <span className="tech-badge">C/C++</span>
              </div>
            </div>

            {/* Right side - Terminal/Code display */}
            <div className="hero-right">
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="terminal-title">main.cpp — ESP32</span>
                </div>
                <div className="terminal-body">
                  <pre className="code-content">
                    <code>{typedCode}<span className="cursor">|</span></code>
                  </pre>
                </div>
                <div className="terminal-footer">
                  <span className="status-dot" />
                  <span>Connected to broker.io</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - Redesigned */}
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-icon"><FiCpu /></div>
              <div className="stat-content">
                <span className="stat-number">3</span>
                <span className="stat-label">Course Tracks</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon"><FiCode /></div>
              <div className="stat-content">
                <span className="stat-number">10+</span>
                <span className="stat-label">Tutorials</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon"><FiZap /></div>
              <div className="stat-content">
                <span className="stat-number">∞</span>
                <span className="stat-label">Projects</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="courses-preview section" ref={coursesRef}>
        <div className="container">
          <div className="section-header fade-in-up">
            <span className="section-tag"><FiTerminal /> Learning Paths</span>
            <h2 className="section-title">
              What You'll <span className="text-gradient">Build</span>
            </h2>
            <p className="section-subtitle">Choose your specialization and start building real-world projects</p>
          </div>
          <div className="courses-grid">
            {courses.map((course, index) => (
              <Link
                key={index}
                to={course.link}
                className={`course-card ${course.color} fade-in-up stagger-${index + 1}`}
              >
                <div className="card-glow" />
                <div className="card-circuit" />
                <div className="course-icon">
                  {course.icon}
                  <div className="icon-ring" />
                </div>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-tech">
                  {course.tech.map((tech, i) => (
                    <span key={i} className="tech-tag">{tech}</span>
                  ))}
                </div>
                <div className="card-footer">
                  <span className="explore-text">Explore track</span>
                  <FiArrowRight className="arrow-icon" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section" ref={ctaRef}>
        <div className="cta-bg">
          <div className="cta-circuit" />
          <div className="cta-glow" />
        </div>
        <div className="container">
          <div className="cta-content">
            <div className="cta-terminal fade-in-up">
              <span className="prompt">$</span>
              <span className="command">./start_learning</span>
              <span className="cursor-blink">_</span>
            </div>
            <h2 className="fade-in-up stagger-1">Ready to Build Something?</h2>
            <p className="fade-in-up stagger-2">
              Start your journey from blinking LEDs to cloud-connected smart devices.
            </p>
            <div className="cta-buttons fade-in-up stagger-3">
              <Link to="/courses" className="btn btn-primary btn-glow">
                <FiTerminal /> Get Started <FiArrowRight />
              </Link>
              <Link to="/about" className="btn btn-secondary btn-tech">
                <FiCode /> About Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
