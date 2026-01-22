import React, { useEffect } from "react";
// nodejs library that concatenates classes
import classNames from "classnames";
// react components for routing our app without refresh
import Link from "next/link";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// @material-ui/icons
// core components
import Parallax from "/components/Parallax/ParallaxInspect.js";

export default function Logout() {

	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
	const backendname = process.env.NEXT_PUBLIC_BACKEND_NAME || 'api';

useEffect(() => {
	const handleLogout = async (e) => {
		try {
			const res = await fetch(`${apiUrl}/${backendname}/logout`, {
				method: "POST",
				credentials: "include",
			});
		} catch (err) {
			console.error("Logout error:", err);
		} finally {
			window.location.href = "/";
		}
	};

	handleLogout();
	}, []);

  return (
    <div>
      <Parallax image="/img/background_inspect2.png">
				Logging out...
        </Parallax>
    </div>
    );
}

