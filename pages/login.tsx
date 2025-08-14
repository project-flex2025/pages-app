// import { signIn } from "next-auth/react";
// import { GetServerSideProps } from "next";
// import { useRouter } from "next/router";
// import { useState, useEffect } from "react";

// type LoginProps = {
//   csrfToken: string | null;
//   isAuthenticated: boolean;
// };

// export default function Login({ csrfToken, isAuthenticated }: LoginProps) {
//   const router = useRouter();
//   const [credential, setCredential] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [timeout, setTimeoutReached] = useState(false);

//   useEffect(() => {
//     const t = setTimeout(() => setTimeoutReached(true), 2000);
//     return () => clearTimeout(t);
//   }, []);

//   useEffect(() => {
//     if (isAuthenticated) {
//       router.replace("/dashboard");
//     }
//   }, [isAuthenticated, router]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorMsg("");

//     // Use absolute callbackUrl to stay on the current subdomain
//     const host = window.location.host;
//     const proto = window.location.protocol;
//     const callbackUrl = `${proto}//${host}/dashboard`;

//     const result = await signIn("credentials", {
//       redirect: false,
//       credential,
//       password,
//       callbackUrl,
//     });

//     setIsLoading(false);

//     if (result?.ok && result?.url) {
//       router.push(result.url);
//     } else {
//       setErrorMsg("Invalid username or password.");
//     }
//   };

//   if (!csrfToken && !timeout) {
//     return (
//       <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   if (!csrfToken && timeout) {
//     return (
//       <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white">
//         <p>
//           Failed to load authentication form.<br />
//           Please check your network or contact support.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="d-flex justify-content-center align-items-center min-vh-100"
//       style={{ backgroundColor: "#121212" }}
//     >
//       <div
//         className="card bg-dark text-white p-4 shadow-lg"
//         style={{ width: "100%", maxWidth: "400px" }}
//       >
//         <h2 className="text-center mb-4">Sign In</h2>
//         <form onSubmit={handleSubmit}>
//           <input
//             name="csrfToken"
//             type="hidden"
//             defaultValue={csrfToken ?? ""}
//           />

//           <div className="mb-3">
//             <label htmlFor="username" className="form-label">
//               Username
//             </label>
//             <input
//               id="username"
//               type="text"
//               className="form-control bg-dark text-white border-secondary"
//               value={credential}
//               onChange={(e) => setCredential(e.target.value)}
//               required
//             />
//           </div>

//           <div className="mb-3">
//             <label htmlFor="password" className="form-label">
//               Password
//             </label>
//             <input
//               id="password"
//               type="password"
//               className="form-control bg-dark text-white border-secondary"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>

//           {errorMsg && (
//             <div className="alert alert-danger py-2 text-center">
//               {errorMsg}
//             </div>
//           )}

//           <button
//             type="submit"
//             className="btn btn-outline-light w-100"
//             disabled={isLoading}
//           >
//             {isLoading ? "Signing in..." : "Sign In"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// // --- SSR: Fetch session and CSRF token directly from the correct host ---
// export const getServerSideProps: GetServerSideProps = async (context) => {
//   const host = context.req.headers.host;
//   const proto = context.req.headers["x-forwarded-proto"] || "https";
//   const baseUrl = `${proto}://${host}`;

//   // Fetch session directly
//   const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
//     headers: {
//       cookie: context.req.headers.cookie || "",
//     },
//   });
//   console.log("sessions",sessionRes);
//   const sessionJson = await sessionRes.json();
//   const isAuthenticated = !!(sessionJson && sessionJson.user);

//   if (isAuthenticated) {
//     return {
//       redirect: {
//         destination: "/dashboard",
//         permanent: false,
//       },
//     };
//   }

//   // Fetch CSRF token directly
//   const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {
//     headers: {
//       cookie: context.req.headers.cookie || "",
//     },
//   });
//   const csrfJson = await csrfRes.json();
//   const csrfToken = csrfJson.csrfToken || null;

//   return {
//     props: {
//       csrfToken,
//       isAuthenticated,
//     },
//   };
// };

// // login.tsx (simplified relevant parts)
// "use client";

// import React, { useEffect, useState, FormEvent } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { RootState, AppDispatch } from "../redux/store";
// import { templates, TemplateType } from "./components/templates";
// import { signIn, getSession } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { toast } from "react-toastify";
// import { fetchAppData } from "../redux/slices/appDataSlice";
// import { setUser } from "../redux/slices/userSlice";
// import { getFirstMenuPath } from "@/utils/userMenu";
// import { fetchUserAndAllowedMenus } from "../redux/slices/loginUserSlice";

