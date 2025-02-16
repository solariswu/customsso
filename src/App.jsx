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

import { applicationUrl } from '/const.js';

import UpdateProfile from './Pages/UpdateProfile';
import RemoveProfile from './Pages/RemoveProfile';

import { RegistrationVerify, RegistrationHome, RegistrationPasswords, RegistrationAttributes } from './Pages/Registration';
import { useFeConfigs } from './DataProviders/FeConfigProvider';
import { Spinner } from 'reactstrap';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import SetTOTP from './Pages/SetTOTP';
import TimeOut from './Pages/TimeOut';
import Favicon from 'react-favicon';


const App = () => {
   const [timerType, setTimerType] = useState('login');
   const [modal, setModal] = useState(false);

   const [time, setTime] = useState('');
   const [startTime, setStartTime] = useState(Date.now());
   // const cd = useRef(300-30);
   // const cd = useRef(startTime);
   const timer = useRef(null);

   const navigate = useNavigate();
   const config = useFeConfigs();

   const selfserviceTimeOut = (type) => {
      setStartTime(Date.now());
      if (type === 'passwordreset') {
         setTimerType('passwordreset')
      }
      else {
         setTimerType('selfservice');
      }
   }

   const pauseTimer = () => timer.current && clearTimeout(timer.current);
   const resumeTimer = () => {
      const timerHandler = () => {

         timer.current && clearTimeout(timer.current);

         const timeNow = Date.now();
         const passedSeconds = Math.floor((timeNow - startTime) / 1000);
         const totalSeconds = timerType === 'login' ? 60 * 4 + 30 : 60 * 10;

         // 10 minutes or 4.5 minutes
         if (passedSeconds >= totalSeconds) {
            const errorMsg = "You took too long or entered your otp wrong too many times.\nTry your login again.";
            setTime('');
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
               case 'passwordreset':
               default:
                  // window.history.go(-3)
                  window.location.assign(`${applicationUrl}?err=${errorMsg}`)
                  return;
            }
         }

         const remainSeconds = totalSeconds - passedSeconds;
         const m = parseInt(remainSeconds / 60) > 9 ? parseInt(remainSeconds / 60) : '0' + parseInt(remainSeconds / 60);
         const s = parseInt(remainSeconds % 60) > 9 ? parseInt(remainSeconds % 60) : '0' + parseInt(remainSeconds % 60);
         setTime(`${m}:${s}`);
         timer.current = setTimeout(() => {
            timerHandler();
         }, 5000);
      };

      timer.current = setTimeout(() => {
         timerHandler();
      }, 5000);
   }

   useEffect(() => {
      const timerHandler = () => {

         timer.current && clearTimeout(timer.current);

         const timeNow = Date.now();
         const passedSeconds = Math.floor((timeNow - startTime) / 1000);
         const totalSeconds = timerType === 'login' ? 60 * 4 + 30 : 60 * 10;

         // 10 minutes or 4.5 minutes
         if (passedSeconds >= totalSeconds) {
            const errorMsg = "You took too long or entered your otp wrong too many times.\nTry your login again.";
            setTime('');
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
                  navigate('/timeout');

                  // const uri = sessionStorage.getItem('amfa-callback-uri');
                  // sessionStorage.removeItem('amfa-callback-uri');
                  // const state = sessionStorage.getItem('amfa-callback-state');
                  // sessionStorage.removeItem('amfa-callback-state');
                  // window.location.assign(`${uri}?error=idplogintimeout&state=${state}`)
                  return;
            }
         }
         const remainSeconds = totalSeconds - passedSeconds;
         const m = parseInt(remainSeconds / 60) > 9 ? parseInt(remainSeconds / 60) : '0' + parseInt(remainSeconds / 60);
         const s = parseInt(remainSeconds % 60) > 9 ? parseInt(remainSeconds % 60) : '0' + parseInt(remainSeconds % 60);
         setTime(`${m}:${s}`);
         timer.current = setTimeout(() => {
            timerHandler();
         }, 5000);
      };

      timerHandler();

      return () => {
         const timerCleaner = () => {
            timer.current && clearTimeout(timer.current);
         }

         timerCleaner();
      }
   }, [timerType, navigate]);

   const Timer = () => {
      return (
         // <div className='about-customizable' style={{ textAlign: 'center' }}>
            <span className='legalText-customizable'>
               {time}
            </span>
         // </div>
      )
   }

   const PwnedPWDModal = () => {
      const toggle = () => {
         if (modal) {
            resumeTimer();
         }
         setModal(!modal)
      };

      return <Modal isOpen={modal} toggle={toggle}>
         <ModalHeader toggle={toggle}>Copyright 2023 - aPersona, Inc.</ModalHeader>
         <ModalBody>

            Copyright 2023 - aPersona, Inc.<br />
            Licensed by aPersona, Inc.<br />
            Refer to your signed aPersona Subscription Agreement.
            aPersona Terms and Conditioins & Privacy Policy<br /><br />

            AWS Terms and Conditions & Privacy Policy<br /><br />

            Password breach checking is provided by Have I Been Pwned:
            <a href='https://haveibeenpwned.com'>https://haveibeenpwned.com</a><br />
            License: <a href='https://creativecommons.org/licenses/by/4.0/'>https://creativecommons.org/licenses/by/4.0/</a><br />
         </ModalBody>
         <ModalFooter style={{ textAlign: "center" }}>
            <Button variant="secondary" onClick={toggle}>
               OK
            </Button>
         </ModalFooter>
      </Modal>

   };

   const Footer = () => {

      return (
         <div className='footer-customizable'>
            <span
               className='legalText-customizable'
            >
               &copy; 2024 -&nbsp;
               <div className="link-customizable" style={{ fontSize: "11px", display: 'inline' }} onClick={() => { pauseTimer(); setModal(true) }}>
                  about
               </div>
               &nbsp;
               <a href={config?.legal.privacy_policy} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                  Privacy Policy
               </a>
               &nbsp;
               <a href={config?.legal.terms_of_service} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Terms of Service</a>
               {' - '}<Timer />
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
         </div >)
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
      <Favicon url={config?.branding.favicon_url} />
         <div className="modal-dialog" style={{ marginTop: '0px' }}>
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
                     <Route path="/dualotp" element={<DualOTP updatetimer={selfserviceTimeOut} />} />
                     <Route path="/mfa" element={<MFA />} />
                     <Route path="/passwordreset" element={<NewPasswords />} />
                     <Route path="/otpmethods" element={<OTPMethods />} />
                     <Route path="/selfservice" element={<SelfService updatetimer={selfserviceTimeOut} />} />
                     <Route path="/updateprofile" element={<UpdateProfile />} />
                     <Route path='/removeprofile' element={<RemoveProfile />} />
                     <Route path="/setuptotp" element={<SetTOTP />} />
                     <Route path="/registration" element={<RegistrationHome />} />
                     <Route path="/registration_password" element={<RegistrationPasswords />} />
                     <Route path="/registration_attributes" element={<RegistrationAttributes />} />
                     <Route path="/registration_verify" element={<RegistrationVerify updatetimer={selfserviceTimeOut} />} />
                     <Route path="/timeout" element={<TimeOut updatetimer={pauseTimer} />} />
                     <Route path="*" element={<NoMatch />} />
                  </Routes>
                  <Footer />
                  {config?.enable_have_i_been_pwned && <PwnedPWDModal key={'pwned'} />}
               </div>
            </div>
         </div>
      </div>
   );
};

export default App;