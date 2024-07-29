export const config = {
	'amfa-dev004':
	{
		'awsaccount': '531680862493', // Mar 27
		'region': 'eu-west-1',
		'spPortalUrl': 'https://apersona.netlify.app',
		'callbackUrls': ['https://amfa-awsdemo-userportal.netlify.app/auth-callback', 'https://amfa.netlify.app/', 'https://apersona.netlify.app/auth-callback', 'http://localhost:5173'],
		'logoutUrls': ['https://amfa-awsdemo-userportal.netlify.app', 'https://amfa.netlify.app/', 'https://apersona.netlify.app', 'http://localhost:5173'],
		'tenantId': 'amfa-dev004', // lowercase only
		'magicstring': 'youguesswhat',
		'serviceName': 'apersona',
		'samlproxyinstanceid': 'i-028b38d91c41d660c',
	}
}

export const env = {
	'region': 'eu-west-1',
	'awsaccount': '531680862493', // Mar 27
}
