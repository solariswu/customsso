var i=Object.defineProperty;var s=Object.getOwnPropertyDescriptor;var d=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var m=(o,e)=>{for(var t in e)i(o,t,{get:e[t],enumerable:!0})},n=(o,e,t,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of d(e))!l.call(o,a)&&a!==t&&i(o,a,{get:()=>e[a],enumerable:!(r=s(e,a))||r.enumerable});return o};var h=o=>n(i({},"__esModule",{value:!0}),o);var c={};m(c,{default:()=>y});module.exports=h(c);var p=(o,e,t)=>`
		<!DOCTYPE html >
			<html>
				<head>
					<meta charset="utf-8">
						<title>Email Title</title>
						<style>
							.container {
								width: 95%;
								box-shadow: 0 0.5em 1em 0 rgba(0,0,0,0.2);
								margin: 2em auto;
								border-radius: 0.5em;

							}
							.email {
								padding: 1em 4em;
							}
							.email-body {
								padding-top: 0.5em;
							}
							.email-footer {
								text-align: center;
							}
							.logo {
								text-align: center;
							}
							img {
								height: 57px;
								width: 313px;
							}
						</style>
				</head>
				<body>
					<div class="container">
						<div class="logo">
							<img src="${e}" alt="logo" />
						</div>
						<div class="email">
							<div>
								<h1>Password changed</h1>
							</div>
							<div class="email-body">
								<p>Hello ${o},</p>
								<p>The password on your account has recently been reset${t?" by Admin":""}. If you performed this password reset, then this message is for your information only.</p>
								<br/>
								<p>If you are not sure you or your administrator performed this password reset, then you should contact your administrator immediately or change your password yourself.</p>
							</div>
							<div class="email-footer">
								<p>APERSONA amfa</p>
							</div>
						</div>
					</div>
				</body>
			</html>
	`,y=p;
//# sourceMappingURL=htmlTemplatePwd.js.map
