#!/bin/bash

#project code repo
PRJ_REPO_BASE=https://github.com/solariswu/
PRJ_REPO_NAME=customsso

#deployment tenant info
export TENANT_ID='amfa-dev004'
export SP_PORTAL_URL='https://apersona.netlify.app'
export EXTRA_APP_URL='https://amfa.netlify.app/'
export SAML_INSTANCE_ID='i-028b38d91c41d660c'

#deployment CDK env
NVM_VER=v0.39.7
NPM_VER=10.8.2

#install node
if aws sts get-caller-identity >/dev/null; then

    rm -rf .nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VER/install.sh | bash
    source ~/.bashrc
    nvm install --lts

    #install git
    sudo yum update -y
    sudo yum install git -y

    #update npm
    npm install -g npm@$NPM_VER

    #download code repo
    git clone $PRJ_REPO_BASE$PRJ_REPO_BASE
    cd $PRJ_REPO_NAME
    git pull
    npm install
    export NODE_OPTIONS=--max-old-space-size=4096

    npm run build
    npm run lambda-build
    npm run cdk-build

    #check DNS domain

    #bootstrap CDK account and region
    set -e

    RED='\033[0;31m'
    BOLD="\033[1m"
    YELLOW="\033[38;5;11m"
    NC='\033[0m' # No Color

    #get region and account by EC2 info
    TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
    EC2_AVAIL_ZONE=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)
    CDK_DEPLOY_REGION=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
    CDK_DEPLOY_ACCOUNT=$(aws sts get-caller-identity | jq -r .Account)

    export CDK_NEW_BOOTSTRAP=1
    export IS_BOOTSTRAP=1
    echo
    echo "*************************************************************************************"
    read -p "Are you sure you want to bootstrap Account $(echo -e $BOLD$YELLOW$CDK_DEPLOY_ACCOUNT$NC) in Region $(echo -e $BOLD$YELLOW$CDK_DEPLOY_REGION$NC)? (y/n)" response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "*************************************************************************************"
        npx cdk bootstrap aws://$CDK_DEPLOY_ACCOUNTD/$CDK_DEPLOY_REGION || (unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP)
        unset IS_BOOTSTRAP && unset CDK_NEW_BOOTSTRAP
        shift
        shift
        npx cdk deploy "$@" --all
        exit $?
    fi
else
    echo -e "${RED} You must execute this script from an EC2 instance which have an Admin Role attached${NC}"
fi
