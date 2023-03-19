import { useState, useEffect } from 'react';

const Home = () => {
	const [authParam, setAuthParam] = useState();


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

	const handleSubmit = (e) => {
		console.log('authParam', authParam);
		e.preventDefault();
	}

	return (
    <div>
      {' '}
      This is Home
      <form
        onSubmit={(e) => {
          handleSubmit(e);
        }}
      >
        <input
          type='hidden'
          name='authParam'
          id='authParam'
          onChange={(e) => setAuthParam(e.target.value)}
        />
        <input
          type='button'
          value='获取authParam'
          onClick={() => {
            console.log('authParam', authParam);
          }}
        />
        <input type='submit' value='submit' />
      </form>
    </div>
  );
}
export default Home;