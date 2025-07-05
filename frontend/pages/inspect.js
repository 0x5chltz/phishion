'use client'
import { useState } from 'react'
import React from "react";
// nodejs library that concatenates classes
import classNames from "classnames";
// react components for routing our app without refresh
import Link from "next/link";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// @material-ui/icons
// core components
import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import Parallax from "/components/Parallax/ParallaxInspect.js";

// sections for this page
import InspectSection from "/pages-sections/InspectPage-Sections/InspectSection.js";

import styles from "/styles/jss/nextjs-material-kit/pages/components.js";

const useStyles = makeStyles(styles);

export default function Inspect(props) {
  const classes = useStyles();
  const { ...rest } = props;
  const [url, setUrl] = useState("")
  const [result, setResult] = useState(null)

  const handleCheck = async () => {
    const res = await fetch('/api/detect', {
      method: 'POST',
      body: JSON.stringify({ url }),
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    setResult(data)
  }
  return (
    <div>
      {/* <div className={classes.section}>
      <GridContainer justify="left">
        <GridItem xs={12} sm={12} md={40}>
          <h1 className="text-3xl font-semibold mb-4">Phishion AI</h1>
            <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="Masukkan URL mencurigakan"
                className="border p-2 w-full mb-4"
            />
            <button onClick={handleCheck} className="bg-black text-white py-2 px-4 rounded">
                Deteksi Sekarang
            </button>

            {result && (
              <div className="mt-6">
                <h2 className="text-xl font-medium">Hasil:</h2>
                <p>Status: <strong>{result.status}</strong></p>
                <p>Confidence: <strong>{result.confidence}%</strong></p>
              </div>
            )}
        </GridItem>
      </GridContainer>
    </div> */}
      {/* <Header
        brand="Phishion"
        rightLinks={<HeaderLinks />}
        fixed
        color="transparent"
        changeColorOnScroll={{
          height: 400,
          color: "white"
        }}
        {...rest}
      /> */}
      <Parallax image="/img/background_inspect2.png">
        <InspectSection />
        </Parallax>
    </div>
    );
}