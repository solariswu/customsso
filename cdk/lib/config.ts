export const config = {
	'amfa-dev004':
	{
		'awsaccount': '531680862493', // Mar 27
		'region': 'eu-west-1',
		'spPortalUrl': 'https://amfa-awsdemo-userportal.netlify.app',
		'callbackUrls': ['https://amfa-awsdemo-userportal.netlify.app/auth-callback', 'https://amfa.netlify.app/', 'http://localhost:3000'],
		'logoutUrls': ['https://amfa-awsdemo-userportal.netlify.app', 'https://amfa.netlify.app/', 'http://localhost:3000'],
		'tenantId': 'amfa-dev004', // lowercase only
		'magicstring': 'youguesswhat',
		'totpkeyname': 'amfa/totpsecrectkey-eEoRjE',
		'totpdbkey' : 'amfa/rdsdev-6Qh4BV',
		'totpdbname' : 'asm_authenticators',
		'serviceName': 'apersona',
		'samlproxyinstanceid': 'i-028b38d91c41d660c',
	}
}

export const env = {
	'region': 'eu-west-1',
	'awsaccount': '531680862493', // Mar 27
}
