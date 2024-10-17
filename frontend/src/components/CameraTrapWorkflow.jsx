import React, { useState, useContext } from 'react';
import NavBar from './NavBar';
import { ThemeContext } from '../ThemeContext';
import ImageBrowserPopup from './ImageBrowserPopup';

const CameraTrapWorkflow = () => {
    const { theme, setTheme } = useContext(ThemeContext);
    const [activeTab, setActiveTab] = useState('extractMetadata');

    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">Camera Trap Workflow</h1>
                <p className="text-lg mb-8 text-center text-gray-700">A semi-automatic workflow to process camera trap images in R.</p>
                <div role="tablist" className="tabs tabs-boxed">
                    <a role="tab" className={`tab ${activeTab === 'extractMetadata' ? 'tab-active' : ''}`} onClick={() => setActiveTab('extractMetadata')}>Extract Metadata</a>
                    <a role="tab" className={`tab ${activeTab === 'classification' ? 'tab-active' : ''}`} onClick={() => setActiveTab('classification')}>Classification</a>
                    <a role="tab" className={`tab ${activeTab === 'qualityCheck' ? 'tab-active' : ''}`} onClick={() => setActiveTab('qualityCheck')}>Quality Check</a>
                    <a role="tab" className={`tab ${activeTab === 'formatting' ? 'tab-active' : ''}`} onClick={() => setActiveTab('formatting')}>Formatting</a>
                </div>
            </div>
            {activeTab === 'extractMetadata' && <ExtractMetadata />}
            {activeTab === 'classification' && <Classification />}
            {activeTab === 'qualityCheck' && <QualityCheck />}
            {activeTab === 'formatting' && <Formatting />}
        </div>
    )
}

const ExtractMetadata = () => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [allowedTypes, setAllowedTypes] = useState([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleOpenFileBrowser = () => {
        let allowedTypes = ['folder'];
        setAllowedTypes(allowedTypes);
        document.getElementById('file_browser_modal').showModal();
    };

    const handleSelectItems = (items) => {
        setSelectedItems(items);
    };

    const handleUpload = async () => {
        try {
            const formData = new FormData();

            selectedItems.forEach(item => {
                formData.append('images', item.path);
            });

            const response = await fetch('/api/camera-trap-workflow/upload', {
                method: 'POST',
                body: formData
            })
            const data = await response.json()
            setUploadSuccess(true);
            console.log(data);
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    const handleProcess = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/extract-metadata/process', {
                method: 'POST'
            })
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                setSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    const handleDownload = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/extract-metadata/download', {
                method: 'GET'
            })
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'CameraTrapWorkload_metadata_renamed.zip'
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    }

    return (
        <div className="min-h-screen bg-base">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-3xl font-semibold mb-4 text-center">Extract Metadata and Rename Images</h2>
                    <p className="text-sm text-gray-700">The metadata saved in the image files such as date and time when the image was taken or the temperature will be extracted. What kind of metadata is saved varies between camera types and settings. One metadata file per site will be saved in the metadata-folder. Then the images will be renamed with a unique name that consists of the siteID, the date when the image was taken and unique number for images from the same day (for example site1_2021-01-01_0001.JPG). The renamed images will be saved in the renamed_images- folder.</p>
                    <h3 className="text-2xl font-semibold mb-4 mt-4">Upload Images for renaming</h3>
                    <div>
                        <label htmlFor="folders" className="block text-sm font-medium text-gray-700 mb-2">
                            Upload folder of images:
                        </label>
                        <button onClick={() => handleOpenFileBrowser()} name="folders" className="btn btn-primary mr-2">Select Folder</button>
                        {selectedItems.length > 0 && (
                            <div className="mt-4">
                                <h3>Selected Foler:</h3>
                                <ul>
                                    {selectedItems.map((item, index) => (
                                        <li key={index}>{item.name} ({item.type})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div>
                        <button className='btn btn-primary mt-4' onClick={handleUpload}>Upload Selected Images</button>
                        {uploadSuccess && (
                            <div role="alert" className="alert alert-success mt-4">
                                <span>Uploaded successfully!</span>
                            </div>
                        )}
                    </div>

                    <button className='btn btn-secondary mt-4' onClick={handleProcess}>Process data</button>
                    {success && (
                        <div role="alert" className="alert alert-success mt-4">
                            <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 shrink-0 stroke-current"
                            fill="none"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>You may download the metadata file and renamed images now.</span>
                        </div>
                    )}

                    <div className="divider"></div>

                    <h2 className="text-2xl font-semibold mb-4">Download results</h2>
                    <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the results here.</p>
                    <p className="text-sm text-gray-700">Inside the the .zip file, you will find:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        <li>metadata file(s) per site</li>
                        <li>copies of uploaded images that were reanmed inside 'images_renamed' folder</li>
                    </ul>
                    <button className='btn btn-secondary mt-4' onClick={handleDownload}>Download results</button>
                </div>
            </div>
            <ImageBrowserPopup onSelect={handleSelectItems} allowedTypes={allowedTypes} />
        </div>
    )
}

const Classification = () => {
    const [autoSuccess, setAutoSuccess] = useState(false);

    const handleAutoClassification = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/auto-classify', {
                method: 'POST'
            })
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                setAutoSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    const handleAutoDownload = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/auto-classify/download', {
                method: 'GET'
            })
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'CameraTrapWorkload_auto_classification.zip'
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    }

    const handleManualClassification = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/manual-classify', {
                method: 'POST'
            })
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                window.open(data.shiny_url, '_blank');
            }
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    return (
        <div className="min-h-screen bg-base">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-3xl font-semibold mb-4 text-center">Auto Classification</h2>
                    <p className="text-sm text-gray-700">Classify images automatically. <b>It will automatically use the reenamed images and metadata file from Extract Metadata step.</b> Once triggered, all images will be classified automatically using the specified model, the output with the class with the highest confidence (guess1) will be saved in the automatic_classification folder which can be downloaded.</p>
                    <button className='btn btn-secondary mt-4' onClick={handleAutoClassification}>Run Classification</button>
                    {autoSuccess && (
                        <div role="alert" className="alert alert-success mt-4">
                            <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 shrink-0 stroke-current"
                            fill="none"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>You may download the output now.</span>
                        </div>
                    )}

                    <div className="divider"></div>

                    <h2 className="text-2xl font-semibold mb-4">Download results</h2>
                    <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the results here.</p>
                    <p className="text-sm text-gray-700">Inside the the .zip file, you will find:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        <li>classification output file(s) per site</li>
                    </ul>
                    <button className='btn btn-secondary mt-4' onClick={handleAutoDownload}>Download results</button>
                </div>

                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-3xl font-semibold mb-4 text-center">Manual Classification</h2>
                    <p className="text-sm text-gray-700 text-center">Select images for manual labelling (classification).</p>
                    <button className='btn btn-secondary mt-4' onClick={handleManualClassification}>Launch Manual Classification</button>
                </div>
            </div>
        </div>
    )
}

