import { UserManager } from "oidc-client-ts";
import { AuthProvider } from "react-admin";


import { getProfileFromToken } from "./getProfileFromToken";

import awsExports, { amfa_service_domain } from "../aws-export";

const issuer = `https://cognito-idp.${awsExports.aws_project_region}.amazonaws.com/${awsExports.aws_user_pools_id}`;
const clientId = awsExports.aws_user_pools_web_client_id;
const redirectUri = `${window.location.protocol}//${window.location.host}/auth-callback`;
const oauth2Url = awsExports.aws_oauth_domain;
const logoutUri = `${window.location.protocol}//${window.location.host}`;


const userManager = new UserManager({
  authority: issuer as string,
  client_id: clientId as string,
  redirect_uri: redirectUri as string,
  response_type: "code",
  scope: "openid profile", // Allow to retrieve the email and user name later api side
});

const cleanup = () => {
  // Remove the ?code&state from the URL
  window.history.replaceState(
    {},
    window.document.title,
    window.location.origin
  );
};

const authProvider: AuthProvider = {
  login: async () => {
    // 1. Redirect to the issuer to ask authentication
    await userManager.signinRedirect();
    return; // Do not return anything, the login is still loading
  },
  logout: () => {
    // console.log('logout')
    // Remove the token from the local storage
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
      // console.log('logout url', `${oauth2Url}/logout?client_id=${clientId}&logout_uri=${logoutUri}`)
      // 2. Redirect to the issuer to ask logout
      window.location.href = `${oauth2Url}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
    }
    return Promise.resolve();
  },
  checkError: () => {
    // console.log('checkError')
    // localStorage.removeItem("token");
    return Promise.reject();
    // return Promise.resolve();
  },
  checkAuth: () => {
    const token = localStorage.getItem("token");

    if (!token || token.length === 0 || token === 'null') {
      return Promise.reject();
    }

    // This is specific to the Google authentication implementation
    const jwt = getProfileFromToken(token);
    const now = new Date();

    return now.getTime() > jwt.exp * 1000
      ? Promise.reject()
      : Promise.resolve();
  },
  getPermissions: () => Promise.resolve(),
  getIdentity: () => {
    const token = localStorage.getItem('token');
    if (!token || token.length === 0) {
      return Promise.reject();
    }

    const profile = getProfileFromToken(token);
    // console.log ('ygwu profile', profile)

    return Promise.resolve({
      id: profile.sub,
      fullName: profile.email ? profile.email : 'unknown',
      email: profile.email,
      //profile.given_name ? profile.given_name : profile.email,
      //profile.given_name + ' ' + profile.family_name,
      avatar: profile.picture,
    });
  },
  handleCallback: async () => {
    // We came back from the issuer with ?code infos in query params
    const { searchParams } = new URL(window.location.href);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    // console.log('ygwu code', code, ' state', state)

    if (!code || !state) {
      return Promise.resolve()
    }

    // oidc-client uses localStorage to keep a temporary state
    // between the two redirections. But since we need to send it to the API
    // we have to retrieve it manually
    const stateKey = `oidc.${state}`;
    const { code_verifier } = JSON.parse(
      localStorage.getItem(stateKey) || "{}"
    );

    const params = {
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code: code, code_verifier
    };

    let body = Object.entries(params)
      .map((item) => { return encodeURIComponent(item[0]) + '=' + encodeURIComponent(item[1]); })
      .join('&');
    const response = await fetch(`${oauth2Url}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });


    if (!response.ok) {
      cleanup();
      return Promise.reject();
    }

    const token = await response.json();

    localStorage.setItem('token', token.id_token);
    userManager.clearStaleState();
    cleanup();
    return Promise.resolve();
  },
};

export default authProvider;