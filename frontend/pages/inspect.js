import React from "react";
import dynamic from "next/dynamic";

import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import Seo from "/components/Seo/Seo.js";
import InspectSection from "/pages-sections/InspectPage-Sections/InspectSection.js";

const RobotScene = dynamic(
  () => import("/components/RobotScene/RobotScene.js"),
  { ssr: false }
);

export default function Inspect(props) {
  const { ...rest } = props;
  return (
    <div>
      <Seo
        title="Inspect URL"
        description="Submit a URL to Phishion for a phishing and malware scan."
        path="/inspect"
      />
      <h1
        style={{
          position: "absolute", width: 1, height: 1, padding: 0,
          margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap", border: 0,
        }}
      >
        Inspect URL
      </h1>

      <Header
        color="transparent"
        brand="Phishion"
        rightLinks={<HeaderLinks />}
        fixed
        changeColorOnScroll={{ height: 200, color: "white" }}
        {...rest}
      />

      {/* Scene wrapper: robot fills the first viewport, the card sits below the
          nose and the section grows/scrolls if its content is tall. */}
      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#0B1120" }}>

        {/* 3D robot canvas — viewport-tall background */}
        <RobotScene mode="inspect" verdict={null} />

        {/* Card centred in the first screen (nudged a little below centre); the
            section flows so the page scrolls and the robot wallpaper scrolls
            with it rather than staying fixed. */}
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: "8vh", boxSizing: "border-box" }}>
          <InspectSection />
        </div>
      </div>

      <Footer />
    </div>
  );
}
