import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';

import { Construct } from 'constructs';

export class AmfaServcieDDB {
	scope: Construct;
	account: string | undefined;
	region: string | undefined;
	tenantId: string | undefined;
	authCodeTable: Table;
	sessionIdTable: Table;
	configTable: Table;
	tenantTable: Table;
	totpTokenTable: Table;
	pwdHashTable: Table;

	constructor(scope: Construct, account: string | undefined, region: string | undefined, tenantId: string | undefined) {
		this.scope = scope;
		this.account = account;
		this.region = region;
		this.tenantId = tenantId;

		this.authCodeTable = this.createAuthCodeTable ();
		this.configTable = this.createAmfaConfigTable();
		this.sessionIdTable = this.createSessionIdTable();
		this.tenantTable = this.createAmfaTenantTable();
		this.totpTokenTable = this.createTotpTokenTable();
		this.pwdHashTable = this.createPWDHashTable();

	}

	private createAuthCodeTable = () => {
		const table = new Table(this.scope, `amfa-authcode-${this.tenantId}`, {
			partitionKey: { name: 'username', type: AttributeType.STRING },
			sortKey: { name: 'apti', type: AttributeType.STRING },
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY,
			timeToLiveAttribute: 'ttl',
		});
		return table;
	}

	private createAmfaConfigTable() {
		const table = new Table(this.scope, `amfa-config-${this.tenantId}`, {
			tableName: `amfa-${this.account}-${this.region}-configtable`,
			partitionKey: { name: 'configtype', type: AttributeType.STRING },
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY,
		});
		return table;
	}

	private createSessionIdTable() {
		const table = new Table(this.scope, `amfa-sessionid-${this.tenantId}`, {
			partitionKey: { name: 'uuid', type: AttributeType.STRING },
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY,
			timeToLiveAttribute: 'ttl',
		});
		return table;
	}

	private createAmfaTenantTable() {
		const table = new Table(this.scope, 'amfa-tenant', {
			tableName: `amfa-${this.account}-${this.region}-tenanttable`,
			partitionKey: { name: 'id', type: AttributeType.STRING },
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY,
		});
		return table;
	}

	private createTotpTokenTable() {
		const table = new Table(this.scope, `amfa-totptoken-${this.tenantId}`, {
			partitionKey: { name: 'id', type: AttributeType.STRING },
			billingMode: BillingMode.PAY_PER_REQUEST,
		});
		return table;
	}

	private createPWDHashTable = () => {
		const table = new Table(this.scope, `amfa-pwdhash-${this.account}-${this.tenantId}`, {
			partitionKey: { name: 'username', type: AttributeType.STRING },
			sortKey: { name: 'timestamp', type: AttributeType.NUMBER },
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.RETAIN,
		});
		return table;
	}
}