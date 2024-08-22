import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import MegaDetector from './components/MegaDetector';
import Zamba from './components/Zamba';
import ZambaProcess from './components/ZambaProcess';
import ZambaResult from './components/ZambaResult';
import ZambaTrain from './components/ZambaTrain';
import Preview from './components/Preview';
import { MegaDetectorReport, MegaDetectorDetectionsAnimalReport } from './components/MegaDetectorReport';
import { BrowserRouter as Router,Routes, Route } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';

function App() {
  const [theme, setTheme] = useState('nature');

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/megadetector" element={<MegaDetector />} />
          <Route path="/zamba" element={<Zamba />} />
          <Route path="/zamba/result" element={<ZambaResult />} />
          <Route path="/preview/:appName" element={<Preview />} />
          <Route path="/megadetector/report" element={<MegaDetectorReport />} />
          <Route path="/megadetector/detections_animal.html" element={<MegaDetectorDetectionsAnimalReport />} />
        </Routes>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
