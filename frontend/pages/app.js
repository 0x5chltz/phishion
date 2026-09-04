import React from "react";
// nodejs library that concatenates classes
import classNames from "classnames";
import Link from "next/link";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// core components
import Header from "/components/Header/Header.js";
import Footer from "/components/Footer/Footer.js";
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Parallax from "/components/Parallax/Parallax.js";
import Seo from "/components/Seo/Seo.js";

import styles from "/styles/jss/nextjs-material-kit/pages/landingPage.js";

// Sections for this page
import VerdictSection from "/pages-sections/LandingPage-Sections/VerdictSection.js";
import HowSection from "/pages-sections/LandingPage-Sections/HowSection.js";
import TeamSection from "/pages-sections/LandingPage-Sections/TeamSection.js";

const dashboardRoutes = [];

const useStyles = makeStyles(styles);

export default function LandingPage(props) {
  const classes = useStyles();
  const { ...rest } = props;
  return (
    <div>
      <Seo
        title="Phishing URL Analysis"
        description="Submit a suspicious URL to Phishion and get a verdict from over 70 antivirus engines, with the per-engine breakdown and a searchable scan history."
        path="/app"
      />
      <Header
        color="transparent"
        routes={dashboardRoutes}
        brand="Phishion"
        rightLinks={<HeaderLinks />}
        fixed
        changeColorOnScroll={{
          height: 400,
          color: "white"
        }}
        {...rest}
      />
      <Parallax filter responsive image="/img/background_header.png">
        <div className={classes.container}>
          <GridContainer>
            <GridItem xs={12} sm={12} md={7}>
              <h1 className={classes.title}>See the Threat, Stop the Trap.</h1>
              <p className={classes.subtitle}>
                Submit a suspicious URL and get a verdict from over 70 antivirus
                engines, with the full per-engine breakdown.
              </p>
              <div className={classes.heroActions}>
                <Link href="/inspect">
                  <Button color="primary" size="lg">
                    Inspect a URL
                  </Button>
                </Link>
                <Link href="/login">
                  <a className={classes.heroSecondary}>Sign in</a>
                </Link>
              </div>
            </GridItem>
          </GridContainer>
        </div>
      </Parallax>
      <div className={classNames(classes.main, classes.mainRaised)}>
        <div className={classes.contentContainer}>
          <VerdictSection />
          <HowSection />
          <TeamSection />
        </div>
      </div>
      <Footer />
    </div>
  );
}
