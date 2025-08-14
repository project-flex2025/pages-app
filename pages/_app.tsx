import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import "./styles/login1.css";
import "./styles/login2.css";
import "./styles/globals.css";
import "./styles/taskModal.css";
import "./styles/taskModal.css";
import "./styles/controlPanel.css";
import JQueryLoader from "../components/JQueryLoader";
import FontApplier from "../components/FontApplier";
import FaviconSetter from "../components/FaviconSetter";
import ClientLayout from "../components/ClientLayout";
import { ThemeProvider } from "@/context/ThemeContext";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "remixicon/fonts/remixicon.css";
import "react-toastify/dist/ReactToastify.css";
import BootstrapClient from "../components/BootstrapClient";

export default function App({ Component, pageProps }: any) {
  const router = useRouter();
  const pathname = router.pathname;

  // Define routes without sidebar/header
  const hideLayoutRoutes = ["/login", "/register", "/forgot-password"];
  const shouldHideLayout = hideLayoutRoutes.includes(pathname);

  return (
    <SessionProvider session={pageProps.session}>
      <Provider store={store}>
        <ThemeProvider>
          <BootstrapClient />
          <JQueryLoader />
          <FontApplier />
          <FaviconSetter />
          {shouldHideLayout ? (
            <Component {...pageProps} />
          ) : (
            <ClientLayout>
              <Component {...pageProps} />
            </ClientLayout>
          )}
        </ThemeProvider>
      </Provider>
    </SessionProvider>
  );
}
