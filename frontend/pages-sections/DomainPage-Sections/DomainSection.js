import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";
import InputAdornment from "@material-ui/core/InputAdornment";
import Language from "@material-ui/icons/Language";
import Search from "@material-ui/icons/Search";

import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import Card from "/components/Card/Card.js";
import CardBody from "/components/Card/CardBody.js";
import CardHeader from "/components/Card/CardHeader.js";
import CardFooter from "/components/Card/CardFooter.js";
import CustomInput from "/components/CustomInput/CustomInput.js";

import styles from "/styles/jss/nextjs-material-kit/pages/inspectPage.js";
import { api } from "../../lib/api";

const useStyles = makeStyles(styles);

export default function DomainSection() {
  const classes = useStyles();
  const [hostname, setHostname] = useState("");
  const [subdomains, setSubdomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedDomain, setSearchedDomain] = useState("");

  const handleLookup = async (event) => {
    event.preventDefault();
    const normalizedHostname = hostname.trim().toLowerCase().replace(/\.$/, "");
    if (!normalizedHostname) return;

    setLoading(true);
    setError("");
    setSubdomains([]);

    try {
      // Via lib/api.js so the API origin follows the page hostname and a
      // non-2xx response throws with .status attached.
      const data = await api.domain(normalizedHostname);

      const discovered = Array.isArray(data.subdomains) ? data.subdomains : [];
      setSubdomains(discovered.sort((left, right) => left.localeCompare(right)));
      setSearchedDomain(normalizedHostname);
    } catch (requestError) {
      setError(requestError.message || "Server error");
      setSearchedDomain("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <GridContainer justify="flex-start">
        <GridItem xs={12} sm={8} md={6}>
          <Card>
            <form onSubmit={handleLookup} className={classes.form}>
              <CardHeader className={classes.cardHeader}>
                <h4>Subdomain Discovery</h4>
              </CardHeader>
              <CardBody>
                <CustomInput
                  labelText="Domain (example.com)"
                  id="hostname"
                  formControlProps={{ fullWidth: true }}
                  inputProps={{
                    type: "text",
                    value: hostname,
                    onChange: (event) => setHostname(event.target.value),
                    required: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Language className={classes.inputIconsColor} />
                      </InputAdornment>
                    )
                  }}
                />

                {loading && <LinearProgress style={{ marginBottom: 16 }} />}
                {error && <Typography color="error">{error}</Typography>}

                {!loading && searchedDomain && !error && (
                  <>
                    <Divider style={{ marginBottom: 12 }} />
                    <Typography style={{ marginBottom: 12 }}>
                      <strong>{subdomains.length}</strong> subdomain(s) found for{" "}
                      <strong>{searchedDomain}</strong>
                    </Typography>
                    {subdomains.length > 0 ? (
                      <ul style={{ maxHeight: 300, overflowY: "auto", paddingLeft: 24 }}>
                        {subdomains.map((subdomain) => (
                          <li key={subdomain}>
                            {subdomain}.{searchedDomain}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography>No subdomains were found.</Typography>
                    )}
                  </>
                )}
              </CardBody>
              <CardFooter className={classes.cardFooter}>
                <Button type="submit" disabled={loading} color="info" round fullWidth>
                  <Search className={classes.icons} /> Discover
                </Button>
              </CardFooter>
            </form>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
