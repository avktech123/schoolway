import React, { useState, useEffect } from 'react';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('http://localhost:3001/api/test')
      .then(res => res.json())
      .then(data => {
        setMessage(data.message)
      })
      .catch(err => setMessage('Failed to connect to backend'));
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Schoolway MERN App</h1>
      <p>{message || 'Welcome to Schoolway!'}</p>
    </div>
  );
}

export default App;