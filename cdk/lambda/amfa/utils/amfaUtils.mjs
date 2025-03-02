const tTypeList = {
	'username': 'Initial passwordless login verification',
	'password': 'Password login verification',
	'sendotp': 'Request OTP',
	'verifyotp': 'OTP verify',
	'pwdreset2': 'Password reset 1st verify',
	'pwdresetverify2': 'Password reset OTP verify',
	'pwdreset3': 'Password reset 2nd verify',
	'pwdresetverify3': 'Password reset OTP verify',
	'selfservice2': 'Self service 1st verify',
	'selfserviceverify2': 'OTP verify',
	'selfservice3': 'Self service 2nd verify',
	'selfserviceverify3': 'OTP verify',
	'updateProfileSendOTP': 'Update profile Request OTP',
	'updateProfile': 'Update profile OTP verify',
	'emailverificationSendOTP': 'Register New Account Request OTP',
	'emailverificationverifyotp': 'Register New Account OTP verify',
}


export const getTType = (step) => {
	return encodeURI(tTypeList[step] ? tTypeList[step] : 'Unknown');
}

export const headers = {
	'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Set-Cookie,Cookie,X-Requested-With',
	'Access-Control-Allow-Origin': `https://${process.env.TENANT_ID}.${process.env.DOMAIN_NAME}`,
	'Vary': 'Origin',
	'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
	'Access-Control-Expose-Headers': 'Set-Cookie',
	'Access-Control-Allow-Credentials': 'true',
	'Cache-Control': 'no-cache',
	'X-Content-Type-Options': 'nosniff',
};

export const responseWithRequestId = (statusCode = 200, body, requestId) => {
	console.log ('amfa lambda responseWithRequestId', {
		isBase64Encoded: false,
		statusCode,
		headers: { ...headers, requestId },
		body: JSON.stringify({ message: body }),
	})
	return {
		isBase64Encoded: false,
		statusCode,
		headers: { ...headers, requestId },
		body: JSON.stringify({ message: body }),
	};
};
