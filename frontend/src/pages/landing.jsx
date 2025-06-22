import React, { useState } from "react";
import "../styles/LandingPage.css";
import Navbar from "../components/navbar";
import Authentication from "./authentication";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const navigate = useNavigate();

  const handleLogin = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthMode("register");
    setShowAuthModal(true);
  };

  const handleClose = () => setShowAuthModal(false);

  const handleStartCalling = () => {
    if (localStorage.getItem("token")) {
      navigate("/home");
    } else {
      handleLogin();
    }
  };

  return (
    <div className="landing-page">
      {/* Animated star background */}
      <div className="stars"></div>
      <div className="stars2"></div>
      <div className="stars3"></div>

      {/* Navigation */}
      <Navbar onLogin={handleLogin} onRegister={handleRegister} />

      {/* Authentication Modal */}
      {showAuthModal && (
        <Authentication mode={authMode} onClose={handleClose} />
      )}

      {/* Hero Section */}
      <main className="hero-section">

        <h1 className="hero-title">
          VidLink Pro is the new way
          <br />
          <span className="gradient-text">to connect globally.</span>
        </h1>

        <p className="hero-description">
          Crystal-clear video calls, seamless screen sharing, and built with
          <br />
          cutting-edge WebRTC technology, React, and intelligent algorithms.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={handleStartCalling}>
            Start Calling for free
            <span className="arrow">→</span>
          </button>
        </div>
      </main>
    </div>
  );
}
