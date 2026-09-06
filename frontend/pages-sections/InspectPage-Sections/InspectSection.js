'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import { Email, Link as LinkIcon, Search } from "@material-ui/icons";

import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import Card from "/components/Card/Card.js";
import CardBody from "/components/Card/CardBody.js";
import CardHeader from "/components/Card/CardHeader.js";
import CardFooter from "/components/Card/CardFooter.js";
import CustomInput from "/components/CustomInput/CustomInput.js";
import CustomLinearProgress from "/components/CustomLinearProgress/CustomLinearProgress.js";

import { api } from "/lib/api.js";
import { useNotify } from "../../context/NotificationContext";

import styles from "/styles/jss/nextjs-material-kit/pages/inspectPage.js";

const useStyles = makeStyles(styles);

export default function InspectSection() {
  const classes = useStyles();
  const router = useRouter();
  const notify = useNotify();

  const [cardAnimaton, setCardAnimation] = useState("cardHidden");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Card animation
  useEffect(() => {
    const timer = setTimeout(() => setCardAnimation(""), 700);
    return () => clearTimeout(timer);
  }, []);

  // Paste clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      notify.warning("Could not read from the clipboard. Paste the URL manually.");
    }
  };

  // Submit scan
  const handleScan = async (e) => {
    e.preventDefault();
    if (!url || loading) return;

    setLoading(true);
    try {
      // api.scan() attaches the CSRF token and accepts the backend's 202 response.
      const data = await api.scan(url);
      const scanId = data?.scan?.id;

      if (scanId == null) {
        notify.error("The scan was accepted but no scan id was returned.");
        return;
      }

      // Keep a localStorage copy purely as a fallback (it also carries `remaining`,
      // which the detail endpoint does not return). The query param is the source of truth.
      try {
        localStorage.setItem("scanResult", JSON.stringify(data));
      } catch (storageErr) {
        // Private mode / quota: not fatal, the query param still works.
      }

      router.push(`/result?id=${encodeURIComponent(scanId)}`);
    } catch (err) {
      if (err?.status === 429) {
        notify.error(
          err?.data?.error ||
            "Daily scan limit reached. Try again after the limit resets."
        );
      } else if (err?.status === 401) {
        notify.warning("Your session has expired. Please sign in again.");
      } else if (err?.status === 400) {
        notify.error(err?.data?.error || "A valid HTTP(S) URL is required.");
      } else {
        notify.error(err?.message || "Scan failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <GridContainer justify="flex-start">
        <GridItem xs={12} sm={6} md={4}>
          <Card
            className={[classes[cardAnimaton], "laser-card"].filter(Boolean).join(" ")}
            data-laser-status={loading ? "scanning" : "idle"}
          >
            <form onSubmit={handleScan} className={classes.form}>
              <CardHeader className={classes.cardHeader + " laser-card-header"}>
                <h1 className={classes.cardTitle}>Inspect a URL</h1>
                <div className="laser-sublabel">// THREAT INSPECTION</div>
              </CardHeader>

              <CardBody>
                <CustomInput
                  labelText="URL"
                  id="url"
                  formControlProps={{ fullWidth: true }}
                  inputProps={{
                    type: "url",
                    value: url,
                    onChange: (e) => setUrl(e.target.value),
                    required: true,
                    disabled: loading,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Paste URL from clipboard"
                          onClick={handlePasteFromClipboard}
                          disabled={loading}
                          size="small"
                        >
                          <LinkIcon className={classes.inputIconsColor} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <CustomInput
                  labelText="Email Content (PRO Version)"
                  id="email"
                  formControlProps={{ fullWidth: true }}
                  inputProps={{
                    type: "email",
                    disabled: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Email className={classes.inputIconsColor} />
                      </InputAdornment>
                    )
                  }}
                />
                <div style={{ width: '100%', marginBottom: 8 }}>
                    <p className="text-gray-700 text-sm">
                      <span className="font-mono font-bold">Daily scan limit is (5 per day)</span>
                    </p>
                </div>
                {loading && (
                  <div style={{ width: '100%' }} aria-live="polite">
                    <CustomLinearProgress color="primary" variant="indeterminate" />
                    <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13 }}>
                      Submitting URL for analysis...
                    </p>
                  </div>
                )}
              </CardBody>
              <CardFooter className={classes.cardFooter}>
                <Button type="submit" disabled={loading} color="info" round fullWidth>
                  <Search className={classes.icons} />{" "}
                  {loading ? "Inspecting..." : "Inspect"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
