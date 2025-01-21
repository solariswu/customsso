##!/bin/bash
unset TENANT_ID && unset ROOT_DOMAIN_NAME && unset ROOT_HOSTED_ZONE_ID && unset SP_PORTAL_URL && unset EXTRA_APP_URL && unset RECAPTCHA_KEY && unset RECAPTCHA_SECRET

source ./config.sh

if [ -z "$TENANT_ID" ]; then
    echo "TENANT_ID is not set, please set TENANT_ID in config.sh"
    exit 1
fi

if aws sts get-caller-identity >/dev/null; then

    source ~/.bashrc
    NODE_OPTIONS=--max-old-space-size=8192

    #get region and account by EC2 info
    TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
    EC2_AVAIL_ZONE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)
    export CDK_DEPLOY_REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
    export CDK_DEPLOY_ACCOUNT=$(aws sts get-caller-identity | jq -r .Account)

    #define colors
    RED='\033[0;31m'
    BOLD="\033[1m"
    YELLOW="\033[38;5;11m"
    NC='\033[0m' # No Color

    echo "-------------------------------------"
    echo "aPersona Identity Manager Uninstaller"
    echo "-------------------------------------"
    echo "aPersona Identity Services may take between 45 min to 1 hr 30 min to complete."
    echo ""
    read -p "Confirm to uninstall AMFA on Account $(echo -e $BOLD$YELLOW$CDK_DEPLOY_ACCOUNT$NC) in Region $(echo -e $BOLD$YELLOW$CDK_DEPLOY_REGION$NC)? (y/n)" response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then

        spin[0]="-"
        spin[1]="\\"
        spin[2]="|"
        spin[3]="/"

        #check whether SSO-CUPStack exists
        if aws cloudformation describe-stacks --stack-name SSO-CUPStack >/dev/null 2>&1; then

            aws s3 rm s3://$CDK_DEPLOY_ACCOUNT-$CDK_DEPLOY_REGION-adminportal-amfa --recursive >/dev/null 2>&1
            aws cloudformation delete-stack --stack-name SSO-CUPStack >/dev/null 2>&1

            echo "[deleting admin portal stack]}"
            StackStatus=''
            i=0
            while [[ "$StackStatus" != 'DELETE_COMPLETE' && "$StackStatus" != 'DELETE_FAILED' ]]; do
                if [ $i == 0 ]; then
                    StackStatus=$(aws cloudformation list-stacks 2>/dev/null | jq .StackSummaries | jq 'map(select(.StackName=="'SSO-CUPStack'"))' | jq -r ".[0]".StackStatus)
                    echo -ne "\r$StackStatus ${spin[$i]}"
                fi
                echo -ne "\b${spin[$i]}"
                sleep 0.3
                i=$((i + 1))
                i=$((i % 4))
            done
            if [[ "$StackStatus" == 'DELETE_FAILED' || -z "$StackStatus" ]]; then
                echo -e "Admin portal service uninstall \b${RED}failed${NC}"
                exit 1
            else
                echo "Admin portal service uninstalled"
            fi
        else
            echo "Admin portal service not found"
        fi

        if aws cloudformation describe-stacks --stack-name APICertificateStack >/dev/null 2>&1; then

            # aws s3 rm s3://$CDK_DEPLOY_ACCOUNT-$CDK_DEPLOY_REGION-adminportal-amfa --recursive >/dev/null 2>&1
            aws cloudformation delete-stack --stack-name APICertificateStack >/dev/null 2>&1

            echo "[deleting certificate stack]}"
            StackStatus=''
            i=0
            while [[ "$StackStatus" != 'DELETE_COMPLETE' && "$StackStatus" != 'DELETE_FAILED' ]]; do
                if [ $i == 0 ]; then
                    StackStatus=$(aws cloudformation list-stacks 2>/dev/null | jq .StackSummaries | jq 'map(select(.StackName=="'APICertificateStack'"))' | jq -r ".[0]".StackStatus)
                    echo -ne "\r$StackStatus ${spin[$i]}"
                fi
                echo -ne "\b${spin[$i]}"
                sleep 0.3
                i=$((i + 1))
                i=$((i % 4))
            done
            if [[ "$StackStatus" == 'DELETE_FAILED' || -z "$StackStatus" ]]; then
                echo -e "certificate stack uninstall \b${RED}failed${NC}"
                exit 1
            else
                echo "Certificate service uninstalled"
            fi
        else
            echo "Certificate service not found"
        fi

        if aws cloudformation describe-stacks --region us-east-1 --stack-name CertStack222 >/dev/null 2>&1; then

            # aws s3 rm s3://$CDK_DEPLOY_ACCOUNT-$CDK_DEPLOY_REGION-adminportal-amfa --recursive >/dev/null 2>&1
            aws cloudformation delete-stack --region us-east-1 --stack-name CertStack222 >/dev/null 2>&1

            echo "[deleting certificate stack]}"
            StackStatus=''
            i=0
            while [[ "$StackStatus" != 'DELETE_COMPLETE' && "$StackStatus" != 'DELETE_FAILED' ]]; do
                if [ $i == 0 ]; then
                    StackStatus=$(aws cloudformation list-stacks --region us-east-1 2>/dev/null | jq .StackSummaries | jq 'map(select(.StackName=="'CertStack222'"))' | jq -r ".[0]".StackStatus)
                    echo -ne "\r$StackStatus ${spin[$i]}"
                fi
                echo -ne "\b${spin[$i]}"
                sleep 0.3
                i=$((i + 1))
                i=$((i % 4))
            done
            if [[ "$StackStatus" == 'DELETE_FAILED' || -z "$StackStatus" ]]; then
                echo -e "certificate stack uninstall \b${RED}failed${NC}"
                exit 1
            else
                echo "CertStack222 uninstalled"
            fi
        else
            echo "CertStack222 not found"
        fi

        #check whether AMFAStack exists
        if aws cloudformation describe-stacks --stack-name AmfaStack >/dev/null 2>&1; then
            aws s3 rm s3://$CDK_DEPLOY_ACCOUNT-amfa-$TENANT_ID --recursive >/dev/null 2>&1
            aws cloudformation delete-stack --stack-name AmfaStack >/dev/null 2>&1
            echo -n "[deleting AMFA stack] ${spin[0]}"
            StackStatus=''
            i=0
            while [[ "$StackStatus" != 'DELETE_COMPLETE' && "$StackStatus" != 'DELETE_FAILED' ]]; do
                if [ $i == 0 ]; then
                    StackStatus=$(aws cloudformation list-stacks 2>/dev/null | jq .StackSummaries | jq 'map(select(.StackName=="'AmfaStack'"))' | jq -r ".[0]".StackStatus)
                    echo -ne "\r$StackStatus ${spin[$i]} "
                fi
                echo -ne "\b${spin[$i]}"
                sleep 0.3
                i=$((i + 1))
                i=$((i % 4))
            done
            if [[ "$StackStatus" == 'DELETE_FAILED' || -z "$StackStatus" ]]; then
                echo -e "AMFA service uninstall \b${RED}failed${NC}"
                exit 1
            else
                echo "AMFA service uninstalled"
            fi
        else
            echo "AMFA service not found"
        fi

        ## userpool deleted, remove saml proxy backend file
        samlproxyClientId=$(jq -rc '."SSO-CUPStack".SAMLProxyAppClientID' apersona_idp_mgt_deploy_outputs.json)
        deleteSamlProxyRes=$(curl -X DELETE "https://api.samlproxy.apersona.com/samlproxy/$TENANT_ID" -d "{\"uninstall\":\"True\", \"clientId\":\"$samlproxyClientId\"}" 2>/dev/null)

        if aws cloudformation describe-stacks --region us-east-1 --stack-name CertificateStack >/dev/null 2>&1; then

            # aws s3 rm s3://$CDK_DEPLOY_ACCOUNT-$CDK_DEPLOY_REGION-adminportal-amfa --recursive >/dev/null 2>&1
            aws cloudformation delete-stack --region us-east-1 --stack-name CertificateStack >/dev/null 2>&1

            echo "[deleting certificate stack]}"
            StackStatus=''
            i=0
            while [[ "$StackStatus" != 'DELETE_COMPLETE' && "$StackStatus" != 'DELETE_FAILED' ]]; do
                if [ $i == 0 ]; then
                    StackStatus=$(aws cloudformation list-stacks --region us-east-1 2>/dev/null | jq .StackSummaries | jq 'map(select(.StackName=="'CertificateStack'"))' | jq -r ".[0]".StackStatus)
                    echo -ne "\r$StackStatus ${spin[$i]}"
                fi
                echo -ne "\b${spin[$i]}"
                sleep 0.3
                i=$((i + 1))
                i=$((i % 4))
            done
            if [[ "$StackStatus" == 'DELETE_FAILED' || -z "$StackStatus" ]]; then
                echo -e "certificate stack uninstall \b${RED}failed${NC}"
                exit 1
            else
                echo "CertificateStack uninstalled"
            fi
        else
            echo "CertificateStack not found"
        fi

        ## delete secrets for re-install
        aws secretsmanager delete-secret --secret-id apersona/$TENANT_ID/asm --force-delete-without-recovery >/dev/null 2>&1
        aws secretsmanager delete-secret --secret-id apersona/$TENANT_ID/smtp --force-delete-without-recovery >/dev/null 2>&1
        aws secretsmanager delete-secret --secret-id apersona/$TENANT_ID/secret --force-delete-without-recovery >/dev/null 2>&1

        ## delete dynamodb tables for re-install
        aws dynamodb delete-table --table-name amfa-$CDK_DEPLOY_ACCOUNT-$CDK_DEPLOY_REGION-configtable >/dev/null 2>&1
        ## shall be deleted only when all tenants deleted in multi-tenants, good for single tenant now.
        aws dynamodb delete-table --table-name amfa-$CDK_DEPLOY_ACCOUNT-$CDK_DEPLOY_REGION-tenanttable >/dev/null 2>&1

        ## clean cross region exporter parameters
        Params=$(aws ssm describe-parameters --parameter-filters "Key=Name,Option=Contains,Values=/AmfaStack/" --region $CDK_DEPLOY_REGION | jq .Parameters | jq .[].Name)
        for param_name in $Params; do
            aws ssm delete-parameter --name $param_name --region $CDK_DEPLOY_REGION >/dev/null 2>&1
        done
        Params=$(aws ssm describe-parameters --parameter-filters "Key=Name,Option=Contains,Values=/SSO-CUPStack/" --region $CDK_DEPLOY_REGION | jq .Parameters | jq .[].Name)
        for param_name in $Params; do
            aws ssm delete-parameter --name $param_name --region $CDK_DEPLOY_REGION >/dev/null 2>&1
        done

        echo "*************************************************************************************"
        echo "uninstall finished"
        echo "***************"
    fi
    unset NODE_OPTIONS
else
    echo -e "${RED} You must execute this script from an EC2 instance which have an Admin Role attached${NC}"
fi

unset TENANT_ID && unset ROOT_DOMAIN_NAME && unset ROOT_HOSTED_ZONE_ID && unset SP_PORTAL_URL && unset EXTRA_APP_URL && unset RECAPTCHA_KEY && unset RECAPTCHA_SECRET
