import React from "react";
// core components
import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import Parallax from "/components/Parallax/ParallaxInspect.js";

// sections for this page
import InspectSection from "/pages-sections/InspectPage-Sections/InspectSection.js";
import Seo from "/components/Seo/Seo.js";

export default function Inspect(props) {
  const { ...rest } = props;

  return (
    <div>
      <Seo
        title="Inspect a URL"
        description="Submit a suspicious URL for analysis against over 70 antivirus and blocklist engines, and get the per-engine verdict back."
        path="/inspect"
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
      <Parallax image="/img/background_inspect2.png">
        <InspectSection />
      </Parallax>
      <Footer />
    </div>
  );
}
