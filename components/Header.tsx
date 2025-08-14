"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { User, Department } from "@/types/user";
import ThemeSwitcher from "./ThemeSwitcher";
import { decompressJson } from "@/utils/decompress";
import TempSwitcher from "./TempSwitcher";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { clearLoginUser } from "../redux/slices/loginUserSlice";

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarMinimized: boolean;
}

export default function Header({
  toggleSidebar,
  isSidebarMinimized,
}: HeaderProps) {
  const dispatch = useDispatch();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // const loginUser = useSelector(
  //   (state: RootState) => state.user.user
  // ) as User | null;

  const loginUserState = useSelector((state: RootState) => state.loginUser) ?? {
    user: null,
    status: "idle",
    error: null,
  }; // safe fallback

  const { user } = loginUserState;

  const router = useRouter();
  const { status } = useSession();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userRole, setUserRole] = useState<{ id: number; name: string } | null>(
    null
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  // const [loggingOut, setLoggingOut] = useState(false);

  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>(
    []
  );

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const fetchConfigurationData = async () => {
    try {
      const response = await fetch("/api/sub_proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-TYPE": "search",
        },
        body: JSON.stringify({
          conditions: [
            {
              field: "feature_name",
              search_type: "exact",
            },
            {
              field: "record_id",
              value: "control_panel",
              search_type: "exact",
            },
          ],
          combination_type: "and",
          dataset: "features",
        }),
      });

      const result = await response.json();

      if (result.total_results > 0 && result.data.length > 0) {
        const { more_data } = result.data[0];

        // Process departments (base64 decoded)
        if (more_data?.configuration?.departments) {
          try {
            const decodedDeptsString = decompressJson(
              more_data.configuration.departments
            );

            const departmentsArray = decodedDeptsString
              ? decodedDeptsString
              : [];
            // console.log("data 3", departmentsArray);
            setDepartments(departmentsArray);
          } catch (decodeError) {
            console.error("Error decoding departments data:", decodeError);
          }
        }

        // Process user roles (find role matching loginUser.role_id)
        if (more_data?.configuration?.userroles) {
          try {
            const decodedRolesString = decompressJson(
              more_data.configuration.userroles
            );
            const allRoles = decodedRolesString ? decodedRolesString : [];

            // Find the role matching the logged-in user's role_id
            if (user && user.role_id !== undefined && user.role_id !== null) {
              const matchedRole = allRoles.find(
                (role: { id: number }) => role.id === Number(user.role_id)
              );
              setUserRole(matchedRole || null);
            } else {
              setUserRole(null);
            }
          } catch (decodeError) {
            console.error("Error decoding user roles data:", decodeError);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching configuration data:", error);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (user && "dep_id" in user && user.dep_id && departments.length > 0) {
      const userDeptIds = Array.isArray(user.dep_id)
        ? user.dep_id
        : [user.dep_id];
      const filtered = departments.filter((dept) =>
        userDeptIds.includes(dept.id)
      );
      setFilteredDepartments(filtered);
    }
  }, [user, departments]);

  useEffect(() => {
    fetchConfigurationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    // setLoggingOut(true);
    // dispatch(clearLoginUser()); // immediately clear redux
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  // if (loggingOut) {
  //   return (
  //     <div
  //       style={{
  //         minHeight: "100vh",
  //         display: "flex",
  //         justifyContent: "center",
  //         alignItems: "center",
  //         background: "#121212",
  //         color: "#fff",
  //         zIndex:1009,
  //       }}
  //     >
  //       <div className="spinner-border text-light me-2" style={{zIndex:1009}} role="status" />
  //       <span>Signing you out...</span>
  //     </div>
  //   );
  // }

  const profile = user?.profile_information?.profile_pic;

  console.log("filteredDepartments", filteredDepartments);

  return (
    <div className="main-header" ref={dropdownRef}>
      <div className="main-header-logo">
        <div className="logo-header">
          <div className="nav-toggle">
            <button
              className="btn btn-toggle toggle-sidebar"
              onClick={toggleSidebar}
            >
              <i
                className={`fa-solid ${
                  isSidebarMinimized ? "fa-chevron-right" : "fa-chevron-left"
                }`}
              ></i>
            </button>
          </div>
        </div>
      </div>
      <nav className="navbar navbar-header navbar-header-transparent navbar-expand-lg">
        <div className="container-fluid">
          <nav className="navbar navbar-header-left navbar-expand-lg navbar-form nav-search p-0 d-none d-lg-flex">
            {/* Search content */}
          </nav>

          <ul className="navbar-nav topbar-nav ms-md-auto align-items-center">
            <li className="nav-item topbar-user dropdown hidden-caret">
              <Link
                className="dropdown-toggle profile-pic"
                data-bs-toggle="dropdown"
                href="javacript:void(0)"
                aria-expanded={isDropdownOpen ? "true" : "false"}
                onClick={toggleDropdown}
              >
                <div className="avatar-circle">
                  <Image
                    src={profile || "/default-profile.png"}
                    alt="profile pic"
                    width={50}
                    height={50}
                    className="profile-img"
                    unoptimized
                  />
                </div>

                <span className="profile-username">
                  <span className="fw-500 d-flex flex-column heading">
                    {user?.profile_information?.full_name || ""}

                    {userRole && (
                      <span className="user-dept">{userRole.name}</span>
                    )}
                  </span>
                </span>
                <span className="ms-4 user-drop-icon">
                  <i
                    className={`fa-solid ${
                      isDropdownOpen ? "fa-chevron-up" : "fa-chevron-down"
                    }`}
                  ></i>
                </span>
              </Link>
              <ul
                className="dropdown-menu profile-scroll dropdown-user animated fadeIn"
                style={{ display: isDropdownOpen ? "block" : "none" }}
              >
                <div className="scrollable-hidden">
                  <li className="dropdown-item-text">
                    <Link className="dropdown-item" href="/profile">
                      My Profile
                    </Link>
                  </li>
                  <div className="dropdown-divider"></div>
                  <li className="dropdown-item-text">
                    <ThemeSwitcher />
                  </li>
                  <div className="dropdown-divider"></div>
                  {/* <li className="dropdown-item-text">
                    <FontSwitcher />
                  </li> */}

                  <div className="dropdown-divider"></div>
                  <li className="dropdown-item-text">
                    <TempSwitcher />
                  </li>

                  <div className="dropdown-divider"></div>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={handleLogout}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      Logout
                    </button>
                  </li>
                </div>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
