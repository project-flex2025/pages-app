import "bootstrap/dist/css/bootstrap.min.css";
import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps }: any) {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
