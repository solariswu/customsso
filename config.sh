#!/bin/bash

# deployment tenant info
export TENANT_ID='amfa-dev004' ## example 'amfa-dev006'

# DNS domain and hosted zone id, required
export ROOT_DOMAIN_NAME='amfa.aws-amplify.dev' ## example 'apersona2.aws-amplify.dev'
export ROOT_HOSTED_ZONE_ID='Z09396062FFC9U1Z188F6' ## example 'Z0596003151J12345678X'

# Registered values from APERSONA
export MOBILE_TOKEN_KEY='93e24574ec564f709e97d4'
export MOBILE_TOKEN_SALT='0770bccd5f334008a2d946'
export ASM_SALT='5SBfqTttzjgXrAX5pvWiBJ8REr6RpF6K'
export TENANT_AUTH_TOKEN='secretAuth123'

# Your SMTP server info for sending email to end users
export SMTP_HOST='smtp.gmail.com' ## example 'email-smtp.us-east-1.amazonaws.com'
export SMTP_USER='apersona.notify@gmail.com' ## example '<YOUR_SMTP_SENDER_USERNANE>'
export SMTP_PASS='zhknmtviieayhaef' ## example 'BQj1234567890'
export SMTP_SECURE='false' ## example 'false'
export SMTP_PORT='587' ## example '587'

# optional
export SP_PORTAL_URL='https://apersona.netlify.app' ## example 'https://apersona.netlify.app' ## can be removed if not use service providers portal.
export EXTRA_APP_URL='https://amfa.netlify.app/' ## example 'https://amfa.netlify.app/' ## can be removed if no extra application using AMFA controller.

# google captcha key and secret. Leave them empty as '' if not uses.
export RECAPTCHA_KEY='6LdFWYUnAAAAAATdjfhjNZqDqPOEn6GWLKHWU9na' ## example '6LdFWYUnAAAAAATdjfhjNZqDqPOEn12345678'
export RECAPTCHA_SECRET='6LdFWYUnAAAAAKvmd0yINMdnPXUkPK3pMHczz0Bx' ## example '6LdFWYUnAAAAABlC3YcF7DqDqPO123456789'


