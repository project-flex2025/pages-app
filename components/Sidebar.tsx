"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { fetchAppData } from "../redux/slices/appDataSlice";
import { getFirstMenuPath } from "@/utils/userMenu";
import { fetchUserAndAllowedMenus } from "../redux/slices/loginUserSlice";
import { UserPermission } from "@/types/controlpanel";

interface SidebarProps {
  isMinimized: boolean;
  toggleSidebar: () => void;
  onHover: (hoverState: boolean) => void;
}

const Sidebar = ({ isMinimized, toggleSidebar, onHover }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();
  const appData = useSelector((state: RootState) => state.appData.appData);

  const loginUserState = useSelector((state: RootState) => state.loginUser) ?? {
    user: null,
    status: "idle",
    error: null,
  }; // safe fallback

  const { user } = loginUserState;

  const userPermissions = user?.more_data?.user_permissions || [];
  // console.log("user permissions from layout",userPermissions);

  const [menuOpen, setMenuOpen] = useState<Record<string, boolean>>({});

  console.log("user id in sidebar ", session?.user?.id);
  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserAndAllowedMenus(userId));
    }
  }, [userId, dispatch]);

  const companyLogo =
    appData?.["Company Logo"]?.value || "/default-profile.png";
  const favicon = appData?.["Favicon"]?.value || "/favicon.png";
  // Add cache-busting to favicon
  const cacheBustedFavicon = `${favicon}?v=${Date.now()}`;
  const displayType = appData?.["Company Logo"]?.display_type || "rectangle";
  const [cacheBustedUrl, setCacheBustedUrl] = useState(companyLogo);

  const [imgSrc, setImgSrc] = useState(cacheBustedFavicon);
  const fallbackSrc = companyLogo;
  useEffect(() => {
    setCacheBustedUrl(`${companyLogo}?v=${Date.now()}`);
    setImgSrc(`${favicon}?v=${Date.now()}`); // Update mini logo with cache-busting
  }, [companyLogo, favicon]);

  useEffect(() => {
    dispatch(fetchAppData());
  }, [dispatch]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const toggleMenu = (menuName: string) => {
    setMenuOpen((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleLogoClick = () => {
    const userPermissions = user?.more_data?.user_permissions;
    const path = getFirstMenuPath(userPermissions);
    router.push(path);
  };
  // const handleLogoClick = () => {
  //   const userInfo = userPermissions;
  //   const path = getFirstMenuPath(userInfo);
  //   router.push(path);
  // };

  return (
    <div
      className="sidebar"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Logo Section */}
      <div className="sidebar-logo">
        <div className="logo-header">
          <div
            className="logo"
            style={{ cursor: "pointer" }}
            onClick={handleLogoClick}
          >
            <div className={`sidebar-logo-${displayType}`}>
              <Image
                src={cacheBustedUrl}
                width={130}
                height={65}
                alt="Company Logo"
              />
            </div>
          </div>

          <div className="mini-logo">
            <Image
              src={imgSrc}
              width={50}
              height={50}
              alt="Mini Logo"
              onError={() => setImgSrc(fallbackSrc)}
            />
          </div>

          <div className="nav-toggle">
            <button
              className="btn btn-toggle toggle-sidebar"
              onClick={toggleSidebar}
            >
              <i
                className={`fa-solid ${
                  isMinimized ? "fa-chevron-right" : "fa-chevron-left"
                }`}
              ></i>
            </button>
            <button className="btn btn-toggle sidenav-toggler">
              <i
                className={`fa-solid ${
                  isMinimized ? "fa-chevron-left" : "fa-chevron-right"
                }`}
              ></i>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-wrapper scrollbar scrollbar-inner scroll-content scroll-scrolly_visible">
        <div className="sidebar-content">
          <ul className="nav nav-secondary">
            {userPermissions?.map((menu: UserPermission, index: number) => (
              <li
                key={index}
                className={`nav-item ${
                  pathname.startsWith(menu.slug) ? "active" : ""
                }`}
              >
                {menu.sub_menus && menu.sub_menus.length > 0 ? (
                  <>
                    <Link
                      data-bs-toggle="collapse"
                      href={`#menu-${index}`}
                      className={menuOpen[menu.name] ? "" : "collapsed"}
                      aria-expanded={menuOpen[menu.name] ? "true" : "false"}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleMenu(menu.name);
                      }}
                    >
                      <i className={`${menu.icon} me-2 main-icon`}></i>
                      <p>{menu.name}</p>
                      <span className="caret"></span>
                    </Link>
                    <div
                      className={`collapse ${
                        menuOpen[menu.name] ? "show" : ""
                      }`}
                      id={`menu-${index}`}
                    >
                      <ul className="nav nav-collapse">
                        {menu.sub_menus.map((submenu, subIndex) => (
                          <li
                            key={subIndex}
                            className={
                              pathname === submenu.slug ? "active" : ""
                            }
                          >
                            <Link href={submenu.slug}>
                              <i
                                className={`${submenu.icon} me-2 sub-menu-icon`}
                              ></i>
                              <span className="sub-item">{submenu.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <Link href={menu.slug || "#"}>
                    <i className={`${menu.icon} me-2`}></i>
                    <p>{menu.name}</p>
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Control Panel */}
          {(user?.role_id === "0" ||
            (user as { control_access?: string })?.control_access ===
              "active") && (
            <ul
              className="nav nav-secondary"
              style={{ marginTop: "auto", paddingTop: "20px" }}
            >
              <div className="d-flex justify-content-center">
                <hr className="w-75 text-center d-flex justify-content-center" />
              </div>
              <li
                className={`nav-item ${
                  pathname.startsWith("/data-center") ? "active" : ""
                }`}
              >
                <Link href="/data-center">
                  <i className="fas fa-cog me-2"></i>
                  <p>Data Center</p>
                </Link>
              </li>
              <li
                className={`nav-item ${
                  pathname.startsWith("/control-panel") ? "active" : ""
                }`}
              >
                <Link href="/control-panel">
                  <i className="fas fa-cog me-2"></i>
                  <p>Control Panel</p>
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
