import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// core components
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";

const useStyles = makeStyles((theme) => ({
  section: {
    padding: "40px 0 64px",
    borderTop: `1px solid ${theme.palette.divider}`
  },
  title: {
    fontSize: "1.125rem",
    fontWeight: 600,
    margin: "0 0 12px"
  },
  names: {
    color: theme.palette.text.secondary,
    lineHeight: 1.9,
    margin: 0,
    listStyle: "none",
    padding: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: "4px 20px"
  },
  name: {
    fontSize: "0.9375rem"
  }
}));

// Previously five profile cards, each rendering the same avatar file and three
// social buttons with no href. Reduced to a plain credit so the section stops
// competing with the product content above it.
const CONTRIBUTORS = [
  "Aditya Firman Nugroho",
  "Dwi Rangga Putra",
  "Muhammad Sulthon Nurbahari",
  "Nur Fatoni",
  "Fadil Muhammad"
];

export default function TeamSection() {
  const classes = useStyles();
  return (
    <div className={classes.section}>
      <GridContainer>
        <GridItem xs={12} md={10}>
          <h2 className={classes.title}>Built by</h2>
          <ul className={classes.names}>
            {CONTRIBUTORS.map((person) => (
              <li className={classes.name} key={person}>
                {person}
              </li>
            ))}
          </ul>
        </GridItem>
      </GridContainer>
    </div>
  );
}
