import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import GroupIcon from "@mui/icons-material/Group";
import SecurityIcon from "@mui/icons-material/Security";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/navbar";
import "../styles/Home.css";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    if (meetingCode.trim()) {
      await addToUserHistory(meetingCode);
      navigate(`/${meetingCode}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleJoinVideoCall();
    }
  };

  const generateRandomCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setMeetingCode(randomCode);
  };

  return (
    <div className="home-container">
      <Navbar />

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Left Panel - Main Action */}
          <div className="left-panel">
            <div className="welcome-section">
              <h1 className="main-heading">
                Ready to Connect?
                <br />
                <span className="highlight-text">Start Your Meeting Now</span>
              </h1>

              <p className="description">
                Join colleagues, friends, and family in high-quality video
                calls. Experience seamless communication with enterprise-grade
                security.
              </p>

              <div className="meeting-input-section">
                <div className="input-group">
                  <TextField
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter meeting code or generate one"
                    variant="outlined"
                    className="meeting-input"
                    fullWidth
                  />
                  <Button
                    onClick={handleJoinVideoCall}
                    className="join-btn"
                    disabled={!meetingCode.trim()}
                    size="large"
                  >
                    Join Now
                  </Button>
                </div>

                <div className="action-buttons">
                  <Button
                    className="generate-btn"
                    onClick={generateRandomCode}
                    startIcon={<VideoCallIcon />}
                  >
                    Generate Code
                  </Button>
                  <Button
                    className="history-link-btn"
                    onClick={() => navigate("/history")}
                    startIcon={<RestoreIcon />}
                  >
                    Past Meetings
                  </Button>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="feature-cards">
              <div className="feature-card">
                <VideoCallIcon className="feature-icon" />
                <h3>HD Video Quality</h3>
                <p>Crystal clear video calls with adaptive quality</p>
              </div>
              <div className="feature-card">
                <GroupIcon className="feature-icon" />
                <h3>Team Collaboration</h3>
                <p>Perfect for team meetings and group discussions</p>
              </div>
              <div className="feature-card">
                <SecurityIcon className="feature-icon" />
                <h3>Secure & Private</h3>
                <p>End-to-end encryption for all your conversations</p>
              </div>
            </div>
          </div>

          {/* Right Panel - Visual Element */}
          <div className="right-panel">
            <div className="visual-container">
              <div className="connection-visual">
                <div className="user-node node-1">
                  <div className="avatar">👤</div>
                  <div className="pulse-ring"></div>
                </div>
                <div className="user-node node-2">
                  <div className="avatar">👥</div>
                  <div className="pulse-ring"></div>
                </div>
                <div className="user-node node-3">
                  <div className="avatar">🏢</div>
                  <div className="pulse-ring"></div>
                </div>
                <div className="connection-lines">
                  <div className="line line-1"></div>
                  <div className="line line-2"></div>
                  <div className="line line-3"></div>
                </div>
              </div>
              <div className="tagline-box">
                <h3>Where Distance Disappears</h3>
                <p>Bringing people together, one call at a time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
