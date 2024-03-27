import { Construct } from 'constructs';
import { TriggerFunction } from 'aws-cdk-lib/triggers';

import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';

import * as path from 'path';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

import { config } from './config';

// import type { TenantInfo } from './types';

export const createPostDeploymentLambda = (
	scope: Construct,
	configTable: Table,
	tenantTable: Table,
	userPoolId: string,
	tenantId: string,
) => {

	// todo update multi-tenants later
	// const userpoolIds : object[]= [];
	// tenants.map (tenant => userpoolIds.push({ [tenant.tenantId]: tenant.userpoolId }));

	const lambdaName = 'postdeployment';
	const initLambda = new TriggerFunction(scope, 'CDKPostDeploymentLambda', {
		runtime: Runtime.NODEJS_18_X,
		handler: `${lambdaName}.handler`,
		code: Code.fromAsset(path.join(__dirname + `/../lambda/${lambdaName}`)),
		environment: {
			AMFACONFIG_TABLE: configTable.tableName,
			AMFATENANT_TABLE: tenantTable.tableName,
			USERPOOL_ID: userPoolId,
			// USERPOOL_IDS: JSON.stringify(userpoolIds),
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
					],
					resources: [`arn:aws:cognito-idp:${config[tenantId].region}:*:userpool/${userPoolId}`],
					// resources,
				}),
			],
		})
	);
};
