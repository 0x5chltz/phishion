'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router';
import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import LinearProgress from "@material-ui/core/LinearProgress";

// @material-ui/icons
import Search from "@material-ui/icons/Search";

// core components
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import Badge from "/components/Badge/Badge.js";
import Card from "/components/Card/Card.js";
import CardBody from "/components/Card/CardBody.js";
import CardHeader from "/components/Card/CardHeader.js";
import CardFooter from "/components/Card/CardFooter.js";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";

import { api } from "/lib/api.js";

import styles from "/styles/jss/nextjs-material-kit/pages/inspectPage.js";

const useStyles = makeStyles(styles);

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;
const PENDING_STATUSES = ["queued", "running"];

// The backend verdict vocabulary is exactly: malicious / suspicious / clean.
const BADGE_COLOR_BY_VERDICT = {
  malicious: "danger",
  suspicious: "warning",
  clean: "success",
};

function verdictOf(scan) {
  if (!scan) return null;
  if (scan.verdict) return scan.verdict;
  if (scan.malicious > 0) return "malicious";
  if (scan.suspicious > 0) return "suspicious";
  if (scan.status === "completed") return "clean";
  return null;
}

// Read the scan id that the inspect page stored, as a fallback for the query param.
function scanIdFromStorage() {
  try {
    const saved = localStorage.getItem("scanResult");
    if (!saved) return { id: null, remaining: null };
    const parsed = JSON.parse(saved);
    return {
      id: parsed?.scan?.id ?? null,
      remaining: parsed?.remaining ?? null,
    };
  } catch (e) {
    return { id: null, remaining: null, error: "Failed to load data from local storage" };
  }
}

