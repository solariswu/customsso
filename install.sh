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

if [ -z "$SMTP_HOST" ] || [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASS" ] || [ -z "$SMTP_SECURE" ] [ -z "$SMTP_PORT" ]; then
    echo "SMTP info is not complete, please fill all SMTP_xxx values in config.sh"
    exit 1
fi

if [ -z "$MOBILE_TOKEN_KEY" ] || [ -z "$MOBILE_TOKEN_SALT" ]; then
    echo "MOBILE_TOKEN setting is not complete, please fill all MOBILE_TOKEN_xxx values in config.sh"
    exit 1
fi

if [ -z "$ASM_SALT" ] ; then
    echo "ASM_SALT is not set, please set ASM_SALT in config.sh"
    exit 1
fi

if [ -z "$TENANT_AUTH_TOKEN" ] ; then
    echo "TENANT_AUTH_TOKEN is not set, please set TENANT_AUTH_TOKEN in config.sh"
    exit 1
fi

if aws sts get-caller-identity >/dev/null; then
    DOMAINNAME=$(aws route53 get-hosted-zone --id $ROOT_HOSTED_ZONE_ID | jq -r .HostedZone.Name)
    if [ "$DOMAINNAME" != "$ROOT_DOMAIN_NAME""." ]; then
        echo "ROOT_DOMAIN_NAME and ROOT_HOSTED_ZONE_ID does not match"
        exit 1
    fi

    APERSONAIDP_REPO_NAME=customsso
    APERSONAADM_REPO_NAME=cognito-userpool-myraadmin

    source ~/.bashrc
    NODE_OPTIONS=--max-old-space-size=8192

    echo "install application dependency libs"
    cd $APERSONAIDP_REPO_NAME
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

    echo "generate AMFA front end config file"

    rm -rf src/const.js
    echo "export const clientName = '$TENANT_ID'" >> src/const.js
    echo "export const region = '$CDK_DEPLOY_REGION'" >> src/const.js
    echo "export const applicationUrl = '$SP_PORTAL_URL'" >> src/const.js
    echo "export const extraAppUrl = '$EXTRA_APP_URL'" >> src/const.js
    echo "export const apiUrl = 'https:///api.$TENANT_ID.$ROOT_DOMAIN_NAME'" >> src/const.js
    echo "export const recaptcha_key = '$RECAPTCHA_KEY'" >> src/const.js

    npm run build

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
        npx cdk bootstrap aws://$CDK_DEPLOY_ACCOUNT/us-east-1
        npx cdk bootstrap aws://$CDK_DEPLOY_ACCOUNT/$CDK_DEPLOY_REGION || (unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP)
        unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP
        npx cdk deploy "$@" --all

        cd ..
        cd $APERSONAADM_REPO_NAME

        export ADMINPORTAL_DOMAIN_NAME="adminportal.""$ROOT_DOMAIN_NAME"
        ADMINPORTAL_HOSTED_ZONE_ID=$(aws route53 create-hosted-zone --name $ADMINPORTAL_DOMAIN_NAME --caller-reference $RANDOM | jq .HostedZone.Id)
        ADMINPORTAL_HOSTED_ZONE_ID=${ADMINPORTAL_HOSTED_ZONE_ID%?}
        NAME_SERVERS=$(aws route53 get-hosted-zone --id $ADMINPORTAL_HOSTED_ZONE_ID | jq .DelegationSet.NameServers)
        export ADMINPORTAL_HOSTED_ZONE_ID=${ADMINPORTAL_HOSTED_ZONE_ID#*zone/}

        $(rm -rf ns_record.json)

        echo " {                         " >> ns_record.json
        echo "  \"Changes\": [{          " >> ns_record.json
        echo "  \"Action\": \"CREATE\",  " >> ns_record.json
        echo "  \"ResourceRecordSet\": { " >> ns_record.json
        echo "  \"Name\": \"$ADMINPORTAL_DOMAIN_NAME\", " >> ns_record.json
        echo "  \"Type\": \"NS\",        " >> ns_record.json
        echo "  \"TTL\": 300,            " >> ns_record.json
        echo "  \"ResourceRecords\": [   " >> ns_record.json

        count=0
        for NAME_SERVER in $NAME_SERVERS; do
            if [ $count = 1 ] || [ $count = 2 ] || [ $count = 3 ]; then
                    echo "  { \"Value\": ${NAME_SERVER%?}}, "  >> ns_record.json
            fi
            if [ $count = 4 ]; then
                    echo "  { \"Value\": $NAME_SERVER} "  >> ns_record.json
            fi
            ((count++))
        done

        echo "                       ]   " >> ns_record.json
        echo "  }}]                      " >> ns_record.json
        echo " }                         " >> ns_record.json

        RESULT=$(aws route53 change-resource-record-sets --hosted-zone-id $ROOT_HOSTED_ZONE_ID --change-batch file://ns_record.json)
        echo "NS RECORD ""$RESULT"

        npm install
        npm run build
        npm run cdk-build

        npx cdk deploy "$@" --all
        echo "Deploy finished"
        echo "***************"
    fi
    unset NODE_OPTIONS
else
    echo -e "${RED} You must execute this script from an EC2 instance which have an Admin Role attached${NC}"
fi