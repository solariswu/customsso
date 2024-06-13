import { getSecret } from "./totp/getKms.mjs"

export const adminGetSecrets = async (tenantId) => {
	const amfaSecrets = await getSecret();
	return {
		...amfaSecrets,
		clientId: process.env.CLIENTCREDENTIALS_ID,
		clientSecret: process.env.CLIENTCREDENTIALS_SECRET,
		domain: process.env.USERPOOL_DOMAIN,
	}
}