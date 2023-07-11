import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, Spinner } from 'reactstrap';

import { apiUrl, clientName } from '../../const';
import { getApti, validateEmail } from '../utils';

const LOGIN = () => {
  const location = useLocation();
  const [config, setConfig] = useState(null);
  const [isLoading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState(location.state ? location.state.msg:null);
  const [email, setEmail] = useState(location.state ? location.state.email : '');

  useEffect(() => {
    document.title = 'Registration';

    const getAmfaConfigs = async () => {
      // get the data from the api

      setLoading(true);
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
        setLoading(false);
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

    if (!email || validateEmail(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    };

    const apti = getApti();
    // const authParam = window.getAuthParam();

    navigate('/registration_password', {
      state: {
        email,
        apti,
      }
    });

    // const params = {
    //   email,
    //   authParam,
    //   apti,
    //   phase: 'registration_email'
    // };

    // const options = {
    //   method: 'POST',
    //   body: JSON.stringify(params),
    //   credentials: 'include',
    // };

    // setLoading(true);
    // setErrorMsg('');
    // try {
    //   const res = await fetch(`${apiUrl}/amfa`, options);

    //   switch (res.status) {
    //     case 200:
    //       const response = await res.json();
    //       if (response.location) {
    //         window.location.assign(response.location);
    //         return;
    //       }
    //       else {
    //         setErrorMsg('Passwordless login error, please contact help desk.');
    //       }
    //       break;
    //     case 202:
    //       // const result = await res.json();
    //       navigate('/newpasswords', {
    //         state: {
    //           email,
    //           apti,
    //         }
    //       });
    //       break;
    //     default:
    //       const data = await res.json();
    //       if (data) {
    //         setErrorMsg(data.message ? data.message : JSON.stringify(data));
    //       }
    //       else {
    //         setErrorMsg('Unknown error, please contact help desk.');
    //       }
    //       break;
    //   }
    //   setLoading(false);
    // }
    // catch (err) {
    //   console.error('error in home', err);
    //   setErrorMsg('Email login error, please contact help desk.');
    //   setLoading(false);
    // }
  }


  return (
    <div>
      <span>
        <h4>Registration</h4>
      </span>
      <hr className="hr-customizable" />
      {!isLoading && config?.allowSelfSignUp && <div>
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
            {isLoading ? 'Loading...' : 'Sign In'}
          </Button>
        </div></div>}
      {!isLoading && !config?.allowSelfSignUp &&
        <span className='idpDescription-customizable'> Self Sign Up is not allowed </span>
      }
      {isLoading ? <span className='errorMessage-customizable'><Spinner color="primary" >{''}</Spinner></span> :
        (errorMsg && <div>
          <br />
          <span className='errorMessage-customizable'>{errorMsg}</span>
        </div>)}
    </div>
  );
}

const RegistrationHome = () => {

  return (
    <LOGIN />
  );
}
export default RegistrationHome;