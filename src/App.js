// App.js

import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './Pages/Home';
import Password from './Pages/Password';
import Captcha from './Pages/Captcha';
import MFA from './Pages/MFA';
import NoMatch from './Pages/NoMatch';
import DualOTP from './Pages/DualOTP';
import NewPasswords from './Pages/NewPasswords';
import SelfService from './Pages/SelfService';
import OTPMethods from './Pages/OTPMethods';

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

   const Footer = () => (<div className='footer-customizable'>
      <span
         className='legalText-customizable'
      >
         Copyright &copy; 2023 aPersona Inc. v1.0
      </span><br />
      <span className='legalText-customizable'>
         {time}
      </span>
   </div>)

   return (
      <div className="container">
         <div className="modal-dialog">
            <div className="modal-content background-customizable modal-content-mobile visible-xs visible-sm">
               <div class="banner-customizable">
                  <center>
                     <img alt="logo" className="logo-customizable" src={logo} />
                  </center>
               </div>
               <div style={{ height: '5px', background: '#63db92' }} />
               <div className="modal-body" style={{ textAlign: 'center' }}>
                  <Routes>
                     <Route path="/" element={<Home />} />
                     <Route path="/authorize" element={<Home />} />
                     <Route path="/oauth2/authorize" element={<Home />} />
                     <Route path="/password" element={<Password />} />
                     <Route path="/dualotp" element={<DualOTP stoptimer={timerCleaner} />} />
                     <Route path="/captcha" element={<Captcha />} />
                     <Route path="/mfa" element={<MFA />} />
                     <Route path="/passwordreset" element={<NewPasswords />} />
                     <Route path="/updateotp" element={<OTPMethods />} />
                     <Route path="/selfservice" element={<SelfService />} />
                     <Route path="*" element={<NoMatch />} />
                  </Routes>
                  <hr className='hr-customizable' />
                  <Footer />
               </div>
            </div>
         </div>
      </div>
   );
};

export default App;