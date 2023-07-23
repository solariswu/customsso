import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from 'reactstrap';

import { apiUrl, clientName } from '../../const';
import { getApti, validateEmail } from '../utils';
import InfoMsg from '../../Components/InfoMsg';

const LOGIN = () => {
  const location = useLocation();
  const [config, setConfig] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [isIniting, setIniting] = useState(true);

  const [msg, setMsg] = useState({ msg: '', type: '' });
  const [email, setEmail] = useState(location.state ? location.state.email : '');

  const setErrorMsg = (msg) => {
    setMsg({ msg, type: 'error' });
  }

  useEffect(() => {
    document.title = 'Registration';

    const getAmfaConfigs = async () => {
      // get the data from the api

      setIniting(true);
      try {
        const response = await fetch(`${apiUrl}/oauth2/feconfig`);
        const json = await response.json();
        console.log(json);

        if (response.status === 200) {
          setConfig(json);
        }
        else {
          // convert the data to json
          json.message ?
            setErrorMsg(json.message) :
            setErrorMsg('Error fetching config from the server');
        }
      }
      catch (error) {
        console.error(error);
        setErrorMsg('Error fetching config from the server');
      }
      finally {
        setIniting(false);
      }
    }

    getAmfaConfigs();

  }, []);

  const navigate = useNavigate();

  const confirmSignUp = (e) => {
    if (e.key === "Enter") {
      signUp();
    }
  }

  const signUp = async (e) => {
    console.log('now in sign up ');

    if (!email || validateEmail(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    };

    const apti = getApti();
    // const authParam = window.getAuthParam();

    const params = {
      email,
      // authParam: window.getAuthParam(),
      apti,
    };

    const options = {
      method: 'POST',
      body: JSON.stringify(params),
    };

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/oauth2/checkuser`, options);
      switch (res.status) {
        case 200:
          // const result = await res.json();
          navigate('/registration_password', {
            state: {
              email,
              apti,
            }
          });
          break;
        default:
          const data = await res.json();
          if (data) {
            setErrorMsg(data.message ? data.message : JSON.stringify(data));
          }
          else {
            setErrorMsg('Unknown error, please contact help desk.');
          }
          break;
      }
      setLoading(false);
    }
    catch (err) {
      console.error('error in sign up', err);
      setErrorMsg('new account sign up error, please contact help desk.');
      setLoading(false);
    }
  }

  return (
    <div>
      <span>
        <h4>Registration</h4>
      </span>
      <hr className="hr-customizable" />
      {!isIniting && config?.allowSelfSignUp && <div>
        <span className='idpDescription-customizable'> Enter your {clientName} account ID </span>
        <div>
          <input name="email" id="email" className="form-control inputField-customizable" placeholder="user@email.com"
            autoCapitalize="none" required aria-label="email" value={email} type="email" onChange={(e) => setEmail(e.target.value)}
            onKeyUp={e => confirmSignUp(e)}
            disabled={isLoading || !config?.allowSelfSignUp}
          />
          <Button
            name="confirm" type="submit"
            className="btn btn-primary submitButton-customizable"
            disabled={isLoading || !config?.allowSelfSignUp}
            onClick={!isLoading ? signUp : null}
          >
            {isLoading ? 'Loading...' : 'Next'}
          </Button>
        </div></div>}
      {!isLoading && !config?.allowSelfSignUp && !isIniting &&
        <span className='idpDescription-customizable'> Self Sign Up is not allowed </span>
      }
      <InfoMsg isLoading={isLoading} msg={msg} />
    </div>
  );
}

const RegistrationHome = () => {

  return (
    <LOGIN />
  );
}
export default RegistrationHome;