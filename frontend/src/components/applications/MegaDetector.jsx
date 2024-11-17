import React, { useState, useContext } from 'react';
import NavBar from '../NavBar';
import { ThemeContext } from '../../ThemeContext';
import ImageBrowserPopup from '../ImageBrowserPopup';

const MegaDetector = () => {
    const { theme, setTheme } = useContext(ThemeContext);
    const [model, setModel] = useState('MDV5A');
    const [selectedItems, setSelectedItems] = useState([]);
    const [allowedTypes, setAllowedTypes] = useState([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [batchSuccess, setBatchSuccess] = useState(false);
    const handleOpenFileBrowser = (type) => {
        let allowedTypes;
        switch (type) {
            case 'image':
                allowedTypes = ['image'];
                break;
            case 'video':
                allowedTypes = ['video'];
                break;
            case 'folder':
                allowedTypes = ['folder'];
                break;
            default:
                allowedTypes = ['image', 'video', 'folder'];
        }
        console.log('Setting allowed types:', allowedTypes);  // Add this log
        setAllowedTypes(allowedTypes);
        document.getElementById('file_browser_modal').showModal();
    };

    const handleSelectItems = (items) => {
        setSelectedItems(items);
    };

    const handleUpload = () => {
        const formData = new FormData();

        // Append each file to the FormData object
        selectedItems.forEach(item => {
            formData.append('image', item.path);
        });

        fetch('/api/megadetector/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            setUploadSuccess(true);
            return response.text();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('model', model);

        fetch('/api/megadetector/run/batch', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.status === 'success') {
                setBatchSuccess(true);
            }
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
                    <button onClick={() => handleOpenFileBrowser('image')} className="btn btn-primary mr-2">Select Images</button>
                    {selectedItems.length > 0 && (
                        <div className="mt-4">
                            <h3>Selected Images:</h3>
                            <ul>
                                {selectedItems.map((item, index) => (
                                    <li key={index}>{item.name} ({item.type})</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <br />
                    <button className='btn btn-primary mt-4' onClick={handleUpload}>Confirm Upload</button>
                    {uploadSuccess && (
                        <div role="alert" className="alert alert-success mt-4">
                            <span>Uploaded successfully!</span>
                        </div>
                    )}
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
                    {batchSuccess && (
                        <div role="alert" className="alert alert-success mt-4">
                            <span>Batch processing completed!</span>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <button className="btn btn-secondary" onClick={() => window.open('/megadetector/report', '_blank')}>
                        View Report
                    </button>
                </div>
            </div>
            <ImageBrowserPopup onSelect={handleSelectItems} allowedTypes={allowedTypes} />
        </div>
    );
};

export default MegaDetector;