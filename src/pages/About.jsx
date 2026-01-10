import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import './About.css';

function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1>About <span className="text-gradient">MycoGrid</span></h1>
          <p>Empowering engineers with practical embedded systems education</p>
        </div>
      </section>

      <section className="about-content section">
        <div className="container">
          <div className="about-grid">
            <div className="about-text">
              <h2>Our Mission</h2>
              <p>
                MycoGrid is dedicated to providing practical, hands-on education
                in embedded systems, IoT development, and energy monitoring.
              </p>
              <p>
                We believe in learning by doing. Our courses focus on real-world
                projects that you can build and apply in your own work.
              </p>
              <p>
                Whether you're a student, hobbyist, or professional engineer,
                we're here to help you master these essential technologies.
              </p>
            </div>

            <div className="contact-card">
              <h3>Contact Us</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <FiMail />
                  <span>contact@myco-grid.com</span>
                </div>
                <div className="contact-item">
                  <FiMapPin />
                  <span>Online Platform</span>
                </div>
              </div>
              <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                <input type="text" placeholder="Your Name" required />
                <input type="email" placeholder="Your Email" required />
                <textarea placeholder="Your Message" rows="4" required></textarea>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
