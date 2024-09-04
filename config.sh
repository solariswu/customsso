#!/bin/bash

export ASM_PORTAL_URL='' ## ASM portal url, example 'https://asm-aws.apersona.com:8443/asm_portal'
export ASM_INSTAL_KEY='' ## example '1234567890' the key received by admin email

# deployment tenant info, required
export TENANT_ID=''   ## example 'amfa-dev006'
export ADMIN_EMAIL='' ## example 'myTenant006@apersona5.dev'

# optional
export TENANT_NAME=''     ## example 'myTenant006', will use TENANT_ID if not set.
export INSTALLER_EMAIL='' ## example 'devops@apersona5.dev', will use ADMIN_EMAIL if not set.

# DNS domain and hosted zone id, required
export ROOT_DOMAIN_NAME=''    ## example 'apersona5.dev'
export ROOT_HOSTED_ZONE_ID='' ## example 'Z0596003151J12345678X'

# AUTH TOKEN values got from APERSONA
# used to clear password threat mode
export TENANT_AUTH_TOKEN=''

# Your SMTP server info for sending email to end users
# stored in AWS Secrets Manager, can be adjusted after installation
export SMTP_HOST=''   ## example 'email-smtp.us-east-1.amazonaws.com'
export SMTP_USER=''   ## example '<YOUR_SMTP_SENDER_USERNANE>'
export SMTP_PASS=''   ## example 'BQj1234567890'
export SMTP_SECURE='' ## example 'false', default value is 'false'
export SMTP_PORT=''   ## example '587', default value is '587'

# optional
# sp portal url is default login page
# extra app url is extra application that will integrate with AWS IdP ASM Login
# can be removed if not use service providers portal or extra application.
# can be manually added in AWS Userpool Console after installation.
export SP_PORTAL_URL='' ## example 'https://apersona.netlify.app'
export EXTRA_APP_URL='' ## example 'https://amfa.netlify.app/'

# google captcha key and secret. Leave them empty as '' if not uses.
export RECAPTCHA_KEY=''    ## example '6LdFWYUnAAAAAATdjfhjNZqDqPOEn12345678'
export RECAPTCHA_SECRET='' ## example '6LdFWYUnAAAAABlC3YcF7DqDqPO123456789'

# salt for local cookie encryption
# generate one value and keep using the same value
# this value could be a 32 charaters string
export ASM_SALT='' ## example '1234567890abcedfABCDEF'
