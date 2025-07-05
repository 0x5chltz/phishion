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
            Solusi cerdas berbasis kecerdasan buatan (AI) yang dirancang untuk mendeteksi dan mencegah serangan phishing secara cepat dan akurat. Dengan antarmuka yang sederhana dan intuitif, pengguna cukup memasukkan tautan (URL) atau konten email mencurigakan, dan Phishion akan langsung menganalisisnya menggunakan model machine learning terkini. Hasil deteksi ditampilkan dalam hitungan detik, lengkap dengan label “Aman” atau “Phishing”, serta tingkat kepercayaan (confidence score) yang transparan.
          </h5>
        </GridItem>
      </GridContainer>
    </div>
  );
}
