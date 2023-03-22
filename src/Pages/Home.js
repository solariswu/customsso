import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [authParam, setAuthParam] = useState(null);
  const [errMsg, setErrorMsg] = useState(null);

  // useEffect(() => {
  // 	const scriptSha = document.createElement('script');
  // 	scriptSha.src = "https://cdn.jsdelivr.net/gh/solariswu/free-cdn-source@main/sha1.js";
  // 	scriptSha.async = true;
  // 	document.body.appendChild(scriptSha);

  // 	const script = document.createElement('script');
  // 	script.src = "https://cdn.jsdelivr.net/gh/solariswu/free-cdn-source@main/apersona_v2.5.2a.js";
  // 	script.async = true;
  // 	document.body.appendChild(script);

  // 	return () => {
  // 		document.body.removeChild(scriptSha);
  // 		document.body.removeChild(script);
  // 	}
  // }, []);

  console.log('authParam', authParam);

  const LOGIN = () => {
    const navigate = useNavigate();
    const [deviceChoice, setDeviceChoice] = useState(sessionStorage.getItem('amfa-device-choice') || 'false');

    const handleDeviceChoice = (e) => {
      const newChoice = e.target.checked ? 'true' : 'false';

      setDeviceChoice(newChoice);
      sessionStorage.setItem('amfa-device-choice', newChoice);
    }

    return (
      <div class="container">
        <div class="modal-dialog">
          <div class="modal-content background-customizable 
          modal-content-mobile visible-xs visible-sm">
            <div style={{ height: '5px', background: 'orange' }} />
            <div class="modal-body" style={{ textAlign: 'center' }}>
              <span><h3>Sign in to your account</h3></span>
              <br />
              <div>
                <input
                  type="checkbox" id="remember-me" name="remember-me"
                  checked={deviceChoice === 'true'}
                  onChange={handleDeviceChoice}
                />
                <span style={{ fontSize: '1rem', marginLeft: '0.5em', color: 'grey' }}>
                  This is my device, remember it.
                </span>
              </div>
              <div class="login-or">
                <hr class="hr-customizable" />
              </div>
              <div>
                <span class='textDescription-customizable'> Login with your EPND account </span><br />
                <input name="email" id="email" class="form-control inputField-customizable" placeholder="user@email.com"
                  autocapitalize="none" required aria-label="email" value="" type="email" />
                <button name="confirm" type="submit" class="btn btn-primary submitButton-customizable"
                  onClick={() => navigate('/password')}
                >
                  Confirm
                </button>
              </div>
              {errMsg && <div>
                <br />
                <span class='errorMessage-customizable'>{errMsg}</span>
              </div>}
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
      </div >
    );
  }

  return (
    <LOGIN />
  );
}
export default Home;