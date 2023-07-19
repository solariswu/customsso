export const amfaPolicies = {
	"super_admin": {
		"policy_name": "epnd-su-rg83ed78xa38",
		"rank": 1,
		"permissions": ['e','ae','v']
	},
	"admin": {
		"policy_name": "epnd-su-72ja37bc51mz",
		"rank": 2,
		"permissions": ['e','ae', 's','v']
	},
	"cohort_owner": {
		"policy_name": "epnd-cohort-owner-52ws89xs12gz",
		"rank": 3,
		"permissions": ['e','ae', 's','v']
	},
	"user": {
		"policy_name": "epnd-user-63em98az26jq47",
		"rank": 4,
		"permissions": ['e','ae', 's','v']
	},
	"password-reset": {
		"policy_name": "EPND-Pwd-Reset-72vc59zx34",
	},
	"self-service": {
		"policy_name": "EPND-Self-Service-72vc59zx34",
	},
	"user-registration": {
		"policy_name": "EPND-User-Registration-72vc59zx34",
	},
	"default": {
		"policy_name": "epnd-default-72ws81aq67jf",
		"rank": 5,
		"permissions": ['e']
	},
}

export const amfaConfigs = {
	"asmurl": "https://asm2.apersona.com:8443/asm",
	"enable_passwordless": true,
	"enable_password_reset": true,
	"enable_self_service": true,
	"enable_user_registration": true,
	"enable_have_i_been_pwned": true,
	"master_additional_otp_methods": ["ae", "s", "v"],
	"salt": "a-random-string-here",
}
