"use client";

import { useEffect } from "react";
import Script from "next/script";
import jQuery from "jquery"; // ES module import

declare global {
  interface Window {
    $: typeof jQuery;
    jQuery: typeof jQuery;
  }
}

export default function JQueryLoader() {
  useEffect(() => {
    window.$ = window.jQuery = jQuery;
  }, []);

  return (
    <>
      <Script src="https://code.jquery.com/jquery-3.7.1.min.js" strategy="beforeInteractive" />
      <Script src="/js/kaiadmin.min.js" strategy="lazyOnload" />
      {/* <Script src="/js/hrm-dashboard.js" strategy="lazyOnload" /> */}
    </>
  );
}