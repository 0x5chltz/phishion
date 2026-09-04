import { container, title } from "/styles/jss/nextjs-material-kit.js";

const landingPageStyle = (theme) => ({
  // Hero container only. Sits over a dark filtered image so its type is white
  // in both themes.
  container: {
    zIndex: "12",
    color: "#FFFFFF",
    ...container
  },
  // Below-the-fold container. Inherits theme text colour, otherwise light mode
  // would render white body text on a white surface.
  contentContainer: {
    zIndex: "12",
    color: theme.palette.text.primary,
    ...container
  },
  // The hero sits over a dark filtered image, so its type stays white in both
  // themes. Everything below the fold follows the theme.
  title: {
    ...title,
    display: "inline-block",
    position: "relative",
    marginTop: "30px",
    minHeight: "32px",
    color: "#FFFFFF",
    textDecoration: "none",
    maxWidth: "16ch"
  },
  subtitle: {
    fontSize: "1.125rem",
    lineHeight: 1.6,
    maxWidth: "52ch",
    margin: "16px 0 0",
    color: "rgba(255, 255, 255, 0.86)"
  },
  heroActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "28px"
  },
  heroSecondary: {
    color: "#FFFFFF",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
    fontWeight: 600,
    fontSize: "0.9375rem"
  },
  // Was a hardcoded #FFFFFF block, which flipped the page to light mode
  // between a dark hero and a dark footer.
  main: {
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    position: "relative",
    zIndex: "3"
  },
  mainRaised: {
    margin: "-60px 30px 0px",
    borderRadius: "12px",
    border: `1px solid ${theme.palette.divider}`,
    boxShadow:
      theme.palette.type === "dark"
        ? "0 16px 40px rgba(0, 0, 0, 0.45)"
        : "0 16px 40px rgba(15, 23, 42, 0.10)",
    "@media (max-width: 767px)": {
      margin: "-40px 12px 0px"
    }
  }
});

export default landingPageStyle;
