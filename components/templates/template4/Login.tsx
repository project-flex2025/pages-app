"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { TemplateLoginProps } from "../index";

const Login: React.FC<TemplateLoginProps> = ({
  credential,
  setCredential,
  password,
  setPassword,
  isLoading,
  handleLogin,
  appData,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Safely extract data from appData
  const loginSideImage = appData?.["Login Side Image"]?.value || "/default-bg.jpg";
  const companyLogo = appData?.["Company Logo"]?.value || "/default-profile.png";
  const companyName = appData?.["Company Name"]?.value || "Your Company";

  return (
    <div
      className="container-fluid login-variant-4"
      style={{
        backgroundImage: `url(${loginSideImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      <div className="logo-section p-4">
        <Image
          src={companyLogo}
          alt="logo"
          width={150}
          height={50}
        />
      </div>

      <div className="container login-main-section">
        <div className="login-container">
          <h6 className="text-muted">
            Welcome to{" "}
            <span className="brand-name">
              {companyName}
            </span>
          </h6>
          <h2 className="login-head mb-4">Sign in</h2>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="mb-3 text-start mail-section">
              <label htmlFor="credential" className="form-label">
                Enter your username or email address
              </label>
              <input
                type="text"
                className="form-control"
                id="credential"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="Username or email address"
                disabled={isLoading}
              />
            </div>

            <div className="mb-2 text-start pass-section position-relative">
              <label htmlFor="password" className="form-label">
                Enter your password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control pe-5"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="btn btn-link position-absolute pass-hide end-0 top-50 translate-middle-y me-2"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEye : faEyeSlash}
                  className="text-dark"
                />
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
