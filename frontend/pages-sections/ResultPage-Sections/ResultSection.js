'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import LinearProgress from "@material-ui/core/LinearProgress";

// @material-ui/icons
import Search from "@material-ui/icons/Search";

// core components
import { List } from '@material-ui/core';
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import Badge from "/components/Badge/Badge.js";
import InfoArea from "/components/InfoArea/InfoArea.js";
import Card from "/components/Card/Card.js";
import CardBody from "/components/Card/CardBody.js";
import CardHeader from "/components/Card/CardHeader.js";
import CardFooter from "/components/Card/CardFooter.js";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";

import styles from "/styles/jss/nextjs-material-kit/pages/inspectPage.js";

const useStyles = makeStyles(styles);

export default function ResultSection() {
  const classes = useStyles();
  const router = useRouter();

  // environtment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const backendname = process.env.NEXT_PUBLIC_BACKEND_NAME || 'api';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
  const saved = localStorage.getItem("scanResult");
  if (!saved) {
    setResult({ error: "Tidak ada data hasil scan" });
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    const url_id = parsed?.url_id || parsed?.id;

    if (!url_id) {
      setResult({ error: "ID hasil scan tidak ditemukan" });
      return;
    }

    setLoading(true);

    fetch(`${apiUrl}/${backendname}/scan/${url_id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setResult({ error: data.error });
        } else {
          setResult(data);
          setRemaining(data.remaining ?? "Tidak diketahui");
        }
      })
      .catch(() => {
        setResult({ error: "Gagal mengambil hasil scan dari server" });
      })
      .finally(() => setLoading(false));
  } catch (e) {
    setResult({ error: "Gagal memuat data dari localStorage" });
  }
}, []);


  if (loading) {
    return (
      <div className={classes.container}>
        <GridContainer justify="flex-start">
          <GridItem xs={12} sm={6} md={4}>
            <Card>
              <CardHeader color="primary" className={classes.cardHeader}>
                <h4>Results</h4>
              </CardHeader>
              <CardBody>
                <Divider style={{ marginBottom: 12 }} />
                <LinearProgress style={{ marginBottom: 16 }} />
                <Typography>Loading scan result...</Typography>
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className={classes.container}>
      <GridContainer justify="flex-start">
        <GridItem xs={12} sm={6} md={4}>
          <Card>
            <CardHeader  className={classes.cardHeader}>
              <h4>Results</h4>
            </CardHeader>
            <CardBody>
              <Divider style={{ marginBottom: 12}} />
              {loading && <LinearProgress style={{ marginBottom: 16 }} />}
              {result.error ? (
                <Typography color="error">
                  {typeof result.error === "object"
                    ? result.error.message || JSON.stringify(result.error)
                    : result.error}
                </Typography>
              ) : (
                <>
                  <Typography style={{ marginBottom: 16 }}>
                    <strong>URL:</strong> {result.scan_result.data?.attributes?.url || "-"}
                  </Typography>
                  <Typography style={{ marginBottom: 16 }}>
                    <strong>Status:</strong>{" "}
                    {result.scan_result.data?.attributes?.last_analysis_stats?.malicious > 0
                      ? "Malicious"
                      : result.scan_result.data?.attributes?.last_analysis_stats?.suspicious > 0
                        ? "Suspicious"
                        : "Clean"}
                  </Typography>
                  <Typography style={{ marginBottom: 16 }}>
                    <strong>Malicious:</strong>{" "}
                    {result.scan_result.data?.attributes?.last_analysis_stats?.malicious > 0
                      ? <Badge color='warning'>YES ({result.scan_result.data.attributes.last_analysis_stats.malicious})</Badge>
                      : <Badge color='success'>NO</Badge>}
                  </Typography>
                  <Typography style={{ marginBottom: 16 }}>
                    <strong>Detail Engine:</strong>
                    <ul>
                      {Object.entries(result.scan_result.data?.attributes?.last_analysis_results || {})
                        .filter(([_, v]) => v.category === "malicious" || v.category === "suspicious")
                        .map(([engine, v]) => (
                          <li key={engine}>
                            {engine}: {v.result}
                          </li>
                        ))}
                    </ul>
                  </Typography>
                  <Typography style={{ marginBottom: 16 }}>
                    <strong>Messages:</strong>{" "}
                    <br></br>
                    {result.scan_result.data?.attributes?.html_meta?.description || " "}
                    <br></br>
                    {" The URL reputation is " + result.scan_result.data?.attributes?.reputation || ""}.
                    <br></br>
                    The URL potentionally{" "}
                    {result.scan_result.data?.attributes?.categories?.Webroot ||
                      result.scan_result.data?.attributes?.categories?.Sophos ||
                      result.scan_result.data?.attributes?.categories?.BitDefender ||
                      result.scan_result.data?.attributes?.categories?.Kaspersky ||
                      "Not found"}.
                    <br></br>
                    {" The generator is " + result.scan_result.data?.attributes?.html_meta?.generator || ""}
                    <br></br>
                    </Typography>
                    <Typography style={{ marginBottom: 16 }}>
                    <strong>Scans Remaining:</strong>{" "}
                    {remaining !== null ? remaining : "-"} scans left.
                  </Typography>
                </>
              )}
            </CardBody>
            <CardFooter className={classes.cardFooter}>
              <Button onClick={() => router.push("/inspect")} color="info" round>
                <Search className={classes.icons} /> Inspect Another URL
              </Button>
            </CardFooter>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}