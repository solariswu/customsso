import { useEffect, useState } from "react";
import { AppBar, Logout, UserMenu } from "react-admin";

import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import EditNoteIcon from "@mui/icons-material/EditNote";

import { amfa_service_domain } from "./aws-export";

import { useFeConfigs } from './configs/FeConfigProvider';

export const AmfaAppBar = () => {
  const branding = useFeConfigs();


  const UserProfile = () => {
    const isXSmall = useMediaQuery((theme) => theme.breakpoints.down("sm"));
    return (
      <MenuItem
        onClick={() =>
          window.location.assign(`https://${amfa_service_domain}/selfservice`)
        }
        component={isXSmall ? "span" : "li"}
      >
        <ListItemIcon>
          <EditNoteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Profile</ListItemText>
      </MenuItem>
    );
  };

  return (
    <AppBar
      userMenu={
        <UserMenu>
          <UserProfile />
          <Logout />
        </UserMenu>
      }
      sx={{
        "& .RaAppBar-menuButton": { display: "none" },
      }}
    >
      <Typography
        variant="h6"
        color="inherit"
        id="react-admin-title"
        sx={{
          flex: 1,
          textoverflow: "ellipsis",
          whitespace: "nowrap",
          overflow: "hidden",
          marginleft: -10,
        }}
      />
      <div style={{ flex: 10, textAlign: "center", verticalAlign: "center" }}>
        {branding && <img
          src={branding?.app_bar_logo_url}
          alt="logo"
          width="200"
          style={{ marginTop: "6px" }}
        />}
      </div>
    </AppBar>
  );
};
