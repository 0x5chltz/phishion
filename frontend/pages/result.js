import React, { useState } from "react";
import dynamic from "next/dynamic";

import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import Seo from "/components/Seo/Seo.js";
import ResultSection from "/pages-sections/ResultPage-Sections/ResultSection.js";

const RobotScene = dynamic(
  () => import("/components/RobotScene/RobotScene.js"),
  { ssr: false }
);

export default function Result(props) {
  const { ...rest } = props;
  // verdict: null (loading) | 'clean' | 'suspicious' | 'malicious'
  const [verdict, setVerdict] = useState(null);

  return (
    <div>
      <Seo
        title="Scan Result"
        description="The verdict for a submitted URL, with the counts behind it and which engines reported what."
        path="/result"
        noindex
      />
      <h1
        style={{
          position: "absolute", width: 1, height: 1, padding: 0,
          margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap", border: 0,
        }}
      >
        Scan Result
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

        {/* 3D robot canvas — verdict drives eye/laser color */}
        <RobotScene mode="result" verdict={verdict} />

        {/* Card overlay — left-aligned, vertically centred */}
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
            <ResultSection onVerdictChange={setVerdict} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
