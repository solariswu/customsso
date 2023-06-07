import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { amfaSteps } from "./utils/amfaSteps.mjs";
import { fetchConfig } from './utils/fetchConfig.mjs';

const validateInputParams = (payload) => {
  // check required params here
  switch (payload.phase) {
    case 'username':
      return (payload && payload.email &&
        payload.apti && payload.authParam);
    case 'password':
      return (payload && payload.email && payload.password &&
        payload.apti  && payload.authParam);
    case 'sendotp':
    case 'pwdreset2':
    case 'pwdreset3':
      return (payload && payload.otpaddr && payload.otptype &&
        payload.apti && payload.authParam);
    case 'verifyotp':
    case 'pwdresetverify2':
    case 'pwdresetverify3':
      return (payload && payload.email && payload.otpcode && payload.otptype &&
        payload.apti  && payload.authParam);
    case 'getOtpOptions':
      return (payload && payload.email && payload.apti && payload.authParam);
    default:
      break;
  }

  console.log ('Invalid payload', payload);

  return false;
};

const headers = {
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Set-Cookie,Cookie,X-Requested-With',
  'Access-Control-Allow-Origin': `https://${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`,
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
  'Access-Control-Expose-Headers': 'Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
};

const response = (statusCode = 200, body) => {
  return {
    statusCode,
    headers,
    body,
  };
};

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION, });

const getIPFromHeader = (fwdfor) => {
  const IPs = fwdfor.split(',');
  return IPs[0];
}

// lambda for rest api
export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const requestId = Math.random().toString(36).substring(2, 16) + Math.random().toString(36).substring(2, 16);

  let error = '';

  try {
    const payload = JSON.parse(event.body);

    console.log('payload', payload);

    if (payload && validateInputParams(payload)) {

      const ipAddress = getIPFromHeader(
        event.headers['X-Forwarded-For'].trim()
      );

      let oneEvent = {};
      oneEvent.uIP = ipAddress;
      oneEvent.email = payload.email;
      oneEvent.apti = payload.apti;
      oneEvent.rememberDevice = payload.rememberDevice;
      oneEvent.authParam = payload.authParam;
      oneEvent.origin = `${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`;
      oneEvent.otptype = payload.otptype;
      oneEvent.otpcode = payload.otpcode;
      oneEvent.otpaddr = payload.otpaddr;
      oneEvent.redirectUri = payload.redirectUri;
      oneEvent.state = payload.state;
      oneEvent.requestTimeEpoch = event.requestContext.requestTimeEpoch;

      oneEvent.cookies = event.headers['Cookie'];
      console.log('oneEvent', oneEvent);

      switch (payload.phase) {
        case 'pwdreset2':
          const pwdreset2Res = await amfaSteps(oneEvent, headers, client, 6);
          return pwdreset2Res;
        case 'pwdresetverify2':
          const pwdresetverify2Res = await amfaSteps(oneEvent, headers, client, 7);
          return pwdresetverify2Res;
        case 'pwdreset3':
          const pwdreset3Res = await amfaSteps(oneEvent, headers, client, 8);
          return pwdreset3Res;
        case 'pwdresetverify3':
          const pwdresetverify3Res = await amfaSteps(oneEvent, headers, client, 9);
          return pwdresetverify3Res;
        case 'getOtpOptions':
          const getOtpOptionsRes = await amfaSteps(oneEvent, headers, client, 5);
          return getOtpOptionsRes;
        case 'username':
          const res = await client.send(new ListUsersCommand({
            UserPoolId: process.env.USERPOOL_ID,
            Filter: `email = "${payload.email}"`,
          }));

          console.log(res);
          const amfaConfigs = await fetchConfig ('amfaConfigs');

          if (amfaConfigs.enable_passwordless && res && res.Users && res.Users.length > 0) {
            const stepOneResponse = await amfaSteps(oneEvent, headers, client, 1);
            return stepOneResponse;
          }
          else {
            return response(202, 'Your identity requires password login.');
          }
        case 'password':
          const stepTwoResponse = await amfaSteps(oneEvent, headers, client, 2);
          return stepTwoResponse;
        case 'sendotp':
          const stepThreeResponse = await amfaSteps(oneEvent, headers, client, 3);
          return stepThreeResponse;
        case 'verifyotp':
          const stepFourResponse = await amfaSteps(oneEvent, headers, client, 4);
          return stepFourResponse;
        default:
          break;
      }
    } else {
      error = 'incoming params error.';
    }


  } catch (err) {
    console.log(err);
    return response(
      err.statusCode ? err.statusCode : 500,
      JSON.stringify({
        message: 'input param parse error',
      })
    );
  }

  return response(500, JSON.stringify({ message: error }));
};
