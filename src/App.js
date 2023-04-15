// App.js
import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import Password from './Pages/Password';
import MFA from './Pages/MFA';
import NoMatch from './Pages/NoMatch';
import { useEffect, useState } from 'react';

import { applicationUrl } from './const';

const App = () => {
   const [oauthTime, setOauthTime] = useState(300);

   useEffect(() => {
      const interval = setInterval(() => {
         if (oauthTime > 1) {
            setOauthTime(oauthTime - 1);
         }
         else {
            localStorage.setItem('OTPErrorMsg', 'You took too long or entered your otp wrong too many times. Try your login again.');
            window.location.assign(`${applicationUrl}?amfa=relogin`);
            return;
         }
      }, 1000);

      return () => {
         clearInterval(interval);
      }
   }, []);

   return (
      <div className="container">
         <div className="modal-dialog">
            <div className="modal-content background-customizable modal-content-mobile visible-xs visible-sm">
               <div class="banner-customizable">
                  <center>
                     <img alt="logo" class="logo-customizable" src="https://cdn.jsdelivr.net/gh/solariswu/free-cdn-source@latest/logo.png" />
                  </center>
               </div>
               <div style={{ height: '5px', background: 'orange' }} />
               <div className="modal-body" style={{ textAlign: 'center' }}>
                  <Routes>
                     <Route path="/" element={<Home />} />
                     <Route path="/authorise" element={<Home />} />
                     <Route path="/oauth2/authorise" element={<Home />} />
                     <Route path="/password" element={<Password />} />
                     <Route path="/mfa" element={<MFA />} />
                     <Route path="*" element={<NoMatch />} />
                  </Routes>
                  <hr className='hr-customizable' />
                  <div className='footer-customizable'>
                     <span
                        className='legalText-customizable'
                     >
                        Copyright &copy; 2023 ePersona Inc. v1.0
                     </span><br />
                     <span>
                        {oauthTime / 60 > 1 ? `${parseInt(oauthTime / 60)}:${oauthTime % 60 > 9 ? oauthTime % 60 : '0' + oauthTime % 60}` : `0${parseInt(oauthTime / 60)}:${oauthTime % 60 > 9 ? oauthTime % 60 : '0' + oauthTime % 60}`}
                     </span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default App;