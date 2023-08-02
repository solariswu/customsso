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
        payload.apti && payload.authParam);
    case 'sendotp':
    case 'pwdreset2':
    case 'pwdreset3':
    case 'selfservice2':
    case 'selfservice3':
    case 'updateProfileSendOTP':
    case 'emailverificationSendOTP':
      return (payload && payload.email && payload.otptype &&
        payload.apti && payload.authParam);
    case 'verifyotp':
    case 'pwdresetverify2':
    case 'pwdresetverify3':
    case 'selfserviceverify2':
    case 'selfserviceverify3':
      return (payload && payload.email && payload.otpcode && payload.otptype &&
        payload.apti && payload.authParam);
    case 'emailverificationverifyotp':
      return (payload && payload.email && payload.otpcode && payload.otptype &&
        payload.apti && payload.authParam && payload.attributes && payload.password);
    case 'updateProfile':
      return (payload && payload.email && payload.otpcode && payload.otptype &&
        payload.apti && payload.authParam && payload.uuid);
    case 'getOtpOptions':
      return (payload && payload.email && payload.apti && payload.authParam);
    case 'removeProfile':
      return (payload && payload.email && payload.apti && payload.authParam && payload.profile);
    default:
      break;
  }

  console.log('Invalid payload', payload);

  return false;
};

const headers = {
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Set-Cookie,Cookie,X-Requested-With',
  'Access-Control-Allow-Origin': `https://${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`,
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
  'Access-Control-Expose-Headers': 'Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
};

const response = (statusCode = 200, body, requestId) => {
  return {
    statusCode,
    headers: { ...headers, requestId },
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
  console.log('amfa requestid: ', requestId);

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
      oneEvent.email = payload.email?.trim()?.toLowerCase();
      oneEvent.apti = payload.apti;
      oneEvent.rememberDevice = payload.rememberDevice;
      oneEvent.authParam = payload.authParam;
      oneEvent.origin = `${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`;
      oneEvent.otptype = payload.otptype?.toLowerCase();
      oneEvent.otpcode = payload.otpcode;
      oneEvent.redirectUri = payload.redirectUri;
      oneEvent.state = payload.state;
      oneEvent.requestTimeEpoch = event.requestContext.requestTimeEpoch;
      oneEvent.uuid = payload.uuid;
      oneEvent.newProfile = payload.newProfile ? payload.newProfile.toLowerCase() : '';
      oneEvent.profile = payload.profile ? payload.profile.toLowerCase() : '';
      oneEvent.requestId = requestId;
      oneEvent.attributes = payload.attributes;
      oneEvent.password = payload.password;
      oneEvent.isResend = payload.isResend;

      oneEvent.cookies = event.headers['Cookie'];
      console.log('oneEvent', oneEvent);

      switch (payload.phase) {
        case 'username':
          const res = await client.send(new ListUsersCommand({
            UserPoolId: process.env.USERPOOL_ID,
            Filter: `email = "${oneEvent.email}"`,
          }));

          console.log(res);
          const amfaConfigs = await fetchConfig('amfaConfigs');

          if (amfaConfigs.enable_passwordless && res && res.Users && res.Users.length > 0) {
            const stepOneResponse = await amfaSteps(oneEvent, headers, client, payload.phase);
            return stepOneResponse;
          }
          else {
            return response(202, 'Your identity requires password login.', requestId);
          }
        default:
          const stepResponse = await amfaSteps(oneEvent, headers, client, payload.phase);
          return stepResponse;
      }
    } else {
      error = 'incoming params error.';
    }
  } catch (err) {
    console.log('error details:', err);
    return response(
      err.statusCode ? err.statusCode : 500,
      JSON.stringify({
        message: 'input param parse error',
      }),
      requestId
    );
  }

  return response(500, JSON.stringify({ message: error }), requestId);
};
