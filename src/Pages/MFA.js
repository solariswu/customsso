import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from 'reactstrap';

import { amfaConfigs } from '../const';

const OTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [errMsg, setErrorMsg] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [otp, setOtp] = useState({ type: 'e', code: '', addr: '' });

  useEffect(() => {
    if (!location.state) {
      navigate('/');
    }
  },  [location, navigate]);

  const authParam = window.getAuthParam();

  const username = location.state?.username;
  const rememberDevice = location.state?.rememberDevice;
  const apti = location.state?.apti;
  const state = location.state?.state;
  const redirectUri = location.state?.redirectUri;

  const setOTPCode = (e) => {
    setOtp({ ...otp, code: e.target.value });
  }

  const stepthree = async ({ otptype, otpaddr }) => {
    setOtp({ ...otp, type: otptype, addr: otpaddr });

    const params = {
      email: username,
      rememberDevice,
      authParam,
      apti,
      otptype,
      otpaddr,
      phase: 'sendotp'
    };

    console.log('send otp params:', params);

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await fetch(`${amfaConfigs.apiUrl}/amfa`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      switch (result.status) {
        case 200:
          setErrorMsg('Verification Code Sent!');
          break;
        case 202:
          console.log('get send otp 202 back');
          break;
        default:
          const data = await result.json();
          console.log('got send otp data back:', data);
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

    const params = {
      email: username,
      rememberDevice,
      authParam,
      apti,
      otptype: otp.type,
      otpcode: otp.code,
      phase: 'verifyotp'
    };

    console.log('verify otp params:', params);

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await fetch(`${amfaConfigs.apiUrl}/amfa`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      switch (result.status) {
        case 200:
          console.log('get verify otp 200 back');
          break;
        case 202:
          console.log('get verify otp 202 back');
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
              <h3>Your login requires an additional verification</h3>
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
            <div className='row align-items-end'>
              <div className='col'>Email:</div>
              <div className='col'>
                <a href='##' className='link-customizable' onClick={() => username? stepthree({ otptype: 'e', otpaddr: username }): null}
                >
                  {username ? `${username[0]}xxx@${username[username.lastIndexOf('@') + 1]}xx.${username.substring((username.lastIndexOf('.') + 1))}` : 'unknown'} </a> </div>
            </div>

            <div className='row align-items-end'>
              <div className='col'>Alt-Email:</div>
              <div className='col'> <a href='##' className='link-customizable'> txxx@hxx.com </a> </div>
            </div>
            <div className='row align-items-end'>
              <div className='col'>SMS:</div>
              <div className='col'> <a href='##' className='link-customizable'> +1-752-4**-***2 </a> </div>
            </div>
            <div className='row align-items-end'>
              <div className='col'>Voice:</div>
              <div className='col'> <a href='##' className='link-customizable'> +1-752-4**-***2 </a> </div>
            </div>
            <div className='row align-items-end'>
              <div className='col'>Mobile Token:&nbsp;&nbsp;&nbsp;&nbsp;Obtain from your mobile</div>
            </div>
            <div>
              <hr className='hr-customizable' />
              <input name="otpcode" id="otpcode" className="form-control inputField-customizable" placeholder="******"
                autoCapitalize="none" required aria-label="otp code" value={otp.code} onChange={setOTPCode} />

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
                style={{ fontSize: '0.8rem', marginLeft: '0.5em', color: 'grey' }}
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