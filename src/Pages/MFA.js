import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from 'reactstrap';

import { amfaConfigs } from '../const';

const OTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [errMsg, setErrorMsg] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isFetching, setFetching] = useState(false);
  const [otp, setOtp] = useState({ type: 'e', code: '', addr: '' });
  const [otpOptions, setOtpOptions] = useState([]);


  useEffect(() => {
    const getMFAOptions = async () => {
      try {
        setFetching(true);
        const result = await fetch(amfaConfigs.tenantOtpConfigUrl);
        const json = await result.json();
        setOtpOptions(json.otpOptions);
      } catch (error) {
        console.log(error);
      }
      finally {
        setFetching(false);
      }
    }

    if (!location.state) {
      navigate('/');
    }
    else {
      getMFAOptions();
    }
  }, []);

  const authParam = window.getAuthParam();

  const username = location.state?.username;
  const rememberDevice = location.state?.rememberDevice;
  const apti = location.state?.apti;
  const state = location.state?.state;
  const redirectUri = location.state?.redirectUri;
  const aemail = location.state?.aemail;
  const phoneNumber = location.state?.phoneNumber;

  const setOTPCode = (e) => {
    setOtp({ ...otp, code: e.target.value });
  }

  const confirmLogin = (e) => {
    if (e.key === "Enter") {
      stepfour(e);
    }
  }

  const stepthree = async ({ otptype, otpaddr }) => {
    setOtp({ ...otp, type: otptype, addr: otpaddr });

    const sendOtpParams = {
      email: username,
      rememberDevice,
      authParam,
      apti,
      otptype,
      otpaddr,
      state,
      redirectUri,
      phase: 'sendotp'
    };

    console.log('send otp params:', sendOtpParams);

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await fetch(`${amfaConfigs.apiUrl}/amfa`, {
        method: 'POST',
        body: JSON.stringify(sendOtpParams),
      });

      switch (result.status) {
        case 200:
          const resultMsg = await result.json();
          if (resultMsg.message) {
            setErrorMsg(resultMsg.message);
            setTimeout(() => {
              setErrorMsg('');
            }, 300);
          }
          else {
            setErrorMsg('Unknown OTP send error, please contact help desk.');
          }
          break;
        case 401:
          navigate('/', {
            state: {
              ErrorMsg: 'You took too long or entered your otp wrong too many times. Try your login again.'
            }
          });
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
    }
    catch (err) {
      console.error('error in OTP login', err);
      setErrorMsg('OTP login error, please contact help desk.');
    }
    finally {
      setLoading(false);
    }
  }

  const stepfour = async (e) => {

    if (!otp.code || otp.code.length < 1) {
      setErrorMsg('Please enter the verification code');
      return;
    }

    const verifyOtpParams = {
      email: username,
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
    setErrorMsg('');
    try {
      const result = await fetch(`${amfaConfigs.apiUrl}/amfa`, {
        method: 'POST',
        body: JSON.stringify(verifyOtpParams),
      });

      switch (result.status) {
        case 200:
          const response = await result.json();
          if (response.location) {
            window.location.assign(response.location);
          }
          break;
        default:
          const data = await result.json();
          console.log('got verify otp data back:', data);
          if (data) {
            setErrorMsg(data.message ? data.message : data.name ? data.name : JSON.stringify(data));
          }
          else {
            setErrorMsg('Unknown error, please contact help desk.');
          }
          break;
      }
    }
    catch (err) {
      console.error('error in password login', err);
      setErrorMsg('OTP login error, please contact help desk.');
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div className='container'>
      <div className='modal-dialog'>
        <div className='modal-content background-customizable modal-content-mobile visible-xs visible-sm'>
          <div style={{ height: '5px', background: 'orange' }} />
          <div className='modal-body' style={{ textAlign: 'center' }}>
            <span>
              <h3>{amfaConfigs.mfaPageTitle}</h3>
            </span>
            <br />
            <div>
              <span
                style={{ fontSize: '1rem', marginLeft: '0.5em', color: 'grey' }}
              >
                Please click on one of the available verification methods below
                to receive a one time identity code, then enter it below.
              </span>
            </div>
            <div className='login-or'>
              <hr className='hr-customizable' />
            </div>
            {isFetching ?
              'Loading...' :
              otpOptions.map((option) => (
                option === 'e' ?
                  (<div className='row align-items-end'>
                    <div className='col'>Email:</div>
                    <div className='col'>
                      <span className='link-customizable' onClick={() => username ? stepthree({ otptype: 'e', otpaddr: username }) : null}>
                        {username ? `${username[0]}xxx@${username[username.lastIndexOf('@') + 1]}xx.${username.substring((username.lastIndexOf('.') + 1))}` : '-'}
                      </span>
                    </div>
                  </div>) : option === 'ae' ?
                    <div className='row align-items-end'>
                      <div className='col'>Alt-Email:</div>
                      <div className='col'>
                        <span className='link-customizable' onClick={() => aemail ? stepthree({ otptype: 'ae', otpaddr: aemail }) : null}>
                          {aemail ? `${aemail[0]}xxx@${aemail[aemail.lastIndexOf('@') + 1]}xx.${aemail.substring((aemail.lastIndexOf('.') + 1))}` : '-'}
                        </span> </div>
                    </div> : option === 's' ?
                      <div className='row align-items-end'>
                        <div className='col'>SMS:</div>
                        <div className='col'>
                          <span href='##' className='link-customizable' onClick={() => phoneNumber ? stepthree({ otptype: 's', otpaddr: phoneNumber }) : null}>
                            {phoneNumber ? phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-xxx-$3') : '-'}
                          </span> </div>
                      </div> : option === 'v' ?
                        <div className='row align-items-end'>
                          <div className='col'>Voice:</div>
                          <div className='col'>
                            <span href='##' className='link-customizable' onClick={() => phoneNumber ? stepthree({ otptype: 'v', otpaddr: phoneNumber }) : null}>
                              {phoneNumber ? phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-xxx-$3') : '-'} </span> </div>
                        </div> :
                        <div className='row align-items-end'>
                          <div className='col'>Mobile Token:&nbsp;&nbsp;&nbsp;&nbsp;Obtain from your mobile</div>
                        </div>
              ))}
            <div>
              <hr className='hr-customizable' />
              <input name="otpcode" id="otpcode" className="form-control inputField-customizable" placeholder="***"
                autoCapitalize="none" required aria-label="otp code" value={otp.code} onChange={setOTPCode}
                onKeyUp={e => confirmLogin(e)}
                disabled={isLoading}
              />

              <Button
                name='verifyotp'
                type='submit'
                className='btn btn-primary submitButton-customizable'
                disabled={isLoading}
                onClick={!isLoading ? stepfour : null}
              >
                {isLoading ? 'Sending...' : 'Verify'}
              </Button>
            </div>
            {errMsg && (
              <div>
                <br />
                <span className='errorMessage-customizable'>{errMsg}</span>
              </div>
            )}
            <hr className='hr-customizable' />
            <div className='footer-customizable'>
              <span
                className='legalText-customizable'
              >
                Copyright &copy; 2023 ePersona Inc.{' '}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MFA = () => {
  return (
    <OTP />
  )
}
export default MFA;
