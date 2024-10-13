#!/bin/bash
unset TENANT_ID && unset ROOT_DOMAIN_NAME && unset ROOT_HOSTED_ZONE_ID && unset SP_PORTAL_URL && unset EXTRA_APP_URL && unset RECAPTCHA_KEY && unset RECAPTCHA_SECRET

source ./config.sh

if [ -z "$ASM_PORTAL_URL" ]; then
    echo "ASM_PORTAL_URL is not set, please set ASM_PORTAL_URL in config.sh"
    exit 1
fi

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

if [ -z "$ASM_INSTAL_KEY" ]; then
    echo "ASM_INSTAL_KEY is not set, please set ASM_INSTAL_KEY in config.sh"
    exit 1
fi

if [ -z "$SMTP_HOST" ]; then
    echo "SMTP_HOST is not set, please set SMTP_HOST in config.sh"
    exit 1
fi

if [ -z "$SMTP_USER" ]; then
    echo "SMTP_USER is not set, please set SMTP_USER in config.sh"
    exit 1
fi

if [ -z "$SMTP_PASS" ]; then
    echo "SMTP_PASS is not set, please set SMTP_PASS in config.sh"
    exit 1
fi

if [ -z "$SMTP_SECURE" ]; then
    export SMTP_SECRET="false"
fi

if [ -z "$SMTP_PORT" ]; then
    echo "SMTP_PORT is not set, use default value 587"
    export SMTP_PORT=587
fi

if [ -z "$ASM_SALT" ]; then
    echo "ASM_SALT is not set, please set ASM_SALT in config.sh"
    exit 1
fi

