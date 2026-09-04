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
  // Rendered as <h1>. Sized at the theme's h2 scale on purpose: these are
  // interior tool pages, so the heading should not shout, and hierarchy is
  // carried by weight rather than raw scale.
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    marginTop: 0,
    marginBottom: 6,
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(5),
    fontSize: '1rem',
    lineHeight: 1.6,
    maxWidth: 640,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
}));

/**
 * Standard chrome for the interior tool pages.
 *
 * `title` renders the page's single <h1>. Pass `hideTitle` when the visual
 * design already carries the heading and only the accessible/SEO one is
 * wanted.
 */
export default function PageShell({ title, subtitle, hideTitle, children }) {
  const classes = useStyles();
  return (
    <div>
      <Header color="white" brand="Phishion" rightLinks={<HeaderLinks />} fixed />
      <div className={classes.main}>
        <div className={classes.container}>
          {title && (
            <h1 className={hideTitle ? classes.srOnly : classes.title}>{title}</h1>
          )}
          {subtitle && !hideTitle && <p className={classes.subtitle}>{subtitle}</p>}
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
