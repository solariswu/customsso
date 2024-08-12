#!/bin/bash

# deployment tenant info
export TENANT_ID='' ## example 'amfa-dev006'

# DNS domain and hosted zone id, required
export ROOT_DOMAIN_NAME='' ## example 'apersona2.aws-amplify.dev'
export ROOT_HOSTED_ZONE_ID='' ## example 'Z0596003151J12345678X'

# optional
export SP_PORTAL_URL='' ## example 'https://apersona.netlify.app' ## can be removed if not use service providers portal.
export EXTRA_APP_URL='' ## example 'https://amfa.netlify.app/' ## can be removed if no extra application using AMFA controller.

# google captcha key and secret. Leave them empty as '' if not uses.
export RECAPTCHA_KEY='' ## example '6LdFWYUnAAAAAATdjfhjNZqDqPOEn12345678'
export RECAPTCHA_SECRET='' ## example '6LdFWYUnAAAAABlC3YcF7DqDqPO123456789'


