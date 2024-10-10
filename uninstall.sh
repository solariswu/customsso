#!/bin/bash
unset TENANT_ID && unset ROOT_DOMAIN_NAME && unset ROOT_HOSTED_ZONE_ID && unset SP_PORTAL_URL && unset EXTRA_APP_URL && unset RECAPTCHA_KEY && unset RECAPTCHA_SECRET

source ./config.sh

if [ -z "$TENANT_ID" ]; then
    echo "TENANT_ID is not set, please set TENANT_ID in config.sh"
    exit 1
fi

if [ -z "$ROOT_DOMAIN_NAME" ]; then
    echo "ROOT_DOMAIN_NAME is not set, please set ROOT_DOMAIN_NAME in config.sh"
    exit 1
fi

if [ -z "$ROOT_HOSTED_ZONE_ID" ]; then
    echo "ROOT_HOSTED_ZONE_ID is not set, please set ROOT_HOSTED_ZONE_ID in config.sh"
    exit 1
fi

if aws sts get-caller-identity >/dev/null; then

    source ~/.bashrc
    NODE_OPTIONS=--max-old-space-size=8192

    echo "install application dependency libs"
    npm install

    if [ -z "$SP_PORTAL_URL" ]; then
        echo "SP_PORTAL_URL is not configured"
        if [ -z "$EXTRA_APP_URL" ]; then
        echo "EXTRA_APP_URL is not configured too, you would need to manually config userpool callback url later"
        else
        export SP_PORTAL_URL=$EXTRA_APP_URL
        echo "using EXTRA_APP_URL as default application url"
        fi
    fi

    #get region and account by EC2 info
    TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
    EC2_AVAIL_ZONE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)
    export CDK_DEPLOY_REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
    export CDK_DEPLOY_ACCOUNT=$(aws sts get-caller-identity | jq -r .Account)

    rm delegationRole.json
    echo "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":\"arn:aws:iam::$CDK_DEPLOY_ACCOUNT:root\"},\"Action\":\"sts:AssumeRole\"}]}" >> delegationRole.json

    if ! aws iam get-role --role-name CrossAccountDnsDelegationRole-DO-NOT-DELETE >/dev/null 2>&1; then
        aws iam create-role --role-name CrossAccountDnsDelegationRole-DO-NOT-DELETE --assume-role-policy-document file://delegationRole.json
        aws iam create-policy --policy-name dns-delegation-policy --policy-document file://delegationPolicy.json
        aws iam attach-role-policy --role-name CrossAccountDnsDelegationRole-DO-NOT-DELETE --policy-arn "arn:aws:iam::$CDK_DEPLOY_ACCOUNT:policy/dns-delegation-policy"
    fi


    RED='\033[0;31m'
    BOLD="\033[1m"
    YELLOW="\033[38;5;11m"
    NC='\033[0m' # No Color

    echo "*************************************************************************************"
    echo "Now starting uninstall AMFA Controller"
    read -p "Confirm to uninstall AMFA on Account $(echo -e $BOLD$YELLOW$CDK_DEPLOY_ACCOUNT$NC) in Region $(echo -e $BOLD$YELLOW$CDK_DEPLOY_REGION$NC)? (y/n)" response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "*************************************************************************************"
        npx cdk destroy "$@" --all
        echo "uninstall finished"
        echo "***************"
    fi
    unset NODE_OPTIONS
else
    echo -e "${RED} You must execute this script from an EC2 instance which have an Admin Role attached${NC}"
fi

unset TENANT_ID && unset ROOT_DOMAIN_NAME && unset ROOT_HOSTED_ZONE_ID && unset SP_PORTAL_URL && unset EXTRA_APP_URL && unset RECAPTCHA_KEY && unset RECAPTCHA_SECRET
