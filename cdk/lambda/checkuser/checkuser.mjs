import * as crypto from 'crypto';
import {
	AdminGetUserCommand,
	CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const headers = {
	'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Set-Cookie,Cookie,X-Requested-With',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
	'Access-Control-Expose-Headers': 'Set-Cookie',
	'Access-Control-Allow-Credentials': 'true',
};

const validateInputParams = (event) => {
	return event.email.trim().length > 0 && event.apti.trim().length > 0;
};

const getUser = async (payload, cognito) => {

	const command = new AdminGetUserCommand({
		Username: payload.email,
		UserPoolId: process.env.USERPOOL_ID,
	});
	const user = await cognito.send(command);
	console.log('get user:', user);

	return user;
}

// lambda for rest api /checkuser
export const handler = async (event) => {
	console.log(event);

	let error = { message: 'check username error' };

	const payload = JSON.parse(event.body);

	if (validateInputParams(payload)) {
		const cognito = new CognitoIdentityProviderClient({
			region: process.env.AWS_REGION,
		});

		try {

			const user = await getUser(payload, cognito);

			if (user) {

				const res = { username: user.Username, apti: payload.apti };
				return {
					statusCode: 400,
					headers,
					body: JSON.stringify({ message: 'username already exists' }),
				};
			}
		} catch (err) {
			console.error(err);
			const error = err.message ? err : { message: "error while checking email signup" }
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
