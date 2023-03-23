import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NoMatch = () => {
  const [authParam, setAuthParam] = useState(null);
  const [errMsg, setErrorMsg] = useState(null);

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