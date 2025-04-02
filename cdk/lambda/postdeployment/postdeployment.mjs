
import {
	DynamoDBClient,
	PutItemCommand,
} from '@aws-sdk/client-dynamodb';

import {
	CognitoIdentityProviderClient, CreateGroupCommand,
	DescribeUserPoolCommand, UpdateUserPoolCommand
} from '@aws-sdk/client-cognito-identity-provider';

import { amfaPolicies, amfaConfigs, amfaBrandings, amfaLegals } from './config.mjs';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const createUserGroup = async (GroupName) => {
	const userpoolIds = JSON.parse(process.env.USERPOOL_IDS);

	const param = {
		GroupName,
		UserPoolId: userpoolIds[0],
	}
	await cognito.send(new CreateGroupCommand(param));
}

const createAmfaConfigs = async (configType, dynamodb) => {
	let values = {
		'amfaPolicies': amfaPolicies,
		'amfaConfigs': amfaConfigs,
		'amfaBrandings': amfaBrandings,
		'amfaLegals': amfaLegals,
	};
	console.log('createAmfaConfigs values', values);
	// // override default values by installer specified values.
	// if (process.env.ASM_PROVIDER_ID && process.env.ASM_PROVIDER_ID != '') {
	// 	console.log('update amfaConfig totp asm provider id to value ', process.env.ASM_PROVIDER_ID)
	// 	values.amfaConfigs.totp = {};
	// 	values.amfaConfigs.totp.asm_provider_id = parseInt(process.env.ASM_PROVIDER_ID)
	// }
	// else {
	// 	console.log('no overriding for amfaConfig totp asm provider id')
	// }

	let value = '';

	if (configType === 'amfaPolicies') {
		value = values[configType];
		if (value !== '' && value !== 'null') {
			try {
				value = JSON.parse(value);
				for (const key in value) {
					const policy = value[key];
					const child = {}
					child['policy_name'] = policy;
					const sp = policy.split('-');
					child['enable_passwordless'] = true;
					child['permissions'] = ["e", "ae", "s", "v", "t"];
					child['rank'] = isNaN(parseInt(sp[1])) ? '' : parseInt(sp[1]);
					value[key] = child;

					if (key !== 'default' && !(key.includes('-'))) {
						try {
							await createUserGroup(key)
						} catch (error) {
							console.error('create policy user group failed with:', error)
							console.error('RequestId: ' + error.requestId);
						}
					}
				}
				value = JSON.stringify(value, null, "  ")
			}
			catch (e) {
				console.log('amfaPolicy parsing error');
				value = '';
			}
		}
		else {
			value = '';
		}
	}
	else {
		try {
			value = JSON.stringify(values[configType], null, "  ");
		} catch (error) {
			console.log('amfaConfig parsing error')
		}
	}

	if (value === '' || value === 'null') {
		console.log('no value for ', configType);
		return;
	}

	console.log("createAmfaConfigs configType: ", configType, " value: ", value);

	try {
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

		console.log('createAmfaConfigs params', params);

		let putItemCommand = new PutItemCommand(params);
		let results = await dynamodb.send(putItemCommand);
		console.log(`${configType} write result:`, results);

	} catch (err) {
		console.error('create config failed with:', err);
		console.error('RequestId: ' + err.requestId);
	}
}

const switchUserpoolTierToLite = async (UserPoolId) => {

	const describeUserPoolRes = await cognito.send(new DescribeUserPoolCommand({
		UserPoolId
	}));

	const userPool = describeUserPoolRes.UserPool;
	if (!userPool) {
		throw new Error('UserPool not found');
	}

	if (userPool.UserPoolTier === 'LITE') {
		console.log('UserPool already in LITE tier');
		return;
	}

	userPool.UserPoolTier = 'LITE';
	delete userPool.CreationDate;
	delete userPool.LastModifiedDate;
	delete userPool.EstimatedNumberOfUsers;
	delete userPool.Id;
	delete userPool.Status;

	const param = {
		UserPoolId,
		...userPool,
	}

	return cognito.send(new UpdateUserPoolCommand(param));
}

const createTenants = async (dynamodb, userpoolIds) => {
	console.log('createTenants userpoolIds', userpoolIds);

	let amfaTenants = [];
	try {
		amfaTenants = JSON.parse(process.env.AMFA_TENANTS);
	} catch (error) {
		console.error('parse amfa tenants failed with:', error);
	}

	for (let index = 0; index < amfaTenants.length; index++) {
		try {
			const element = amfaTenants[index];
			const params = {
				Item: {
					id: {
						S: element.tenant_id,
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
					endUserSpUrl: {
						S:element.endUserSpUrl,
					},
					extraappurl: {
						S:element.extraAppUrl,
					},
					samlproxy: {
						BOOL: element.samlproxy,
					},
					samlIdPMetadataUrl: {
						S: `https://samlproxy.apersona-id.com/Saml2IDP/proxy.xml`,
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
	const res = await Promise.allSettled(dbTables.map((table) => createAmfaConfigs(table, dynamodb)))

	console.log('createAmfaConfigs result', res);

	try {
		const userpoolIds = JSON.parse(process.env.USERPOOL_IDS);

		const param = {
			GroupName: amfaConfigs.user_registration_default_group,
			UserPoolId: userpoolIds[0],
		}
		const res = await cognito.send(new CreateGroupCommand(param));
		console.log('create user group result', res);
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

	try {
		const userpoolIds = JSON.parse(process.env.USERPOOL_IDS);
		await switchUserpoolTierToLite(userpoolIds[0]);
	} catch (err) {
		console.error('switch userpool tier to lite failed with:', err);
		console.error('RequestId: ' + error.requestId);
	}
};
