const cardStyle = {
  card: {
    border: "1px solid rgb(0, 200, 255)",
    marginBottom: "30px",
    marginTop: "30px",
    borderRadius: "6px",
    color: "rgb(255, 255, 255)",
    background: "rgba(73, 73, 73, 0.90)",
    width: "100%",
    boxShadow:
      "0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minWidth: "0",
    wordWrap: "break-word",
    fontSize: ".875rem",
    transition: "all 300ms linear",
  },
  cardPlain: {
    background: "transparent",
    boxShadow: "none",
  },
  cardCarousel: {
    overflow: "hidden",
  },
};

export default cardStyle;
