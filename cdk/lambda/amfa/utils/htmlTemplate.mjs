const HTML_TEMPLATE = (user, types, values, isByAdmin) => {
	let diff = `<p>Your following MFA value${types.length > 1 ? 's' : ''} has been changed${isByAdmin ? ' by Admin' : ''}.</p>`;

	for (let index = 0; index < types.length; index++) {
		diff += `<p>&nbsp;&nbsp;&#x2022; ${types[index]} has been `;
		diff += values[index] && values[index].length > 1 ? 'changed to ' + values[index] : 'removed';
		diff += '</p>';
	}

	console.log ('HTML template diff value', diff);

	return `
		<!DOCTYPE html >
			<html>
				<head>
					<meta charset="utf-8">
						<title>Email Title</title>
						<style>
							.container {
								width: 100%;
							height: 100%;
							padding: 20px;
							background-color: #f4f4f4;
			}
							.email {
								width: 80%;
							margin: 0 auto;
							background-color: #fff;
							padding: 20px;
			}
							.email-header {
								background - color: #333;
							color: #fff;
							padding: 20px;
							text-align: center;
			}
							.email-body {
								padding: 20px;
			}
							.email-footer {
								background - color: #333;
							color: #fff;
							padding: 20px;
							text-align: center;
			}
						</style>
				</head>
				<body>
					<div class="container">
						<div class="email">
							<div class="email-header">
								<h1>MFA value changed</h1>
							</div>
							<div class="email-body">
								<p>Hello ${user},</p>
								${diff}
								<p>If you did not make this change, please contact the help desk.</p>
							</div>
							<div class="email-footer">
								<p>APERSONA amfa</p>
							</div>
						</div>
					</div>
				</body>
			</html>
	`;
}

export default HTML_TEMPLATE;