export default function ResultSection({ onVerdictChange }) {
  const classes = useStyles();
  const router = useRouter();

  const [scan, setScan] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [remaining, setRemaining] = useState(null);

  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;
    let intervalId = null;

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const stored = scanIdFromStorage();
    if (stored.remaining !== null && stored.remaining !== undefined) {
      setRemaining(stored.remaining);
    }

    const queryId = router.query?.id;
    const rawId = Array.isArray(queryId) ? queryId[0] : queryId;
    const scanId = rawId != null && rawId !== "" ? rawId : stored.id;

    if (scanId == null) {
      setLoading(false);
      setError(stored.error || "No scan result data available");
      return () => {
        cancelled = true;
        stopPolling();
      };
    }

    const fetchOnce = async () => {
      try {
        attemptsRef.current += 1;
        const data = await api.scanDetail(scanId);
        if (cancelled) return;

        setWarning(data?.warning || null);

        const nextScan = data?.scan || null;
        setScan(nextScan);

        const status = nextScan?.status;
        if (!PENDING_STATUSES.includes(status)) {
          // completed, failed, or anything terminal: stop polling.
          setLoading(false);
          stopPolling();
          // Notify parent of verdict so robot laser color updates
          if (onVerdictChange) {
            onVerdictChange(verdictOf(nextScan));
          }
          return;
        }

        if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
          setLoading(false);
          setTimedOut(true);
          stopPolling();
        }
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        stopPolling();
        setError(
          err?.status === 404
            ? "Scan result not found"
            : err?.data?.error || err?.message || "Failed to fetch the scan result from the server"
        );
      }
    };

    fetchOnce();
    intervalId = setInterval(fetchOnce, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [router.isReady, router.query?.id]);

  const attributes = scan?.result?.data?.attributes || null;
  const stats = attributes?.last_analysis_stats || null;
  const verdict = verdictOf(scan);
  const maliciousCount = stats?.malicious ?? scan?.malicious ?? 0;

  const engineDetections = Object.entries(attributes?.last_analysis_results || {})
    .filter(([, v]) => v?.category === "malicious" || v?.category === "suspicious");

  const statusLabel = verdict
    ? verdict.charAt(0).toUpperCase() + verdict.slice(1)
    : "Unknown";

  // Published on the card so the scene can colour its beams from the DOM,
  // which also covers a first paint that happens before onVerdictChange runs.
  const LASER_STATUS_BY_VERDICT = {
    malicious: "danger",
    suspicious: "suspicious",
    clean: "safe",
  };
  const laserStatus = error
    ? "error"
    : LASER_STATUS_BY_VERDICT[verdict] || "idle";

  if (loading) {
    return (
      <div className={classes.container}>
        <GridContainer justify="flex-start">
          <GridItem xs={12} sm={6} md={4}>
            <Card className="laser-card" data-laser-status="scanning">
              <CardHeader color="primary" className={classes.cardHeader}>
                <h4>Results</h4>
              </CardHeader>
              <CardBody>
                <Divider style={{ marginBottom: 12 }} />
                <LinearProgress style={{ marginBottom: 16 }} />
                <Typography>
                  {scan?.status === "running"
                    ? "Analysis in progress, this can take a moment..."
                    : "Loading scan result..."}
                </Typography>
                {warning ? (
                  <Typography color="textSecondary" style={{ marginTop: 12 }}>
                    {warning}
                  </Typography>
                ) : null}
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <GridContainer justify="flex-start">
        <GridItem xs={12} sm={6} md={4}>
          <Card className="laser-card" data-laser-status={laserStatus}>
            <CardHeader className={classes.cardHeader}>
              <h4>Results</h4>
            </CardHeader>
            <CardBody>
              <Divider style={{ marginBottom: 12}} />
              {warning ? (
                <Typography color="textSecondary" style={{ marginBottom: 16 }}>
                  {warning}
                </Typography>
              ) : null}
              {error ? (
                <Typography color="error">
                  {typeof error === "object"
                    ? error.message || JSON.stringify(error)
                    : error}
                </Typography>
              ) : timedOut ? (
                <Typography color="error">
                  The scan is still being processed and did not finish in time. Reload this
                  page in a moment to check again.
                </Typography>
              ) : (
                <>
                  <Typography style={{ marginBottom: 16 }}>
                    <strong>URL:</strong> {attributes?.url || scan?.url || "-"}
                  </Typography>
                  <Typography style={{ marginBottom: 16 }}>
                    <strong>Status:</strong> {statusLabel}
                  </Typography>
                  <Typography style={{ marginBottom: 16 }}>
                    <strong>Verdict:</strong>{" "}
                    {verdict ? (
                      <Badge color={BADGE_COLOR_BY_VERDICT[verdict] || "gray"}>
                        {verdict === "malicious"
                          ? `MALICIOUS (${maliciousCount})`
                          : verdict.toUpperCase()}
                      </Badge>
                    ) : (
                      <Badge color="gray">UNKNOWN</Badge>
                    )}
                  </Typography>
                  <Typography style={{ marginBottom: 16 }} component="div">
                    <strong>Detail Engine:</strong>
                    {engineDetections.length ? (
                      <ul>
                        {engineDetections.map(([engine, v]) => (
                          <li key={engine}>
                            {engine}: {v?.result || v?.category}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div>No engine flagged this URL.</div>
                    )}
                  </Typography>
                  <Typography style={{ marginBottom: 16 }} component="div">
                    <strong>Messages:</strong>
                    <br />
                    {attributes?.html_meta?.description || " "}
                    <br />
                    {attributes?.reputation !== undefined && attributes?.reputation !== null
                      ? `The URL reputation is ${attributes.reputation}.`
                      : "The URL reputation is not available."}
                    <br />
                    {"The URL potentionally "}
                    {attributes?.categories?.Webroot ||
                      attributes?.categories?.Sophos ||
                      attributes?.categories?.BitDefender ||
                      attributes?.categories?.Kaspersky ||
                      "Not found"}.
                    <br />
                    {attributes?.html_meta?.generator
                      ? `The generator is ${attributes.html_meta.generator}`
                      : ""}
                    <br />
                  </Typography>
                  <Typography style={{ marginBottom: 16 }}>
                    <strong>Scans Remaining:</strong>{" "}
                    {remaining !== null && remaining !== undefined ? remaining : "Unknown"} scans left.
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
