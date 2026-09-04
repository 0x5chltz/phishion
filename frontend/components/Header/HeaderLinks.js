'use client';
/*eslint-disable*/
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Icon from "@material-ui/core/Icon";
// @material-ui/icons
import ExitToApp from "@material-ui/icons/ExitToApp";
import Brightness4 from "@material-ui/icons/Brightness4";
import Brightness7 from "@material-ui/icons/Brightness7";
// core components
import Button from "/components/CustomButtons/Button.js";
import CustomDropdown from "/components/CustomDropdown/CustomDropdown.js";
import { useThemeMode } from "/context/ThemeContext.js";
import { api } from "/lib/api.js";

const TOOL_ROUTES = {
  "Scan History": "/history",
  "Batch Scan": "/batch",
  "Bulk Import": "/import",
  "Compare Scans": "/compare",
  "Search & Export": "/search",
  "Analytics": "/analytics",
  "Scheduled Scans": "/scheduled",
  "Manage Tags & Lists": "/manage",
  "Settings": "/settings",
};

import styles from "/styles/jss/nextjs-material-kit/components/headerLinksStyle.js";

const useStyles = makeStyles(styles);

export default function HeaderLinks(props) {
  const classes = useStyles();
  const router = useRouter();
  const [ url, setUrl ] = useState("");

  const [username, setUsername] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Goes through lib/api.js so the API origin follows the page hostname.
    // A hardcoded localhost here broke every call when the app was opened on
    // 127.0.0.1, and a 401 is the normal anonymous case, not an error worth
    // logging on every page load.
    api
      .userinfo()
      .then((data) => {
        if (cancelled) return;
        try {
          localStorage.setItem("Username", data.username);
        } catch (_) {
          // Storage unavailable in private mode; not required.
        }
        setUsername(data.username || "Guest");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status !== 401) console.error("Failed to fetch user:", err);
        setUsername("Guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated = username && username !== "Guest";
  const notAuthenticated = username && username === "Guest";
  const { mode, toggle } = useThemeMode();

  const handleToolSelect = (label) => {
    const route = TOOL_ROUTES[label];
    if (route) router.push(route);
  };

  return (
    <List className={classes.list}>
      {/* Show user info */}
      <ListItem className={classes.listItem}>
        <Button
          href="/profile"
          color="transparent"
          target="_self"
          className={classes.navLink}
        >
          <Icon className={classes.icons}>person</Icon>{" "}
          {username === null ? "Loading..." : username}
        </Button>
      </ListItem>

      {/* Show inspect menu for all */}
      <ListItem className={classes.listItem}>
        <Button
          href="/inspect"
          color="transparent"
          target="_self"
          className={classes.navLink}
        >
          <Icon className={classes.icons}>search</Icon> Inspect
        </Button>
      </ListItem>

      {/* Subdomain discovery */}
      <ListItem className={classes.listItem}>
        <Button
          href="/domains"
          color="transparent"
          target="_self"
          className={classes.navLink}
        >
          <Icon className={classes.icons}>language</Icon> Domains
        </Button>
      </ListItem>

      {/* Tools dropdown for authenticated users */}
      {isAuthenticated && (
        <ListItem className={classes.listItem}>
          <CustomDropdown
            navDropdown
            buttonText="Tools"
            buttonIcon="build"
            dropdownHeader="Threat Intelligence Tools"
            buttonProps={{
              className: classes.navLink,
              color: "transparent",
            }}
            onClick={handleToolSelect}
            dropdownList={Object.keys(TOOL_ROUTES)}
          />
        </ListItem>
      )}

      {/* Theme toggle */}
      <ListItem className={classes.listItem}>
        <Button
          color="transparent"
          className={classes.navLink}
          onClick={toggle}
          aria-label="Toggle dark mode"
        >
          {mode === "dark" ? (
            <Brightness7 className={classes.icons} />
          ) : (
            <Brightness4 className={classes.icons} />
          )}
        </Button>
      </ListItem>

      {/* Login / Logout */}
      {notAuthenticated && (
        <ListItem className={classes.listItem}>
          <Button
            href="/login"
            color="transparent"
            target="_self"
            className={classes.navLink}
          >
            <ExitToApp className={classes.icons}/> Login
          </Button>
        </ListItem>
	  )}

	  {isAuthenticated && (
		<ListItem className={classes.listItem}>
		 <Button
		  href="/logout"
		  color="transparent"
		  target="_self"
		  className={classes.navLink}
		 >
		  <ExitToApp className={classes.icons} /> Logout
		 </Button>
		</ListItem>
		)}
    </List>
  );
}
