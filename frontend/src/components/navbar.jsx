import React, { useContext, useState, useEffect } from "react";
import "./Navbar.css";
import { AuthContext } from "../contexts/AuthContext";

export default function Navbar({ onLogin, onRegister }) {
  const { userData, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        !event.target.closest(".nav-menu") &&
        !event.target.closest(".mobile-menu-toggle")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 480) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuItemClick = (callback) => {
    callback();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <div className="logo">
            <div className="logo-icon">📹</div>
            <span>VidLink Pro</span>
          </div>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>

        <div className={`nav-menu ${isMobileMenuOpen ? "active" : ""}`}>
          {userData ? (
            <>
              <span className="nav-user">
                Hello, {userData.name || userData.username}
              </span>
              <button
                className="btn-logout"
                onClick={() => handleMenuItemClick(logout)}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-login"
                onClick={() => handleMenuItemClick(onLogin)}
              >
                Log in
              </button>
              <button
                className="btn-signup"
                onClick={() => handleMenuItemClick(onRegister)}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
