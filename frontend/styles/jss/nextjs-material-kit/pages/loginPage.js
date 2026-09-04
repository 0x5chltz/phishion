import { container } from "/styles/jss/nextjs-material-kit.js";

const loginPageStyle = (theme) => ({
  container: {
    ...container,
    zIndex: "2",
    position: "relative",
    paddingTop: "18vh",
    paddingBottom: "18vh",
    color: "#FFFFFF"
  },
  cardHidden: {
    opacity: "0",
    transform: "translate3d(0, -60px, 0)"
  },
  pageHeader: {
    minHeight: "100vh",
    height: "auto",
    display: "inherit",
    position: "relative",
    margin: "0",
    padding: "0",
    border: "0",
    alignItems: "center",
    "&:before": {
      background: "rgba(0, 0, 0, 0.55)"
    },
    "&:before,&:after": {
      position: "absolute",
      zIndex: "1",
      width: "100%",
      height: "100%",
      display: "block",
      left: "0",
      top: "0",
      content: '""'
    }
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    margin: "4px 0 10px",
    color: theme.palette.text.primary
  },
  cardCopy: {
    color: theme.palette.text.secondary,
    fontSize: "0.9375rem",
    lineHeight: 1.6,
    margin: "0 0 24px"
  },
  icons: {
    width: "20px",
    height: "20px",
    marginRight: "8px"
  }
});

export default loginPageStyle;
