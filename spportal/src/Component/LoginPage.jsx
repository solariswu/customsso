import {
  login_page_center_color,
  login_page_outter_color,
} from "../configs/configs_ui.mjs";
import LoginForm from "./LoginForm";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

const LoginPage = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const errMsg = queryParams.get("err");

  // console.log ('errmsg', errMsg)
  // <Login>
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
        backgroundImage: `radial-gradient(circle at 50% 14em, ${login_page_center_color} 0%, ${login_page_outter_color} 60%, ${login_page_outter_color} 100%)`,
      }}
    >
      <Card
        className={"RaLogin-card"}
        style={{
          minWidth: 350,
          marginTop: "6em",
        }}
      >
        <LoginForm />
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
