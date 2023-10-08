export const amfaPolicies = {
	"super_admin": {
		"policy_name": "epnd-su-rg83ed78xa38",
		"rank": 1,
		"permissions": ['e', 'ae', 'v']
	},
	"admin": {
		"policy_name": "epnd-su-72ja37bc51mz",
		"rank": 2,
		"permissions": ['e', 'ae', 's', 'v', 't']
	},
	"cohort_owner": {
		"policy_name": "epnd-cohort-owner-52ws89xs12gz",
		"rank": 3,
		"permissions": ['e', 'ae', 's', 'v']
	},
	"user": {
		"policy_name": "epnd-user-63em98az26jq47",
		"rank": 4,
		"permissions": ['e', 'ae', 's', 'v', 't']
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
	"asmurl": "https://asm-aws-2.apersonadev2.com:8443/asm",
	"enable_passwordless": true,
	"enable_password_reset": true,
	"enable_self_service": true,
	"enable_user_registration": true,
	"enable_have_i_been_pwned": true,
	"enable_google_recaptcha": true,
	"NOTE!!! Please Take care of using 'master_additional_otp_methods'": "'e' would be always available for update profile and password reset, even if 'e' is not set",
	"master_additional_otp_methods": ["ae", "s", "v", "t"],
	"user_registration_default_group": "user",
	"update_profile_force_mobile_token_first_if_registered": true,
	"salt": "a-random-string-here",
	"smtp": {
		service: "gmail",
		host: "smtp.gmail.com",
		port: 587,
		secure: false,
		user: "niunaihemianbao012@gmail.com",
		pass: "jwcjehfafowrmtlk",
	},
	"totp": {
	  "asm_provider_id": 1,
	  "asm_totp_salt": "**Salt-here!!!**"
	}
}

export const amfaBrandings =
{
	logo_url: "https://images.squarespace-cdn.com/content/v1/6384c70defa1aa7a84c4a2bf/19179f7c-b44d-41d5-b112-11fd7fc8ce63/aPLogo-EffortlessAppSecurity-v3-370x73.T.png",
	brand_base_color: "#337AB7",
	login_app_main_page_header: "Sign in to your account",
	login_app_main_page_message: "Login with your account email address.",
	login_app_password_message: "Please enter your password",
	login_app_verification_page_header: "Your login requires an additional verificaiton.",
	login_app_verify_page_message: "Please click on one of your verification methods, then enter it below, and click Verify",
	update_profile_app_main_page_header: "Update Profile",
	update_profile_app_main_page_message: "Login with your account email address.",
	update_profile_app_main_page_password_message: "Please enter your password",
	update_profile_app_verify1_message: "Access requires 2 verifications. Verification Step 1. Choose contact method:",
	update_profile_app_verify2_message: "Access requires 2 verifications. Verification Step 2. Choose contact method:",
	update_profile_app_verify_retreive_message: "A verification code has been sent to you. Please retrieve it, enter it below and click Verify.",
	update_provile_app_portal_header: "Update Profile: Verify Methods",
	consent_content: "Sample Consent Form Content"
}
