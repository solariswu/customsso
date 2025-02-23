import { useEffect } from "react";
import Favicon from "react-favicon";

import { Admin, Resource, houseLightTheme } from "react-admin";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";

import authProvider from "./Component/authProvider";
import { dataProvider } from "./Component/dataProvider";
import LoginPage from "./Component/LoginPage";
import { MyAuthCallbackPage } from "./Component/MyAuthCallbackPage";
import serviceproviders from "./serviceproviders";
import { AmfaLayout } from "./AmfaLayout";
import { useFeConfigs } from "./configs/FeConfigProvider";


const messages = {
  en: englishMessages,
};

const i18nProvider = polyglotI18nProvider((locale) => messages[locale], "en", {
  allowMissing: true,
});

export const App = () => {
  // useEffect(() => {
  //   const fetchBranding = async () => {
  //     const res = await fetch('/branding.json')
  //     const data = await res.json()
  //     setBranding(data)
  //     document.title = data.app_title;
  //   }
  //   fetchBranding()
  //   document.title = '';

  // }, []);

  const branding = useFeConfigs();

  if (branding) {
    document.title = branding.app_title;

    const userTheme = {
      ...houseLightTheme,
      sidebar: {
        width: 0, // The default value is 240
        closedwWidth: 0,
      },
      components: {
        ...houseLightTheme.components,
        RaAppBar: {
          styleOverrides: {
            root: {
              "& .RaAppBar-toolbar": {
                color: branding.app_title_icon_color,
                backgroundImage: `linear-gradient(310deg, ${branding.app_bar_end_color}, ${branding.app_bar_start_color})`,
              },
            },
          },
        },
      },
    };

    return (
      <>
        <Favicon url={branding.fav_icon_url} />
        <Admin
          disableTelemetry
          theme={userTheme}
          authProvider={authProvider}
          dataProvider={dataProvider}
          loginPage={LoginPage}
          layout={AmfaLayout}
          locale="en" // Add this...
          i18nProvider={i18nProvider}
        >
          requireAuth={true}
          authCallbackPage={MyAuthCallbackPage}
          <Resource name="serviceproviders" {...serviceproviders} />
        </Admin>
        <div
          style={{
            position: "fixed",
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 100,
            padding: 6,
            backgroundColor: "white",
            textAlign: "center",
            color: "grey",
            fontSize: "11px",
          }}
        >
          Copyright &copy; 2024 aPersona Inc. v1.0{" "}
          <a href={branding.app_privacy_url} target="_blank" rel="noreferrer">Privacy Policy</a>
          {" and "}
          <a href={branding.app_terms_url} target="_blank" rel="noreferrer">Terms of Service</a>
          {" apply"}
        </div>
      </>
    )
  }
  else {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }
};
