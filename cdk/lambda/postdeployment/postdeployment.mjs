
import {
	DynamoDBClient,
	PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { amfaPolicies, amfaConfigs } from './config.mjs';

const createAmfaConfigs = async () => {

	const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

	try {
		let value = JSON.stringify(amfaPolicies);

		let params = {
			Item: {
				configtype: {
					S: 'amfaPolicies',
				},
				value: {
					S: value,
				},
			},
			ReturnConsumedCapacity: 'TOTAL',
			TableName: process.env.AMFACONFIG_TABLE,
		};

		let putItemCommand = new PutItemCommand(params);
		let results = await dynamodb.send(putItemCommand);
		console.log('amfaPolicies write result:', results);

		value = JSON.stringify(amfaConfigs);

		 params = {
			Item: {
				configtype: {
					S: 'amfaConfigs',
				},
				value: {
					S: value,
				},
			},
			ReturnConsumedCapacity: 'TOTAL',
			TableName: process.env.AMFACONFIG_TABLE,
		};

		putItemCommand = new PutItemCommand(params);
		results = await dynamodb.send(putItemCommand);
		console.log('amfaPolicies write result:', results);

	} catch (err) {
		console.error('create config failed with:', err);
		console.error('RequestId: ' + err.requestId);
	}
}

export const handler = async (event) => {
	await createAmfaConfigs();
};
