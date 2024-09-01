import React, { useState } from 'react';
import NavBar from './NavBar';

const Il2bb = () => {
    const [theme, setTheme] = useState('nature');
    const [imageFiles, setImageFiles] = useState([]);
    const [mappingFile, setMappingFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] =  useState(false);

    const handleUpload = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        fetch('/api/il2bb/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update state with the names of uploaded files
            console.log('Retrieved data: ', data);
            setImageFiles(data.imageFiles);
            setMappingFile(data.mappingFile);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    const handleProcessData = async () => {
        try {
            const stage1Reponse = await fetch('/api/il2bb/trigger_stage1', {
                method: 'POST',
                body: mappingFile
            })
            setProcessing(true);
            const stage1Data = await stage1Reponse.json();
            console.log('Stage 1 response: ', stage1Data);

            if (stage1Data.status === 'success') {
                const stage2Response = await fetch('/api/il2bb/trigger_stage2', {
                    method: 'POST',
                })
                const stage2Data = await stage2Response.json();
                console.log('Stage 2 response: ', stage2Data);
                setProcessing(false);
                setSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    const handleDownload = async () => {
        try {
            const response = await fetch('/api/il2bb/download', {
                method: 'GET'
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'IL2BB_batch_result.zip'
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

    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">Image Level Label to Bounding Box (IL2BB)</h1>
                <p className="text-lg mb-8 text-center text-gray-700">A pipeline for generating labeled bounding boxes.</p>

                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Upload Data</h2>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <div>
                                {/* <h3>Instructions</h3> */}
                                <h3 className="text-lg font-semibold mb-2">Label Map (CSV file)</h3>
                                <p className="text-sm text-gray-700">The main input to the batching stage is a simple csv file (no header row) with two fields:</p>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                    <li>image file name</li>
                                    <li>label</li>
                                </ul>
                                <p className="text-sm text-gray-700">*Note: The IL2BB pipeline expects all of the targets in the image to be of the same species. When creating your label map, skip any images that have more than one species in them. Images can have multiple targets of the same species.</p>
                                <p className="text-sm text-gray-700">See <a className="link" href="https://github.com/persts/IL2BB/tree/main/UseCase">here</a> for more details.</p>
                                <label htmlFor="mapping-file" className="block text-sm font-medium text-gray-700 mt-4 mb-2">
                                    Label Map (CSV file):
                                </label>
                                <input 
                                    type="file" 
                                    name="mapping-file" 
                                    accept=".csv" 
                                    className="file-input file-input-bordered file-input-primary bg-white w-full max-w-xs" 
                                />
                            </div>
                            <label htmlFor="image-files" className="block text-sm font-medium text-gray-700 mb-2">
                                Upload image(s):
                            </label>
                            <input
                                type="file"
                                name="image-files"
                                accept="image/*"
                                multiple
                                className="file-input file-input-primary bg-white w-full max-w-xs"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Upload</button>
                    </form>

                    {mappingFile && (
                        <div className="mt-4">
                            <p className="font-semibold">Uploaded label CSV file:</p>
                            <ul>
                                <li>{mappingFile}</li>
                            </ul>
                        </div>
                    )}

                    {imageFiles && imageFiles.length > 0 && (
                        <div className="mt-4">
                            <p className="font-semibold">Uploaded images:</p>
                            <ul>
                                {imageFiles.map((image, index) => (
                                    <li key={index}>{image}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <button className='btn btn-primary' onClick={handleProcessData}>Process data</button>
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
                        <li>a annotation file (il2bb.bbx)</li>
                        <li>a log file</li>
                        <li>copies of the images used in the batch</li>
                    </ul>
                    <button className='btn btn-primary mt-4' onClick={handleDownload}>Download results</button>
                </div>
            </div>
        </div>
    );
};

export default Il2bb;