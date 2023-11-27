// App.js

import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import Home from './Pages/Home';
import Password from './Pages/Password';
import MFA from './Pages/MFA';
import NoMatch from './Pages/NoMatch';
import DualOTP from './Pages/DualOTP';
import NewPasswords from './Pages/NewPasswords';
import SelfService from './Pages/SelfService';
import OTPMethods from './Pages/OTPMethods';

import { applicationUrl } from './const';

import UpdateProfile from './Pages/UpdateProfile';
import RemoveProfile from './Pages/RemoveProfile';

import { RegistrationVerify, RegistrationHome, RegistrationPasswords, RegistrationAttributes } from './Pages/Registration';
import { useFeConfigs } from './DataProviders/FeConfigProvider';
import { Spinner } from 'reactstrap';

import SetTOTP from './Pages/SetTOTP';
import PwnedPWDModal from './Components/PwnedPWDModal';

const App = () => {
   const [time, setTime] = useState('');
   const [timerType, setTimerType] = useState('login');
   const cd = useRef(299);
   const timer = useRef(null);

   const navigate = useNavigate();
   const config = useFeConfigs();

   const selfserviceTimeOut = () => {
      cd.current = 600;
      setTimerType('selfservice');
   }

   useEffect(() => {
      const timerHandler = () => {
         if (cd.current <= 0) {
            const errorMsg = "You took too long or entered your otp wrong too many times. Try your login again.";
            setTime('');
            timer.current && clearTimeout(timer.current);
            localStorage.setItem('OTPErrorMsg', errorMsg);
            switch (timerType) {
               case 'selfservice':
                  navigate('/selfservice', {
                     state: {
                        selfservicemsg: errorMsg,
                     }
                  });
                  return;
               case 'login':
               default:
                  window.location.assign(`${applicationUrl}?amfa=relogin`)
                  return;
            }
         }
         const m = parseInt(cd.current / 60) > 9 ? parseInt(cd.current / 60) : '0' + parseInt(cd.current / 60);
         const s = parseInt(cd.current % 60) > 9 ? parseInt(cd.current % 60) : '0' + parseInt(cd.current % 60);
         setTime(`${m}:${s}`);
         cd.current--;
         timer.current = setTimeout(() => {
            timerHandler();
         }, 1000);
      };

      timerHandler();

      return () => {
         const timerCleaner = () => {
            timer.current && clearTimeout(timer.current);
         }

         timerCleaner();
      }
   }, [timerType, navigate]);


   const Footer = () => {

      return (
         <div className='footer-customizable'>
            <div>
               <span className='legalText-customizable'>
                  {time}
               </span>
            </div>
            <span
               className='legalText-customizable'
            >
               Copyright &copy; 2023 aPersona Inc. v1.0
            </span>
            {
               config.enable_google_recaptcha && <div >
                  <span className='legalText-customizable' style={{ color: '#d4d4d4', fontSize: '6px' }}>
                     This site is protected by reCAPTCHA and the Google
                     <a href="https://policies.google.com/privacy">Privacy Policy</a> and
                     <a href="https://policies.google.com/terms">Terms of Service</a> apply.
                  </span>
               </div>
            }
         </div>)
   }

   if (!config)
      return (
         <div className="container">
            <div className="modal-dialog">
               <div className="modal-content background-customizable modal-content-mobile visible-xs visible-sm"></div>
               <div className="modal-body" style={{ textAlign: 'center' }}>
                  <Spinner color="primary" style={{ margin: '8px auto' }}>{''}</Spinner>
               </div>
            </div>
         </div>
      );

   return (
      <div className="container">
         <div className="modal-dialog">
            <div className="modal-content background-customizable modal-content-mobile visible-xs visible-sm">
               <div class="banner-customizable">
                  <center>
                     <img alt="logo" className="logo-customizable" src={config?.branding.logo_url} />
                  </center>
               </div>
               <div style={{ height: '5px', background: config?.branding.brand_base_color }} />
               <div className="modal-body" style={{ textAlign: 'center' }}>
                  <Routes>
                     <Route path="/" element={<Home />} />
                     <Route path="/authorize" element={<Home />} />
                     <Route path="/oauth2/authorize" element={<Home />} />
                     <Route path="/password" element={<Password />} />
                     <Route path="/dualotp" element={<DualOTP stoptimer={selfserviceTimeOut} />} />
                     <Route path="/mfa" element={<MFA />} />
                     <Route path="/passwordreset" element={<NewPasswords />} />
                     <Route path="/otpmethods" element={<OTPMethods />} />
                     <Route path="/selfservice" element={<SelfService stoptimer={selfserviceTimeOut} />} />
                     <Route path="/updateprofile" element={<UpdateProfile />} />
                     <Route path='/removeprofile' element={<RemoveProfile />} />
                     <Route path="/setuptotp" element={<SetTOTP />} />
                     <Route path="/registration" element={<RegistrationHome />} />
                     <Route path="/registration_password" element={<RegistrationPasswords />} />
                     <Route path="/registration_attributes" element={<RegistrationAttributes />} />
                     <Route path="/registration_verify" element={<RegistrationVerify />} />
                     <Route path="*" element={<NoMatch />} />
                  </Routes>
                  <Footer />
                  <div className='about-customizable' style={{ textAlign: 'center' }}>
                     {
                        config?.enable_have_i_been_pwned &&
                        <PwnedPWDModal />
                     }
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default App;