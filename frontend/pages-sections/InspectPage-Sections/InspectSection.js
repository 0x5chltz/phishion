'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/router';
import axios from 'axios';
import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import Popover from "@material-ui/core/Popover";

// @material-ui/icons
import Email from "@material-ui/icons/Email";
import Link from "@material-ui/icons/Link";
import Search from "@material-ui/icons/Search";
// import Close from "@material-ui/icons/Close";

// core components
import { List } from '@material-ui/core';
import GridContainer from "/components/Grid/GridContainer.js";
import GridItem from "/components/Grid/GridItem.js";
import Button from "/components/CustomButtons/Button.js";
import InfoArea from "/components/InfoArea/InfoArea.js";
import Card from "/components/Card/Card.js";
import CardBody from "/components/Card/CardBody.js";
import CardHeader from "/components/Card/CardHeader.js";
import CardFooter from "/components/Card/CardFooter.js";
import CustomInput from "/components/CustomInput/CustomInput.js";
// import styles from "/styles/jss/nextjs-material-kit/pages/landingPageSections/productStyle.js";
import styles from "/styles/jss/nextjs-material-kit/pages/inspectPage.js";

// import { Link } from '@material-ui/core';

const useStyles = makeStyles(styles);

export default function InspectSection() {
  const classes = useStyles();
  const router = useRouter();
  const [anchorElBottom, setAnchorElBottom] = React.useState(null);
  const [cardAnimaton, setCardAnimation] = React.useState("cardHidden");
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCardAnimation("");
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // environtment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const backendname = process.env.NEXT_PUBLIC_BACKEND_NAME || 'api';
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [users  , setUsers] = useState([]);

  const handleScan = async (e) => {
    if (!url) return;

    e.preventDefault();
    setLoading(true);

    try {
        const res = await fetch(`${apiUrl}/${backendname}/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data = await res.json();

        localStorage.setItem("scanResult", JSON.stringify(data));
        
        router.push("/result");
      } catch (err) {
        alert("Gagal menghubungi server");
      } finally {
        setLoading(false);
      }
    };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      console.error("Gagal mengambil clipboard:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/${backendname}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleOpenUsers = (event) => {
    setAnchorElBottom(event.currentTarget);
    fetchUsers();
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
                  labelText="Url"
                  id="url"
                  formControlProps={{
                    fullWidth: true
                  }}
                  inputProps={{
                    type: "url",
                    value: url,
                    onChange: e => setUrl(e.target.value),
                    required: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Link onClick={handlePasteFromClipboard} className={classes.inputIconsColor} />
                      </InputAdornment>
                    )
                  }}
                />
                <CustomInput
                  labelText="Email Content (PRO Version)"
                  id="email"
                  formControlProps={{
                    fullWidth: true
                  }}
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
              </CardBody>
              <CardFooter className={classes.cardFooter}>
                <Button type="submit" disabled={loading} color="info" round>
                  <Search className={classes.icons} /> Inspect
                </Button>
                {/* <Button onClick={handleOpenUsers}>
                  Check Users
                </Button>
                <Popover
                  classes={{
                    paper: classes.popover
                  }}
                  open={Boolean(anchorElBottom)}
                  anchorEl={anchorElBottom}
                  onClose={() => setAnchorElBottom(null)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center"
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "center"
                  }}
                >
                  <h3 className={classes.popoverHeader}>User lists</h3>

                  <List className={classes.popoverList}>
                    {users.map((user, index) => (
                      <InfoArea
                        key={index}
                        title={user.name}
                        description={user.email}
                        icon={Person}
                        iconColor="info"
                        vertical
                      />
                    ))}
                  </List>
                </Popover> */}
              </CardFooter>
            </form>
          </Card>
        </GridItem>
      </GridContainer>      
    </div>
  );
}