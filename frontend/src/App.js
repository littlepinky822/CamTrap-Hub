import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import About from './components/About';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Profile from './components/Profile';
import Register from './components/Register';
import DataManagement from './components/DataManagement';
import MegaDetector from './components/applications/MegaDetector';
import Zamba from './components/applications/Zamba';
import ZambaResult from './components/applications/ZambaResult';
import Il2bb from './components/applications/Il2bb';
import WildcoFaceBlur from './components/applications/WildcoFaceBlur';
import Preview from './components/Preview';
import CameraTrapTools from './components/applications/CameraTrapTools';
import CameraTrapWorkflow from './components/applications/CameraTrapWorkflow';
import ImageBrowserPopup from './components/ImageBrowserPopup';
import { MegaDetectorReport, MegaDetectorDetectionsAnimalReport } from './components/applications/MegaDetectorReport';
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
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/datamanagement" element={<DataManagement />} />
            </Route>
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
            <Route path="/camera-trap-workflow" element={<CameraTrapWorkflow />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}

export default App;
