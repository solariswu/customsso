import {
	DynamoDBClient,
	PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import * as crypto from 'crypto';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

export const genPwdResetID = async (username, apti, otpaddr) => {
	console.log('generate session id for user:', username, ' apti:', apti, ' otpaddr:', otpaddr);

	const uuid = crypto.randomUUID();
	const timestamp = Date.now();

	const myotpaddr = otpaddr ? otpaddr : '';

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
				S: myotpaddr,
			},
			timestamp: {
				N: `${timestamp}`,
			},
		},
		ReturnConsumedCapacity: 'TOTAL',
		TableName: process.env.SESSION_ID_TABLE,
	};

	const putItemCommand = new PutItemCommand(params);
	const results = await dynamodb.send(putItemCommand);
	console.log('pwd reset id write result:', results);

	return uuid;

}
