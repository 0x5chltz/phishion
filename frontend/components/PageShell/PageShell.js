import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Header from '/components/Header/Header.js';
import HeaderLinks from '/components/Header/HeaderLinks.js';
import Footer from '/components/Footer/Footer.js';

const useStyles = makeStyles((theme) => ({
  main: {
    paddingTop: 112,
    paddingBottom: 80,
    minHeight: '70vh',
  },
  container: {
    maxWidth: 1120,
    margin: '0 auto',
    padding: theme.spacing(0, 3),
  },
  title: {
    fontWeight: 700,
    marginBottom: 6,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(5),
    fontSize: '1rem',
    maxWidth: 640,
  },
}));

export default function PageShell({ title, subtitle, children }) {
  const classes = useStyles();
  return (
    <div>
      <Header color="white" brand="Phishion" rightLinks={<HeaderLinks />} fixed />
      <div className={classes.main}>
        <div className={classes.container}>
          {title && <h2 className={classes.title}>{title}</h2>}
          {subtitle && <p className={classes.subtitle}>{subtitle}</p>}
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
