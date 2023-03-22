import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OTP = () => {
  const navigate = useNavigate();
  const [errMsg, setErrMsg] = useState('');

  return (
    <div class='container'>
      <div class='modal-dialog'>
        <div class='modal-content background-customizable modal-content-mobile visible-xs visible-sm'>
          <div style={{ height: '5px', background: 'orange' }} />
          <div class='modal-body' style={{ textAlign: 'center' }}>
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
            <div class='login-or'>
              <hr class='hr-customizable' />
            </div>
            <div class='row align-items-end'>
              <div class='col'>Email:</div>
              <div class='col'> <a href='##' class='link-customizable'> txxx@hxx.com </a> </div>
            </div>

            <div class='row align-items-end'>
              <div class='col'>Alt-Email:</div>
              <div class='col'> <a href='##' class='link-customizable'> txxx@hxx.com </a> </div>
            </div>
            <div class='row align-items-end'>
              <div class='col'>SMS:</div>
              <div class='col'> <a href='##' class='link-customizable'> +1-752-4**-***2 </a> </div>
            </div>
            <div class='row align-items-end'>
              <div class='col'>Voice:</div>
              <div class='col'> <a href='##' class='link-customizable'> +1-752-4**-***2 </a> </div>
            </div>
            <div class='row align-items-end'>
              <div class='col'>Mobile Token:&nbsp;&nbsp;&nbsp;&nbsp;Obtain from your mobile</div>
            </div>
            <div>
              <hr class='hr-customizable' />
              <input
                name='otp'
                id='otp'
                class='form-control inputField-customizable'
                placeholder='******'
                autocapitalize='none'
                required
                aria-label='otp'
                value=''
                type='otp'
              />
              <button
                name='confirm'
                type='submit'
                class='btn btn-primary submitButton-customizable'
                onClick={() => navigate('authorise')}
              >
                Verify
              </button>
            </div>
            {errMsg && (
              <div>
                <br />
                <span class='errorMessage-customizable'>{errMsg}</span>
              </div>
            )}
            <hr class='hr-customizable' />
            <div class='footer-customizable'>
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