'use client';
import React, { useEffect, useState } from 'react';
// nodejs library that concatenates classes
import classNames from "classnames";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// core components
import Header from "/components/Header/Header.js";
import Footer from "/components/Footer/Footer.js";
import Button from "/components/CustomButtons/Button.js";
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Parallax from "/components/Parallax/Parallax.js";
import { api } from "../lib/api";

import styles from "/styles/jss/nextjs-material-kit/pages/profilePage.js";
import Seo from "/components/Seo/Seo.js";

const useStyles = makeStyles(styles);

export default function ProfilePage(props) {
  const classes = useStyles();

  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Via lib/api.js so the API origin follows the page hostname.
    api
      .userinfo()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status !== 401) console.error("Unable to load user", err);
        setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { ...rest } = props;
  const imageClasses = classNames(
    classes.imgRaised,
    classes.imgRoundedCircle,
    classes.imgFluid
  );

  return (
    <div>
      <Seo
        title="Profile"
        description="Your Phishion account."
        path="/profile"
        noindex
      />
      <h1 style={{position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>Your Account</h1>
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
      <Parallax small filter image="/img/profile-bg.jpg" />
      <div className={classNames(classes.main, classes.mainRaised)}>
        <div>
          <div className={classes.container}>
            <GridContainer justify="center">
              <GridItem xs={12} sm={12} md={6}>
                {user ? (
                <div className={classes.profile}>
                  <div>
                    <img
                      src="/img/faces/profile.png"
                      alt="..."
                      className={imageClasses}
                    />
                  </div>
                  <div className={classes.name}>
                    <h3 className={classes.title}>{user.username}</h3>
                    <h6>User</h6>
                  </div>
                    <Button color="danger" href="/delete">
                      delete account
                    </Button>
                </div>
                ) : (
                  <p style={{ textAlign: "center", marginTop: "20px" }}>
                    Anonymous User
                  </p>
                ) }
              </GridItem>
            </GridContainer>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
