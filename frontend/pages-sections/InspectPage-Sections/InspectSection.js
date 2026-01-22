'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import { Email, Link as LinkIcon, Search } from "@material-ui/icons";

import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import Card from "/components/Card/Card.js";
import CardBody from "/components/Card/CardBody.js";
import CardHeader from "/components/Card/CardHeader.js";
import CardFooter from "/components/Card/CardFooter.js";
import CustomInput from "/components/CustomInput/CustomInput.js";

import styles from "/styles/jss/nextjs-material-kit/pages/inspectPage.js";

const useStyles = makeStyles(styles);

export default function InspectSection() {
  const classes = useStyles();
  const router = useRouter();

  const [cardAnimaton, setCardAnimation] = useState("cardHidden");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const backendname = process.env.NEXT_PUBLIC_BACKEND_NAME || 'api';

  // Card animation
  useEffect(() => {
    const timer = setTimeout(() => setCardAnimation(""), 700);
    return () => clearTimeout(timer);
  }, []);

  // Get user info
  useEffect(() => {
    fetch(`${apiUrl}/${backendname}/userinfo`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => {
        console.error("Unauthorized", err);
      });
  }, []);

  // Paste clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  // Submit scan
  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/${backendname}/scan`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (res.status !== 200) {
        alert(data.error || "Scan failed");
      } else {
        localStorage.setItem("scanResult", JSON.stringify(data));
        router.push("/result");
      }
    } catch (err) {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <GridContainer justify="flex-start">
        <GridItem xs={12} sm={6} md={4}>
          <Card className={classes[cardAnimaton]}>
            <form onSubmit={handleScan} className={classes.form}>
              <CardHeader className={classes.cardHeader}>
                <h4>Phishion</h4>
              </CardHeader>

              <CardBody>
                <CustomInput
                  labelText="URL"
                  id="url"
                  formControlProps={{ fullWidth: true }}
                  inputProps={{
                    type: "url",
                    value: url,
                    onChange: (e) => setUrl(e.target.value),
                    required: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <LinkIcon onClick={handlePasteFromClipboard} className={classes.inputIconsColor} style={{ cursor: "pointer" }} />
                      </InputAdornment>
                    )
                  }}
                />

                <CustomInput
                  labelText="Email Content (PRO Version)"
                  id="email"
                  formControlProps={{ fullWidth: true }}
                  inputProps={{
                    type: "email",
                    disabled: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Email className={classes.inputIconsColor} />
                      </InputAdornment>
                    )
                  }}
                />
                <div style={{ width: '100%', marginBottom: 8 }}>
                    <p className="text-gray-700 text-sm">
                      <span className="font-mono font-bold">Daily scan limit is (5 per day)</span>
                    </p>
                </div>
              </CardBody>
              <CardFooter className={classes.cardFooter}>
                <Button type="submit" disabled={loading} color="info" round fullWidth>
                  <Search className={classes.icons} /> Inspect
                </Button>
              </CardFooter>
            </form>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
