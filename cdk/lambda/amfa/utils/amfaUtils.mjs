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