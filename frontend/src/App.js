import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import MegaDetector from './components/MegaDetector';
import Zamba from './components/Zamba';
import ZambaProcess from './components/ZambaProcess';
import ZambaResult from './components/ZambaResult';
import ZambaTrain from './components/ZambaTrain';
import Il2bb from './components/Il2bb';
import Preview from './components/Preview';
import CameraTrapTools from './components/CameraTrapTools';
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
          <Route path="/preview/:appName" element={<Preview />} />
          <Route path="/megadetector" element={<MegaDetector />} />
          <Route path="/zamba" element={<Zamba />} />
          <Route path="/zamba/result" element={<ZambaResult />} />
          <Route path="/megadetector/report" element={<MegaDetectorReport />} />
          <Route path="/megadetector/detections_animal.html" element={<MegaDetectorDetectionsAnimalReport />} />
          <Route path="/il2bb" element={<Il2bb />} />
          <Route path="/camera-trap-tools" element={<CameraTrapTools />} />
        </Routes>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
