import React from "react";
import dynamic from "next/dynamic";
// core components
import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import Seo from "/components/Seo/Seo.js";

// WebGL only, and it measures the card from the DOM, so never server render it.
const RobotScene = dynamic(
  () => import("/components/RobotScene/RobotScene.js"),
  { ssr: false }
);

// sections for this page
import DomainSection from "/pages-sections/DomainPage-Sections/DomainSection.js";

// The scene is a fixed-height, overflow-hidden signature layout, so the page h1
// is exposed to assistive tech and crawlers without being painted over the
// artwork. The visible heading for the lookup lives in DomainSection.
const srOnly = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function Domains(props) {
  const { ...rest } = props;

  return (
    <div>
      <Seo
        title="Subdomain Discovery"
        description="Enumerate subdomains for a hostname during reconnaissance, surfacing forgotten hosts and lookalike infrastructure attached to a domain."
        path="/domains"
      />
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
      <h1 style={srOnly}>Subdomain Discovery</h1>

      <div style={{ position: "relative", height: "100vh", overflow: "hidden", background: "#0B1120" }}>
        <RobotScene mode="inspect" verdict={null} />

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
            <DomainSection />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
