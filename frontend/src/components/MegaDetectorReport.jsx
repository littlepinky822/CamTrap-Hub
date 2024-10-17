import React, { useState, useEffect, useContext } from 'react';
import './MegaDetectorReport.css';
import { ThemeContext } from '../ThemeContext';
import NavBar from './NavBar';

const MegaDetectorReport = () => {
    const [htmlContent, setHtmlContent] = useState('');
    const { theme, setTheme } = useContext(ThemeContext);

    useEffect(() => {
        fetch('/api/megadetector/report')
            .then(response => response.json())
            .then(data => {setHtmlContent(data.html_content);
            })
            .catch(error => console.error('Error fetching HTML content:', error));
    }, []);

    useEffect(() => {
        if (htmlContent) {
            const container = document.querySelector('.report-container');
            const headers = container.querySelectorAll('h1, h2, h3');
            headers.forEach(header => {
                header.classList.add('text-primary', 'font-bold');
            });
        }
    }, [htmlContent]);

    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className="container mx-auto p-4 py-8">
                <h2 className="text-4xl font-bold mb-4 text-center text-primary">MegaDetector Report</h2>
                <div className="report-container bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
            </div>
        </div>
    );
};

const MegaDetectorDetectionsAnimalReport = () => {
    const [htmlContent, setHtmlContent] = useState('');
    const { theme, setTheme } = useContext(ThemeContext);
    
    useEffect(() => {
        fetch('/api/megadetector/detections_animal.html')
            .then(response => response.json())
            .then(data => {setHtmlContent(data.html_content);
            })
            .catch(error => console.error('Error fetching HTML content:', error));
    }, []);

    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className="container mx-auto p-4 py-8">
                <h2 className="text-4xl font-bold mb-4 text-center text-primary">MegaDetector Report</h2>
                <div className="report-container bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
                <div className="mt-8 text-center">
                    <button className="btn btn-secondary" onClick={() => window.history.back()}>Back</button>
                </div>
            </div>
        </div>
    );
};

export { MegaDetectorReport, MegaDetectorDetectionsAnimalReport };