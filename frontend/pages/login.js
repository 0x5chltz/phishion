import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// @material-ui/icons
import Language from "@material-ui/icons/Language";
// Core components
import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import Card from "/components/Card/Card.js";
import CardBody from "/components/Card/CardBody.js";
import Seo from "/components/Seo/Seo.js";

import styles from "/styles/jss/nextjs-material-kit/pages/loginPage.js";

const useStyles = makeStyles(styles);

const LoginPage = (props) => {
  const [cardAnimaton, setCardAnimation] = React.useState("cardHidden");

  // Was a bare setTimeout in the render body, which scheduled a new timer on
  // every render and never cleared any of them.
  React.useEffect(() => {
    const timer = setTimeout(() => setCardAnimation(""), 700);
    return () => clearTimeout(timer);
  }, []);

  const classes = useStyles();
  const { ...rest } = props;

  const handleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    // Was window.open(url, "__selfs"). That is not a browsing context keyword,
    // so it opened a named popup and the original tab never learned about the
    // session.
    window.location.href = `${apiUrl}/login/google`;
  };

  return (
    <div>
      <Seo
        title="Sign in"
        description="Sign in to Phishion with your Google account to submit URLs for analysis and keep a searchable history of your scans."
        path="/login"
      />
      <Header
        absolute
        color="transparent"
        brand="Phishion"
        rightLinks={<HeaderLinks />}
        {...rest}
      />
      <div
        className={classes.pageHeader}
        style={{
          backgroundImage: "url('/img/bg7.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "top center"
        }}
      >
        <div className={classes.container}>
          <GridContainer justify="center">
            <GridItem xs={12} sm={8} md={5}>
              <Card className={classes[cardAnimaton]}>
                <CardBody>
                  <h1 className={classes.cardTitle}>Sign in</h1>
                  <p className={classes.cardCopy}>
                    Phishion uses your Google account. Scans, tags, and lists
                    are tied to that account, and the daily scan quota is
                    counted per user.
                  </p>
                  <Button
                    onClick={handleLogin}
                    color="primary"
                    size="lg"
                    fullWidth
                  >
                    <Language className={classes.icons} /> Sign in with Google
                  </Button>
                </CardBody>
              </Card>
            </GridItem>
          </GridContainer>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
