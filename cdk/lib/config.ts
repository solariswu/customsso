const spPortalUrl = process.env.SP_PORTAL_URL;
const customAppUrl = process.env.EXTRA_APP_URL;

let callbackUrls: string[] = [];
spPortalUrl ?
	callbackUrls.push(`${spPortalUrl}/auth-callback`) :
	callbackUrls.push('https://example.com/login');
if (customAppUrl) {
	callbackUrls.push(customAppUrl);
}

let logoutUrls: string[] = [];
spPortalUrl ?
	logoutUrls.push(spPortalUrl) :
	logoutUrls.push('https://example.com/logout');
if (customAppUrl) {
	logoutUrls.push(customAppUrl);
}

export const config = [
	{
		'awsaccount': process.env.CDK_DEPLOY_ACCOUNT,
		'region': process.env.CDK_DEPLOY_REGION,
		tenantId: process.env.TENANT_ID, // lowercase only
		spPortalUrl,
		callbackUrls,
		logoutUrls,
		'magicstring': 'youguesswhat',
		'serviceName': 'apersona',
		// 'samlproxyinstanceid': process.env.SAML_INSTANCE_ID,
	}
]

