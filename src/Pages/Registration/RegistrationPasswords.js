import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';
import { validatePassword, check_pwn_password } from '../utils';
import PwnedPWDModal from '../../Components/PwnedPWDModal';
import { useFeConfigs } from '../../DataProviders/FeConfigProvider';


const LOGIN = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useFeConfigs();

  const closeQuickView = () => {
    console.log('back pressed');
  }

  useEffect(() => {
    if (!location.state) {
      navigate('/');
    }

    window.history.pushState('fake-route', document.title, window.location.href);

    window.addEventListener('popstate', closeQuickView);
    return () => {
      window.removeEventListener('popstate', closeQuickView);
      // If we left without using the back button, aka by using a button on the page, we need to clear out that fake history event
      if (window.history.state === 'fake-route') {
        window.history.back();
      }
    };
  }, [location.state, navigate]);

  const email = location.state?.email;
  const apti = location.state?.apti;

  const [errorMsg, setErrorMsg] = useState(null);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordType, setPasswordType] = useState('password');
  const [pwnedpasswords, setPwnedpasswords] = useState(false);

  const confirmSignUp = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  }

  const validTwoPasswords = async () => {
    if (!password) {
      setErrorMsg('Please enter password');
      return false;
    };

    const passwordValidation = validatePassword(password);

    if (passwordValidation) {
      setErrorMsg(passwordValidation);
      return false;
    }

    if (!newPassword) {
      setErrorMsg('Please enter new password');
      return false;
    }

    if (password !== newPassword) {
      setErrorMsg('Passwords do not match');
      return false;
    }

    if (config?.enable_have_i_been_pwned) {
      const ispwned = await check_pwn_password(password);

      if (ispwned) {
        setErrorMsg('The new password you entered has been reported as stolen. Try a different one!');
        setPwnedpasswords(true);
        return false;
      }
    }

    return true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setPwnedpasswords(false);
    const pwdCheck = await validTwoPasswords();

    if (pwdCheck) {
      navigate('/registration_attributes',
        {
          state: {
            email,
            apti,
            password
          }
        })
    }
  }

  const toggle = () => (passwordType === "password") ? setPasswordType("text") : setPasswordType("password");

  if (!config) {
    return (
      <div>
        <span><h4>Registration</h4></span>
        <hr className="hr-customizable" />
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <span><h4>Registration</h4></span>
      <hr className="hr-customizable" />
      <div>
        <span className='idpDescription-customizable'> Enter your password </span>
        <div className="input-group">
          <input id="signInFormPassword" name="password" type={passwordType} className="form-control inputField-customizable"
            style={{ height: '40px' }}
            placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
            autoFocus
            onKeyUp={e => confirmSignUp(e)}
          />
          <button className="btn btn-primary" onClick={toggle} >
            {passwordType === "password" ? (
              <svg
                width="20"
                height="17"
                fill="#C0C0C0"
                className="bi bi-eye-slash-fill"
                viewBox="0 0 16 16"
              >
                <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z" />
                <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z" />
              </svg>
            ) : (
              <svg
                width="20"
                height="17"
                fill="#C0C0C0"
                className="bi bi-eye-fill"
                viewBox="0 0 16 16"
              >
                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
              </svg>
            )}
          </button>
        </div>
        <span className='idpDescription-customizable'> Verify your new password </span>
        <div className="input-group">
          <input id="signInFormNewPassword" name="newPassword" type={passwordType} className="form-control inputField-customizable"
            style={{ height: '40px' }}
            placeholder="Repeat Password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            onKeyUp={e => confirmSignUp(e)}
          />
          <button className="btn btn-primary" onClick={toggle}>
            {passwordType === "password" ? (
              <svg
                width="20"
                height="17"
                fill="#C0C0C0"
                className="bi bi-eye-slash-fill"
                viewBox="0 0 16 16"
              >
                <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z" />
                <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z" />
              </svg>
            ) : (
              <svg
                width="20"
                height="17"
                fill="#C0C0C0"
                className="bi bi-eye-fill"
                viewBox="0 0 16 16"
              >
                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
              </svg>
            )}
          </button>
        </div>
        <Button name="confirm" type="submit" className="btn btn-primary submitButton-customizable"
          variant="success"
          onClick={handleSubmit}
        >
          {'Next'}
        </Button>
      </div>
      {location.state && location.state.backable &&
        <Button name='back' type="submit" className="btn btn-primary submitButton-customizable"
          onClick={() => navigate('/registration', {
            state: {
              consent: true,
              email,
              apti,
            }
          })}
          style={{ marginTop: '10px' }}
        >
          {'Back'}
        </Button>
      }
      {
          errorMsg && <div>
            <br />
            <span className='errorMessage-customizable'>{errorMsg}</span>
          </div>
      }
      {pwnedpasswords && <PwnedPWDModal />}
    </div >
  );
}

const RegistrationPasswords = () => {

  return (
    <LOGIN />
  )
}
export default RegistrationPasswords;