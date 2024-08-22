import {
	SecretsManagerClient,
	GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
	region: process.env.AWS_REGION,
});

export const getSecret = async () => {
	const response = await client.send(
		new GetSecretValueCommand({
			SecretId: process.env.SECRECT_NAME,
		})
	);
	const secret = JSON.parse(response.SecretString);

	return secret;
}

export const getAsmSalt = async () => {
	const secret = await getSecret ();
	return secret?.asmSalt;
}

export const getSMTP = async () => {
	const response = await client.send(
		new GetSecretValueCommand({
			SecretId: process.env.SMTPSECRET_NAME,
		})
	);
	const secret = JSON.parse(response.SecretString);

	return secret;
}

export const getAsmPortalTenantAuthToken = async () => {
	const response = await client.send(
		new GetSecretValueCommand({
			SecretId: process.env.ASMSECRET_NAME,
		})
	);
	const secret = JSON.parse(response.SecretString);

	return secret?.tenantAuthToken;
}
