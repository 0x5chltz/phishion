import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// @material-ui/icons
import Chat from "@material-ui/icons/Chat";
import VerifiedUser from "@material-ui/icons/VerifiedUser";
import Fingerprint from "@material-ui/icons/Fingerprint";
// core components
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import InfoArea from "/components/InfoArea/InfoArea.js";

import styles from "/styles/jss/nextjs-material-kit/pages/landingPageSections/productStyle.js";
import { Adb, AlarmOn, Android, BluetoothSearchingTwoTone, ImageSearch, LocationSearching, MyLocation, Person, SportsRugbyTwoTone, ZoomIn } from "@material-ui/icons";

const useStyles = makeStyles(styles);

export default function HowSection() {
  const classes = useStyles();
  return (
    <div className={classes.section}>
      <GridContainer justify="center">
        <GridItem xs={12} sm={12} md={8}>
          <h2 className={classes.title}>How it works</h2>
        </GridItem>
      </GridContainer>
      <div>
        <GridContainer justify="center">
          <GridItem xs={12} sm={12} md={4}>
            <InfoArea
              title="Inspect"
              description="Let's dive deep into that URL like it's a treasure map leading to lost riches or something."
              icon={ZoomIn}
              iconColor="info"
              vertical
            />
          </GridItem>
          <GridItem xs={12} sm={12} md={4}>
            <InfoArea
              title="Spot on"
              description="API is the ultimate URL chef, throwing over 70 antivirus engines into the pot and stirring up a delectable stew of aggregated URLs that even your grandma would love!"
              icon={MyLocation}
              iconColor="success"
              vertical
            />
          </GridItem>
          <GridItem xs={12} sm={12} md={4}>
            <InfoArea
              title="Rapid"
              description="Get your detection results quicker than you can say 'abracadabra!'"
              icon={AlarmOn}
              iconColor="danger"
              vertical
            />
          </GridItem>
        </GridContainer>
      </div>
    </div>
  );
}
