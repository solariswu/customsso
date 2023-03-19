import * as crypto from 'crypto';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {DynamoDBClient, PutItemCommand} from '@aws-sdk/client-dynamodb';

const validateInputParams = (event) => {
  return (
    event.username.trim().length > 0 &&
    event.state.trim().length > 0 &&
    event.callbackUri.trim().length > 0
  );
};

export const handler = async (event) => {
  console.log(event);

  let error = '';

  const payload = JSON.parse(event.body);

  if (validateInputParams(payload)) {
    const cognito = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
    });
    const dynamodb = new DynamoDBClient({region: process.env.AWS_REGION});

    const appclientId = process.env.APPCLIENT_ID;
    const appclientSecret = process.env.APP_SECRET;
    const username = payload.username;

    const secretHash = crypto
      .createHmac('SHA256', appclientSecret)
      .update(username + appclientId)
      .digest('base64');

    const input = {
      AuthFlow: 'CUSTOM_AUTH',
      ClientId: appclientId,
      AuthParameters: {
        USERNAME: username,
        SECRET_HASH: secretHash,
      },
    };

    const command = new InitiateAuthCommand(input);

    try {
      const user = await cognito.send(command);
      if (user.ChallengeName === 'CUSTOM_CHALLENGE') {
        console.log('user:', user);
        const params = {
          Item: {
            username: {
              S: username,
            },
            session: {
              S: user.Session,
            },
            callbackUri: {
              S: payload.callbackUri,
            },
            state: {
              S: payload.state,
            },
            timestamp: {
              N: `${event.requestContext.requestTimeEpoch}`,
            },
          },
          ReturnConsumedCapacity: 'TOTAL',
          TableName: process.env.AUTHSESSION_TABLE,
        };

        console.log('params', params);
        const putItemCommand = new PutItemCommand(params);
        const results = await dynamodb.send(putItemCommand);
        console.log('dynamodb write result:', results);
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST',
          },
          body: JSON.stringify('Custom Challenge started.'),
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
