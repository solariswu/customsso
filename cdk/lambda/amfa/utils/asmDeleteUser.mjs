export const asmDeleteUser = async (headers, email, configs, requestId, policies, admin) => {

	console.log('asmDeleteUser payload ', email, ' configs ', configs);
	const reason = 'Removing user by aPersona AWS Identity Manager.';
	const postURL = `${configs.asmurl}/extRemoveUser.kv?l=${policies.default['policy_name']}&u=${encodeURIComponent(email)}&admin=${encodeURIComponent(admin ? admin : 'AWS-ASM-Svc')}&reason=${encodeURIComponent(reason)}`

	console.log (`now posting to ${postURL}`)

	return fetch(postURL, {
		method: "POST"
	});

}
