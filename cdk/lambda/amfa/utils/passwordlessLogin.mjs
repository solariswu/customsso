import * as crypto from 'crypto';
import {
  RespondToAuthChallengeCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import {
	PutItemCommand,
} from '@aws-sdk/client-dynamodb';

function makeId(length) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const getUser = async (username, cognito) => {

  const appclientId = process.env.APPCLIENT_ID;
  const appclientSecret = process.env.APP_SECRET;

  const secretHash = crypto
    .createHmac('SHA256', appclientSecret)
    .update(username + appclientId)
    .digest('base64');

  const initiateAuthParam = {
    AuthFlow: 'CUSTOM_AUTH',
    ClientId: appclientId,
    AuthParameters: {
      USERNAME: username,
      SECRET_HASH: secretHash,
    },
  };

  console.log ('initiateAuthParam:', initiateAuthParam);

  const initiateAuthCommand = new InitiateAuthCommand(initiateAuthParam);

  const initiateAuthResult = await cognito.send(initiateAuthCommand);

  if (initiateAuthResult.ChallengeName === 'CUSTOM_CHALLENGE') {

    const input = {

      ChallengeName: 'CUSTOM_CHALLENGE',
      ClientId: appclientId,
      ChallengeResponses: {
        USERNAME: username,
        SECRET_HASH: secretHash,
        ANSWER: process.env.MAGIC_STRING,
      },
      Session: initiateAuthResult.Session,
    };

    const command = new RespondToAuthChallengeCommand(input);

    const user = await cognito.send(command);
    console.log('user:', user);
    return user;
  }

  return null;

}

const storeTokens = async (user, payload, authCode, dynamodb) => {
  console.log('tokens write user:', user);
  console.log('payload:', payload);
  console.log('authCode:', authCode);

  const tokenString =
    '{"id_token":"' +
    user.AuthenticationResult['IdToken'] +
    '",' +
    '"access_token":"' +
    user.AuthenticationResult['AccessToken'] +
    '",' +
    '"refresh_token":"' +
    user.AuthenticationResult['RefreshToken'] +
    '",' +
    '"expires_in":300,"token_type":"Bearer"}';

  const params = {
    Item: {
      username: {
        S: payload.email,
      },
      apti: {
        S: payload.apti,
      },
      authCode: {
        S: authCode,
      },
      state: {
        S: payload.state,
      },
      redirectUri: {
        S: payload.redirectUri,
      },
      tokenString: {
        S: tokenString,
      },
      timestamp: {
        N: `${payload.requestTimeEpoch}`,
      },
      ttl: {
        N: `${parseInt(payload.requestTimeEpoch / 1000 + 3600)}`
      }
    },
    ReturnConsumedCapacity: 'TOTAL',
    TableName: process.env.AUTHCODE_TABLE,
  };

  const putItemCommand = new PutItemCommand(params);

  const results = await dynamodb.send(putItemCommand);
  console.log('tokens write result:', results);

}

export const passwordlessLogin = async (realUsername, payload, cognito, dynamodb) => {

  const user = await getUser(realUsername, cognito);

  if (user.AuthenticationResult) {
    const authCode = makeId(32);
    await storeTokens(user, payload, authCode, dynamodb);

    return `${payload.redirectUri}/?code=${authCode}&state=${payload.state}`;
  }
  return null;
};
