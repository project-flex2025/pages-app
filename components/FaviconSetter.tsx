"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const FaviconSetter = () => {
  const appData = useSelector((state: RootState) => state.appData.appData);

  useEffect(() => {
    const favicon = document.getElementById(
      "favicon"
    ) as HTMLLinkElement | null;
    const baseFaviconUrl =
      appData?.["Favicon"]?.value ||
      appData?.["Company Logo"]?.value ||
      "/default-favicon.ico";
    // Add cache-busting query string
    const faviconUrl = `${baseFaviconUrl}?v=${Date.now()}`;

    if (favicon) {
      favicon.href = faviconUrl;
    } else {
      const link = document.createElement("link");
      link.id = "favicon";
      link.rel = "icon";
      link.href = faviconUrl;
      document.head.appendChild(link);
    }
  }, [appData]);

  return null;
};

export default FaviconSetter;
