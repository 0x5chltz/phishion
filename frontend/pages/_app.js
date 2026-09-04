import React from "react";
import Head from "next/head";
import "/styles/scss/nextjs-material-kit.scss?v=1.2.0";
import { AuthProvider } from "/context/AuthContext.js";
import { NotificationProvider } from "/context/NotificationContext.js";
import { ConfirmProvider } from "/components/ConfirmDialog/ConfirmDialog.js";
import { ThemeModeProvider } from "/context/ThemeContext.js";

// This used to extend next/app with a static getInitialProps that only
// forwarded pageProps. Its mere presence disabled Automatic Static
// Optimization for every route, so each crawler request paid for a full
// server render while the head was a single hardcoded title. Pages that need
// request-time data fetch it client side, and pages/result.js reads
// router.query behind a router.isReady guard, so static optimization is safe.
export default function MyApp({ Component, pageProps }) {
  return (
    <React.Fragment>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Per-page titles and descriptions come from components/Seo/Seo.js.
            This title is only the fallback for any route without one. */}
        <title>Phishion</title>
      </Head>
      <ThemeModeProvider>
        <NotificationProvider>
          <ConfirmProvider>
            <AuthProvider>
              <Component {...pageProps} />
            </AuthProvider>
          </ConfirmProvider>
        </NotificationProvider>
      </ThemeModeProvider>
    </React.Fragment>
  );
}
