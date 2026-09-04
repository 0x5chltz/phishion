import React from "react";
import dynamic from "next/dynamic";

// Core components
import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import Seo from "/components/Seo/Seo.js";

// sections
import InspectSection from "/pages-sections/InspectPage-Sections/InspectSection.js";

// 3D Robot scene — loaded client-side only (Three.js needs window)
const RobotScene = dynamic(
  () => import("/components/RobotScene/RobotScene.js"),
  { ssr: false }
);

export default function Inspect(props) {
  const { ...rest } = props;

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden", background: "#0B1120" }}>
      <Seo
        title="Inspect a URL"
        description="Submit a suspicious URL for analysis against over 70 antivirus and blocklist engines, and get the per-engine verdict back."
        path="/inspect"
      />

      {/* 3D Robot background — fills viewport behind everything */}
      <RobotScene />

      {/* Navigation */}
      <Header
        color="transparent"
        brand="Phishion"
        rightLinks={<HeaderLinks />}
        fixed
        changeColorOnScroll={{
          height: 200,
          color: "white",
        }}
        {...rest}
      />

      {/* Form card overlay — floats on top of canvas */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
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

      {/* Footer pinned at bottom */}
      <div style={{ position: "absolute", bottom: 0, width: "100%", zIndex: 10 }}>
        <Footer />
      </div>
    </div>
  );
}
