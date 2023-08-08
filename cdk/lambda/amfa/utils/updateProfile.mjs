import {
	AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import {
	DynamoDBClient,
	GetItemCommand,
} from '@aws-sdk/client-dynamodb';


export const checkSessionId = async (payload, step) => {

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
		console.log('get update profile uid result:', results);

		const email = results.Item.username.S;
		// const apti = results.Item.apti.S;
		const otpaddr = results.Item.otpaddr.S;
		const timestamp = results.Item.timestamp.N;

		const expired = ((Date.now() - timestamp) > 1000 * 60 * 5);

		const result = (email === payload.email && !expired)

		if (result && (step === 'updateProfile' || step === 'removeProfile')) {
			return (result && otpaddr === payload.newProfile)
		}
		return result;

	}
	catch (error) {
		console.log('error', error);
	}

	return false;
}

export const updateProfile = async (email, otptype, profile, uuid, cognitoClient) => {
	let UserAttributes = [];

	switch (otptype) {
		case 'ae':
			UserAttributes.push({
				Name: 'custom:alter-email',
				Value: profile,
			});
			break;
		case 'v':
			UserAttributes.push({
				Name: 'custom:voice-number',
				Value: profile,
			});
			break;
		case 's':
			UserAttributes.push({
				Name: 'phone_number',
				Value: profile,
			});
			UserAttributes.push({
				Name: 'phone_number_verified',
				Value: (profile && profile.length > 0) ? 'true' : 'false',
			});
			break;
		default:
			break;
	}

	const param = new AdminUpdateUserAttributesCommand({
		Username: email,
		UserPoolId: process.env.USERPOOL_ID,
		UserAttributes,
	});

	await cognitoClient.send(param);

	// const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

	// const params = {
	// 	TableName: process.env.SESSION_ID_TABLE,
	// 	Key: {
	// 		uuid: { S: uuid },
	// 	},
	// };

	// try {
	// 	await dynamodb.send(new DeleteItemCommand(params));
	// }
	// catch (err) {
	// 	console.log(`delete uuid in ddb table ${process.env.SESSION_ID_TABLE} error, uuid:`, uuid);
	// 	console.log('dynamobdb delete item error: ', err);
	// }
}