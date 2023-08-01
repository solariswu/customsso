
import {
	AdminSetUserPasswordCommand,
	CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

import {
	DeleteItemCommand,
	DynamoDBClient,
	GetItemCommand,
} from '@aws-sdk/client-dynamodb';

const headers = {
	'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,X-Requested-With',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
};

export const handler = async (event) => {

	console.info("EVENT\n" + JSON.stringify(event, null, 2));

	const payload = JSON.parse(event.body);

	const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

	const params = {
		TableName: process.env.SESSION_ID_TABLE,
		Key: {
			uuid: { S: payload.uuid },
		},
	};

	try {
		const getItemCommand = new GetItemCommand(params);
		const results = await dynamodb.send(getItemCommand);
		console.log('get password reset uid result:', results);

		const email = results.Item.username.S;
		const apti = results.Item.apti.S;

		console.log(email);
		console.log('payload', payload);

		if (email.trim().toLowerCase() === payload.email.trim().toLowerCase()
			 && apti === payload.apti) {
			const input = { // AdminSetUserPasswordRequest
				UserPoolId: process.env.USERPOOL_ID, // required
				Username: email.trim().toLowerCase(), // required
				Password: payload.password, // required
				Permanent: true,
			};

			console.log('set pwd param', input)
			const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

			const param = new AdminSetUserPasswordCommand(input);
			const results = await client.send(param);
			console.log('set user password result:', results);


			const deleteItemCommand = new DeleteItemCommand(params);
			await dynamodb.send(deleteItemCommand);

			return {
				statusCode: 200,
				headers,
				body: JSON.stringify({ message: 'success' }),
			}
		}
	}
	catch (error) {
		console.log('error', error);
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify(error),
		};
	}
}