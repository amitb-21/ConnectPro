import axios from "axios";
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );

  useEffect(() => {
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [userData, token]);

  const handleRegister = async (name, username, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/user/register`, {
        name,
        username,
        password,
      });
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || "Registration failed.";
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/user/login`, {
        username,
        password,
      });
      setToken(res.data.token);
      setUserData(res.data.user);
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || "Login failed.";
    }
  };

  const getHistoryOfUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/user/get_all_activity`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to fetch history.";
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      const res = await axios.post(
        `${API_URL}/auth/user/add_to_activity`,
        { meetingCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (error) {
      throw (
        error.response?.data?.message || "Failed to add meeting to history."
      );
    }
  };

  const deleteMeetingFromHistory = async (meetingId) => {
    try {
      const res = await axios.delete(
        `${API_URL}/auth/user/delete_meeting/${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || "Failed to delete meeting.";
    }
  };

  const logout = () => {
    setUserData(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const value = {
    userData,
    setUserData,
    token,
    handleRegister,
    handleLogin,
    getHistoryOfUser,
    addToUserHistory,
    deleteMeetingFromHistory,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
