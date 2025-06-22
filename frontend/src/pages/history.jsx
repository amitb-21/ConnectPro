import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Snackbar, Alert, CircularProgress } from "@mui/material";
import "../styles/History.css";

export default function History() {
  const { getHistoryOfUser, addToUserHistory, deleteMeetingFromHistory } =
    useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to fetch meeting history",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setSnackbar({
      open: true,
      message: "Meeting code copied to clipboard!",
      severity: "success",
    });
  };

  const handleRejoinMeeting = async (meetingCode) => {
    await addToUserHistory(meetingCode);
    routeTo(`/${meetingCode}`);
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await deleteMeetingFromHistory(meetingId);
      setMeetings((prev) => prev.filter((m) => m._id !== meetingId));
      setSnackbar({
        open: true,
        message: "Meeting deleted successfully!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error || "Failed to delete meeting.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <IconButton
          className="history-back-btn"
          onClick={() => routeTo("/home")}
        >
          <HomeIcon />
        </IconButton>
        <h1 className="history-title">
          Past <span>Meetings</span>
        </h1>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your meeting history...</p>
          </div>
        ) : meetings.length > 0 ? (
          <div className="meetings-grid">
            {meetings.map((meeting, index) => (
              <Card key={index} className="meeting-card" variant="outlined">
                <CardContent className="meeting-card-content">
                  <Typography className="meeting-code" gutterBottom>
                    {meeting.meetingCode}
                  </Typography>
                  <Typography className="meeting-date">
                    {formatDate(meeting.date)} at {formatTime(meeting.date)}
                  </Typography>
                </CardContent>
                <CardActions className="meeting-actions">
                  <Button
                    className="rejoin-btn"
                    startIcon={<VideoCallIcon />}
                    onClick={() => handleRejoinMeeting(meeting.meetingCode)}
                  >
                    Rejoin
                  </Button>
                  <Button
                    className="copy-btn"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => handleCopyCode(meeting.meetingCode)}
                  >
                    Copy Code
                  </Button>
                  <IconButton
                    className="delete-btn"
                    color="error"
                    onClick={() => handleDeleteMeeting(meeting._id)}
                    aria-label="Delete meeting"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📹</div>
            <h3>No Past Meetings</h3>
            <p>
              Your meeting history will appear here once you start joining
              calls.
            </p>
          </div>
        )}
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
