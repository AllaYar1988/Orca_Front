import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { TbNetwork } from 'react-icons/tb';
import './Navbar.css';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <div className="logo-icon">
            <TbNetwork />
          </div>
          <span className="logo-text">
            <span className="logo-myco">Myco</span>
            <span className="logo-grid">Grid</span>
          </span>
        </Link>

        <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        <ul className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <li>
            <NavLink to="/" onClick={closeMenu}>Home</NavLink>
          </li>
          <li>
            <NavLink to="/courses" onClick={closeMenu}>Courses</NavLink>
          </li>
          <li>
            <NavLink to="/about" onClick={closeMenu}>About</NavLink>
          </li>
          <li className="navbar-cta">
            <Link to="/contact" className="btn btn-primary" onClick={closeMenu}>
              Contact
            </Link>
          </li>
          <li className="navbar-cta">
            <Link to="/iot/login" className="btn btn-secondary" onClick={closeMenu}>
              IoT Login
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
