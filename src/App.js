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
            <Route path="/" element={<Home />} />
            <Route path="/authorize" element={<Home />} />
            <Route path="/oauth2/authorize" element={<Home />} />
            <Route path="/password" element={<Password />} />
            <Route path="/mfa" element={<MFA />} />
            <Route path="*" element={<NoMatch />} />
         </Routes>
      </>
   );
};

export default App;