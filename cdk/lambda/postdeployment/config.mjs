export const amfaPolicies = process.env.ASM_POLICIES;
export const serviceName = 'CompanyName'

export const amfaConfigs = {
    "COMMENT-File": "This file contains the available primary AWS aPersona Adaptive MFA login settings.",
    "asmurl": process.env.ASM_SERVICE_URL,
    "asm_portal_url": process.env.ASM_PORTAL_URL,
    "enable_password_reset": true,
    "enable_self_service": true,
    "enable_self_service_remove_buttons": true,
    "enable_user_registration": true,
    "enable_have_i_been_pwned": true,
    "enable_google_recaptcha": false,
    "COMMENT-NOTE!!! Please Take care of using 'master_additional_otp_methods'": " 'e' would be always available for update profile and password reset, even if 'e' is not set. Available options are: 'e' for primary email, 'ae' for alt-email, 's' for sms, 'v' for voice, 't' for mobile soft token. Be sure to use double quotes.",
    "master_additional_otp_methods": [
        "ae",
        "s",
        "v",
        "t"
    ],
    "user_registration_default_group": "user",
    "mobile_token_svc_name": serviceName,
    "update_profile_force_mobile_token_first_if_registered": true,
    "COMMENT-totp": "This totp information must match the aPersona Adaptive Security Manager Tenant/Client ID and associated salt. salt now is saving in secret manager",
    "totp": {
        "asm_provider_id": 50, //This would be overrided by deploy variable retrieved. implemented.
    },
    "enable_password_expire": true,
    "passwords_expire_days": 90,
    "enable_prevent_password_reuse": true,
    "prevent_password_reuse_count": 5,
    "enable_auto_pwd_reset_on_threat": true,
}

export const amfaBrandings =
{
    service_name: serviceName,
    "COMMENT-NOTE logo size": "250x50",
    logo_url: "https://downloads.apersona.com/logos/logo-here_250x50.png",
    "COMMENT-NOTE email_logo size": "250x50",
    email_logo_url: "https://downloads.apersona.com/logos/logo-here_250x50.png",
    brand_base_color: "#7D8CA3",
    consent_content: 'By signing up, I accept the  <a href=\"[https://downloads.apersona.com/demos/compnay-privacy.html](https://downloads.apersona.com/demos/WeaveAI-Privacy.html\)" target=\"_blank\">privacy policy</a> and the <a href=\"[https://downloads.apersona.com/demos/company-Ts-Cs.html](https://downloads.apersona.com/demos/WeaveAI-Ts-Cs.html\)" target=\"_blank\"> terms &amp; conditions</a>',
    "COMMENT-NOTE fav_icon size": "16x16 png",
    favicon_url: 'https://downloads.apersona.com/logos/favicon.png',
}

export const amfaLegals =
{
    "terms_of_service": "https://downloads.apersona.com/demos/WeaveAI-Ts-Cs.html",
    "privacy_policy": "https://downloads.apersona.com/demos/WeaveAI-Privacy.html"
}
