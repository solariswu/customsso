import { getSecret } from "./totp/getKms.mjs"

export const adminGetSecrets = async (tenantId) => {
	const amfaSecrets = await getSecret();
	return {
		...amfaSecrets,
		clientId: process.env.CLIENTCREDENTIALS_ID,
		clientSecret: process.env.CLIENTCREDENTIALS_SECRET,
		domain: `https://${process.env.USERPOOL_DOMAIN}.auth.${process.env.AWS_REGION}.amazoncognito.com/oauth2/token`,
	}
}