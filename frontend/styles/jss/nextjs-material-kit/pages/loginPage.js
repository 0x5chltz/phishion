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
  },
  submit: {
    marginTop: "24px"
  },
  formError: {
    background: theme.palette.type === "dark"
      ? "rgba(239, 68, 68, 0.16)"
      : "rgba(220, 38, 38, 0.10)",
    border: `1px solid ${theme.palette.error.main}55`,
    color: theme.palette.type === "dark"
      ? theme.palette.error.main
      : theme.palette.error.dark,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: "0.875rem",
    lineHeight: 1.5,
    margin: "0 0 8px"
  },
  altAction: {
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
    textAlign: "center",
    margin: "20px 0 0"
  },
  altLink: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    textDecoration: "underline",
    textUnderlineOffset: "3px"
  }
});

export default loginPageStyle;
