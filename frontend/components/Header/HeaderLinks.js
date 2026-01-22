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
import Login from "@material-ui/icons/Login";
import Logout from "@material-ui/icons/Logout";
// core components
import Button from "/components/CustomButtons/Button.js";

import styles from "/styles/jss/nextjs-material-kit/components/headerLinksStyle.js";

const useStyles = makeStyles(styles);

export default function HeaderLinks(props) {
  const classes = useStyles();
  const router = useRouter();
  const [ url, setUrl ] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const backendname = process.env.NEXT_PUBLIC_BACKEND_NAME || 'api';

  const [username, setUsername] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${apiUrl}/${backendname}/userinfo`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Not authenticated");
        
		const data = await res.json();
        setUsername(data.username || "Guest");
        } catch (err) {
        console.error("Failed to fetch user:", err);
        setUsername("Guest");
		}
	  };
    
	fetchUser();
}, []);

  const isAuthenticated = username && username !== "Guest";
  const notAuthenticated = username && username === "Guest";

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

      {/* Login / Logout */}
      {notAuthenticated && (
        <ListItem className={classes.listItem}>
          <Button
            href="/login"
            color="transparent"
            target="_self"
            className={classes.navLink}
          >
            <Login className={classes.icons}/> Login
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
		  <Logout className={classes.icons} /> Logout
		 </Button>
		</ListItem>
		)}
    </List>
  );
}
