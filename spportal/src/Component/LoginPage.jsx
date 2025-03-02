import { useFeConfigs } from "../configs/FeConfigProvider";
import LoginForm from "./LoginForm";
import Card from "@mui/material/Card";

const LoginPage = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const errMsg = queryParams.get("err");
  const branding = useFeConfigs();

  if (!branding) {
    return <div></div>;
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        height: "1px",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundImage: `radial-gradient(circle at 50% 14em, ${branding.login_page_center_color} 0%, ${branding.login_page_outter_color} 60%, ${branding.login_page_outter_color} 100%)`,
      }}
    >
      <Card
        className={"RaLogin-card"}
        style={{
          minWidth: 350,
          marginTop: "6em",
        }}
      >
        <LoginForm logo={branding.app_login_logo_url} title={branding.app_title}/>
        <div
          style={{
            textAlign: "center",
            padding: "0em 0.5em 0.5em 0.5em",
            color: "red",
          }}
        >
          {errMsg?.split("\\n").map((i, key) => {
            // console.log ('i', i)
            return <div key={key}>{i}</div>;
          })}
        </div>
      </Card>
    </div>
  );
};
export default LoginPage;
