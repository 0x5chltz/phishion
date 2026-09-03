import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Header from '/components/Header/Header.js';
import HeaderLinks from '/components/Header/HeaderLinks.js';
import Footer from '/components/Footer/Footer.js';

const useStyles = makeStyles(() => ({
  main: {
    paddingTop: 120,
    paddingBottom: 80,
    minHeight: '70vh',
    background: 'inherit',
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px',
  },
  title: {
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    color: '#777',
    marginBottom: 32,
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
