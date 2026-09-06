import { container, title } from "/styles/jss/nextjs-material-kit.js";

import imagesStyle from "/styles/jss/nextjs-material-kit/imagesStyles.js";

// Theme-aware so the profile surface follows the light/dark toggle instead of
// being locked to a white panel with grey text.
const profilePageStyle = (theme) => ({
  container,
  profile: {
    textAlign: "center",
    "& img": {
      maxWidth: "160px",
      width: "100%",
      margin: "0 auto",
      transform: "translate3d(0, -50%, 0)"
    }
  },
  description: {
    margin: "1.071rem auto 0",
    maxWidth: "600px",
    color: theme.palette.text.secondary,
    textAlign: "center !important"
  },
  name: {
    marginTop: "-80px"
  },
  ...imagesStyle,
  main: {
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    position: "relative",
    zIndex: "3"
  },
  mainRaised: {
    margin: "-60px 30px 0px",
    borderRadius: "12px",
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[2]
  },
  title: {
    ...title,
    color: theme.palette.text.primary,
    display: "inline-block",
    position: "relative",
    marginTop: "30px",
    minHeight: "32px",
    textDecoration: "none"
  },
  socials: {
    marginTop: "0",
    width: "100%",
    transform: "none",
    left: "0",
    top: "0",
    height: "100%",
    lineHeight: "41px",
    fontSize: "20px",
    color: theme.palette.text.secondary
  },
  navWrapper: {
    margin: "20px auto 50px auto",
    textAlign: "center"
  }
});

export default profilePageStyle;
