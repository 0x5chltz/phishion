import React from "react";
// core components
import Parallax from "/components/Parallax/ParallaxInspect.js";

// sections for this page
import DomainSection from "/pages-sections/DomainPage-Sections/DomainSection.js";

export default function Domains() {
  return (
    <div>
      <Parallax image="/img/background_inspect2.png">
        <DomainSection />
      </Parallax>
    </div>
  );
}
