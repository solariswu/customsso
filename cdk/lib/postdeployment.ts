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
) => {

	const lambdaName = 'postdeployment';
	const initLambda = new TriggerFunction(scope, 'CDKPostDeploymentLambda', {
		runtime: Runtime.NODEJS_18_X,
		handler: `${lambdaName}.handler`,
		code: Code.fromAsset(path.join(__dirname + `/../lambda/${lambdaName}`)),
		environment: {
			AMFACONFIG_TABLE: configTable.tableName,
		},
		timeout: Duration.minutes(5),
	});

	initLambda.role?.attachInlinePolicy(
		new Policy(scope, `${lambdaName}-lambda-policy`, {
			statements: [
				new PolicyStatement({
					actions: [
						'dynamodb:Scan',
						'dynamodb:GetItem',
						'dynamodb:PutItem',
					],
					resources: [configTable.tableArn],
				}),
			],
		})
	);
};
