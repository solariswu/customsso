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
        "rank": 50,
        "enable_passwordless": false,
        "permissions": [
            "ae",
            "e",
            "t"
        ],
    },
}

export const amfaConfigs = {
    "COMMENT-File": "This file contains the available primary AWS aPersona Adaptive MFA login settings.",
    "asmurl": "https://fs.apersonadev2.com:8443/asm",
    "asm_portal_url": "https://fs.apersonadev2.com:8443/asm_portal",
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
    "mobile_token_svc_name": "WeaveAI AMFA",
    "update_profile_force_mobile_token_first_if_registered": true,
    "COMMENT-totp": "This totp information must match the aPersona Adaptive Security Manager Tenant/Client ID and associated salt. salt now is saving in secret manager",
    "totp": {
        "asm_provider_id": 50,
    },
    "enable_password_expire": true,
    "passwords_expire_days": 90,
    "enable_prevent_password_reuse": true,
    "prevent_password_reuse_count": 5,
    "enable_auto_pwd_reset_on_threat": true,
}

export const amfaBrandings =
{
    service_name: "WeaveAI",
    logo_url: "https://downloads.apersona.com/logos/WeaveAILogo.png",
    email_logo_url: "https://downloads.apersona.com/logos/WeaveAILogo.png",
    brand_base_color: "#009AD0",
    consent_content: 'By signing up, I accept the <a href="https://downloads.apersona.com/demos/WeaveAI-Privacy.html" target="_blank">privacy policy</a> and the <a href="https://downloads.apersona.com/demos/WeaveAI-Ts-Cs.html" target="_blank"> terms &amp; conditions</a>',
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