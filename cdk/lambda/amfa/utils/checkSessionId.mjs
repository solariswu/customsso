import {
	GetItemCommand,
} from '@aws-sdk/client-dynamodb';

export const checkSessionId = async (payload, step, dynamodb) => {

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

		const expired = ((Date.now() - timestamp) > 1000 * 60 * 10);

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
