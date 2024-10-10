#!/bin/bash

AMFA_FOLD=$(basename `pwd`)

if [ -d "../"$AMFA_FOLD"_release" ]; then
	echo "../"$AMFA_FOLD"_release" "already exists"
	read -p "do you want to override it? (y/n)" response
	if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
		rm -rf ../$AMFA_FOLD"_release"
	else
		exit 1;
	fi
fi

echo 'making release... wait'
cd ..
cp -r $AMFA_FOLD $AMFA_FOLD"_release" >/dev/null 2>&1
cd $AMFA_FOLD"_release"
rm -rf cdk.out .git node_modules mk_release.sh config_bak.sh
rm -rf cdk/lambda/amfa/utils cdk/lambda/amfa/*.mjs
rm -rf cdk/lambda/totptoken/*.mjs
rm -rf cdk/lambda/passwordreset/*.mjs

git init >/dev/null 2>&1
git add . >/dev/null 2>&1
git commit -m "release" >/dev/null 2>&1

echo 'release made in folder '../$AMFA_FOLD"_release"


