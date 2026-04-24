import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
        });
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8080/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        showMessage("success", "Profile updated successfully!");
      } else {
        const err = await response.json();
        showMessage("error", err.detail || "Failed to update profile");
      }
    } catch (err) {
      showMessage("error", "Error updating profile");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage("error", "Passwords do not match");
      return;
    }
    if (passwordData.new_password.length < 6) {
      showMessage("error", "Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ new_password: passwordData.new_password }),
      });

      if (response.ok) {
        showMessage("success", "Password updated successfully!");
        setPasswordData({ new_password: "", confirm_password: "" });
      } else {
        const err = await response.json();
        showMessage("error", err.detail || "Failed to update password");
      }
    } catch (err) {
      showMessage("error", "Error updating password");
    }
  };

  const handleRetakeAssessment = () => {
    navigate("/risk_profile");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fin-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-fin-text-variant hover:text-fin-text-main text-sm font-medium mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg> Back to Dashboard
        </button>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-fin-surface rounded-lg p-6 fin-shadow-sm border border-fin-outline-variant text-center">
            <div className="w-20 h-20 mx-auto bg-fin-primary rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">
                {getInitials(user?.name)}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-fin-text-main">{user?.name}</h2>
            <p className="text-sm text-fin-text-variant">{user?.email}</p>
            {user?.has_risk_profile && (
              <span className="inline-block mt-3 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                Risk Profile Complete
              </span>
            )}
          </div>

          <div className="bg-fin-surface rounded-lg p-6 fin-shadow-sm border border-fin-outline-variant">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-fin-surface-low rounded-lg">
                <svg className="w-5 h-5 text-fin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h3 className="text-base font-semibold text-fin-text-main">
                Personal Details
              </h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-fin-text-variant mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-fin-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-fin-primary focus:border-transparent text-fin-text-main text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fin-text-variant mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-fin-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-fin-primary focus:border-transparent text-fin-text-main text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-fin-primary text-white rounded-md text-sm font-medium hover:bg-fin-primary-container transition-colors"
              >
                Save Changes
              </button>
            </form>
          </div>

          <div className="bg-fin-surface rounded-lg p-6 fin-shadow-sm border border-fin-outline-variant">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-fin-surface-low rounded-lg">
                <svg className="w-5 h-5 text-fin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="text-base font-semibold text-fin-text-main">Security</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-fin-text-variant mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-fin-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-fin-primary focus:border-transparent text-fin-text-main text-sm"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fin-text-variant mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-fin-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-fin-primary focus:border-transparent text-fin-text-main text-sm"
                  placeholder="Re-enter password"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-fin-primary text-white rounded-md text-sm font-medium hover:bg-fin-primary-container transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>

          <div className="bg-fin-surface rounded-lg p-6 fin-shadow-sm border border-fin-outline-variant">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-fin-surface-low rounded-lg">
                <svg className="w-5 h-5 text-fin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="text-base font-semibold text-fin-text-main">
                Risk Assessment
              </h3>
            </div>

            <p className="text-sm text-fin-text-variant mb-4">
              Retake your risk assessment to update your investment
              recommendations and savings targets.
            </p>

            <button
              onClick={handleRetakeAssessment}
              className="px-4 py-2 bg-fin-primary text-white rounded-md text-sm font-medium hover:bg-fin-primary-container transition-colors"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;