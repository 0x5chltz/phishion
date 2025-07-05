'use client'
import { use, useState } from 'react'
import axios from 'axios';
import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import Icon from "@material-ui/core/Icon";
import Popover from "@material-ui/core/Popover";

// import IconButton from "@material-ui/core/IconButton";
// import Dialog from "@material-ui/core/Dialog";
// import DialogTitle from "@material-ui/core/DialogTitle";
// import DialogContent from "@material-ui/core/DialogContent";
// import DialogActions from "@material-ui/core/DialogActions";
// import Slide from "@material-ui/core/Slide";

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

import { Adb, Android, Person, SportsRugbyTwoTone } from "@material-ui/icons";
import { Value } from 'sass';
// import { Link } from '@material-ui/core';

const useStyles = makeStyles(styles);

export default function InspectSection() {
  const classes = useStyles();
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
  const [users  , setUsers] = useState([]);
  const [url, setUrl] = useState("");

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
            <form className={classes.form}>
              <CardHeader color="primary" className={classes.cardHeader}>
                <h4>Phishion AI</h4>
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
                    endAdornment: (
                      <InputAdornment position="end">
                        <Link className={classes.inputIconsColor} />
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
                <Button  color="info" round>
                  <Search className={classes.icons} /> Inspect
                </Button>
                <Button onClick={handleOpenUsers}>
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
                </Popover>
              </CardFooter>
            </form>
          </Card>
        </GridItem>
      </GridContainer>      
    </div>
  );
}