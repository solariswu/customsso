var n=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var h=Object.getOwnPropertyNames;var s=Object.prototype.hasOwnProperty;var g=(t,e)=>{for(var a in e)n(t,a,{get:e[a],enumerable:!0})},c=(t,e,a,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of h(e))!s.call(t,i)&&i!==a&&n(t,i,{get:()=>e[i],enumerable:!(o=m(e,i))||o.enumerable});return t};var p=t=>c(n({},"__esModule",{value:!0}),t);var b={};g(b,{default:()=>v});module.exports=p(b);var r=(t,e,a,o,i)=>{let d=`<p>Your following MFA value${e.length>1?"s":""} has been changed${i?" by Admin":""}.</p>`;for(let l=0;l<e.length;l++)d+=`<p>&nbsp;&nbsp;&#x2022; ${e[l]} has been `,d+=a[l]&&a[l].length>1?"changed to "+a[l]:"removed",d+="</p>";return console.log("HTML template diff value",d),`
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
							<img src="${o}" alt="logo" />
						</div>
						<div class="email">
							<div>
								<h1>MFA value changed</h1>
							</div>
							<div class="email-body">
								<p>Hello ${t},</p>
								${d}
								<p>If you did not make this change, please contact the help desk.</p>
							</div>
							<div class="email-footer">
								<p>APERSONA amfa</p>
							</div>
						</div>
					</div>
				</body>
			</html>
	`},v=r;
//# sourceMappingURL=htmlTemplate.js.map
