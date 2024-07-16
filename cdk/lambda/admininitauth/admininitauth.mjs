import * as crypto from 'crypto';
import {
    AdminInitiateAuthCommand,
    CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import {
    DynamoDBClient,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb';

const headers = {
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Set-Cookie,Cookie,X-Requested-With',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
    'Access-Control-Expose-Headers': 'Set-Cookie',
    'Access-Control-Allow-Credentials': 'true',
};

const validateInputParams = (event) => {
    return event.email.trim().length > 0 && event.password.trim().length > 0 &&
        event.apti.trim().length > 0;
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

const getUserWithPassword = async (payload, cognito, secretHash) => {

    return cognito.send(new AdminInitiateAuthCommand(
        {
            AuthParameters: {
                USERNAME: payload.email.trim().toLowerCase(),
                PASSWORD: payload.password,
                SECRET_HASH: secretHash,
            },
            UserPoolId: process.env.USERPOOL_ID,
            ClientId: process.env.APPCLIENT_ID,
            AuthFlow: "ADMIN_NO_SRP_AUTH",
        }
    ));
}

const getUser = async (payload, cognito) => {

    const appclientId = process.env.APPCLIENT_ID;
    const appclientSecret = process.env.APP_SECRET;

    const secretHash = crypto
        .createHmac('SHA256', appclientSecret)
        .update(payload.email.trim().toLowerCase() + appclientId)
        .digest('base64');

    return getUserWithPassword(payload, cognito, secretHash);
}

const storeTokens = async (user, payload, authCode, dynamodb, requestTimeEpoch) => {
    console.log('tokens write user:', user);
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
                S: payload.email.trim().toLowerCase(),
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
                N: `${requestTimeEpoch}`,
            },
            ttl: {
                N: `${parseInt(requestTimeEpoch / 1000 + 3600)}`,
            },
        },
        ReturnConsumedCapacity: 'TOTAL',
        TableName: process.env.AUTHCODE_TABLE,
    };

    const putItemCommand = new PutItemCommand(params);
    const results = await dynamodb.send(putItemCommand);
    console.log('tokens write result:', results);

}

const genSessionID = async (username, apti, dynamodb) => {
    console.log('generating session id for user:', username, ' apti:', apti);

    const uuid = crypto.randomUUID();
    const timestamp = Date.now();

    const params = {
        Item: {
            uuid: {
                S: uuid,
            },
            username: {
                S: username,
            },
            apti: {
                S: apti,
            },
            otpaddr: {
                S: 'FORCE_CHANGE_PASSWORD',
            },
            timestamp: {
                N: `${timestamp}`,
            },
            ttl: {
                N: `${parseInt(timestamp / 1000 + 3600)}`,
            },
        },
        ReturnConsumedCapacity: 'TOTAL',
        TableName: process.env.SESSION_ID_TABLE,
    };

    const putItemCommand = new PutItemCommand(params);
    const results = await dynamodb.send(putItemCommand);
    console.log('session id creation result:', results);

    return uuid;

}

// lambda for rest api /oauth2/admininitauth
export const handler = async (event) => {
    console.log(event);

    let error = { message: 'admininitauth error' };

    const payload = JSON.parse(event.body);

    if (validateInputParams(payload)) {
        const cognito = new CognitoIdentityProviderClient({
            region: process.env.AWS_REGION,
        });
        const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

        try {

            const user = await getUser(payload, cognito);

            // force change password
            if (user.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
                const uuid = await genSessionID(payload.email, payload.apti, dynamodb);
                const res = { email: payload.email, apti: payload.apti, uuid };
                return {
                    statusCode: 202,
                    headers,
                    body: JSON.stringify(res),
                };
            }

            if (user.AuthenticationResult) {
                if (payload.state) {
                    const authCode = makeId(32);
                    await storeTokens(user, payload, authCode, dynamodb, event.requestContext.requestTimeEpoch);
                }
                const res = { email: payload.email, apti: payload.apti };
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(res),
                };
            }
        } catch (err) {
            console.error(err);

            if (err.code === 'PasswordResetRequiredException' || err.message === 'Password reset required for the user') {
                const uuid = await genSessionID(payload.email, payload.apti, dynamodb);
                const res = { email: payload.email, apti: payload.apti, uuid, message: 'RESET_REQUIRED' };
                return {
                    statusCode: 402,
                    headers,
                    body: JSON.stringify(res),
                }
            }

            const error = err.message ? err : { message: "error in password login" }
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify(error),
            };
        }
    } else {
        error = { message: 'incoming params error.' };
    }

    return {
        statusCode: 500,
        headers,
        body: JSON.stringify(error),
    };
};
