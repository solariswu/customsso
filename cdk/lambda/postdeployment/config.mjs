export const amfaPolicies = {
    "super_admin": {
        "policy_name": "su-rg83ed78xa38",
        "rank": 1,
        "enable_passwordless": false,
        "permissions": [
            'e',
            'ae',
            'v']
    },
    "admin": {
        "policy_name": "admin-72ja37bc51mz",
        "rank": 2,
        "enable_passwordless": false,
        "permissions": [
            'e',
            'ae',
            's',
            'v',
            't'
        ]
    },
    "executive": {
        "policy_name": "exec-52ws89xs12gz",
        "rank": 3,
        "enable_passwordless": true,
        "permissions": [
            'e',
            'ae',
            's',
            'v'
        ]
    },
    "user": {
        "policy_name": "user-63em98az26jq47",
        "rank": 4,
        "enable_passwordless": true,
        "permissions": [
            'e',
            'ae',
            's',
            'v',
            't'
        ]
    },
    "password-reset": {
        "policy_name": "pwd-reset-92wx58dz37"
    },
    "self-service": {
        "policy_name": "update-profile-72vc59zx34"
    },
    "user-registration": {
        "policy_name": "user-registration-34he12cp74"
    },
    "default": {
        "policy_name": "default-72ws81aq67jf",
        "rank": 5,
        "enable_passwordless": false,
        "permissions": [
            'ae',
            'e',
            't'
        ]
    },
}

export const amfaConfigs = {
    "COMMENT-File": "This file contains the available primary AWS aPersona Adaptive MFA login settings.",
    "asmurl": "https://asm-aws.apersonadev2.com:8443/asm",
    "enable_password_reset": true,
    "enable_self_service": true,
    "enable_self_service_remove_buttons": true,
    "enable_user_registration": true,
    "enable_have_i_been_pwned": true,
    "enable_google_recaptcha": true,
    "COMMENT-NOTE!!! Please Take care of using 'master_additional_otp_methods'": " 'e' would be always available for update profile and password reset, even if 'e' is not set. Available options are: 'e' for primary email, 'ae' for alt-email, 's' for sms, 'v' for voice, 't' for mobile soft token. Be sure to use double quotes.",
    "master_additional_otp_methods": [
        "ae",
        "s",
        "v",
        "t"
    ],
    "user_registration_default_group": "user",
    "update_profile_force_mobile_token_first_if_registered": true,
    "COMMENT-totp": "This totp information must match the aPersona Adaptive Security Manager Tenant/Client ID and associated salt. salt now is saving in secret manager",
    "totp": {
        "asm_provider_id": 1,
    },
    "enable_password_expire": true,
    "passwords_expire_days": 90,
    "enable_prevent_password_reuse": true,
    "prevent_password_reuse_count": 5,
}

export const amfaBrandings =
{
    service_name: "apersona",
    logo_url: "https://downloads.apersona.com/downloads/aPersona_Logos_Package/aPLogo-370x67.png",
    email_logo_url: "https://downloads.apersona.com/downloads/aPersona_Logos_Package/aPLogo-370x67.png",
    brand_base_color: "#42739C",
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
    consent_content: 'By signing up, I accept the <a href="https://example.com" target="_blank">privacy policy</a> and the <a href="https://example2.com" target="_blank"> terms &amp; conditions</a>',
}

export const amfaLegals =
{
    terms_of_service: "New User terms and conditions",
    privacy_policy: "service privacy policy here",
}

export const amfaTenants = [
    {
        id: 'amfa-dev004',
        name: 'amfa dev004',
        contact: 'admin@apersona.com',
        url: 'https://amfa-dev004.amfa.aws-amplify.dev',
        samlproxy: true,
        samlIdPMetadataUrl: 'https://amfasaml.aws-amplify.dev/Saml2IDP/proxy.xml'
    }
]