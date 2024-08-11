#!/bin/bash

# deployment tenant info
TENANT_ID='' ## example 'amfa-dev006'

# DNS domain and hosted zone id, required
ROOT_DOMAIN_NAME = '' ## example 'apersona2.aws-amplify.dev'
ROOT_HOSTED_ZONE_ID = '' ## example 'Z0596003151J12345678X'

# optional
SP_PORTAL_URL='' ## example 'https://apersona.netlify.app' ## can be removed if not use service providers portal.
EXTRA_APP_URL='' ## example 'https://amfa.netlify.app/' ## can be removed if no extra application using AMFA controller.

# google captcha key and secret. Leave them empty as '' if not uses.
RECAPTCHA_KEY = '' ## example '6LdFWYUnAAAAAATdjfhjNZqDqPOEn12345678'
RECAPTCHA_SECRET = '' ## example '6LdFWYUnAAAAABlC3YcF7DqDqPO123456789'

if aws sts get-caller-identity >/dev/null; then

    source ~/.bashrc
    NODE_OPTIONS=--max-old-space-size=8192

    echo "install application dependency libs"
    npm install

    if [ -z ${SP_PORTAL_URL+x} ]; then
        echo "SP_PORTAL_URL is not configured"
        if [ -z ${EXTRA_APP_URL+x} ]; then
        echo "EXTRA_APP_URL is not configured too, you would need to manually config userpool callback url later"
        else
        SP_PORTAL_URL=$EXTRA_APP_URL
        echo "using EXTRA_APP_URL as default application url"
        fi
    fi

    #get region and account by EC2 info
    TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
    EC2_AVAIL_ZONE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)
    CDK_DEPLOY_REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
    CDK_DEPLOY_ACCOUNT=$(aws sts get-caller-identity | jq -r .Account)

    rm delegationRole.json
    echo "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":\"arn:aws:iam::$CDK_DEPLOY_ACCOUNT:root\"},\"Action\":\"sts:AssumeRole\"}]}" >> delegationRole.json

    if ! aws iam get-role --role-name CrossAccountDnsDelegationRole-DO-NOT-DELETE >/dev/null 2>&1; then
        aws iam create-role --role-name CrossAccountDnsDelegationRole-DO-NOT-DELETE --assume-role-policy-document file://delegationRole.json
        aws iam create-policy --policy-name dns-delegation-policy --policy-document file://delegationPolicy.json
        aws iam attach-role-policy --role-name CrossAccountDnsDelegationRole-DO-NOT-DELETE --policy-arn "arn:aws:iam::$CDK_DEPLOY_ACCOUNT:policy/dns-delegation-policy"
    fi

    echo "generate AMFA front end config file"

    rm -rf src/const.js
    echo "export const clientName = '$TENANT_ID'" >> src/const.js
    echo "export const region = '$CDK_DEPLOY_REGION'" >> src/const.js
    echo "export const applicationUrl = '$SP_PORTAL_URL'" >> src/const.js
    echo "export const extraAppUrl = '$EXTRA_APP_URL'" >> src/const.js
    echo "export const apiUrl = 'https:///api.$TENANT_ID.$ROOT_DOMAIN_NAME'" >> src/const.js
    echo "export const recaptcha_key = '$RECAPTCHA_KEY'" >> src/const.js

    npm run build
    npm run lambda-build

    echo ""
    echo "**********************************"
    echo "Start building...please wait ..."
    npm run cdk-build

    #check DNS domain

    #bootstrap CDK account and region
    # set -e

    RED='\033[0;31m'
    BOLD="\033[1m"
    YELLOW="\033[38;5;11m"
    NC='\033[0m' # No Color

    export CDK_NEW_BOOTSTRAP=1
    export IS_BOOTSTRAP=1
    echo "*************************************************************************************"
    echo "Now starting deployment of AMFA Controller"
    read -p "Confirm to deploy AMFA on Account $(echo -e $BOLD$YELLOW$CDK_DEPLOY_ACCOUNT$NC) in Region $(echo -e $BOLD$YELLOW$CDK_DEPLOY_REGION$NC)? (y/n)" response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "*************************************************************************************"
        npx cdk bootstrap aws://$CDK_DEPLOY_ACCOUNTD/$CDK_DEPLOY_REGION || (unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP)
        unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP
        npx cdk deploy "$@" --all
        echo "Deploy finished"
        echo "***************"
    fi
    unset NODE_OPTIONS
else
    echo -e "${RED} You must execute this script from an EC2 instance which have an Admin Role attached${NC}"
fi

unset TENANT_ID && unset ROOT_DOMAIN_NAME && unset ROOT_HOSTED_ZONE_ID && unset SP_PORTAL_URL && unset EXTRA_APP_URL && unset RECAPTCHA_KEY && unset RECAPTCHA_SECRET
