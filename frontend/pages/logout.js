import React, { useCallback, useEffect, useState } from "react";
// core components
import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import Button from "/components/CustomButtons/Button.js";
import Parallax from "/components/Parallax/ParallaxInspect.js";

import { api } from "/lib/api.js";
import { useNotify } from "/context/NotificationContext.js";
import Seo from "/components/Seo/Seo.js";

export default function Logout(props) {
  const notify = useNotify();
  const { ...rest } = props;

  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(true);

  const handleLogout = useCallback(async () => {
    setPending(true);
    setFailed(false);
    try {
      // api.logout() attaches the CSRF token; without it the backend rejects with 403
      // and the session would survive while the UI pretended we were logged out.
      await api.logout();
      window.location.href = "/";
    } catch (err) {
      setPending(false);
      setFailed(true);
      notify.error(
        err?.data?.error || err?.message || "Logout failed. You are still signed in."
      );
    }
  }, [notify]);

  useEffect(() => {
    handleLogout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Seo
        title="Signing out"
        description="Signing out of Phishion."
        path="/logout"
        noindex
      />
      <h1 style={{position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>Signing out</h1>
      <Header
        color="transparent"
        brand="Phishion"
        rightLinks={<HeaderLinks />}
        fixed
        changeColorOnScroll={{
          height: 200,
          color: "white"
        }}
        {...rest}
      />
      <Parallax image="/img/background_inspect2.png">
        <div style={{ padding: "120px 24px", textAlign: "center", color: "#fff" }}>
          {pending ? (
            <h4>Logging out...</h4>
          ) : failed ? (
            <div>
              <h4>Logout failed. You are still signed in.</h4>
              <p>Check your connection and try again.</p>
              <Button color="info" round onClick={handleLogout}>
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      </Parallax>
      <Footer />
    </div>
  );
}
