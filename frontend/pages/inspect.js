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

      {/* Full-viewport scene wrapper */}
      <div style={{ position: "relative", height: "100vh", overflow: "hidden", background: "#0B1120" }}>

        {/* 3D robot canvas — fills entire background */}
        <RobotScene mode="inspect" verdict={null} />

        {/* Card overlay — left-aligned, vertically centred, above canvas */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div style={{ pointerEvents: "all", width: "100%" }}>
            <InspectSection />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
