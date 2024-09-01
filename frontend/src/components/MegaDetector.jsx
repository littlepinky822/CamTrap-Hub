import React, { useState, useContext } from 'react';
import NavBar from './NavBar';
import { ThemeContext } from '../ThemeContext';

const MegaDetector = () => {
    const { theme, setTheme } = useContext(ThemeContext);
    const [model, setModel] = useState('MDV5A');
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleUpload = (e) => {
        e.preventDefault();
        const formData = new FormData();
        const files = e.target.image.files;

        // Append each file to the FormData object
        for (let i = 0; i < files.length; i++) {
            formData.append('image', files[i]);
        }

        fetch('/api/megadetector/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            // Update state with the names of uploaded files
            setUploadedFiles(Array.from(files).map(file => file.name));
            console.log('Uploaded files: ', Array.from(files).map(file => file.name));
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        fetch('/api/megadetector/run/batch', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">MegaDetector</h1>
                <p className="text-lg mb-8 text-center text-gray-700">
                    MegaDetector is an AI model that identifies animals, people, and vehicles in camera trap images (which also makes it useful for eliminating blank images).
                </p>

                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Upload Images</h2>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                                Upload image(s):
                            </label>
                            <input
                                type="file"
                                name="image"
                                id="image"
                                accept="image/*"
                                multiple
                                className="file-input file-input-primary bg-white w-full max-w-xs"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Upload</button>
                    </form>
                </div>

                <div className="bg-base-200 shadow-md rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Run MegaDetector</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col">
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                                Select a model:
                            </label>
                            <div className="dropdown dropdown-bottom">
                                <div tabIndex={0} role="button" className="btn m-1 w-full max-w-xs bg-white">
                                    {model ? model : 'Select model'}
                                </div>
                                <ul tabIndex={0} className="dropdown-content menu z-[1] p-2 shadow rounded-box bg-white w-full max-w-xs">
                                    <li><a onClick={() => setModel('MDV5A')}>MDv5a</a></li>
                                    <li><a onClick={() => setModel('MDV5B')}>MDv5b</a></li>
                                    <li><a onClick={() => setModel('MDV4')}>MDv4</a></li>
                                </ul>
                            </div>
                        </div>
                        {model === 'MDV4' && (
                            <div role="alert" className="alert alert-warning">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 shrink-0 stroke-current"
                                    fill="none"
                                    viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                                <span>Warning: MDv4 is not recommended, please only select this if you have a really good reason to do so.</span>
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary">Run Batch</button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <button className="btn btn-secondary" onClick={() => window.open('/megadetector/report', '_blank')}>
                        View Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MegaDetector;