import { Construct } from 'constructs';
import { TriggerFunction } from 'aws-cdk-lib/triggers';

import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';

import * as path from 'path';
import { Table } from 'aws-cdk-lib/aws-dynamodb';


export const createPostDeploymentLambda = (
	scope: Construct,
	configTable: Table,
	tenantTable: Table,
	userPoolId: string,
	region: string | undefined,
	tenantId: string | undefined,
	tenantName: string | undefined,
) => {

	// todo update multi-tenants later
	// const userpoolIds : object[]= [];
	// tenants.map (tenant => userpoolIds.push({ [tenant.tenantId]: tenant.userpoolId }));

	const lambdaName = 'postdeployment';
	const tenant_id = tenantId || 'default';
	const initLambda = new TriggerFunction(scope, 'CDKPostDeploymentLambda', {
		runtime: Runtime.NODEJS_20_X,
		handler: `${lambdaName}.handler`,
		code: Code.fromAsset(path.join(__dirname + `/../lambda/${lambdaName}`)),
		environment: {
			AMFACONFIG_TABLE: configTable.tableName,
			AMFATENANT_TABLE: tenantTable.tableName,
			USERPOOL_IDS: JSON.stringify([userPoolId]),
			AMFA_TENANTS: JSON.stringify([{
				tenant_id,
				name: tenantName,
				url: `https://${tenant_id}.${process.env.ROOT_DOMAIN_NAME}`,
				endUserSpUrl: process.env.SP_PORTAL_URL ? process.env.SP_PORTAL_URL : '',
				extraAppUrl: process.env.EXTRA_APP_URL ? process.env.EXTRA_APP_URL : '',
				samlproxy: true,
				contact: process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL : ''
			}]),
			ASM_PROVIDER_ID: process.env.ASM_PROVIDER_ID ? process.env.ASM_PROVIDER_ID : '',
			ASM_POLICIES: process.env.ASM_POLICIES ? process.env.ASM_POLICIES : '',
			ASM_PORTAL_URL: process.env.ASM_PORTAL_URL ? process.env.ASM_PORTAL_URL : '',
			ASM_SERVICE_URL: process.env.ASM_SERVICE_URL ? process.env.ASM_SERVICE_URL : '',
		},
		timeout: Duration.minutes(5),
	});

	// const resources: string[] = [];
	// todo update multi-tenants later
	// tenants.map (tenant => resources.push(`arn:aws:cognito-idp:${config[tenant.tenantId].region}:*:userpool/${tenant.userpoolId}`));

	initLambda.role?.attachInlinePolicy(
		new Policy(scope, `${lambdaName}-lambda-policy`, {
			statements: [
				new PolicyStatement({
					actions: [
						'dynamodb:Scan',
						'dynamodb:GetItem',
						'dynamodb:PutItem',
					],
					resources: [configTable.tableArn, tenantTable.tableArn],
				}),
				new PolicyStatement({
					actions: [
						'cognito-idp:CreateGroup',
						'cognito-idp:DescribeUserPool',
						'cognito-idp:UpdateUserPool'
					],
					resources: [`arn:aws:cognito-idp:${region}:*:userpool/${userPoolId}`],
					// resources,
				}),
				new PolicyStatement({
					actions: [
						'iam:PassRole'
					],
					resources: [`arn:aws:iam::*:role/AmfaStack-amfauserpoolsmsRole*`],
				}),
			],
		})
	);
};
