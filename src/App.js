// App.js

import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './Pages/Home';
import Password from './Pages/Password';
import MFA from './Pages/MFA';
import NoMatch from './Pages/NoMatch';

import { applicationUrl } from './const';

import logo from './logo.png';


const App = () => {
   const [time, setTime] = useState('');
   const cd = useRef(299);
   const timer = useRef(null);

   const timerHandler = () => {
      if (cd.current <= 0) {
         setTime('');
         timer.current && clearTimeout(timer.current);
         localStorage.setItem('OTPErrorMsg', "You took too long or entered your otp wrong too many times. Try your login again.");
         window.location.assign(`${applicationUrl}?amfa=relogin`);
         return;
      }
      const m = parseInt(cd.current / 60) > 9 ? parseInt(cd.current / 60) : '0' + parseInt(cd.current / 60);
      const s = parseInt(cd.current % 60) > 9 ? parseInt(cd.current % 60) : '0' + parseInt(cd.current % 60);
      setTime(`${m}:${s}`);
      cd.current--;
      timer.current = setTimeout(() => {
         timerHandler();
      }, 1000);
   };

   const timerCleaner = () => {
      timer.current && clearTimeout(timer.current);
   }

   useEffect(() => {
      timerHandler();

      return () => {
         timerCleaner();
      }
   }, []);

   return (
      <div className="container">
         <div className="modal-dialog">
            <div className="modal-content background-customizable modal-content-mobile visible-xs visible-sm">
               <div class="banner-customizable">
                  <center>
                     <img alt="logo" class="logo-customizable" src={logo} />
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
                        Copyright &copy; 2023 aPersona Inc. v1.0
                     </span><br />
                     <span className='legalText-customizable'>
                        {time}
                     </span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default App;