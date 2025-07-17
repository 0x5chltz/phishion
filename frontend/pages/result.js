import React from "react";
// nodejs library that concatenates classes
import classNames from "classnames";
// react components for routing our app without refresh
import Link from "next/link";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// @material-ui/icons
// core components
import Parallax from "/components/Parallax/ParallaxInspect.js";

// sections for this page
import ResultSection from "/pages-sections/ResultPage-Sections/ResultSection.js";

export default function Result() {

  return (
    <div>
      <Parallax image="/img/background_inspect2.png">
        <ResultSection />
        </Parallax>
    </div>
    );
}