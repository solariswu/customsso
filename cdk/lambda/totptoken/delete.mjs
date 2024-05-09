import {
	DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';

export const deleteResData = async (payload, dynamodb) => {

	console.log('delete all old token from db');
	const params = {
		TableName: process.env.TOTPTOKEN_TABLE,
		Key: {
			id: { S: payload.email.trim() + '#' + payload.pid.trim() },
		},
	};

	await dynamodb.send(new DeleteItemCommand (params));

	return 'OK';

}