const QualityCheck = () => {
    const [launchSuccess, setLaunchSuccess] = useState(false);
    const [output, setOutput] = useState('');
    
    const handleQualityCheck = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/quality-check', {
                method: 'POST'
            })
            const data = await response.json();
            if (data.status === 'success') {
                window.open(data.shiny_url, '_blank');
                setLaunchSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    const handleQualityCheckDownload = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/quality-check/download', {
                method: 'GET'
            })
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'CameraTrapWorkload_quality_check.zip'
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    }

    const handleModalEvaluation = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/modal-evaluation', {
                method: 'POST'
            })
            const data = await response.json();
            console.log(data);
            setOutput(data.output.replace(/\\n/g, '\n'));
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    return (
        <div className="min-h-screen bg-base">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-3xl font-semibold mb-4 text-center">Quality Check</h2>
                    <p className="text-sm text-gray-700 text-center">Verify the model labels and performance. You can select the type of quality check (random selection of all images, per class or per confidence class) and the number of images you want to check. Then, random images will be selected and presented for manual labelling. A file with the labels will be saved in the quality_check folder.</p>
                    <button className='btn btn-secondary mt-4' onClick={handleQualityCheck}>Launch Quality Check</button>
                    {launchSuccess && (
                        <div role="alert" className="alert alert-info mt-4">
                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 shrink-0 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Quality check shiny app launched successfully! Please remember to close the app (scroll to the bottom and click 'STOP') before you leave the page.</span>
                    </div>
                    )}

                    <div className="divider"></div>

                    <h2 className="text-2xl font-semibold mb-4">Download results</h2>
                    <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the results here.</p>
                    <p className="text-sm text-gray-700">Inside the the .zip file, you will find:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        <li>quality check labels file(s) per site</li>
                    </ul>
                    <button className='btn btn-secondary mt-4' onClick={handleQualityCheckDownload}>Download results</button>
                </div>
                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-3xl font-semibold mb-4 text-center">Modal Evaluation</h2>
                    <p className="text-sm text-gray-700 text-center">After finishing the quality check, use this function to calculate overall model accuracy, accuracy per confidence class as well as precision, recall and F1 score for each class.</p>
                    <p className="text-sm text-gray-700 text-center">You may go back to Classification - <b>Manual Classification</b> to correct model labels.</p>
                    <button className='btn btn-secondary mt-4' onClick={handleModalEvaluation}>Modal Evaluation</button>
                    {output && (
                        <div className="mt-4">
                            <h3>Output:</h3>
                            <pre>{output}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const Formatting = () => {
    const [success, setSuccess] = useState(false);

    const handleFormatting = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/formatting', {
                method: 'POST'
            })
            const data = await response.json();
            if (data.status === 'success') {
                setSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    const handleFormatDownload = async () => {
        try {
            const response = await fetch('/api/camera-trap-workflow/formatting/download', {
                method: 'GET'
            })
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'CameraTrapWorkload_final_formatting.zip'
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    }

    return (
        <div className="min-h-screen bg-base">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-3xl font-semibold mb-4 text-center">Formatting</h2>
                    <p className="text-sm text-gray-700 text-center">Combine your automatic and manual image labels.</p>
                    <button className='btn btn-secondary mt-4' onClick={handleFormatting}>Start formatting</button>
                    {success && (
                        <div role="alert" className="alert alert-info mt-4">
                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 shrink-0 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Formatted successfully!</span>
                    </div>
                    )}

                    <div className="divider"></div>

                    <h2 className="text-2xl font-semibold mb-4">Download results</h2>
                    <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the results here.</p>
                    <p className="text-sm text-gray-700">Inside the the .zip file, you will find:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        <li>formatted labels file(s) per locality</li>
                    </ul>
                    <button className='btn btn-secondary mt-4' onClick={handleFormatDownload}>Download results</button>
                </div>
            </div>
        </div>
    )
}

export default CameraTrapWorkflow;