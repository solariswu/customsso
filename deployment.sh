#!/bin/bash

#deployment tenant info
export TENANT_ID='amfa-dev004'
export SP_PORTAL_URL='https://apersona.netlify.app'
export EXTRA_APP_URL='https://amfa.netlify.app/'
export SAML_INSTANCE_ID='i-028b38d91c41d660c'

if aws sts get-caller-identity >/dev/null; then

    source ~/.bashrc
    export NODE_OPTIONS=--max-old-space-size=4096

    npm install

    npm run build
    npm run lambda-build

    echo ""
    echo "**********************************"
    echo "Please wait"

    npm run cdk-build

    #check DNS domain

    #bootstrap CDK account and region
    # set -e

    RED='\033[0;31m'
    BOLD="\033[1m"
    YELLOW="\033[38;5;11m"
    NC='\033[0m' # No Color

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

    export CDK_NEW_BOOTSTRAP=1
    export IS_BOOTSTRAP=1
    echo "*************************************************************************************"
    echo "Now starting deployment of AMFA Controller"
    read -p "Confirm to deploy AMFA on Account $(echo -e $BOLD$YELLOW$CDK_DEPLOY_ACCOUNT$NC) in Region $(echo -e $BOLD$YELLOW$CDK_DEPLOY_REGION$NC)? (y/n)" response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "*************************************************************************************"
        npx cdk bootstrap aws://$CDK_DEPLOY_ACCOUNTD/$CDK_DEPLOY_REGION || (unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP)
        unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP
        shift
        shift
        npx cdk deploy "$@" --all
        echo "Deploy finished"
        echo "***************"
        exit $?
    fi
else
    echo -e "${RED} You must execute this script from an EC2 instance which have an Admin Role attached${NC}"
fi
