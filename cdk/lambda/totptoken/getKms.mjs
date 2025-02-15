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
			SecretId: `amfa/${process.env.TENANT_ID}/secret`,
			VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
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
			SecretId: `amfa/${process.env.TENANT_ID}/smtp`,
			VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
		})
	);
	const secret = JSON.parse(response.SecretString);
	secret.secure = secret.secure === 'true' || secret.secure === true ? true : false;

	return secret;
}
