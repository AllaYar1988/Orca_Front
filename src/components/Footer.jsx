import { Link } from 'react-router-dom';
import { TbNetwork } from 'react-icons/tb';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <Link to="/" className="footer-logo">
            <div className="logo-icon">
              <TbNetwork />
            </div>
            <span><span className="logo-myco">Myco</span><span className="logo-grid">Grid</span></span>
          </Link>
          <nav className="footer-nav">
            <Link to="/">Home</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>&copy; {currentYear} MycoGrid. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
