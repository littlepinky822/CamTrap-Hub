import React from 'react';
import Home from './components/Home';
import MegaDetector from './components/MegaDetector';
import { BrowserRouter as Router,Routes, Route } from 'react-router-dom';

function App() {



  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/megadetector" element={<MegaDetector />} />
      </Routes>
    </Router>
  );
}

export default App;
