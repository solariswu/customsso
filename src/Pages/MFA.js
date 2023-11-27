import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from 'reactstrap';

import { apiUrl, applicationUrl } from '../const';
import { useFeConfigs } from '../DataProviders/FeConfigProvider';
import InfoMsg from '../Components/InfoMsg';

const MFAContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useFeConfigs();

  const [msg, setMsg] = useState({ msg: '', type: '' });
  const [isLoading, setLoading] = useState(false);
  const [otp, setOtp] = useState({ type: '', code: '', addr: '' });
  const [otpInFly, setOtpInFly] = useState('');

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
  const uuid = location.state?.uuid;
  const rememberDevice = location.state?.rememberDevice;
  const apti = location.state?.apti;
  const state = location.state?.state;
  const redirectUri = location.state?.redirectUri;
  const aemail = location.state?.aemail;
  const phoneNumber = location.state?.phoneNumber;
  const vPhoneNumber = location.state?.vPhoneNumber;
  const mobileToken = location.state?.mobileToken;
  let otpOptions = location.state?.otpOptions;

  const setInfoMsg = (msg) => {
    setMsg({ msg, type: 'info' });
  }

  const setErrorMsg = (msg) => {
    setMsg({ msg, type: 'error' });
  }

  const setOTPCode = (e) => {
    setOtp({ ...otp, code: e.target.value });
  }

  const confirmLogin = (e) => {
    if (e.key === "Enter") {
      stepfour(e);
    }
  }

  const sendOtp = async (otptype) => {
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
            setOtpInFly(otptype);
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
    try {
      const result = await fetch(`${apiUrl}/amfa`, {
        method: 'POST',
        body: JSON.stringify(verifyOtpParams),
        credentials: 'include',
      });

      switch (result.status) {
        case 200:
          const response = await result.json();
          setOtpInFly('');
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
            setOTPCode('');
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
          setOTPCode('');
          break;
      }
      setLoading(false);
    }
    catch (err) {
      setLoading(false);
      console.error('error in password login', err);
      setErrorMsg('OTP login error, please contact help desk.');
      setOTPCode('');
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
        case 't':
          if (mobileToken)
            OTPMethodsCount++;
          break
        default:
          break;
      }
    })
  }

  const OTPElement = ({ otptype }) => {

    if (otptype === 't') {
      if (mobileToken) {
        setOtpInFly('t');
        setOtp({ ...otp, type: 't' });

        return (
          <div className='row align-items-end'>
            <div className='col-4'>TOTP:</div>
            <div className='col'>
              <span className='link-customizable'>
                mobile app token
              </span>
            </div>
          </div>
        )
      }
      else {
        return null
      }
    }

    const table = {
      e: {
        title: 'Email',
        content: `${email[0]}xxx@${email[email.lastIndexOf('@') + 1]}xx.${email.substring((email.lastIndexOf('.') + 1))}`,
      },
      ae: {
        title: 'Alt-Email',
        content: aemail ? aemail : null,
      },
      s: {
        title: 'SMS',
        content: phoneNumber ? phoneNumber : null,
      },
      v: {
        title: 'Voice',
        content: vPhoneNumber ? vPhoneNumber : null,
      }
    };

    return (table[otptype].content &&
      <div className='row align-items-end'>
        <div className='col-4'>{table[otptype].title}:</div>
        <div className='col'>
          <span className='link-customizable' onClick={() => sendOtp(otptype)}>
            {table[otptype].content}
          </span>
          {otpInFly === otptype && <div style={{ fontSize: '0.7em', fontStyle: 'italic' }}>(resend code)</div>}
        </div>
      </div>
    )
  }

  if (OTPMethodsCount === 0) {
    return (
      <div>
        <span> <h4>{config?.branding.login_app_verification_page_header}</h4> </span>
        <hr className='hr-customizable' />
        <div>
          <span
            style={{ lineHeight: '1rem', color: 'grey' }}
          >
            Your account does not have sufficient verification methods to log in. Please update your profile.
          </span>
          <hr className='hr-customizable' />
        </div>
        <div>
          <Button name='updateprofile' type="submit" className="btn btn-primary submitButton-customizable"
            onClick={() => navigate('/otpmethods', {
              state: {
                email,
                uuid,
                validated: true,
                msg: { msg: '', type: '' },
              }
            })}
          >
            Update Profile
          </Button>
        </div>
      </div>
    )
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
      {otpOptions.map((option) => ((otpInFly === '' || otpInFly === option) && <OTPElement otptype={option} />))}
      <div style={{ padding: '5px 0 0 0' }}>
        {
          otpInFly && otpInFly !== '' &&
          <>
            <input name="otpcode" id="otpcode" type="tel" className="form-control inputField-customizable" placeholder="####"
              style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
              autoCapitalize="none" required aria-label="otp code" value={otp.code} onChange={setOTPCode}
              onKeyUp={e => confirmLogin(e)}
              disabled={isLoading || otpInFly === ''}
            />
            <Button
              name='verifyotp'
              type='submit'
              className='btn btn-primary submitButton-customizable'
              style={{ width: '40%', margin: 'auto 10px', display: 'inline', height: '40px' }}
              disabled={isLoading || otpInFly === ''}
              onClick={stepfour}
            >
              {isLoading ? 'Sending...' : 'Verify'}
            </Button>
          </>
        }
        {otpInFly && otpInFly !== '' && OTPMethodsCount > 1 &&
          <Button name='changeotp' type="submit" className="btn btn-secondary submitButton-customizable-back"
            disabled={isLoading}
            onClick={() => setOtpInFly('')}
          >
            Try another Channel
          </Button>
        }
      </div>
      <InfoMsg isLoading={isLoading} msg={msg} />
    </div>
  );
}

const MFA = () => {
  return (
    <MFAContent />
  )
}
export default MFA;