// const LoginPage: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const router = useRouter();

//   const selectedTemplate = useSelector(
//     (state: RootState) => state.templateRef.selectedTemplate
//   ) as TemplateType;

//   const appData = useSelector((state: RootState) => state.appData.appData);
//   const loginUserState = useSelector((state: RootState) => state.loginUser);
//   const { status, error } = loginUserState ?? { status: "idle", error: null };

//   const templateExists = templates[selectedTemplate];
//   const LoginComponent = templates[selectedTemplate]?.Login;

//   const [credential, setCredential] = useState("");
//   const [password, setPassword] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [checkingSession, setCheckingSession] = useState(true);

//   // 🔹 1st effect: Always fetch appData on page load
//   useEffect(() => {
//     dispatch(fetchAppData());
//   }, [dispatch]);

//   // 🔹 2nd effect: Then check session/login flow
//   useEffect(() => {
//     const initSession = async () => {
//       try {
//         const session = await getSession();
//         console.log("session data from login page",session?.user?.id);
//         if (session?.user?.id) {
//           const actionResult = await dispatch(
//             fetchUserAndAllowedMenus(session.user.id)
//           );
//           if (fetchUserAndAllowedMenus.fulfilled.match(actionResult)) {
//             const userFromState = actionResult.payload.user;
//             dispatch(setUser(userFromState));
//             const allowedMenus = userFromState?.more_data?.user_permissions;
//             if (Array.isArray(allowedMenus) && allowedMenus.length > 0) {
//               const pathToRedirect = getFirstMenuPath(allowedMenus);
//               router.replace(pathToRedirect);
//               return;
//             }
//           }
//         }
//       } catch (err) {
//         console.error("Session check error:", err);
//       } finally {
//         setCheckingSession(false);
//       }
//     };

//     initSession();
//   }, [dispatch, router]);

//   const handleLogin = async (event: FormEvent) => {
//     event.preventDefault();
//     setIsLoading(true);

//     try {
//       const result = await signIn("credentials", {
//         redirect: false,
//         credential,
//         password,
//       });

//       if (result?.error) {
//         toast.error("Login failed: Invalid credentials", {
//           autoClose: 1000,
//           hideProgressBar: true,
//         });
//         return;
//       }

//       const session = await getSession();
//       const userId = session?.user?.id;
//       if (!userId) {
//         toast.error("Session error: No user ID found");
//         return;
//       }

