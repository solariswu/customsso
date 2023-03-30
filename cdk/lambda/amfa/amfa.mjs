import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { amfaSteps } from "./utils/amfaSteps.mjs";


const validateInputParams = (payload) => {
  // check required params here
  switch (payload.phase) {
    case 'username':
      return (payload && payload.email &&
        payload.apti && payload.rememberDevice && payload.authParam);
    case 'password':
      return (payload && payload.email && payload.password &&
        payload.apti && payload.rememberDevice && payload.authParam);
    case 'otp':
      return (payload && payload.email && payload.otp && payload.otpCode &&
        payload.apti && payload.rememberDevice && payload.authParam);
    default:
      break;
  }

  return false;
};

const headers = {
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
  'Access-Control-Allow-Origin': `https://${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`,
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
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
      const origin = event.headers['origin']?.trim();

      if (
        origin !== `https://${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`
      ) {
        return response(403, JSON.stringify({ message: 'origin not allowed' }));
      }

      let oneEvent = {};
      oneEvent.uIP = ipAddress;
      oneEvent.email = payload.email;
      oneEvent.apti = payload.apti;
      oneEvent.rememberDevice = payload.rememberDevice;
      oneEvent.authParam = payload.authParam;
      oneEvent.origin = `${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`;

      // todo fetch cookie from header
      oneEvent.cookies = event.headers['Cookies'];
      console.log('oneEvent', oneEvent);

      switch (payload.phase) {
        case 'username':
          const stepOneResponse = await amfaSteps(oneEvent, headers, client, 1);
          return response(stepOneResponse.statusCode, stepOneResponse.body);
        case 'password':
          oneEvent.password = payload.password;
          // store tokens and then perform OAuth2 back to main CUP
          const stepTwoResponse = await amfaSteps(oneEvent, headers, client, 2);
          return response(stepTwoResponse.statusCode, stepTwoResponse.body);
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
