import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// @material-ui/icons
import Chat from "@material-ui/icons/Chat";
import VerifiedUser from "@material-ui/icons/VerifiedUser";
import Fingerprint from "@material-ui/icons/Fingerprint";
import Header from "/components/Header/Header.js";

// core components
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import InfoArea from "/components/InfoArea/InfoArea.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";

import styles from "/styles/jss/nextjs-material-kit/pages/landingPageSections/productStyle.js";
import { Adb, Android, Person, SportsRugbyTwoTone } from "@material-ui/icons";

const useStyles = makeStyles(styles);

export default function ProductSection() {
  const classes = useStyles();
  return (
    <div className={classes.section}>
        <GridContainer justify="center">
        <GridItem xs={12} sm={12} md={8}>
          <h2 className={classes.title}>Let{"'"}s talk product</h2>
          <h5 className={classes.description}>
            An intelligent, API-based solution designed to detect and prevent phishing attacks quickly and accurately. With a simple and intuitive interface, users simply enter a suspicious link (URL) or email content, and Phishion will instantly analyze it using state-of-the-art machine learning models. Detection results are displayed within seconds, complete with a "Safe" or "Phishing" label and a transparent confidence score.
          </h5>
        </GridItem>
      </GridContainer>
    </div>
  );
}
