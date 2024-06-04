import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { amfaSteps } from "./utils/amfaSteps.mjs";
import { fetchConfig } from './utils/fetchConfig.mjs';

import { checkSessionId } from './utils/checkSessionId.mjs';

import { deleteTotp, registotp } from './utils/totp/registOtp.mjs';
import { asmDeleteUser } from './utils/asmDeleteUser.mjs';
import { notifyProfileChange } from './utils/mailer.mjs';
import { deletePwdHashByUser} from './utils/passwordhash.mjs';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

const validateInputParams = (payload) => {
  // check required params here
  switch (payload.phase) {
    case 'admindeletetotp':
    case 'admindeleteuser':
    case 'adminupdateuser':
      return (payload.email);
    case 'username':
      return (payload.email &&
        payload.apti && payload.authParam);
    case 'password':
      return (payload.email && payload.password &&
        payload.apti && payload.authParam);
    case 'sendotp':
    case 'pwdreset2':
    case 'pwdreset3':
    case 'selfservice2':
    case 'selfservice3':
    case 'updateProfileSendOTP':
    case 'emailverificationSendOTP':
      return (payload.email && payload.otptype &&
        payload.apti && payload.authParam);
    case 'verifyotp':
    case 'pwdresetverify2':
    case 'pwdresetverify3':
    case 'selfserviceverify2':
    case 'selfserviceverify3':
      return (payload.email && payload.otpcode && payload.otptype &&
        payload.apti && payload.authParam);
    case 'emailverificationverifyotp':
      return (payload.email && payload.otpcode && payload.otptype &&
        payload.apti && payload.authParam && payload.attributes && payload.password);
    case 'updateProfile':
      return (payload.email && payload.otpcode && payload.otptype &&
        payload.apti && payload.authParam && payload.uuid);
    case 'getOtpOptions':
    case 'getUserOtpOptions':
      return (payload.email && payload.authParam);
    case 'removeProfile':
      return (payload.email && payload.authParam && payload.profile);
    case 'registotp':
      return (payload.email && payload.uuid && payload.secretCode && payload.tokenLabel);
    default:
      break;
  }

  console.log('Phase not found.', payload);

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
      const amfaBrandings = await fetchConfig ('amfaBrandings', dynamodb);
      const amfaPolicies = await fetchConfig ('amfaPolicies', dynamodb);

      switch (payload.phase) {
        case 'admindeletetotp':
          const amfaConfigs = await fetchConfig('amfaConfigs', dynamodb);
          return await deleteTotp(headers, payload.email, amfaConfigs,
            requestId, client, true, dynamodb, amfaBrandings.email_logo_url, true);
        case 'admindeleteuser':
          {
            const amfaConfigs = await fetchConfig('amfaConfigs', dynamodb);
            console.log('asm delete user payload', payload);
            await asmDeleteUser(headers, payload.email, amfaConfigs, requestId, amfaPolicies, payload.admin);
            if (payload.hasTOTP) {
              await deleteTotp(headers, payload.email, amfaConfigs,
                requestId, client, false, dynamodb, amfaBrandings.email_logo_url, true);
            }
            await deletePwdHashByUser(payload.email, dynamodb, amfaConfigs);
          }
          return;
        case 'adminupdateuser':
          console.log('admin update user - otptypes', payload.otptype, ' newProfileValue')
          await notifyProfileChange(payload.email,
            payload.otptype, payload.newProfileValue,
            amfaBrandings.email_logo_url, true);
          return;
        case 'registotp':
          const isValidUuid = await checkSessionId(payload, payload.uuid, dynamodb);
          if (isValidUuid) {
            const amfaConfigs = await fetchConfig('amfaConfigs', dynamodb);
            return await registotp(headers, payload, amfaConfigs,
              requestId, amfaBrandings.email_logo_url, client, dynamodb);
          }
          break;
        case 'removeProfile':
          if (payload.otptype === 't') {
            console.log('removeProfile check uuid');
            const isValidUuid = await checkSessionId(payload, payload.uuid, dynamodb);
            console.log('isValidUuid', isValidUuid);
            if (isValidUuid) {
              const amfaConfigs = await fetchConfig('amfaConfigs', dynamodb);
              return await deleteTotp(headers, payload.email, amfaConfigs,
                requestId, client, true, dynamodb, amfaBrandings.email_logo_url, false);
            }
          }
          break;
        default:
          break;
      }

      // santise and format the input data 
      payload.uIP = getIPFromHeader(event.headers['X-Forwarded-For'].trim());;
      payload.email = payload.email?.trim()?.toLowerCase();
      payload.origin = `${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`;
      payload.otptype = payload.otptype?.toLowerCase();
      payload.requestTimeEpoch = event.requestContext.requestTimeEpoch;
      payload.newProfile = payload.newProfile ? payload.newProfile.toLowerCase() : '';
      payload.profile = payload.profile ? payload.profile.toLowerCase() : '';
      payload.cookies = event.headers['Cookie'];

      console.log('oneEvent', payload);

      switch (payload.phase) {
        case 'username':
          const res = await client.send(new ListUsersCommand({
            UserPoolId: process.env.USERPOOL_ID,
            Filter: `email = "${payload.email}"`,
          }));

          console.log('phase username ListUser Result ', res);

          if (res && res.Users && res.Users.length > 0) {
            const stepOneResponse = await amfaSteps(payload, headers, client, payload.phase, dynamodb);
            return stepOneResponse;
          }
          else {
            // login request, but no such user found
            // allow the UI proceed further to avoid username enumeration attack.
            return response(202, 'Your identity requires password login.', requestId);
          }
        default:
          const stepResponse = await amfaSteps(payload, headers, client, payload.phase, dynamodb);
          return stepResponse;
      }
    } else {
      error = 'incoming params error.';
    }
  } catch (err) {
    console.error('error details:', err);
    return response(
      err.statusCode ? err.statusCode : 511,
      JSON.stringify({
        message: 'input param parse error',
      }),
      requestId
    );
  }

  return response(500, JSON.stringify({ message: error }), requestId);
};
