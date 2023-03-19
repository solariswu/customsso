// App.js
import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import Password from './Pages/Password';
import MFA from './Pages/MFA';
import NoMatch from './Pages/NoMatch';

const App = () => {
 return (
    <>
       <Routes>
          <Route path="/authorise" element={<Home />} />
          <Route path="/password" element={<Password />} />
          <Route path="/mfa" element={<MFA />} />
          <Route path="*" element={<Home />} />
       </Routes>
    </>
 );
};

export default App;