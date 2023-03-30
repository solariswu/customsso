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
	'Access-Control-Allow-Headers': 'Content-Type',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

const validateInputParams = (event) => {
	return event.username.trim().length > 0 && event.password.trim().length > 0;
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

const getUserByPassword = async (payload, cognito, secretHash) => {

	const params = {
		AuthParameters: {
			USERNAME: payload.username,
			PASSWORD: payload.password,
			SECRET_HASH: secretHash,
		},
		UserpoolId: process.env.USERPOOL_ID,
		ClientId: process.env.APPCLIENT_ID,
		AuthFlow: ADMIN_NO_SRP_AUTH,
	};

	const command = new AdminInitiateAuthCommand(params);

	const user = await cognito.send(command);

	console.log('password login user:', user);

	return user;
}

const getUser = async (payload, cognito) => {

	const appclientId = process.env.APPCLIENT_ID;
	const appclientSecret = process.env.APP_SECRET;

	const secretHash = crypto
		.createHmac('SHA256', appclientSecret)
		.update(username + appclientId)
		.digest('base64');

	return await getUserByPassword(payload, cognito, secretHash);
}

const storeTokens = async (user, dynamodb, requestTimeEpoch) => {
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
				N: `${requestTimeEpoch}`,
			},
		},
		ReturnConsumedCapacity: 'TOTAL',
		TableName: process.env.AUTHCODE_TABLE,
	};

	const putItemCommand = new PutItemCommand(params);
	const results = await dynamodb.send(putItemCommand);
	console.log('tokens write result:', results);

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

			if (user.AuthenticationResult) {
				const authCode = makeId(32);
				await storeTokens(user, payload.username, dynamodb, event.requestContext.requestTimeEpoch);

				const res = { authCode};
				return {
					statusCode: 200,
					headers,
					body: JSON.stringify(res),
				};
			}
		} catch (err) {
			console.error(err);
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
