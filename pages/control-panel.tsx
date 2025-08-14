"use client";

import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Users from "../components/Users";
import Departments from "../components/Departments";
import { useSelector } from "react-redux";
import { RootState } from "./../redux/store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Tags from "../components/Tags";

export default function ControlPanel() {
  //   const user = useSelector((state: RootState) => state.user.user);
  const loginUserState = useSelector((state: RootState) => state.loginUser) ?? {
    user: null,
    status: "idle",
    error: null,
  }; // safe fallback
  const { user } = loginUserState;
  const isAdmin = user?.role_id === "0";
  const router = useRouter();
  const { status } = useSession();

  // Set default active tab based on role
  const [activeTab, setActiveTab] = useState<"departments" | "users" | "tags">(
    isAdmin ? "departments" : "users"
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  return (
    <div className="container mt-5">
      <div className="card custom-card">
        <div className="card-header bg-primary text-white text-center">
          <h5 className="text-primary">Control Panel</h5>
        </div>
        <div className="card-body">
          <ul className="nav nav-tabs">
            {isAdmin && (
              <>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "departments" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("departments")}
                  >
                    Departments
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "tags" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("tags")}
                  >
                    Tags
                  </button>
                </li>
              </>
            )}
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "users" ? "active" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                Users
              </button>
            </li>
          </ul>

          <div className="mt-3">
            {/* Show Departments only if role_id === "0", otherwise show Users */}
            {activeTab === "departments" && isAdmin ? (
              <Departments />
            ) : activeTab === "tags" && isAdmin ? (
              <Tags />
            ) : (
              <Users />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
