#!/bin/bash

AMFA_FOLD=$(basename `pwd`)

if [ -d "../"$AMFA_FOLD"_beta" ]; then
	echo "../"$AMFA_FOLD"_beta" "already exists"
	read -p "do you want to override it? (y/n)" response
	if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
		rm -rf ../$AMFA_FOLD"_beta"
	else
		exit 1;
	fi
fi

git checkout beta >/dev/null 2>&1

echo 'making beta version of AMFA ... wait'
npm i
npm run build
npm run lambda-build
rm -rf node_modules
cd spportal
npm i
npm run build
rm -rf node_modules
cd ../..
cp -r $AMFA_FOLD $AMFA_FOLD"_beta" >/dev/null 2>&1
cd $AMFA_FOLD"_beta"
rm -rf cdk.out .git src public mk_release.sh mk_beta.sh config_bak.sh spportal/src spportal/public spportal/*.*
rm -rf cdk/lambda/amfa/utils cdk/lambda/amfa/*.mjs
rm -rf cdk/lambda/totptoken/*.mjs
rm -rf cdk/lambda/passwordreset/*.mjs
rm -rf cdk/lambda/customemailsender/*.mjs

git init >/dev/null 2>&1
git add . >/dev/null 2>&1
git commit -m "beta version" >/dev/null 2>&1

echo 'Beta made in folder '../$AMFA_FOLD"_beta"


