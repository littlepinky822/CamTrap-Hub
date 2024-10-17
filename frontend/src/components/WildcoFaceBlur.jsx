import React, { useState } from 'react';
import NavBar from './NavBar';
import ImageBrowserPopup from './ImageBrowserPopup';

const WildcoFaceBlur = () => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [megadetectorFile, setMegadetectorFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [dateFolders, setDateFolders] = useState('false');
    const [blurLevel, setBlurLevel] = useState(7);
    const [confThreshold, setConfThreshold] = useState(0.25);
    const [allowedTypes, setAllowedTypes] = useState([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleUpload = async () => {
        const formData = new FormData();

        if (megadetectorFile) {
            formData.append('megadetector-file', megadetectorFile);
        }

        selectedItems.forEach(item => {
            if (item.type === 'folder') {
                formData.append('folders', item.path);
            } else {
                formData.append('files', item.path);
            }
        });

        try {
            const response = await fetch('/api/wildCoFaceBlur/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            console.log('Upload response: ', data);
            setUploadSuccess(true);
        } catch (e) {
            console.error('Error: ', e);
        }
    };

    const handleProcessImages = async () => {
        try {
            const response = await fetch('/api/wildCoFaceBlur/trigger_script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dateFolders: dateFolders,
                    blurLevel: blurLevel,
                    confThreshold: confThreshold
                })
            })
            setProcessing(true);
            const data = await response.json();
            console.log('Response: ', data);
            setProcessing(false);
            setSuccess(true);
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    const handleDownload = async () => {
        try {
            const response = await fetch('/api/wildCoFaceBlur/download', {
                method: 'GET'
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'WildCoFaceBlur_output.zip'
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    };

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
        console.log('Selected items:', selectedItems);
    };

    return (
        <div className="min-h-screen bg-base">
            <NavBar />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">WildCo-FaceBlur</h1>
                <p className="text-lg mb-8 text-center text-gray-700">Obscures human identities in camera trap images after processing via <a href="https://github.com/microsoft/CameraTraps/blob/master/megadetector.md" target="_blank">Microsoft MegaDetector</a>.</p>

                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Upload Data</h2>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">MegaDetector output (a .json file)</h3>
                        <p className="text-sm text-gray-700">Check <a className="link" href="https://github.com/microsoft/CameraTraps/blob/master/megadetector.md">here</a> for more details about MegaDetector usage.</p>
                        <label htmlFor="megadetector-file" className="block text-sm font-medium text-gray-700 mt-2 mb-2">
                            MegaDetector output (a .json file)
                        </label>
                        <input 
                            type="file" 
                            name="megadetector-file" 
                            accept=".json" 
                            className="file-input file-input-bordered file-input-primary bg-white w-full max-w-xs mb-2" 
                            onChange={(e) => setMegadetectorFile(e.target.files[0])}
                        />
                        {megadetectorFile && (
                            <div className="mt-4">
                                <p className="font-semibold">Uploaded MegaDetector output file:</p>
                                <ul>
                                    <li>{megadetectorFile.name}</li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mt-4 mb-2">Folder of images:</h3>
                        <p className="text-sm text-gray-700">*Note: Within your imgaes folder, create individaul sub-folders for each of your camera trap sites/deployments.</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                            <li>You may optionally include sub-folders for date specific camera checks (e.g. 2021-09-01 to 2021-12-31).</li>
                            <li>Within these site (or check) specific folders, paste the MegaDetector .json file and camera trap photos corresponding to the site.</li>
                            <li>If you wish to upload different images, please go to <a href="/datamanagement" className="link">Data Space</a> and upload your images there.</li>
                        </ul>
                        {/* <button onClick={() => handleOpenFileBrowser('image')} className="btn btn-primary mr-2">Select Images</button>
                        <button onClick={() => handleOpenFileBrowser('video')} className="btn btn-primary mr-2">Select Videos</button> */}
                        <button onClick={() => handleOpenFileBrowser('folder')} className="btn btn-primary mt-2">Select Folder</button>
                        {selectedItems.length > 0 && (
                            <div className="mt-4">
                                <h3>Selected Items:</h3>
                                <ul>
                                    {selectedItems.map((item, index) => (
                                        <li key={index}>{item.name} ({item.type})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <button className='btn btn-primary mt-4' onClick={handleUpload}>Upload Selected Items</button>
                    {uploadSuccess && (
                        <div role="alert" className="alert alert-success mt-4">
                            <span>Uploaded successfully!</span>
                        </div>
                    )}

                    <h2 className="text-2xl font-semibold mt-4 mb-4">Configuration</h2>
                    <div className="space-y-4 flex flex-col">
                        <div className="dropdown dropdown-bottom">
                            <label htmlFor="media-type" className="block text-sm font-medium text-gray-700 mb-2">
                                Date folders (depending on your uploaded folder structure):
                            </label>
                            <div tabIndex={0} role="button" className="btn m-1 w-full max-w-xs bg-white">
                                {dateFolders ? dateFolders : 'Date folders'}
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-full max-w-xs">
                                <li><button onClick={() => setDateFolders('false')}>False</button></li>
                                <li><button onClick={() => setDateFolders('true')}>True</button></li>
                            </ul>
                        </div>
                        <div>
                            <label htmlFor="blur-level" className="block text-sm font-medium text-gray-700 mb-2">
                                Blur level (Lower values are more obscured; recommended: between 3 and 7):
                            </label>
                            <input 
                                type="number" 
                                id="blur-level"
                                placeholder="Blur level (number)" 
                                className="input w-full max-w-xs" 
                                defaultValue="7"
                                onChange={(e) => setBlurLevel(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="conf" className="block text-sm font-medium text-gray-700 mb-2">
                                The MegaDetector confidence threshold:
                            </label>
                            <input 
                                type="number" 
                                id="conf"
                                placeholder="Confidence threshold (number)" 
                                className="input w-full max-w-xs" 
                                defaultValue="0.25"
                                onChange={(e) => setConfThreshold(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <button className='btn btn-primary' onClick={handleProcessImages}>Process images</button>
                {processing && (
                    <div role="alert" className="alert alert-info mt-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 shrink-0 stroke-current">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>You've successfully triggered the processing. It may take a while to finish.</span>
                  </div>
                )}

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
                    <span>Processing completed! You may download the result now.</span>
                  </div>
                )}

                <div className="bg-base-200 shadow-md rounded-lg p-6 mt-8 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Download results</h2>
                    <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the results here.</p>
                    <p className="text-sm text-gray-700">Inside the the .zip file, you will find:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        <li>copies of the images that have been processed (blured)</li>
                    </ul>
                    <button className='btn btn-primary mt-4' onClick={handleDownload}>Download results</button>
                </div>
            </div>
            <ImageBrowserPopup onSelect={handleSelectItems} allowedTypes={allowedTypes} />
        </div>
    );
};

export default WildcoFaceBlur;