// import axios from 'axios';

export const fetchConfigData = async () => {

	// const getTenantDataResponse = async () => {
	// 	return await fetch(process.env.TENANT_CONFIG_URL);
	// 	// return axios.get(process.env.TENANT_CONFIG_URL);
	// }

	// const getConfigResponse = async () => {
	// 	return await fetch(process.env.AMFA_CONFIG_URL);
	// 	// return await axios.get(process.env.AMFA_CONFIG_URL);
	// }

	const [tenantDataRes, configDataRes] = await Promise.allSettled([fetch(process.env.TENANT_CONFIG_URL), fetch(process.env.AMFA_CONFIG_URL)]);

	console.log('tenantDataRes:', tenantDataRes);
	console.log('configDataRes:', configDataRes);

	if (tenantDataRes.status === 'rejected' || configDataRes.status === 'rejected') {
		console.log('Error getting amfa config file:', configDataRes.reason);
		console.log('Error getting tenant data:', tenantDataRes.reason);

		throw new Error('Error getting config file');
	}

	if (tenantDataRes.value.status !== 200 || configDataRes.value.status !== 200) {
		console.log('Error getting amfa config file:', configDataRes.value);
		console.log('Error getting tenant data:', tenantDataRes.value);

		throw new Error('Error getting config file');
	}

	const tenantData = await tenantDataRes.value.json();
	const configData = await configDataRes.value.json();

	console.log('tenantData:', tenantData);
	console.log('configData:', configData);

	return [tenantData, configData];
	// console.log('fetchConfigData:', tenantDataRes.value.data, configDataRes.value.data);
	// return [tenantDataRes.value.data, configDataRes.value.data];

}