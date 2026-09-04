import React from "react";
import Router from "next/router";
import Link from "next/link";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// Core components
import Header from "/components/Header/Header.js";
import HeaderLinks from "/components/Header/HeaderLinks.js";
import Footer from "/components/Footer/Footer.js";
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import Card from "/components/Card/Card.js";
import CardBody from "/components/Card/CardBody.js";
import CustomInput from "/components/CustomInput/CustomInput.js";
import Seo from "/components/Seo/Seo.js";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";

import styles from "/styles/jss/nextjs-material-kit/pages/loginPage.js";

// Mirrors MIN_PASSWORD_LENGTH in backend/phishion/validators.py. The server
// is the authority; this only avoids a pointless round trip.
const MIN_PASSWORD_LENGTH = 10;

const useStyles = makeStyles(styles);

const RegisterPage = (props) => {
  const classes = useStyles();
  const notify = useNotify();
  const { refresh } = useAuth();
  const { ...rest } = props;

  const [cardAnimaton, setCardAnimation] = React.useState("cardHidden");
  const [form, setForm] = React.useState({ email: "", username: "", password: "" });
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setCardAnimation(""), 700);
    return () => clearTimeout(timer);
  }, []);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError("");

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.register(form.email.trim(), form.username.trim(), form.password);
      await refresh();
      notify.success("Account created");
      Router.push("/app");
    } catch (err) {
      setError(err.message || "Could not create the account.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Seo
        title="Create an account"
        description="Create a Phishion account to submit URLs for analysis and keep a searchable history of your scans."
        path="/register"
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
                  <h1 className={classes.cardTitle}>Create an account</h1>
                  <p className={classes.cardCopy}>
                    You need an account to submit scans. Each account has its
                    own history, tags, and daily scan quota.
                  </p>

                  <form onSubmit={handleSubmit} noValidate>
                    {error && (
                      <p className={classes.formError} role="alert">
                        {error}
                      </p>
                    )}

                    <CustomInput
                      labelText="Email"
                      id="email"
                      formControlProps={{ fullWidth: true }}
                      inputProps={{
                        type: "email",
                        name: "email",
                        value: form.email,
                        autoComplete: "email",
                        required: true,
                        disabled: submitting,
                        onChange: update("email")
                      }}
                    />
                    <CustomInput
                      labelText="Username"
                      id="username"
                      formControlProps={{ fullWidth: true }}
                      inputProps={{
                        type: "text",
                        name: "username",
                        value: form.username,
                        autoComplete: "username",
                        required: true,
                        disabled: submitting,
                        onChange: update("username")
                      }}
                    />
                    <CustomInput
                      labelText={`Password (at least ${MIN_PASSWORD_LENGTH} characters)`}
                      id="pass"
                      formControlProps={{ fullWidth: true }}
                      inputProps={{
                        type: "password",
                        name: "password",
                        value: form.password,
                        autoComplete: "new-password",
                        required: true,
                        disabled: submitting,
                        onChange: update("password")
                      }}
                    />

                    <Button
                      type="submit"
                      color="primary"
                      size="lg"
                      fullWidth
                      disabled={submitting}
                      className={classes.submit}
                    >
                      {submitting ? "Creating account..." : "Create account"}
                    </Button>
                  </form>

                  <p className={classes.altAction}>
                    Already have an account?{" "}
                    <Link href="/login">
                      <a className={classes.altLink}>Sign in</a>
                    </Link>
                  </p>
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

export default RegisterPage;
