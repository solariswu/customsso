// This file contains the aPersona MFA settings for the initial passwordless auth transaction verification. (Only available with a local EPND Login.)
// NOTE: If a user elects to login via LSRI, this script will not be run, it will be skipped.
//
import {
  AdminListGroupsForUserCommand,
  ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider';

import axios from 'axios';
import { createHash } from 'node:crypto';

import { fetchConfigData } from './fetchConfigData.mjs';


export const amfaSteps = async (event, headers, client, step) => {

  const response = (statusCode, body) => {
    return {
      statusCode,
      headers,
      body: JSON.stringify({ message: body }),
    };
  };

  function hash(content) {
    return createHash('md5').update(content).digest('hex');
  }

  try {
    const [tenantData, amfaConfigs] = await fetchConfigData();
    // API vars saved in node.js property file in the back-end node.js
    const salt = amfaConfigs.salt; // Pull this from a property file. All MFA services will use this same salt to read and write the one_time_token-Cookie.
    console.log('salt', salt);

    const asmurl = 'https://asm2.apersona.com:8443/asm';  // Url of the Adaptive MFA Server.

    console.log('steps inside:', event);

    const listUsersParam = {
      UserPoolId: process.env.USERPOOL_ID,
      // AttributesToGet: ["email"],
      Filter: "email = \"" + event.email + "\"",
      // Limit: 1,
    };

    console.log("listUsersParam", listUsersParam);

    const listUsersRes = await client.send(new ListUsersCommand(listUsersParam));
    console.log('listUsersRes:', listUsersRes);

    if (!listUsersRes || !listUsersRes.Users || listUsersRes.Users.length === 0) {
      console.log('Did not find valid user for email:', event.email);
      return response(500, 'Did not find valid user for this email');
    };

    console.log('UserAttributes:', listUsersRes.Users[0].Attributes);

    const param = {
      UserPoolId: process.env.USERPOOL_ID,
      Username: listUsersRes.Users[0].Username,
    };

    const userGroup = await client.send(new AdminListGroupsForUserCommand(param));
    console.log('userGroup:', userGroup);

    if (!userGroup || !userGroup.Groups || userGroup.Groups.length === 0) {
      console.log('Did not find a valid user group');
      return response(500, 'Did not find a valid user group');
    }

    const ug = userGroup.Groups[0].GroupName;
    console.log('ug:', ug);

    const l = tenantData[ug] ? tenantData[ug] : '';

    if (l === '') {
      console.log('Did not find a valid ASM Policy for the user group:', ug);
      return response(
        500,
        `Did not find a valid ASM Policy for the user group:${ug})`
      );
    }

    // This is the ASM Security Policy key. This key needs to be picked up from a NodeJS back-end propery file based on the role of the user based on their email address-keycloak account.
    // Ex. If user_role=super admin, then l='epnd-su-72ja37bc51mz', ELSE if user_role=cohort owner, then l=asm_policy_for_cohort_owners, etc. etc.

    let wr = event.origin;//'epnd.com'; // This is the domain of the services where MFA is being setup. It must match the domain for the HTTPS URL domain where the cookie is secured.
    let sfl = 6; // This should be picked up via property file. It should be set to 5 or 6. Can also be set based on user security group. If admin, sfl=6 else sfl=5. Should never be set less than 5.

    // API vars that come from the end-user javascript front-end client via post or cookie read
    let u = event.email; //'ksparksnc@icloud.com'; // email address of the user. Entered from front end web service to login via post.
    let igd = event.rememberDevice === 'true' ? 1 : 0; // On the main login page, add a checkbox:  [ ] Remember this device, I own it. If checked, set igd = 0 and send it with all related transactions until the login process completes
    // If it's not checked (default) set igd = 1. This will ensure no forensics are collected on a public terminal or shared devices.
    // If the user checks the box, then node.js needs to save this preference in the browser under local storage.  see: https://codepen.io/kylastoneberg/pen/qweppq
    let a = encodeURI(event.authParam);
    //encodeURI('{"apersonaKey":"36b284dffbd5-956bf51bb14ce-cfd6ce53e8c87d4","deviceType":"PC","osInfo":"Windows - 7","deviceInfo":"device_info_here","browserInfo":"Chrome - 32.0.1700.107","webHost":"10.5.1.5:8080","pageUrl":"/svcs/login.ap"}');
    // The a variable is taken from the variable authParam, which is generated client side using the apersona javascript and passed to the backend via post.
    // The example provide above is an example of what the authParamstring looks like.

    // API vars that are known previously and should be reused

    // API vars that are detected or generated  on the back-end node.js
    let uIp = event.uIP ? event.uIP : '00000000000'; // This is the client ip address as detected from the NodeJS server. see: https://www.abstractapi.com/guides/node-js-get-ip-address Let's'45.23.45.12'; // This is the client ip address as detected from the NodeJS server. see: https://www.abstractapi.com/guides/node-js-get-ip-address Let's use request.header.
    let apti = event.apti; // This key needs to be a randon key that is set for each new login process and kept and sent in until the user succeeds or fails their login.
    let otpm = 'e'; // This is the otp method. The default is e, which stands for email. If users have other methods for verification, this field can be used to set the method. s for sms, v for voice, ae for alt-email.
    let p = u; // OTP Method value. Making p=u is our default use case to begin with. In order to do other methods, the end user will need a way to manage their other methods, like phone number, alt-email, mobile token.

    // API vars that are hard coded for this type of API call in the back-end node.js
    let otpp = 1; // OTP PAUSE: This tells asm to not send out an otp, essentially pauses it. For the initial passwordless auth, this should be set and sent.
    let nsf = 3; // No saving of Forensics:  nsf=0 means ASM will continue to save and update forensics and passwordless auth will auto extend to the policy ttl.
    // nsf=1 means asm will not save any forensics and as a result, passwordless will expire no matter what on the ttl.
    // With the next release of ASM, we will be setting nsf=3 which will not save device forensics, but it will contine to update the one time use cookie/token, which is more secure.
    let tType = 'Initial passwordless login verification'; // Transaction typelLabel for audit logs.
    if (step === 2) {
      tType = 'Password verification';
    }
    let af1 = u + 'passwordless_check' + uIp; // This is the passwordless behavior tracker.
    // This var creates a behavior key for passwordless auth. By adding the email and uIP, a user will only be able to use passwordless auth from a known previously used location.

    const amfaCookieName = hash(`${u}${wr}${salt}`);
    let c = (event.cookies && event.cookies[amfaCookieName]) ? event.cookies[amfaCookieName] : ''; //'278dcbdee5660876c230650ebb4bd70e';  // For every new MFA Auth login the nodeJS backend needs to read the cookie from teh client if it exists and send it in.


    let postURL = asmurl +
      '/extAuthenticate.kv?' +
      'l=' +
      l +
      '&u=' +
      u +
      '&uIp=' +
      uIp +
      '&apti=' +
      apti +
      '&c=' +
      c +
      '&wr=' +
      wr +
      '&igd=' +
      igd +
      '&otpm=' +
      otpm +
      '&p=' +
      p +
      '&otpp=' +
      otpp +
      '&tType=' +
      tType +
      '&af1=' +
      af1 +
      '&a=' +
      a;

    if (step === 1) {
      postURL = postURL + '&sfl=' + sfl + '&nsf=' + nsf;
    }

    console.log('now posting to : ', postURL);
    // Execute the authentication API
    const amfaResponse = await axios.post(postURL);

    console.log('step' + step + ' response:', amfaResponse);

    Date.prototype.addDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    }

    var date = new Date();

    switch (amfaResponse.statusCode) {
      case 200:
        if (amfaResponse.data === 'OK') {
          const cookieValue = `${amfaCookieName}=${amfaResponse.identifier}; Domain=${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}; HttpOnly; Expires=${date.addDays(120).toUTCString()}; Secure; SameSite=None; Path=/`;

          return {
            message: 'OK',
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
              'Access-Control-Allow-Origin': `https://${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`,
              'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
              'Set-Cookie': cookieValue,
            }
          };
        }
        return response(502, 'The login service is not currently available. Contact the help desk.');
      case 202:
        return response(202, response.data);
      case 203:
        return response(402, 'Your location is not permitted. Contact the help desk.');
      default:
        return response(503, 'We ran into an issue. Please contact the help desk.');
    }
  }
  catch (error) {
    console.error('Error in step ' + step + ':', error);
    return response(500, error);
  }

}

  // Once the adaptive mfa api is executed, there are a number of possible return codes.
  // Below are those return codes along with the behavior that should be performed as a result.
  // code: 200 message: 0K   (IMPORTANT: Pull the identifier from the response and save it as a SECURE (https only/domain specific) long life cookie 120 days. cookie_name: hash(u+wr+salt).
  //                    Allow the user to login. Enable all SSO Tokens and put the user in session.)
  //                    Reading and writing cookies: https://stackoverflow.com/questions/3393854/get-and-set-a-single-cookie-with-node-js-http-server
  // code: 200 message: {anything other than OK}
  //                    In this case the ASM Admin has set the policy in maintenace or turned on auto learning,
  //                    which for passwordless we don't want to allow.
  //                    DO NOT Log the user in. Instead put them back to the login page with
  //                    error: "The login service is not currently available. Contact the help desk."
  // code: 202          User did not pass the passwordless verification. Push the user to the password page and request they enter their password.
  // code: 203          Contry blocked or threat actor location detected. Push the user back to the initial login page with this error: "Your location is not permitted. Contact the help desk."
  // code: Anything else: Default - Push the user back to the initial login page with the error: "We ran into an issue. Please contact the help desk."
  //
