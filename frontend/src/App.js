import React from 'react';
import Home from './components/Home';
import MegaDetector from './components/MegaDetector';
import Zamba from './components/Zamba';
import ZambaProcess from './components/ZambaProcess';
import ZambaResult from './components/ZambaResult';
import ZambaTrain from './components/ZambaTrain';
import Preview from './components/Preview';
import { BrowserRouter as Router,Routes, Route } from 'react-router-dom';

function App() {



  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/megadetector" element={<MegaDetector />} />
        <Route path="/zamba" element={<Zamba />} />
        <Route path="/zamba/process" element={<ZambaProcess />} />
        <Route path="/zamba/result" element={<ZambaResult />} />
        <Route path="/zamba/train" element={<ZambaTrain />} />
        <Route path="/preview/:appName" element={<Preview />} />
      </Routes>
    </Router>
  );
}

export default App;
