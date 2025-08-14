"use client";

import React, { useState, useEffect } from "react";
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

  const isExternal = (url: string) => /^https?:\/\//.test(url);

  // ✅ Safe defaults
  const rawCompanyLogo =
    appData?.["Company Logo"]?.value && typeof appData?.["Company Logo"]?.value === "string"
      ? appData["Company Logo"].value
      : "/default-profile.png";

  const rawSideImage =
    appData?.["Login Side Image"]?.value && typeof appData?.["Login Side Image"]?.value === "string"
      ? appData["Login Side Image"].value
      : "/default-side.png";

  const companyName = appData?.["Company Name"]?.value || "Your Company";
  const caption = appData?.["Caption"]?.value || "Welcome! Please login to continue.";

  const [companyLogo, setCompanyLogo] = useState(rawCompanyLogo);
  const [sideImage, setSideImage] = useState(rawSideImage);

  useEffect(() => {
    const versionedLogo = isExternal(rawCompanyLogo)
      ? `${rawCompanyLogo}?v=${Date.now()}`
      : rawCompanyLogo;
    const versionedSideImage = isExternal(rawSideImage)
      ? `${rawSideImage}?v=${Date.now()}`
      : rawSideImage;

    setCompanyLogo(versionedLogo);
    setSideImage(versionedSideImage);
  }, [rawCompanyLogo, rawSideImage]);

  return (
    <div className="container-fluid login-variant-2">
      <div className="login-container">
        <div className="row justify-content-center">
          {/* Left login form */}
          <div className="col-lg-6 col-md-12 d-flex justify-content-center">
            <div className="login-section">
              <div className="logo-section">
                {/* ✅ Only render if valid */}
                {companyLogo && (
                  <Image
                    src={companyLogo}
                    alt="login logo"
                    width={160}
                    height={80}
                    unoptimized={isExternal(companyLogo)}
                  />
                )}
              </div>

              <div className="login-content-section">
                <h3 className="login-head">Sign in</h3>
                <p className="login-title">{companyName}</p>
                <p className="login-caption">{caption}</p>

                <form className="login-form" onSubmit={handleLogin}>
                  <div className="mb-3 mail-section text-start">
                    <label className="form-label mb-2">Username</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fa-regular fa-envelope"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={credential}
                        onChange={(e) => setCredential(e.target.value)}
                        placeholder="Enter Username"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="mb-3 pass-section position-relative text-start">
                    <label className="form-label mb-2">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fa-solid fa-lock"></i>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control pe-5"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute pass-hide end-0 translate-middle-y me-2"
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
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="remember-check-box">
                      <input type="checkbox" id="remember" />
                      <label htmlFor="remember" className="remember">
                        Remember me
                      </label>
                    </div>
                    <a href="#" className="forgot-password-link">
                      Forgot Password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn login-btn w-100"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right side image */}
          <div className="col-lg-6 col-md-12 login-right-section">
            <div className="login-img-section">
              {sideImage && (
                <Image
                  src={sideImage}
                  className="login-img"
                  alt="login-img"
                  width={600}
                  height={500}
                  unoptimized={isExternal(sideImage)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
