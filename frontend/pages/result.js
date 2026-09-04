import React from "react";
// core components
import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import Parallax from "/components/Parallax/ParallaxInspect.js";

// sections for this page
import ResultSection from "/pages-sections/ResultPage-Sections/ResultSection.js";
import Seo from "/components/Seo/Seo.js";

export default function Result(props) {
  const { ...rest } = props;

  return (
    <div>
      <Seo
        title="Scan Result"
        description="The verdict for a submitted URL, with the counts behind it and which engines reported what."
        path="/result"
        noindex
      />
      <h1 style={{position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>Scan Result</h1>
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
        <ResultSection />
      </Parallax>
      <Footer />
    </div>
  );
}
