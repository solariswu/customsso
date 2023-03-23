import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NoMatch = () => {
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

  const NotFound = () => {
    const navigate = useNavigate();

    return (
      <div className="container">
        <div className="modal-dialog">
          <div className="modal-content background-customizable 
          modal-content-mobile visible-xs visible-sm">
            <div style={{ height: '5px', background: 'orange' }} />
            <div className="modal-body" style={{ textAlign: 'center', height: '100%' }}>
              <span><h3>404 Not Found</h3></span>

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
      </div >
    );
  }

  return (
    <NotFound />
  );
}
export default NoMatch;