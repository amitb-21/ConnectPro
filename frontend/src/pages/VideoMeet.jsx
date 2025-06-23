import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { Badge, IconButton } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import styles from "../styles/VideoMeet.module.css";
import withAuth from "../utils/withAuth";

const server_url = import.meta.env.VITE_API_URL;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const VideoMeetComponent = () => {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(false); // Start with video off
  let [audio, setAudio] = useState(false); // Start with audio off
  let [screen, setScreen] = useState(false);
  let [showModal, setModal] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState(false);
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  let [previewStream, setPreviewStream] = useState(null);

  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);

  // Get actual video count by filtering videos with valid streams
  const activeVideos = videos.filter(
    (video) => video.stream && video.stream.active
  );
  const actualParticipantCount = activeVideos.length + 1; // +1 for local video

  // Mobile-friendly grid calculation (2 videos per row)
  const getGridDimensions = (count) => {
    const cols = 2; // Always 2 columns for mobile-like layout
    const rows = Math.ceil(count / 2);
    return { cols, rows };
  };

  const { cols, rows } = getGridDimensions(actualParticipantCount);

  useEffect(() => {
    getPermissions();
  }, []);

  // Reset newMessages when modal is opened
  useEffect(() => {
    if (showModal) {
      setNewMessages(0);
    }
  }, [showModal]);

  // Add preview stream setup
  const setupPreviewStream = async () => {
    try {
      if (videoAvailable) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false, // Don't need audio for preview
        });
        setPreviewStream(stream);
        if (localVideoref.current) {
          localVideoref.current.srcObject = stream;
        }
      }
    } catch (error) {
      // Silent error handling
    }
  };

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .catch((e) => {});
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        // Stop the test stream
        videoPermission.getTracks().forEach((track) => track.stop());
        // Setup preview stream after getting permissions
        setupPreviewStream();
      } else {
        setVideoAvailable(false);
      }
    } catch (error) {
      setVideoAvailable(false);
    }

    try {
      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        // Stop the test stream
        audioPermission.getTracks().forEach((track) => track.stop());
      } else {
        setAudioAvailable(false);
      }
    } catch (error) {
      setAudioAvailable(false);
    }

    if (navigator.mediaDevices.getDisplayMedia) {
      setScreenAvailable(true);
    } else {
      setScreenAvailable(false);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  let getMedia = () => {
    // Stop preview stream before starting actual stream
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
      setPreviewStream(null);
    }

    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      // Silent error handling
    }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    // Update all peer connections with new stream
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      // Remove old tracks
      const senders = connections[id].getSenders();
      senders.forEach((sender) => {
        if (sender.track) {
          connections[id].removeTrack(sender);
        }
      });

      // Add new stream
      stream.getTracks().forEach((track) => {
        connections[id].addTrack(track, stream);
      });

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => {});
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            // Silent error handling
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          if (localVideoref.current) {
            localVideoref.current.srcObject = window.localStream;
          }

          for (let id in connections) {
            // Remove old tracks
            const senders = connections[id].getSenders();
            senders.forEach((sender) => {
              if (sender.track) {
                connections[id].removeTrack(sender);
              }
            });

            // Add black silence
            window.localStream.getTracks().forEach((track) => {
              connections[id].addTrack(track, window.localStream);
            });

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => {});
            });
          }
        })
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({
          video: video && videoAvailable,
          audio: audio && audioAvailable,
        })
        .then(getUserMediaSuccess)
        .catch((e) => {
          // If getUserMedia fails, create black silence
          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          getUserMediaSuccess(blackSilence());
        });
    } else {
      // Create black silence when both video and audio are off
      let blackSilence = (...args) =>
        new MediaStream([black(...args), silence()]);
      getUserMediaSuccess(blackSilence());
    }
  };

  let getDislayMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      // Silent error handling
    }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      // Remove old tracks
      const senders = connections[id].getSenders();
      senders.forEach((sender) => {
        if (sender.track) {
          connections[id].removeTrack(sender);
        }
      });

      // Add new stream
      stream.getTracks().forEach((track) => {
        connections[id].addTrack(track, stream);
      });

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => {});
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            // Silent error handling
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          if (localVideoref.current) {
            localVideoref.current.srcObject = window.localStream;
          }

          getUserMedia();
        })
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => {});
                })
                .catch((e) => {});
            }
          })
          .catch((e) => {});
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => {});
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => {
          const updatedVideos = videos.filter((video) => video.socketId !== id);
          return updatedVideos;
        });
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          // Only create connection if it doesn't exist
          if (!connections[socketListId]) {
            connections[socketListId] = new RTCPeerConnection(
              peerConfigConnections
            );

            connections[socketListId].onicecandidate = function (event) {
              if (event.candidate != null) {
                socketRef.current.emit(
                  "signal",
                  socketListId,
                  JSON.stringify({ ice: event.candidate })
                );
              }
            };

            connections[socketListId].ontrack = (event) => {
              // Check if video already exists in state
              setVideos((prevVideos) => {
                const existingVideoIndex = prevVideos.findIndex(
                  (video) => video.socketId === socketListId
                );

                if (existingVideoIndex !== -1) {
                  // Update existing video
                  const updatedVideos = [...prevVideos];
                  updatedVideos[existingVideoIndex] = {
                    ...updatedVideos[existingVideoIndex],
                    stream: event.streams[0],
                  };
                  videoRef.current = updatedVideos;
                  return updatedVideos;
                } else {
                  // Add new video
                  const newVideo = {
                    socketId: socketListId,
                    stream: event.streams[0],
                    autoplay: true,
                    playsinline: true,
                  };
                  const updatedVideos = [...prevVideos, newVideo];
                  videoRef.current = updatedVideos;
                  return updatedVideos;
                }
              });
            };

            if (
              window.localStream !== undefined &&
              window.localStream !== null
            ) {
              window.localStream.getTracks().forEach((track) => {
                connections[socketListId].addTrack(track, window.localStream);
              });
            } else {
              let blackSilence = (...args) =>
                new MediaStream([black(...args), silence()]);
              window.localStream = blackSilence();
              window.localStream.getTracks().forEach((track) => {
                connections[socketListId].addTrack(track, window.localStream);
              });
            }
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              if (window.localStream) {
                window.localStream.getTracks().forEach((track) => {
                  connections[id2].addTrack(track, window.localStream);
                });
              }
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => {});
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      if (localVideoref.current && localVideoref.current.srcObject) {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    } catch (e) {}

    // Clean up preview stream if it exists
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    Object.keys(connections).forEach(id => {
      if (connections[id]) {
        connections[id].close();
        delete connections[id];
      }
    });
    navigate("/home", { replace: true });
  };

    navigate("/home", { replace: true });
  };

  let openChat = () => {
    setModal(true);

  };

  let closeChat = () => {
    setModal(false);
  };

  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    // Only increment newMessages if chat is closed and message is from another user
    if (!showModal && socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername === true ? (
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyContent}>
            <h2>Enter into Lobby</h2>
            <div className={styles.usernameInput}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <button onClick={connect} className={styles.connectButton}>
              Connect
            </button>
            <div className={styles.previewVideo}>
              <video ref={localVideoref} autoPlay muted playsInline></video>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {/* Chat Modal */}
          {showModal && (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                  <h1>Chat</h1>
                  <IconButton
                    onClick={closeChat}
                    className={styles.closeButton}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>

                <div className={styles.chattingDisplay}>
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div style={{ marginBottom: "20px" }} key={index}>
                          <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <input
                    type="text"
                    placeholder="Enter Your chat"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      flex: 1,
                      background: "rgba(55, 65, 81, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      color: "#ffffff",
                      fontSize: "0.9rem",
                    }}
                  />
                  <button onClick={sendMessage} className={styles.sendButton}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} className={styles.controlButton}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton
              onClick={handleEndCall}
              className={styles.endCallButton}
            >
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} className={styles.controlButton}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            {screenAvailable === true && (
              <IconButton
                onClick={handleScreen}
                className={styles.controlButton}
              >
                {screen === true ? (
                  <StopScreenShareIcon />
                ) : (
                  <ScreenShareIcon />
                )}
              </IconButton>
            )}
            <Badge badgeContent={newMessages} max={999} color="error">
              <IconButton
                onClick={() => setModal(!showModal)}
                className={styles.controlButton}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          {/* Mobile-Friendly Video Grid (2 columns) */}
          <div
            className={styles.dynamicVideoGrid}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {/* Always show local video first */}
            <div className={styles.videoGridItem}>
              <video
                className={styles.participantVideo}
                ref={localVideoref}
                autoPlay
                muted
                playsInline
              />
              <div className={styles.participantLabel}>
                {username || "You"} (You)
              </div>
            </div>

            {/* Show only active remote videos */}
            {activeVideos.map((video, index) => (
              <div key={video.socketId} className={styles.videoGridItem}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className={styles.participantVideo}
                />
                <div className={styles.participantLabel}>
                  Participant {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(VideoMeetComponent);