if [ -z "$ADMIN_EMAIL" ]; then
    echo "ADMIN_EMAIL is not set, please set ADMIN_EMAIL in config.sh"
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

    if [ -z "$TENANT_NAME" ]; then
        echo "TENANT_NAME is not set, using TENANT_ID as TENANT_NAME"
        TENANT_NAME=$(jq -rn --arg x "$TENANT_ID" '$x|@uri')
    fi

    TENANT_NAME=$(jq -rn --arg x "$TENANT_NAME" '$x|@uri')

    export MOBILE_TOKEN_SALT=$(aws secretsmanager get-secret-value --region $CDK_DEPLOY_REGION --secret-id "apersona/$TENANT_ID/secret" | jq -r .SecretString | jq -r -c .Mobile_Token_Salt)

    if [ -z "$MOBILE_TOKEN_SALT" ]; then
        ## not deployed yet
        registRes=$(curl -X POST -F "newTenantName=$TENANT_NAME" -F "awsAccountId=$CDK_DEPLOY_ACCOUNT" -F "newTenantAdminEmail=$ADMIN_EMAIL" -F "asmSecretKey=$ASM_INSTAL_KEY" -F "awsUserPoolFqdn=$ROOT_DOMAIN_NAME" -F "awsRegion=$CDK_DEPLOY_REGION" -F "requestedBy=$INSTALLER_EMAIL" "$ASM_PORTAL_URL/newTenantAssignmentWithDefaults.ap")
        echo "amfa register result: "$registRes
        export ASM_PROVIDER_ID=$(echo $registRes | jq -r .newTenantId)
        export MOBILE_TOKEN_KEY=$(echo $registRes | jq -r .mobileTokenKey)
        export MOBILE_TOKEN_SALT=$(echo $registRes | jq -r .mobileTokenSalt)
        export TENANT_AUTH_TOKEN=$(echo $registRes | jq -r .asmTenantSecretKey)
    else
            ## already deployed
        export MOBILE_TOKEN_KEY=$(aws secretsmanager get-secret-value --region $CDK_DEPLOY_REGION --secret-id "apersona/$TENANT_ID/secret" | jq -r .SecretString | jq -r -c .Mobile_Token_Key)
        export ASM_PROVIDER_ID=$(aws secretsmanager get-secret-value --region $CDK_DEPLOY_REGION --secret-id "apersona/$TENANT_ID/secret" | jq -r .SecretString | jq -r -c .Provider_Id)
        export TENANT_AUTH_TOKEN=$(aws secretsmanager get-secret-value --region $CDK_DEPLOY_REGION --secret-id "apersona/$TENANT_ID/asm" | jq -r .SecretString | jq -r -c .tenantAuthToken)

    fi

    if [ -z "$ASM_PROVIDER_ID" ]; then
        echo "ASM portal newTenant API error, no provider_id, please check your install key and admin email value and contact Apersona for support"
        exit 1
    fi

    if [ -z "$MOBILE_TOKEN_SALT" ]; then
        echo "ASM portal newTenant API error, no mobile token salt, please check your install key and admin email value and contact Apersona for support"
        exit 1
    fi

    if [ -z "$MOBILE_TOKEN_KEY" ]; then
        echo "ASM portal newTenant API error, no mobile token key, please check your install key and admin email value and contact Apersona for support"
        exit 1
    fi

    if ! aws iam get-role --role-name CrossAccountDnsDelegationRole-DO-NOT-DELETE >/dev/null 2>&1; then
        rm -rf delegationRole.json
        echo "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":\"arn:aws:iam::$CDK_DEPLOY_ACCOUNT:root\"},\"Action\":\"sts:AssumeRole\"}]}" >>delegationRole.json

        aws iam create-role --role-name CrossAccountDnsDelegationRole-DO-NOT-DELETE --assume-role-policy-document file://delegationRole.json
        aws iam create-policy --policy-name dns-delegation-policy --policy-document file://delegationPolicy.json
        aws iam attach-role-policy --role-name CrossAccountDnsDelegationRole-DO-NOT-DELETE --policy-arn "arn:aws:iam::$CDK_DEPLOY_ACCOUNT:policy/dns-delegation-policy"
    fi

    echo "generate AMFA front end config file"

    rm -rf src/const.js
    echo "export const clientName = '$TENANT_ID'" >>src/const.js
    echo "export const region = '$CDK_DEPLOY_REGION'" >>src/const.js
    echo "export const applicationUrl = '$SP_PORTAL_URL'" >>src/const.js
    echo "export const extraAppUrl = '$EXTRA_APP_URL'" >>src/const.js
    echo "export const apiUrl = 'https:///api.$TENANT_ID.$ROOT_DOMAIN_NAME'" >>src/const.js
    echo "export const recaptcha_key = '$RECAPTCHA_KEY'" >>src/const.js

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
    echo "Now starting deployment of APERSONA AWS IdP"
    read -p "Confirm to deploy AMFA on Account $(echo -e $BOLD$YELLOW$CDK_DEPLOY_ACCOUNT$NC) in Region $(echo -e $BOLD$YELLOW$CDK_DEPLOY_REGION$NC)? (y/n)" response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "*************************************************************************************"
        npx cdk bootstrap aws://$CDK_DEPLOY_ACCOUNT/us-east-1
        npx cdk bootstrap aws://$CDK_DEPLOY_ACCOUNT/$CDK_DEPLOY_REGION || (unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP)
        unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP
        npx cdk deploy "$@" --all --outputs-file ../apersona_idp_deploy_outputs.json

        cd ..
        cd $APERSONAADM_REPO_NAME

        export ADMINPORTAL_DOMAIN_NAME="adminportal.""$ROOT_DOMAIN_NAME"
        ADMINPORTAL_HOSTED_ZONE_ID=$(aws route53 list-hosted-zones | jq .HostedZones | jq 'map(select(.Name=="'$ADMINPORTAL_DOMAIN_NAME'."))' | jq -r '.[0]'.Id)
        if [ -z "$ADMINPORTAL_HOSTED_ZONE_ID" ] || [ "$ADMINPORTAL_HOSTED_ZONE_ID" = "null" ]; then
            echo "Creating hosted zone for $ADMINPORTAL_DOMAIN_NAME"
            ADMINPORTAL_HOSTED_ZONE_ID=$(aws route53 create-hosted-zone --name $ADMINPORTAL_DOMAIN_NAME --caller-reference $RANDOM | jq .HostedZone.Id)
            ADMINPORTAL_HOSTED_ZONE_ID=${ADMINPORTAL_HOSTED_ZONE_ID%?}
            NAME_SERVERS=$(aws route53 get-hosted-zone --id $ADMINPORTAL_HOSTED_ZONE_ID | jq .DelegationSet.NameServers)

            $(rm -rf ns_record.json)

            echo " {                         " >>ns_record.json
            echo "  \"Changes\": [{          " >>ns_record.json
            echo "  \"Action\": \"CREATE\",  " >>ns_record.json
            echo "  \"ResourceRecordSet\": { " >>ns_record.json
            echo "  \"Name\": \"$ADMINPORTAL_DOMAIN_NAME\", " >>ns_record.json
            echo "  \"Type\": \"NS\",        " >>ns_record.json
            echo "  \"TTL\": 300,            " >>ns_record.json
            echo "  \"ResourceRecords\": [   " >>ns_record.json

            count=0
            for NAME_SERVER in $NAME_SERVERS; do
                if [ $count = 1 ] || [ $count = 2 ] || [ $count = 3 ]; then
                    echo "  { \"Value\": ${NAME_SERVER%?}}, " >>ns_record.json
                fi
                if [ $count = 4 ]; then
                    echo "  { \"Value\": $NAME_SERVER} " >>ns_record.json
                fi
                ((count++))
            done

            echo "                       ]   " >>ns_record.json
            echo "  }}]                      " >>ns_record.json
            echo " }                         " >>ns_record.json

            RESULT=$(aws route53 change-resource-record-sets --hosted-zone-id $ROOT_HOSTED_ZONE_ID --change-batch file://ns_record.json)
            $(rm -rf ns_record.json)
        else
            echo "Hosted zone for $ADMINPORTAL_DOMAIN_NAME already exists"
        fi

        export ADMINPORTAL_HOSTED_ZONE_ID=${ADMINPORTAL_HOSTED_ZONE_ID#*zone/}
        echo "Admin Portal Hosted Zone ID is $ADMINPORTAL_HOSTED_ZONE_ID"

        npm install
        # npm run build
        npm run cdk-build

        npx cdk deploy "$@" --all --outputs-file ../apersona_idp_mgt_deploy_outputs.json

        # update admin frontend config with the deployed userpool id and appclient
        ADMINPORTAL_USERPOOL_ID=$(jq 'to_entries|.[]|select (.key=="SSO-CUPStack")|.value|.AdminPortalUserPoolId' ../apersona_idp_mgt_deploy_outputs.json)
        ADMINPORTAL_CLIENT_ID=$(jq 'to_entries|.[]|select (.key=="SSO-CUPStack")|.value|.AdminPortalClientId' ../apersona_idp_mgt_deploy_outputs.json)
        ADMINPORTAL_HOSTEDUI_URL=$(jq 'to_entries|.[]|select (.key=="SSO-CUPStack")|.value|.AdminLoginHostedUIURL' ../apersona_idp_mgt_deploy_outputs.json)

        if [ -z "$ADMINPORTAL_USERPOOL_ID" ] || [ -z "$ADMINPORTAL_CLIENT_ID" ] || [ -z "$ADMINPORTAL_HOSTEDUI_URL" ]; then
            echo "Admin Portal deployment failed"
            echo "Some resources are not generated"
        else
            rm -rf public/amfaext.js
            echo "export const AdminPortalUserPoolId="$ADMINPORTAL_USERPOOL_ID >>public/amfaext.js
            echo "export const AdminPortalClientId="$ADMINPORTAL_CLIENT_ID >>public/amfaext.js
            echo "export const AdminHostedUIURL="$ADMINPORTAL_HOSTEDUI_URL >>public/amfaext.js
            echo "export const SPPortalUrl='$SP_PORTAL_URL'" >>public/amfaext.js
            # deploy admin portal stack again
            # npm run build
            npm run cdk-build
            rm -rf ../apersona_idp_mgt_deploy_outputs.json
            npx cdk deploy "$@" --all --outputs-file ../apersona_idp_mgt_deploy_outputs.json
        fi

        echo "Deploy finished"
        echo "***************"
    fi
    unset NODE_OPTIONS
else
    echo -e "${RED} You must execute this script from an EC2 instance which have an Admin Role attached${NC}"
fi
