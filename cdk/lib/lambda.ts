import {Construct} from 'constructs';
import {Function, Code, Runtime} from 'aws-cdk-lib/aws-lambda';
import {Duration} from 'aws-cdk-lib';
import {Policy, PolicyStatement} from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { config } from '../lib/config';

// basic lambda policy
export const BasicLambdaPolicyStatement = new PolicyStatement({
  actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
  resources: ['arn:aws:logs:*:*:*'],
});

// oauth endpoint lambda related policy
export const getOAuthLambdaPolicy = (oAuthEndpointName: string) => {
  // todo: different policies for different endpoints

  return  ([
      BasicLambdaPolicyStatement,
      new PolicyStatement({
        actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
        resources: ['*'],
      }),
    ]);
};

export const createAuthChallengeFn = (
  scope: Construct,
  lambdaName: string,
  runtime: Runtime
) => {
  const fn = new Function(scope, lambdaName, {
    runtime,
    handler: `${lambdaName}.handler`,
    code: Code.fromAsset(path.join(__dirname, `/../lambda/${lambdaName}`)),
    timeout: Duration.minutes(5),
    environment: {
      LANDING_PAGE: config.customauthLandingpage,
      SENDER: config.emailfrom,
      GMAIL_ACCOUNT: config.gmailaddress,
      GMAIL_APPPWD: config.gmailapppwd,
    },
  });

  fn.role?.attachInlinePolicy(
    new Policy(scope, `hc-${lambdaName}-policy`, {
      statements: [BasicLambdaPolicyStatement],
    })
  );

  return fn;
};
