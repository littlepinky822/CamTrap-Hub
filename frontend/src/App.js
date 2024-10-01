import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import DataManagement from './components/DataManagement';
import MegaDetector from './components/MegaDetector';
import Zamba from './components/Zamba';
import ZambaResult from './components/ZambaResult';
import Il2bb from './components/Il2bb';
import WildcoFaceBlur from './components/WildcoFaceBlur';
import Preview from './components/Preview';
import CameraTrapTools from './components/CameraTrapTools';
import ImageBrowserPopup from './components/ImageBrowserPopup';
import { MegaDetectorReport, MegaDetectorDetectionsAnimalReport } from './components/MegaDetectorReport';
import { BrowserRouter as Router,Routes, Route } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';
import { AuthProvider } from './components/AuthContext';

function App() {
  const [theme, setTheme] = useState('nature');

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/datamanagement" element={<DataManagement />} />
            <Route path="/preview/:appName" element={<Preview />} />
            <Route path="/megadetector" element={<MegaDetector />} />
            <Route path="/zamba" element={<Zamba />} />
            <Route path="/zamba/result" element={<ZambaResult />} />
            <Route path="/megadetector/report" element={<MegaDetectorReport />} />
            <Route path="/megadetector/detections_animal.html" element={<MegaDetectorDetectionsAnimalReport />} />
            <Route path="/il2bb" element={<Il2bb />} />
            <Route path="/camera-trap-tools" element={<CameraTrapTools />} />
            <Route path="/wildcofaceblur" element={<WildcoFaceBlur />} />
            <Route path="/image-browser-popup" element={<ImageBrowserPopup />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}

export default App;
