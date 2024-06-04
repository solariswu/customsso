import * as crypto from 'crypto';
import { getSecret } from './getKms.mjs';
import { DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const aesEncrypt = ({ toEncrypt, aesKey }) => {
	const cipher = crypto.createCipheriv('aes-128-ecb', aesKey, '');
	let encrypted = cipher.update(toEncrypt, 'utf8', 'base64');
	return encrypted + cipher.final('base64');
};

const genTotpToken = async (secret_key, email) => {

	const secret = await getSecret();
	const totp_secret = secret?.totpSecret;
	const totp_salt = secret?.totpSalt;

	const key_and_salt = `${totp_secret}${totp_salt}`;
	const key_salt_and_email = key_and_salt + email.substring(0, email.length / 2);
	const encoded_key = Buffer.from(key_salt_and_email, 'utf8').toString('base64');
	const final_encrypt_key = encoded_key.substring(0, 16);
	const cryptedResult = aesEncrypt({ toEncrypt: secret_key, aesKey: final_encrypt_key });

	return cryptedResult;

}

const writeToDB = async (payload, dynamodb) => {

	console.log('starting to write token to db', payload)

	const last_update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

	const params = {
		Item: {
			id: {
				S: payload.email.trim().toLowerCase() + '#' + payload.provider_id,
			},
			token: {
				S: payload.token.trim(),
			},
			last_update: {
				S: last_update,
			},
			device_name: {
				S: payload.device_name,
			}
		},
		ReturnConsumedCapacity: 'TOTAL',
		TableName: process.env.TOTPTOKEN_TABLE,
	};

	const putItemCommand = new PutItemCommand(params);
	const result = await dynamodb.send(putItemCommand);
	console.log('token db write result', result);
}


export const deleteToken = async (payload, dynamodb) => {
	console.log('delete old token from db', payload);

	const params = {
		TableName: process.env.TOTPTOKEN_TABLE,
		Key: {
			id: { S: payload.email.trim() + '#' + payload.pid },
		},
	};

	const result = await dynamodb.send(new DeleteItemCommand(params));
	console.log ('deletetotp result:', result)

	return result.Count;
}


export default async function writeToken(payload, dynamodb) {
	const { secret_key, email, provider_id, device_name } = payload

	const encryptedToken = await genTotpToken(secret_key, email);

	await writeToDB({ email, token: encryptedToken, provider_id, device_name }, dynamodb);

}