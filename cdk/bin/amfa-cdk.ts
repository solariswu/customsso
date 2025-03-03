#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CertificateStack } from '../lib/certificate';
import { AmfaStack } from '../lib/amfa-stack';
// import { config } from '../lib/config';

const app = new App();

const certEnv = {
	account: process.env.CDK_DEPLOY_ACCOUNT,
	region: 'us-east-1',
};

const certStack = new CertificateStack(app, 'CertificateStack', {
	env: certEnv,
	crossRegionReferences: true,
},
	process.env.TENANT_ID
	// config[0].tenantId, //needs to be change for multi-tenants
);

const amfaEnv = {
	account: process.env.CDK_DEPLOY_ACCOUNT,
	region: process.env.CDK_DEPLOY_REGION,
}

new AmfaStack(app, 'AmfaStack', {
	siteCertificate: certStack.siteCertificate,
	apiCertificate: certStack.apiCertificate,
	hostedZone: certStack.hostedZone,
	env: amfaEnv,
	crossRegionReferences: true,
});

app.synth();
