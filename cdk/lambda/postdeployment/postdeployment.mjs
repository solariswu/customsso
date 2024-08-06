
import {
	DynamoDBClient,
	PutItemCommand,
} from '@aws-sdk/client-dynamodb';

import { CognitoIdentityProviderClient, CreateGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { amfaPolicies, amfaConfigs, amfaBrandings, amfaLegals, amfaTenants } from './config.mjs';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const createAmfaConfigs = async (configType, dynamodb) => {
	const values = {
		'amfaPolicies': amfaPolicies,
		'amfaConfigs': amfaConfigs,
		'amfaBrandings': amfaBrandings,
		'amfaLegals': amfaLegals,
	};
	try {
		let value = JSON.stringify(values[configType], null, "  ");

		const params = {
			Item: {
				configtype: {
					S: configType,
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
		console.log(`${configType} write result:`, results);

	} catch (err) {
		console.error('create config failed with:', err);
		console.error('RequestId: ' + err.requestId);
	}
}


const createTenants = async (dynamodb, userpoolIds) => {
	console.log('createTenants userpoolIds', userpoolIds);
	for (let index = 0; index < amfaTenants.length; index++) {
		try {
			const element = amfaTenants[index];
			const params = {
				Item: {
					id: {
						S: element.id,
					},
					name: {
						S: element.name,
					},
					contact: {
						S: element.contact,
					},
					url: {
						S: element.url,
					},
					samlproxy: {
						BOOL: element.samlproxy,
					},
					samlIdPMetadataUrl: {
						S: element.samlIdPMetadataUrl,
					},
					userpool: {
						S: userpoolIds[index],
					},
				},
				ReturnConsumedCapacity: 'TOTAL',
				TableName: process.env.AMFATENANT_TABLE,
			}
			let results = await dynamodb.send(new PutItemCommand(params));
			console.log('amfa tenant write result:', results);

		} catch (err) {
			console.error('create amfa tenant item failed with:', err);
			console.error('RequestId: ' + err.requestId);
		}
	}
}

export const handler = async (event) => {
	const dbTables = ['amfaPolicies', 'amfaBrandings', 'amfaConfigs', 'amfaLegals'];
	await Promise.allSettled(dbTables.map((table) => createAmfaConfigs(table, dynamodb)))

	try {
		const userpoolIds = JSON.parse(process.env.USERPOOL_IDS);

		const param = {
			GroupName: amfaConfigs.user_registration_default_group,
			UserPoolId: userpoolIds[0],
		}
		await cognito.send(new CreateGroupCommand(param));
	}
	catch (err) {
		console.error('create group failed with:', err);
		console.error('RequestId: ' + err.requestId);
	}

	try {
		const userpoolIds = JSON.parse(process.env.USERPOOL_IDS);
		await createTenants(dynamodb, userpoolIds);
	}
	catch (err) {
		console.error('parse userpool ids failed with:', err);
	}

};
