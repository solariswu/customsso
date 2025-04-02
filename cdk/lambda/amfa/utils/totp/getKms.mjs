import {
	SecretsManagerClient,
	GetSecretValueCommand,
	UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";


export const setSMTP = async (tenantId, smtp) => {
	const response = await client.send(
		new UpdateSecretCommand({
			SecretId: process.env.SMTPSECRET_NAME,
			SecretString: JSON.stringify(smtp),
		})
	);
	return response;
}

const client = new SecretsManagerClient({
	region: process.env.AWS_REGION,
});

export const getSecret = async () => {
	const response = await client.send(
		new GetSecretValueCommand({
			SecretId: process.env.SECRET_NAME,
		})
	);
	const secret = JSON.parse(response.SecretString);

	return secret;
}

export const getAsmSalt = async () => {
	try {
  	    const secret = await getSecret ();
	    return secret?.asmSalt;
	}
	catch (e) {
		console.error('get asm salt failed with:', e);
		return null;
	}
}

export const getProviderId = async () => {
	try {
		const secret = await getSecret ();
		return secret?.Provider_Id;
	}
	catch (e) {
		console.error('get provider id failed with:', e);
		return null;
	}
}

export const getSMTP = async () => {
	console.log('get smtp secret', process.env.SMTPSECRET_NAME);
	const response = await client.send(
		new GetSecretValueCommand({
			SecretId: process.env.SMTPSECRET_NAME,
		})
	);

	const secret = JSON.parse(response.SecretString);
	secret.secure = secret.secure === 'true' || secret.secure === true ? true : false
	console.log('get smtp secret response', secret);

	return secret;
}
