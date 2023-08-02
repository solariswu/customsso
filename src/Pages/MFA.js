import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';

import { apiUrl, applicationUrl } from '../const';
import { useFeConfigs } from '../DataProviders/FeConfigProvider';

const OTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useFeConfigs();

  const [errMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [otp, setOtp] = useState({ type: '', code: '', addr: '' });


  useEffect(() => {

    if (!location.state) {
      navigate('/');
      return;
    }
    else {
      window.history.pushState('fake-route', document.title, window.location.href);

      window.addEventListener('popstate', () => console.log('back pressed in MFA'));
      return () => {
        window.removeEventListener('popstate', () => console.log('back pressed in MFA'));
        // If we left without using the back button, aka by using a button on the page, we need to clear out that fake history event
        if (window.history.state === 'fake-route') {
          window.history.back();
        }
      };
    }
  }, [location.state, navigate]);

  const authParam = window.getAuthParam();

  const email = location.state?.email;
  const rememberDevice = location.state?.rememberDevice;
  const apti = location.state?.apti;
  const state = location.state?.state;
  const redirectUri = location.state?.redirectUri;
  const aemail = location.state?.aemail;
  const phoneNumber = location.state?.phoneNumber;
  const vPhoneNumber = location.state?.vPhoneNumber;
  const otpOptions = location.state?.otpOptions;

  const setOTPCode = (e) => {
    setOtp({ ...otp, code: e.target.value });
  }

  const confirmLogin = (e) => {
    if (e.key === "Enter") {
      stepfour(e);
    }
  }

  const stepthree = async ({ otptype }) => {
    setOtp({ ...otp, type: otptype });

    const sendOtpParams = {
      email,
      rememberDevice,
      authParam,
      apti,
      otptype,
      state,
      redirectUri,
      phase: 'sendotp'
    };

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      const result = await fetch(`${apiUrl}/amfa`, {
        method: 'POST',
        body: JSON.stringify(sendOtpParams),
        credentials: 'include',
      });

      switch (result.status) {
        case 202:
          const resultMsg = await result.json();
          if (resultMsg.message) {
            setInfoMsg(resultMsg.message);
            setTimeout(() => {
              setInfoMsg('');
            }, 8000);
          }
          else {
            setErrorMsg('Unknown OTP send error, please contact help desk.');
          }
          break;
        case 401:
          const resultMsg401 = await result.json();
          if (resultMsg401.message) {
            localStorage.setItem('OTPErrorMsg', resultMsg401.message);
            window.location.assign(`${applicationUrl}?amfa=relogin`);
            return;
          }
          else {
            setErrorMsg('Unknown OTP send error, please contact help desk.');
          }
          break;
        default:
          const data = await result.json();
          if (data) {
            setErrorMsg(data.message ? data.message : data.name ? data.name : JSON.stringify(data));
          }
          else {
            setErrorMsg('Unknown error, please contact help desk.');
          }
          break;
      }
      setLoading(false);
    }
    catch (err) {
      console.error('error in OTP login', err);
      setErrorMsg('OTP login error, please contact help desk.');
      setLoading(false);
    }
  }

  const stepfour = async (e) => {

    if (!otp.code || otp.code.length < 1) {
      setErrorMsg('Please enter the verification code');
      setInfoMsg('');
      return;
    }

    const verifyOtpParams = {
      email,
      rememberDevice,
      authParam,
      apti,
      otptype: otp.type,
      otpcode: otp.code,
      state,
      redirectUri,
      phase: 'verifyotp'
    };

    console.log('verify otp params:', verifyOtpParams);

    setLoading(true);
    setOtp({ ...otp, code: '', addr: '' });
    setErrorMsg('');
    setInfoMsg('');
    try {
      const result = await fetch(`${apiUrl}/amfa`, {
        method: 'POST',
        body: JSON.stringify(verifyOtpParams),
        credentials: 'include',
      });

      switch (result.status) {
        case 200:
          const response = await result.json();
          if (response.location) {
            window.location.assign(response.location);
            return;
          }
          break;
        // case 203:
        // Push the user back to the initial login page with this error: "Your location is not permitted. Contact the help desk."
        case 401:
          // Send the user back to the login page with this error: "You took too long or entered your otp wrong too many times. Try your login again."
          const resultMsg = await result.json();
          if (resultMsg.message) {
            localStorage.setItem('OTPErrorMsg', resultMsg.message);
            window.location.assign(`${applicationUrl}?amfa=relogin`);
            return;
          }
          else {
            setErrorMsg('Unknown OTP send error, please contact help desk.');
          }
          break;
        case 203:
        default:
          const data = await result.json();
          if (data) {
            setErrorMsg(data.message ? data.message : data.name ? data.name : JSON.stringify(data));
          }
          else {
            setErrorMsg('Unknown error, please contact help desk.');
          }
          break;
      }
      setLoading(false);
    }
    catch (err) {
      setLoading(false);
      console.error('error in password login', err);
      setErrorMsg('OTP login error, please contact help desk.');
    }
  }

  let OTPMethodsCount = 0;

  if (otpOptions) {
    otpOptions.forEach((option) => {
      switch (option) {
        case 'e':
          if (email)
            OTPMethodsCount++;
          break;
        case 'ae':
          if (aemail)
            OTPMethodsCount++;
          break;
        case 's':
          if (phoneNumber)
            OTPMethodsCount++;
          break;
        case 'v':
          if (vPhoneNumber && vPhoneNumber !== phoneNumber)
            OTPMethodsCount++;
          break;
        default:
          break;
      }
    })
  }

  return (
    <div>
      <span> <h4>{config?.branding.login_app_verification_page_header}</h4> </span>
      <hr className='hr-customizable' />
      <div>
        <span
          style={{ lineHeight: '1rem', color: 'grey' }}
        >
          {
            OTPMethodsCount > 1 ?
              config?.branding.login_app_verify_page_message :
              'Access requires a verification. Click your ID below to receive a one time verification code.'
          }
        </span>
        <hr className='hr-customizable' />
      </div>
      {otpOptions.map((option) => (
        option === 'e' && email ?
          (<div className='row align-items-end'>
            <div className='col-4'>Email:</div>
            <div className='col'>
              <span className='link-customizable' onClick={() => email ? stepthree({ otptype: 'e' }) : null}>
                {`${email[0]}xxx@${email[email.lastIndexOf('@') + 1]}xx.${email.substring((email.lastIndexOf('.') + 1))} >`}
              </span>
            </div>
          </div>) : option === 'ae' && aemail ?
            <div className='row align-items-end'>
              <div className='col-4'>Alt-Email:</div>
              <div className='col'>
                <span className='link-customizable' onClick={() => stepthree({ otptype: 'ae' })}>
                  {`${aemail[0]}xxx@${aemail[aemail.lastIndexOf('@') + 1]}xx.${aemail.substring((aemail.lastIndexOf('.') + 1))} >`} </span>
              </div>
            </div> : option === 's' && phoneNumber ?
              <div className='row align-items-end'>
                <div className='col-4'>SMS:</div>
                <div className='col'>
                  <span className='link-customizable' onClick={() => phoneNumber ? stepthree({ otptype: 's' }) : null}>
                    {phoneNumber.replace(/(\d{3})(\d{5})(\d{1})/, '$1xxx$3') + ' >'} </span>
                </div>
              </div> : option === 'v' && vPhoneNumber ?
                <div className='row align-items-end'>
                  <div className='col-4'>Voice:</div>
                  <div className='col'>
                    <span className='link-customizable' onClick={() => vPhoneNumber ? stepthree({ otptype: 'v' }) : null}>
                      {vPhoneNumber.replace(/(\d{3})(\d{5})(\d{1})/, '$1xxx$3') + ' >'} </span>
                  </div>
                </div> : option === 'm' &&
                <div className='row align-items-end'>
                  <div className='col'>Mobile Token:&nbsp;&nbsp;&nbsp;&nbsp;Obtain from your mobile</div>
                </div>
      ))}
      <br />
      <div>
        <input name="otpcode" id="otpcode" type="tel" className="form-control inputField-customizable" placeholder="####"
          style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
          autoCapitalize="none" required aria-label="otp code" value={otp.code} onChange={setOTPCode}
          onKeyUp={e => confirmLogin(e)}
          disabled={isLoading}
        />
        <Button
          name='verifyotp'
          type='submit'
          className='btn btn-primary submitButton-customizable'
          style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
          disabled={isLoading}
          onClick={!isLoading ? stepfour : null}
        >
          {isLoading ? 'Sending...' : 'Verify'}
        </Button>
      </div>
      {isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" >{''}</Spinner></span> : (
        errMsg && (
          <div><span className='errorMessage-customizable'>{errMsg}</span></div>
        ))}
      {!isLoading && infoMsg &&
        <div><span className='infoMessage-customizable'>{infoMsg}</span></div>
      }
    </div>
  );
}

const MFA = () => {
  return (
    <OTP />
  )
}
export default MFA;