//       const actionResult = await dispatch(fetchUserAndAllowedMenus(userId));
//       if (fetchUserAndAllowedMenus.fulfilled.match(actionResult)) {
//         const userFromState = actionResult.payload.user;
//         dispatch(setUser(userFromState));
//         const allowedMenus = userFromState?.more_data?.user_permissions;
//         if (Array.isArray(allowedMenus) && allowedMenus.length > 0) {
//           const pathToRedirect = getFirstMenuPath(allowedMenus);
//           router.push(pathToRedirect);
//         } else {
//           toast.error("No allowed menus found for this user");
//           router.push("/");
//         }
//       } else {
//         toast.error("Failed to load user data");
//         router.push("/");
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       toast.error("Login error occurred", {
//         autoClose: 1000,
//         hideProgressBar: true,
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (checkingSession) {
//     return <div>Checking session...</div>;
//   }
//   if (!templateExists) {
//     return <div className="container mt-5"><h3 className="text-danger">Invalid template selected!</h3></div>;
//   }
//   if (status === "loading") {
//     return <div>Loading user data...</div>;
//   }
//   if (status === "error") {
//     return <div className="text-danger">Error: {error}</div>;
//   }

//   return (
//     <LoginComponent
//       credential={credential}
//       setCredential={setCredential}
//       password={password}
//       setPassword={setPassword}
//       isLoading={isLoading}
//       handleLogin={handleLogin}
//       appData={appData}
//     />
//   );
// };

// export default LoginPage;

"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { templates, TemplateType } from "../components/templates";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { fetchAppData } from "../redux/slices/appDataSlice";
import { getFirstMenuPath } from "@/utils/userMenu";
import { fetchUserAndAllowedMenus } from "../redux/slices/loginUserSlice";

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const selectedTemplate = useSelector(
    (state: RootState) => state.templateRef.selectedTemplate
  ) as TemplateType;

  const appData = useSelector((state: RootState) => state.appData.appData);
  const loginUserState = useSelector((state: RootState) => state.loginUser);
  const { status, error, user } = loginUserState ?? {
    status: "idle",
    error: null,
    user: null,
  };

  const templateExists = templates[selectedTemplate];
  const LoginComponent = templates[selectedTemplate]?.Login;

  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // 1️⃣ Always fetch app data on load
  useEffect(() => {
    dispatch(fetchAppData());
  }, [dispatch]);

  // 2️⃣ Try to auto-login if session exists
  // useEffect(() => {
  //   const initSession = async () => {
  //     try {
  //       const session = await getSession();
  //       console.log("session data from login page", session?.user?.id);
  //       if (session?.user?.id) {
  //         const actionResult = await dispatch(
  //           fetchUserAndAllowedMenus(session.user.id)
  //         );
  //         if (fetchUserAndAllowedMenus.fulfilled.match(actionResult)) {
  //           const allowedMenus =
  //             actionResult.payload.user?.more_data?.user_permissions;
  //           if (Array.isArray(allowedMenus) && allowedMenus.length > 0) {
  //             const pathToRedirect = getFirstMenuPath(allowedMenus);
  //             router.replace(pathToRedirect);
  //             return;
  //           }
  //         }
  //       }
  //     } catch (err) {
  //       console.error("Session check error:", err);
  //     } finally {
  //       setCheckingSession(false);
  //     }
  //   };

  //   initSession();
  // }, [dispatch, router]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await getSession();
        if (session?.user?.id) {
          const actionResult = await dispatch(
            fetchUserAndAllowedMenus(session.user.id)
          );
          if (fetchUserAndAllowedMenus.fulfilled.match(actionResult)) {
            const allowedMenus =
              actionResult.payload.user?.more_data?.user_permissions;
            if (Array.isArray(allowedMenus) && allowedMenus.length > 0) {
              const pathToRedirect = getFirstMenuPath(allowedMenus);
              router.replace(pathToRedirect);
              return; // 🔹 Stop here, don't show login
            }
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setCheckingSession(false);
      }
    };

    initSession();
  }, [dispatch, router]);

  // 3️⃣ Handle manual login
  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        credential,
        password,
      });

      if (result?.error) {
        toast.error("Login failed: Invalid credentials", {
          autoClose: 1000,
          hideProgressBar: true,
        });
        return;
      }

      const session = await getSession();
      const userId = session?.user?.id;
      if (!userId) {
        toast.error("Session error: No user ID found");
        return;
      }

      const actionResult = await dispatch(fetchUserAndAllowedMenus(userId));
      if (fetchUserAndAllowedMenus.fulfilled.match(actionResult)) {
        const allowedMenus =
          actionResult.payload.user?.more_data?.user_permissions;
        if (Array.isArray(allowedMenus) && allowedMenus.length > 0) {
          const pathToRedirect = getFirstMenuPath(allowedMenus);
          router.push(pathToRedirect);
        } else {
          toast.error("No allowed menus found for this user");
          router.push("/");
        }
      } else {
        toast.error("Failed to load user data");
        router.push("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login error occurred", {
        autoClose: 1000,
        hideProgressBar: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // A reusable loading screen component
  const FullScreenLoader: React.FC<{ message: string }> = ({ message }) => {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#121212",
          color: "#fff",
        }}
      >
        <div className="spinner-border text-light mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4>{message}</h4>
      </div>
    );
  };

  // 1. Show fullscreen loader while checking session
  if (checkingSession || status === "loading") {
    return <FullScreenLoader message="Getting things ready for you..." />;
  }

  // 2. If user already logged in (status succeeded + user exists) → skip login page
  if (status === "succeeded" && loginUserState.user) {
    return null; // Nothing because router.replace() will trigger navigation
  }

  if (!templateExists) {
    return (
      <div className="container mt-5">
        <h3 className="text-danger">Invalid template selected!</h3>
      </div>
    );
  }

  if (status === "error") {
    return <div className="text-danger">Error: {error}</div>;
  }

  // 5️⃣ Render the login UI
  return (
    <LoginComponent
      credential={credential}
      setCredential={setCredential}
      password={password}
      setPassword={setPassword}
      isLoading={isLoading}
      handleLogin={handleLogin}
      appData={appData}
    />
  );
};

export default LoginPage;
