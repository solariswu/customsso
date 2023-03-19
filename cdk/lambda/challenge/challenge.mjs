import * as crypto from 'crypto';
import {
  CognitoIdentityProviderClient,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';

const validateInputParams = (event) => {
  return event.username.trim().length > 0 && event.answer.trim().length > 0;
};

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

// lambda for rest api /oauth2/challenge
export const handler = async (event) => {
  console.log(event);

  let error = '';

  const payload = JSON.parse(event.body);

  if (validateInputParams(payload)) {
    const cognito = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
    });
    const dynamodb = new DynamoDBClient({region: process.env.AWS_REGION});
    const username = payload.username;

    const params = {
      TableName: process.env.AUTHSESSION_TABLE,
      Key: {
        username: {S: username},
      },
    };

    const getItemCommand = new GetItemCommand(params);

    try {
      const item = await dynamodb.send(getItemCommand);

      const username = item.Item.username.S;
      const session = item.Item.session.S;
      const state = item.Item.state.S;
      const callbackUri = item.Item.callbackUri.S;

      console.log('username:', username);

      const appclientId = process.env.APPCLIENT_ID;
      const appclientSecret = process.env.APP_SECRET;

      const secretHash = crypto
        .createHmac('SHA256', appclientSecret)
        .update(username + appclientId)
        .digest('base64');

      const input = {
        ChallengeName: 'CUSTOM_CHALLENGE',
        ClientId: appclientId,
        ChallengeResponses: {
          USERNAME: username,
          SECRET_HASH: secretHash,
          ANSWER: payload.answer,
        },
        Session: session,
      };

      const command = new RespondToAuthChallengeCommand(input);

      const user = await cognito.send(command);
      console.log('user:', user);

      if (user.AuthenticationResult) {
        const authCode = makeId(32);
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
            authcode: {
              S: authCode,
            },
            tokenString: {
              S: tokenString,
            },
            timestamp: {
              N: `${event.requestContext.requestTimeEpoch}`,
            },
          },
          ReturnConsumedCapacity: 'TOTAL',
          TableName: process.env.AUTHCODE_TABLE,
        };

        console.log('putItemParams', params);
        const putItemCommand = new PutItemCommand(params);
        const results = await dynamodb.send(putItemCommand);
        console.log('authcode write result:', results);

        const res = {authCode, callbackUri, state};
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST',
          },
          body: JSON.stringify(res),
        };
      }
    } catch (err) {
      console.error(err);
      const error = err.message ? err.message : err;
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'OPTIONS,POST',
        },
        body: JSON.stringify(error),
      };
    }
  } else {
    error = 'incoming params error.';
  }

  return {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST',
    },
    body: JSON.stringify(error),
  };
};
