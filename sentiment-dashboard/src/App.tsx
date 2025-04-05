// App.tsx
import React from 'react';
import SentimentDashboard from './Components/SentimentDashboard';
import './App.css';

const App = () => {
  return (
    <div className="App">
      <div className="dashboard-container">
        <SentimentDashboard />
      </div>
    </div>
  );
};

export default App;