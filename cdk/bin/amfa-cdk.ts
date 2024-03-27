#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CertificateStack } from '../lib/certificate';
import { AmfaStack } from '../lib/amfa-stack';
import { config, env } from '../lib/config';

const app = new App();

const certEnv = {
	account: env.awsaccount, //process.env.CDK_DEFAULT_ACCOUNT,
	region: 'us-east-1',
};

const certStack = new CertificateStack(app, 'CertificateStack', {
	env: certEnv,
	crossRegionReferences: true,
},
	config['amfa-dev004'].tenantId,
);

const amfaEnv = {
	account: env.awsaccount, //process.env.CDK_DEFAULT_ACCOUNT,
	region: env.region,
}

new AmfaStack(app, 'AmfaStack', {
	siteCertificate: certStack.siteCertificate,
	apiCertificate: certStack.apiCertificate,
	hostedZone: certStack.hostedZone,
	env: amfaEnv,
	crossRegionReferences: true,
});

app.synth();
