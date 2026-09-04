import React from "react";
// @material-ui/core components
import { makeStyles, useTheme } from "@material-ui/core/styles";
// core components
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import { verdictColors } from "/context/ThemeContext.js";

const useStyles = makeStyles((theme) => ({
  section: {
    padding: "64px 0 48px"
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    margin: "0 0 16px"
  },
  body: {
    color: theme.palette.text.secondary,
    maxWidth: "56ch",
    margin: 0
  },
  keyLabel: {
    color: theme.palette.text.secondary,
    fontSize: "0.8125rem",
    fontWeight: 600,
    margin: "0 0 14px"
  },
  row: {
    display: "flex",
    alignItems: "baseline",
    gap: "14px",
    padding: "12px 0",
    borderTop: `1px solid ${theme.palette.divider}`
  },
  pill: {
    fontWeight: 700,
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    padding: "5px 12px",
    borderRadius: 999,
    border: "1px solid transparent",
    flexShrink: 0,
    minWidth: "104px",
    textAlign: "center"
  },
  meaning: {
    color: theme.palette.text.secondary,
    fontSize: "0.9375rem",
    lineHeight: 1.5
  },
  "@media (max-width: 959px)": {
    section: { padding: "48px 0 32px" }
  }
}));

const VERDICTS = [
  {
    key: "malicious",
    meaning: "At least one engine flagged the URL as malicious."
  },
  {
    key: "suspicious",
    meaning: "No malicious hits, but one or more engines flagged it as suspicious."
  },
  {
    key: "clean",
    meaning: "No engine flagged it. Absence of a hit is not proof of safety."
  }
];

export default function VerdictSection() {
  const classes = useStyles();
  const theme = useTheme();
  const colors = verdictColors(theme);

  return (
    <div className={classes.section}>
      <GridContainer>
        <GridItem xs={12} md={6}>
          <h2 className={classes.title}>What you get back</h2>
          <p className={classes.body}>
            Phishion submits the URL to VirusTotal and stores the aggregated
            result against your account. You see the verdict, the counts behind
            it, and which engines reported what. Every scan stays searchable,
            taggable, and exportable as CSV or JSON.
          </p>
        </GridItem>
        <GridItem xs={12} md={6}>
          <p className={classes.keyLabel}>Verdicts</p>
          {VERDICTS.map((verdict) => (
            <div className={classes.row} key={verdict.key}>
              <span
                className={classes.pill}
                style={{
                  background: colors[verdict.key].background,
                  color: colors[verdict.key].color,
                  borderColor: colors[verdict.key].border
                }}
              >
                {verdict.key}
              </span>
              <span className={classes.meaning}>{verdict.meaning}</span>
            </div>
          ))}
        </GridItem>
      </GridContainer>
    </div>
  );
}
