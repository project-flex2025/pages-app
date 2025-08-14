"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ReactNode, useState } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Define routes where Sidebar and Header should not be displayed
  const hideLayoutRoutes = ["/login", "/register", "/forgot-password"];
  const shouldHideLayout = hideLayoutRoutes.includes(pathname);

  const toggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  const handleSidebarHover = (hoverState: boolean) => {
    if (isSidebarMinimized) {
      setIsHovered(hoverState);
    }
  };

  return shouldHideLayout ? (
    <>{children}</> // Only render children (login page content)
  ) : (
    <div
      className={`wrapper ${isSidebarMinimized ? "sidebar_minimize" : ""} ${
        isHovered ? "sidebar_minimize_hover" : ""
      }`}
    >
      <Sidebar
        isMinimized={isSidebarMinimized}
        toggleSidebar={toggleSidebar}
        onHover={handleSidebarHover}
      />
      <div className="main-panel">
        <Header
          toggleSidebar={toggleSidebar}
          isSidebarMinimized={isSidebarMinimized}
        />
        <div className="container">
          <div className="page-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
