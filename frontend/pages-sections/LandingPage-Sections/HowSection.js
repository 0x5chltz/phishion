import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// core components
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";

const useStyles = makeStyles((theme) => ({
  section: {
    padding: "48px 0 64px"
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    margin: "0 0 32px"
  },
  step: {
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
    padding: "24px 0",
    borderTop: `1px solid ${theme.palette.divider}`
  },
  marker: {
    width: "6px",
    alignSelf: "stretch",
    borderRadius: 999,
    background: theme.palette.primary.main,
    flexShrink: 0,
    opacity: 0.85
  },
  stepBody: {
    flex: 1,
    minWidth: 0
  },
  stepTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    margin: "0 0 6px"
  },
  stepText: {
    color: theme.palette.text.secondary,
    margin: 0,
    maxWidth: "62ch",
    lineHeight: 1.6
  },
  code: {
    fontSize: "0.875rem",
    padding: "2px 6px",
    borderRadius: 8,
    background:
      theme.palette.type === "dark"
        ? "rgba(148, 163, 184, 0.14)"
        : "rgba(15, 23, 42, 0.06)"
  },
  "@media (max-width: 599px)": {
    step: { gap: "16px" }
  }
}));

export default function HowSection() {
  const classes = useStyles();
  return (
    <div className={classes.section}>
      <GridContainer>
        <GridItem xs={12} md={10}>
          <h2 className={classes.title}>How it works</h2>

          <div className={classes.step}>
            <span className={classes.marker} aria-hidden="true" />
            <div className={classes.stepBody}>
              <h3 className={classes.stepTitle}>Submit a URL</h3>
              <p className={classes.stepText}>
                Paste any <span className={`${classes.code} mono`}>http</span> or{" "}
                <span className={`${classes.code} mono`}>https</span> address.
                Phishion validates the scheme and host before anything leaves
                your account, and rejects everything else.
              </p>
            </div>
          </div>

          <div className={classes.step}>
            <span className={classes.marker} aria-hidden="true" />
            <div className={classes.stepBody}>
              <h3 className={classes.stepTitle}>It goes to the engines</h3>
              <p className={classes.stepText}>
                The URL is queued with VirusTotal, which runs it past over 70
                antivirus and blocklist engines. Analysis is asynchronous, so
                the result page polls until the verdict settles.
              </p>
            </div>
          </div>

          <div className={classes.step}>
            <span className={classes.marker} aria-hidden="true" />
            <div className={classes.stepBody}>
              <h3 className={classes.stepTitle}>Triage the result</h3>
              <p className={classes.stepText}>
                Read the verdict and the per-engine detail, tag the scan, push
                the host onto a whitelist or blacklist, and export the record
                when you need it somewhere else.
              </p>
            </div>
          </div>
        </GridItem>
      </GridContainer>
    </div>
  );
}
