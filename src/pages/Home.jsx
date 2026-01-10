import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiCpu, FiWifi, FiZap, FiArrowRight, FiActivity } from 'react-icons/fi';
import './Home.css';

function Home() {
  const coursesRef = useRef(null);
  const ctaRef = useRef(null);

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
      description: 'Learn microcontroller programming and hardware interfaces.',
      color: 'green',
      link: '/category/embedded-systems'
    },
    {
      icon: <FiWifi />,
      title: 'IoT Development',
      description: 'Build connected devices with cloud integration.',
      color: 'blue',
      link: '/category/iot'
    },
    {
      icon: <FiZap />,
      title: 'Energy Monitoring',
      description: 'Design smart energy metering systems.',
      color: 'orange',
      link: '/category/energy-monitoring'
    }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        {/* Animated Background - Mycelium Network */}
        <div className="hero-bg">
          {/* Mycelium Network SVG */}
          <svg className="mycelium-svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
            {/* Central hub - bottom center, growing upward like roots */}

            {/* Main trunk branches from center */}
            <path className="mycelium-branch" d="M600,600 Q580,500 550,400 Q520,300 480,200" />
            <path className="mycelium-branch delay-1" d="M600,600 Q620,480 680,380 Q740,280 800,180" />
            <path className="mycelium-branch delay-2" d="M600,600 Q550,520 450,450 Q350,380 250,320" />
            <path className="mycelium-branch delay-3" d="M600,600 Q650,510 750,440 Q850,370 950,300" />

            {/* Secondary branches - left side */}
            <path className="mycelium-branch delay-2" d="M480,200 Q420,150 350,120" />
            <path className="mycelium-branch delay-3" d="M480,200 Q500,140 520,80" />
            <path className="mycelium-branch delay-4" d="M550,400 Q480,380 400,360" />
            <path className="mycelium-branch delay-5" d="M550,400 Q520,340 480,280" />
            <path className="mycelium-branch delay-3" d="M450,450 Q380,420 300,400" />
            <path className="mycelium-branch delay-4" d="M250,320 Q180,280 100,260" />
            <path className="mycelium-branch delay-5" d="M250,320 Q220,250 180,180" />

            {/* Secondary branches - right side */}
            <path className="mycelium-branch delay-3" d="M800,180 Q860,140 920,100" />
            <path className="mycelium-branch delay-4" d="M800,180 Q780,120 760,60" />
            <path className="mycelium-branch delay-5" d="M680,380 Q720,340 780,300" />
            <path className="mycelium-branch delay-2" d="M680,380 Q740,420 820,440" />
            <path className="mycelium-branch delay-3" d="M750,440 Q820,400 900,380" />
            <path className="mycelium-branch delay-4" d="M950,300 Q1020,260 1100,240" />
            <path className="mycelium-branch delay-5" d="M950,300 Q980,220 1000,140" />

            {/* Tertiary fine branches */}
            <path className="mycelium-fine delay-1" d="M350,120 Q300,100 240,90" />
            <path className="mycelium-fine delay-2" d="M350,120 Q340,80 320,40" />
            <path className="mycelium-fine delay-3" d="M400,360 Q350,340 290,330" />
            <path className="mycelium-fine delay-4" d="M300,400 Q260,360 220,340" />
            <path className="mycelium-fine delay-5" d="M100,260 Q60,240 20,230" />
            <path className="mycelium-fine delay-1" d="M920,100 Q980,70 1040,50" />
            <path className="mycelium-fine delay-2" d="M920,100 Q940,60 950,20" />
            <path className="mycelium-fine delay-3" d="M900,380 Q960,360 1020,350" />
            <path className="mycelium-fine delay-4" d="M820,440 Q880,460 940,470" />
            <path className="mycelium-fine delay-5" d="M1100,240 Q1150,220 1200,210" />

            {/* Connection nodes - where branches meet */}
            <circle className="mycelium-node" cx="600" cy="600" r="8" />
            <circle className="mycelium-node delay-1" cx="480" cy="200" r="5" />
            <circle className="mycelium-node delay-2" cx="800" cy="180" r="5" />
            <circle className="mycelium-node delay-3" cx="550" cy="400" r="4" />
            <circle className="mycelium-node delay-4" cx="680" cy="380" r="4" />
            <circle className="mycelium-node delay-5" cx="450" cy="450" r="4" />
            <circle className="mycelium-node delay-1" cx="750" cy="440" r="4" />
            <circle className="mycelium-node delay-2" cx="250" cy="320" r="4" />
            <circle className="mycelium-node delay-3" cx="950" cy="300" r="4" />
            <circle className="mycelium-node delay-4" cx="350" cy="120" r="3" />
            <circle className="mycelium-node delay-5" cx="920" cy="100" r="3" />
            <circle className="mycelium-node delay-1" cx="400" cy="360" r="3" />
            <circle className="mycelium-node delay-2" cx="780" cy="300" r="3" />
            <circle className="mycelium-node delay-3" cx="300" cy="400" r="3" />
            <circle className="mycelium-node delay-4" cx="900" cy="380" r="3" />
            <circle className="mycelium-node delay-5" cx="100" cy="260" r="3" />
            <circle className="mycelium-node delay-1" cx="1100" cy="240" r="3" />
          </svg>

          {/* Floating particles */}
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`} />
            ))}
          </div>

          {/* Data flow lines */}
          <div className="data-flow">
            <div className="data-pulse pulse-1" />
            <div className="data-pulse pulse-2" />
            <div className="data-pulse pulse-3" />
          </div>
        </div>

        <div className="container hero-content">
          <div className="hero-badge">
            <FiActivity className="badge-icon" />
            <span>Learn by Building Real Projects</span>
          </div>
          <h1>
            Learn <span className="text-gradient animated-gradient">Embedded Systems</span>
            <br />& <span className="text-gradient animated-gradient delay">Smart Energy</span>
          </h1>
          <p className="hero-tagline">Connecting Knowledge. Powering Systems.</p>
          <p className="hero-description">
            Like mycorrhiza networks that connect forests underground, we connect you
            to the world of embedded systems, IoT, and micro-grid technology.
          </p>
          <div className="hero-buttons">
            <Link to="/courses" className="btn btn-primary btn-glow">
              View Courses <FiArrowRight />
            </Link>
            <Link to="/about" className="btn btn-secondary">
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">3</span>
              <span className="stat-label">Course Topics</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-number">10+</span>
              <span className="stat-label">Tutorials</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-number">∞</span>
              <span className="stat-label">Projects to Build</span>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="courses-preview section" ref={coursesRef}>
        <div className="container">
          <h2 className="section-title fade-in-up">
            What We <span className="text-gradient">Teach</span>
          </h2>
          <div className="courses-grid">
            {courses.map((course, index) => (
              <Link
                key={index}
                to={course.link}
                className={`course-card ${course.color} fade-in-up stagger-${index + 1}`}
              >
                <div className="card-glow" />
                <div className="course-icon">
                  {course.icon}
                  <div className="icon-pulse" />
                </div>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="card-arrow">
                  <FiArrowRight />
                </div>
              </Link>
            ))}
          </div>
          <div className="courses-cta">
            <Link to="/courses" className="btn btn-primary">
              Explore All Courses <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section" ref={ctaRef}>
        <div className="cta-bg">
          <div className="cta-grid" />
        </div>
        <div className="container">
          <div className="cta-icon fade-in-up">
            <FiZap />
          </div>
          <h2 className="fade-in-up stagger-1">Ready to Start Learning?</h2>
          <p className="fade-in-up stagger-2">Join us and build real-world embedded and IoT solutions.</p>
          <Link to="/contact" className="btn btn-primary btn-glow fade-in-up stagger-3">
            Get in Touch <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
