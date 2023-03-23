import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OTP = () => {
  const navigate = useNavigate();
  const [errMsg, setErrMsg] = useState('');

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
              <div className='col'> <a href='##' className='link-customizable'> txxx@hxx.com </a> </div>
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
              <input
                name='otp'
                id='otp'
                className='form-control inputField-customizable'
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
                className='btn btn-primary submitButton-customizable'
                onClick={() => navigate('authorise')}
              >
                Verify
              </button>
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