// This file contains the aPersona MFA settings for the initial passwordless auth transaction verification. (Only available with a local EPND Login.)
// NOTE: If a user elects to login via LSRI, this script will not be run, it will be skipped.
//
import {
  AdminListGroupsForUserCommand,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { createHash } from 'node:crypto';

import { fetchCode } from './fetchCode.mjs';
import { passwordlessLogin } from './passwordlessLogin.mjs';

import { signUp } from './signUp.mjs';

import { cookie2NamePrefix } from '../const.mjs';

import { genSessionID } from './genSessionID.mjs';
import { fetchConfig } from './fetchConfig.mjs';

import { updateProfile } from './updateProfile.mjs';
import { checkSessionId } from './checkSessionId.mjs';
import { getTType } from './amfaUtils.mjs';
import { getTotp } from './totp/getToken.mjs';
import { validateTotp } from './totp/verifyOtp.mjs';

export const amfaSteps = async (event, headers, cognito, step) => {

  const response = (statusCode, body, requestIdIn) => {
    const requestId = requestIdIn ? requestIdIn : '';

    return {
      isBase64Encoded: false,
      statusCode,
      headers: { ...headers, requestId },
      body: JSON.stringify({ message: body }),
    };
  };

  const cookieEnabledHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Set-Cookie,Cookie,X-Requested-With',
    'Access-Control-Allow-Origin': `https://${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`,
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
    'Access-Control-Expose-Headers': 'Set-Cookie',
    'Access-Control-Allow-Credentials': 'true',
  };

  const transUAttr = async (userAttributes, amfaConfigs) => {
    const phoneNumber = userAttributes.phone_number ? userAttributes.phone_number.replace(/(\d{3})(\d{5})(\d{1})/, '$1xxx$3') : null;
    let aemail = userAttributes['custom:alter-email'] ? userAttributes['custom:alter-email'] : null;
    (aemail && aemail.indexOf('@') > 0) ?
      aemail = `${aemail[0]}xxx@${aemail[aemail.lastIndexOf('@') + 1]}xx.${aemail.substring((aemail.lastIndexOf('.') + 1))}`
      : aemail = null;

    const vPhoneNumber = userAttributes['custom:voice-number'] ? userAttributes['custom:voice-number'].replace(/(\d{3})(\d{5})(\d{1})/, '$1xxx$3') : null;
    const mobileToken = await getTotp(event.email, amfaConfigs.totp?.asm_provider_id);

    let tempOtpData = { phoneNumber, aemail, vPhoneNumber, mobileToken };

    let otpData = { aemail: null, phoneNumber: null, vPhoneNumber: null, mobileToken: null };

    if (amfaConfigs.master_additional_otp_methods) {
      amfaConfigs.master_additional_otp_methods.forEach(method => {
        switch (method) {
          case 'ae':
            otpData.aemail = tempOtpData.aemail;
            break;
          case 's':
            otpData.phoneNumber = tempOtpData.phoneNumber;
            break;
          case 'v':
            otpData.vPhoneNumber = tempOtpData.vPhoneNumber;
            break;
          case 't':
            otpData.mobileToken = mobileToken;
            break;
          default:
            break;
        }
      });
      return otpData;
    }

    return tempOtpData;
  }

  function hash(content) {
    return createHash('md5').update(content).digest('hex');
  }

  if (step === 'updateProfile' || step === 'removeProfile' || step === 'checkSessionId' || step === 'updateProfileSendOTP') {
    const isValidUuid = await checkSessionId(event, step);
    if (!isValidUuid) {
      return response(400, 'Invalid UUID', event.requestId);
    }

    if (step === 'checkSessionId') {
      return response(200, 'valid Session ID', event.requestId);
    }
  }

  try {
    const amfaConfigs = await fetchConfig('amfaConfigs');
    const amfaPolicies = await fetchConfig('amfaPolicies');
    // API vars saved in node.js property file in the back-end node.js
    const salt = amfaConfigs.salt; // Pull this from a property file. All MFA services will use this same salt to read and write the one_time_token-Cookie.
    const asmurl = amfaConfigs.asmurl;  // Url of the Adaptive MFA Server.
    let user = null;
    let userAttributes = null;
    let ug = 'default';

    const smtpConfig = {
      service: amfaConfigs.smtp.service,
      host: amfaConfigs.smtp.host,
      port: amfaConfigs.smtp.port,
      secure: amfaConfigs.smtp.secure,
      auth: {
        user: amfaConfigs.smtp.user,
        pass: amfaConfigs.smtp.pass,
      }
    }

    // master otp methods controll check
    const otp_steps_under_master_control_config = [
      //login
      'sendotp', 'verifyotp',
      //pwd reset
      'pwdreset2', 'pwdreset3', 'pwdresetverify2', 'pwdresetverify3',
      //selfservice
      'selfservice2', 'selfservice3', 'selfserviceverify2', 'selfserviceverify3',
      //updateprofile
      'updateProfileSendOTP', 'updateProfile', 'removeProfile'
    ]

    if (
      amfaConfigs.master_additional_otp_methods &&
      !amfaConfigs.master_additional_otp_methods.includes(event.otptype) &&
      otp_steps_under_master_control_config.includes(step) &&
      event.otptype !== 'e'
    ) {
      return response(403, 'Master OTP methods restriction', event.requestId);
    }

    // TOTP verification 
    const mobileTokenVerifySteps = [
      'pwdresetverify2',
      'pwdresetverify3',
      'selfserviceverify2',
      'selfserviceverify3'
    ];

    if (mobileTokenVerifySteps.includes(step) && event.otptype === 't') {
      const isValid = await validateTotp(event, amfaConfigs);
      if (isValid) {
        const apti = step.startsWith('selfserviceverify') ? 'updateprofile' : event.apti;
        const uuid = await genSessionID(event.email, apti);
        return {
          isBase64Encoded: false,
          statusCode: 200,
          headers: { ...headers, requestId: event.requestId },
          body: JSON.stringify({ message: 'OK', uuid }),
        };
      }
      return response(403, 'The identity code you entered was not correct. Please try again.', event.requestId)
    }
    // end TOTP verifiction

    if (step !== 'emailverificationSendOTP' && step !== 'emailverificationverifyotp') {
      const listUsersParam = {
        UserPoolId: process.env.USERPOOL_ID,
        Filter: "email = \"" + event.email + "\"",
      };

      const listUsersRes = await cognito.send(new ListUsersCommand(listUsersParam));

      if (!listUsersRes || !listUsersRes.Users || listUsersRes.Users.length === 0) {
        console.log('Did not find valid user for email:', event.email);
        return response(500, 'Did not find valid user for this email', event.requestId);
      };

      const users = listUsersRes.Users.filter((user) => {
        return user.UserStatus === 'CONFIRMED' || 'FORCE_CHANGE_PASSWORD';
      });

      if (users.length === 0) {
        console.log('Did not find valid user for email:', event.email);
        return response(500, 'Did not find valid user for this email, or user account has not been activated', event.requestId);
      };

      if (users[0].UserStatus === 'FORCE_CHANGE_PASSWORD' && step === 'username') {
        console.log('Admin Created User account needs to be actived:', event.email);
        return response(202, 'User account has not been activated', event.requestId);
      }

      console.log('UserAttributes:', users[0].Attributes);
      user = users[0];

      userAttributes = user.Attributes.reduce((acc, curr) => {
        acc[curr.Name] = curr.Value;
        return acc;
      });

      const param = {
        UserPoolId: process.env.USERPOOL_ID,
        Username: users[0].Username,
      };

      const userGroup = await cognito.send(new AdminListGroupsForUserCommand(param));
      console.log('userGroup:', userGroup);

      let ugRank = 10000;

      for (let i = 0; i < userGroup.Groups.length; i++) {
        userGroup.Groups[i].GroupName = userGroup.Groups[i].GroupName.toLowerCase();
        if (amfaPolicies[userGroup.Groups[i].GroupName] && amfaPolicies[userGroup.Groups[i].GroupName].rank < ugRank) {
          ug = userGroup.Groups[i].GroupName;
          ugRank = amfaPolicies[userGroup.Groups[i].GroupName].rank;
        }
      }

      if (!amfaPolicies[ug])
        ug = 'default';
    }
    console.log('ug:', ug);

    switch (event.otptype) {
      case 'e':
        event.otpaddr = event.email;
        break;
      case 'ae':
        event.otpaddr = userAttributes['custom:alter-email'];
        break;
      case 's':
        event.otpaddr = userAttributes?.phone_number;
        break;
      case 'v':
        event.otpaddr = userAttributes['custom:voice-number'] ? userAttributes['custom:voice-number'] : userAttributes.phone_number;
        break;
      default:
        break;
    }

    event.otpaddr = event.otpaddr?.toLowerCase();

    // event.profile '' means legacy profile is not set
    if (step === 'updateProfileSendOTP' && event.profile !== '' && event.otpaddr !== event.profile?.toLowerCase()) {
      // legacy profile not correct
      return response(400, 'Your entry was not valid, please try again.', event.requestId);
    }

    if (step === 'updateProfileSendOTP' || step === 'updateProfile') {
      event.otpaddr = event.newProfile?.toLowerCase();
    }

    if (step === 'removeProfile') {
      let equalCurrentProfile = false;
      switch (event.otptype) {
        case 'ae':
          equalCurrentProfile = (userAttributes['custom:alter-email'] === event.profile);
          break;
        case 's':
          equalCurrentProfile = (event.profile === userAttributes.phone_number);
          break;
        case 'v':
          equalCurrentProfile = (event.profile === userAttributes['custom:voice-number']);
          break;
        default:
          break;
      }

      if (!equalCurrentProfile) {
        return response(400, 'Your entry was not valid, please try again.', event.requestId);
      }

      await updateProfile(event.email, event.otptype, '', cognito, smtpConfig);
      return response(200, 'OK', event.requestId);

    }

    if (step === 'getOtpOptions') {
      const otpData = await transUAttr(userAttributes, amfaConfigs);

      const body = JSON.stringify({
        otpOptions: amfaPolicies[ug].permissions,
        email: userAttributes.email,
        ...otpData,
      })

      console.log('body:', body);

      return {
        statusCode: 200,
        isBase64Encoded: false,
        headers,
        body,
      };
    }

    let l = amfaPolicies[ug].policy_name ? encodeURI(amfaPolicies[ug].policy_name) : '';

    if (step.startsWith('pwdreset')) {
      l = amfaPolicies['password-reset'].policy_name ? encodeURI(amfaPolicies['password-reset'].policy_name) : '';
    }

    if (step.startsWith('selfservice') || step.startsWith('updateProfile')) {
      l = amfaPolicies['self-service'].policy_name ? encodeURI(amfaPolicies['self-service'].policy_name) : '';
    }

    if (l === '') {
      console.log('Did not find a valid ASM Policy for the user group:', ug);
      return response(
        500,
        `Did not find a valid ASM Policy for the user group:${ug})`,
        event.requestId
      );
    }

    // This is the ASM Security Policy key. This key needs to be picked up from a NodeJS back-end propery file based on the role of the user based on their email address-keycloak account.
    // Ex. If user_role=super admin, then l='epnd-su-72ja37bc51mz', ELSE if user_role=cohort owner, then l=asm_policy_for_cohort_owners, etc. etc.

    let wr = event.origin;//'epnd.com'; // This is the domain of the services where MFA is being setup. It must match the domain for the HTTPS URL domain where the cookie is secured.
    let sfl = 6; // This should be picked up via property file. It should be set to 5 or 6. Can also be set based on user security group. If admin, sfl=6 else sfl=5. Should never be set less than 5.

    // API vars that come from the end-user javascript front-end client via post or cookie read
    let u = encodeURIComponent(event.email); // email address of the user. Entered from front end web service to login via post.
    let igd = event.rememberDevice === 'true' ? 0 : 1; // On the main login page, add a checkbox:  [ ] Remember this device, I own it. If checked, set igd = 0 and send it with all related transactions until the login process completes
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

    let af1 = u + 'passwordless_check' + uIp; // This is the passwordless behavior tracker.
    // This var creates a behavior key for passwordless auth. By adding the email and uIP, a user will only be able to use passwordless auth from a known previously used location.

    const amfaCookieName = hash(`${u}${wr}${salt}`);
    let c = '';
    if (event.cookies && event.cookies.trim().length > 0) {
      const startIndex = event.cookies.trim().indexOf(amfaCookieName) + amfaCookieName.length + 1;
      c = event.cookies.trim().substring(startIndex).split(';')[0];
    }
    //'278dcbdee5660876c230650ebb4bd70e';  // For every new MFA Auth login the nodeJS backend needs to read the cookie from teh client if it exists and send it in.

    let postURL = asmurl +
      '/extAuthenticate.kv?l=' +
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
      '&af1=' +
      af1 +
      '&a=' +
      a;

    const tType = getTType(step);

    console.log('step:', step);

    switch (step) {
      case 'username':
        postURL = postURL + '&sfl=' + sfl + '&nsf=' + nsf + '&tType=' + tType;
        break;
      case 'password':
        postURL = postURL + '&tType=' + tType;
        break;
      case 'sendotp':
        otpm = event.otptype;
        // This is the otp method. The default is e, which stands for email. If users have other methods for verification, this field can be used to set the method. 
        //e for email, s for sms, v for voice, ae for alt-email.
        p = encodeURIComponent(event.otpaddr);
        postURL = asmurl + '/extResendOtp.kv?l=' + l + '&u=' + u + '&apti=' + apti + '&uIp=' + uIp + '&otpm=' + otpm + '&p=' + p + '&tType=' + tType
        break;
      case 'verifyotp':
      case 'pwdresetverify2':
      case 'pwdresetverify3':
      case 'selfserviceverify2':
      case 'selfserviceverify3':
      case 'updateProfile':
      case 'emailverificationverifyotp':
        otpm = event.otptype;
        let o = event.otpcode;  // This is the otp entered by the end user and provided to the nodejs backend via post.
        postURL = asmurl + '/extVerifyOtp.kv?l=' + l + '&u=' + u + '&uIp=' + uIp + '&apti=' + apti + '&wr=' + wr + '&igd=' + igd + '&otpm=' + otpm + '&p=' + p + '&otpp=' + otpp + '&tType=' + tType + '&af1=' + af1 + '&a=' + a + '&o=' + o;
        break;
      case 'pwdreset2':
      case 'pwdreset3':
      case 'selfservice2':
      case 'selfservice3':
      case 'updateProfileSendOTP':
      case 'emailverificationSendOTP':
        otpm = event.otptype;
        p = encodeURIComponent(event.otpaddr);
        if (event.isResend) {
          postURL = asmurl + '/extResendOtp.kv?l=' + l + '&u=' + u + '&apti=' + apti + '&uIp=' + uIp + '&otpm=' + otpm + '&p=' + p + '&tType=' + tType;
        }
        else {
          otpp = 0;
          sfl = 7;
          postURL = asmurl + '/extAuthenticate.kv?l=' + l + '&sfl=' + sfl + '&u=' + u + '&apti=' + apti + '&uIp=' + uIp + '&otpm=' + otpm + '&p=' + p + '&tType=' + tType + '&otpp=' + otpp;
        }
        break;
      default:
        break;
    }

    console.log('now posting to : ', postURL);
    // Execute the authentication API
    const amfaResponse = await fetch(postURL, {
      method: "POST"
    });

    if (amfaResponse && amfaResponse.status) {
      const amfaResponseJSON = await amfaResponse.json();

      console.log('amfaResponseJSON:', amfaResponseJSON);

      switch (amfaResponseJSON.code) {
        case 200:
          switch (step) {
            case 'updateProfile':
              if (amfaResponseJSON.message === 'OK') {
                // update profile
                await updateProfile(event.email, event.otptype, event.otpaddr, cognito, smtpConfig);
                return response(200, 'OK', event.requestId);
              }
              else {
                // statusCode 200, but not 'OK' message
                return response(506, 'The login service is not currently available. Contact the help desk.', event.requestId);
              }
            case 'username':
            case 'password':
            case 'verifyotp':
              if (amfaResponseJSON.message === 'OK') {
                const url = step === 'username' ? await passwordlessLogin(event, cognito) :
                  await fetchCode(event.email, event.apti);
                console.log('url:', url);
                if (url) {
                  Date.prototype.addDays = function (days) {
                    var date = new Date(this.valueOf());
                    date.setDate(date.getDate() + days);
                    return date;
                  }

                  var date = new Date();
                  const cookieValue = `${amfaCookieName}=${amfaResponseJSON.identifier}; Domain=${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}; HttpOnly; Expires=${date.addDays(120).toUTCString()}; Secure; SameSite=Strict; Path=/`;
                  const cookie2Value = `${cookie2NamePrefix}=${amfaResponseJSON.identifier.substr(-16, 16)}; Domain=${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}; Expires=${date.addDays(120).toUTCString()}; Secure; SameSite=Strict; Path=/`;

                  return {
                    statusCode: 200,
                    isBase64Encoded: false,
                    multiValueHeaders: {
                      'Set-Cookie': [cookieValue, cookie2Value/*, cookie3Value*/],
                    },
                    headers: cookieEnabledHeaders,
                    body: JSON.stringify({ 'location': url })
                  }
                }
                else {
                  return response(505, 'Service error, please contact the help desk.', event.requestId)
                }
              }
              else {
                // statusCode 200, but not 'OK' message
                return response(501, 'The login service is not currently available. Contact the help desk.', event.requestId);
              }
            case 'pwdresetverify2':
            case 'pwdresetverify3':
            case 'selfserviceverify2':
            case 'selfserviceverify3':
              if (amfaResponseJSON.message === 'OK') {
                const apti = step.startsWith('selfserviceverify') ? 'updateprofile' : event.apti;
                const uuid = await genSessionID(event.email, apti);
                return {
                  isBase64Encoded: false,
                  statusCode: 200,
                  headers: { ...headers, requestId: event.requestId },
                  body: JSON.stringify({ message: 'OK', uuid }),
                };
              }
              else {
                // statusCode 200, but not 'OK' message
                return response(501, 'The login service is not currently available. Contact the help desk.', event.requestId);
              }
            case 'emailverificationverifyotp':
              if (amfaResponseJSON.message === 'OK') {
                const user = await signUp(event.email, event.password, event.attributes, cognito);
                if (user?.User) {
                  const uuid = await genSessionID(event.email, event.apti);
                  return {
                    isBase64Encoded: false,
                    statusCode: 200,
                    headers: { ...headers, requestId: event.requestId },
                    body: JSON.stringify({ message: 'OK', uuid }),
                  };
                }
              }
              // statusCode 200, but not 'OK' message
              return response(501, 'The login service is not currently available. Contact the help desk.', event.requestId);
            default:
              // step 'sendotp', 'pwdreset2', 'pwdreset3', 'selfservice2', 'selfservice3' would not get 200, but 202 when the otp was sent.
              return response(505, 'The login service is not currently available. Contact the help desk.', event.requestId);
          }
        case 202:
          switch (step) {
            case 'username':
              // User did not pass the passwordless verification. Push the user to the password page and request they enter their password.
              return response(202, 'Your identity requires password login.', event.requestId)
            case 'password':
              // User did not pass the passwordless verification. Push the user to the OTP Challenge Page
              const otpData = await transUAttr(userAttributes, amfaConfigs);
              return {
                statusCode: 202,
                isBase64Encoded: false,
                headers: { ...cookieEnabledHeaders, requestId: event.requestId },
                body: JSON.stringify({ email: event.email, ...otpData, otpOptions: amfaPolicies[ug].permissions })
              }
            case 'sendotp':
            case 'pwdreset2':
            case 'pwdreset3':
            case 'selfservice2':
            case 'selfservice3':
            case 'emailverificationSendOTP':
              // The OTP was resent. Push the user back to the OTP Challenge Page: Display 'message'
              return response(202, amfaResponseJSON.message, event.requestId)
            case 'updateProfileSendOTP':
              const uuid = await genSessionID(event.email, event.apti, event.otpaddr);
              return {
                isBase64Encoded: false,
                statusCode: 202,
                headers: { ...headers, requestId: event.requestId },
                body: JSON.stringify({ message: amfaResponseJSON.message, uuid }),
              };
            case 'verifyotp':
            case 'pwdresetverify2':
            case 'pwdresetverify3':
            case 'selfserviceverify2':
            case 'selfserviceverify3':
            case 'updateProfile':
            case 'emailverificationverifyotp':
              // The OTP entered was not correct. Push the user back to the OTP Challenge Page:
              // transform the statusCode to 403, as all 202 in frontend means redirect to another page.
              return response(403, 'The identity code you entered was not correct. Please try again.', event.requestId)
            default:
              // no such case
              break;
          }
          break;
        case 203:
          // Country blocked or threat actor location detected.
          // Push the user back to the initial login page with this error:
          //    "Your location is not permitted. Contact the help desk."
          return response(203, 'Your location is not permitted. Contact the help desk.', event.requestId);
        case 401:
          // The user took too long or entered the otp wrong too many times.
          // Send the user back to the login page with this error:
          //    "You took too long or entered your otp wrong too many times. Try your login again."
          return response(401, 'You took too long or entered your otp wrong too many times. Try your login again.', event.requestId);
        default:
          // Anything else: Default - Push the user back to the initial login page with the error:
          //     "We ran into an issue. Please contact the help desk."
          return response(502, 'We ran into an issue. Please contact the help desk.', event.requestId);
      }
    }

    return response(503, 'amfa response error', event.requestId);
  }
  catch (error) {
    console.error('Error in step "' + step + '" :', error);
    if (error.message.indexOf('fetch failed') === -1) {
      return response(504, error.message ? error.message : 'Unknown error in amfa steps', event.requestId);
    }
    else {
      return response(504, 'MFA Service is not responding. Contact the help desk.', event.requestId);
    }
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
