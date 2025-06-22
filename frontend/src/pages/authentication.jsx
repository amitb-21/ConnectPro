import React, { useState, useEffect, useContext } from "react";
import { z } from "zod";
import "../styles/authentication.css";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Authentication({ mode = "login", onClose }) {
  const { handleLogin, handleRegister } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(mode === "login");
  }, [mode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const schema = isLogin ? loginSchema : registerSchema;
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    try {
      if (isLogin) {
        await handleLogin(form.username, form.password);
        navigate("/home");
        onClose && onClose();
      } else {
        await handleRegister(form.name, form.username, form.password);
        alert("Registration successful! Please log in.");
        setIsLogin(true);
        setForm({ name: "", username: "", password: "" });
      }
    } catch (err) {
      setApiError(err);
    }
  };

  return (
    <>
      <div className="auth-overlay" onClick={onClose}></div>
      <div className="auth-container">
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "#9ca3af",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          ×
        </button>
        <h2>{isLogin ? "Login" : "Register"}</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <div className="error">{errors.name}</div>}
            </div>
          )}
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
            />
            {errors.username && <div className="error">{errors.username}</div>}
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <div className="error">{errors.password}</div>}
          </div>
          {apiError && <div className="error">{apiError}</div>}
          <button type="submit">{isLogin ? "Login" : "Register"}</button>
        </form>
        <div style={{ marginTop: 16 }}>
          {isLogin ? (
            <span>
              Don't have an account?{" "}
              <button onClick={() => setIsLogin(false)} className="switch-btn">
                Register
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button onClick={() => setIsLogin(true)} className="switch-btn">
                Login
              </button>
            </span>
          )}
        </div>
      </div>
    </>
  );
}
