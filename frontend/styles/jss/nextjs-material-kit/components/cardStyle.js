const cardStyle = (theme) => ({
  card: {
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: "24px",
    marginTop: "0",
    borderRadius: "14px",
    color: theme.palette.text.primary,
    background: theme.palette.background.paper,
    width: "100%",
    boxShadow: theme.palette.type === "dark"
      ? "0 1px 2px 0 rgba(0,0,0,0.3)"
      : "0 1px 3px 0 rgba(15,23,42,0.08)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minWidth: "0",
    wordWrap: "break-word",
    fontSize: ".875rem",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
  },
  cardPlain: {
    background: "transparent",
    boxShadow: "none",
    border: "none",
  },
  cardCarousel: {
    overflow: "hidden",
  },
});

export default cardStyle;
