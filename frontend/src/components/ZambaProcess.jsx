import React, { useState, useEffect } from 'react'
import NavBar from './NavBar';

function ZambaProcess() {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [taskId, setTaskId] = useState(null);
    const [taskStatus, setTaskStatus] = useState(null);
    const [mediaType, setMediaType] = useState('video');
    const [dryRun, setDryRun] = useState('false');
    const [outputClassname, setOutputClassname] = useState('true');
    const [selectedModel, setSelectedModel] = useState('time_distributed');

    const handleUpload = (e) => {
        e.preventDefault();
        const formData = new FormData();
        const files = e.target.file.files;

        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }

        fetch('/zamba/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            setUploadedFiles(data.files);
            console.log('Uploaded files: ', data.files);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    const triggerProcess = () => {
        fetch('/zamba/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: mediaType, model: selectedModel, dryRun, outputClassname }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            setTaskId(data.task_id);
            setTaskStatus('Started');
        })
        .catch(error => {
            console.error('Error:', error);
            setTaskStatus('Error: ' + error.message);
        });
    }

    useEffect(() => {
        let interval;
        if (taskId) {
            interval = setInterval(() => {
                fetch(`/task_status/${taskId}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                        setTaskStatus(data.status);
                        if (data.status === 'SUCCESS') {
                            clearInterval(interval);
                        }
                    });
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [taskId]);

    return (
        <div className="min-h-screen bg-base">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">Classifying unlabeled videos</h1>
                <p className="text-lg mb-8 text-center text-primary">
                    For more detailed information, check the <a href="https://zamba.drivendata.org/docs/stable/predict-tutorial/" className="link">User Tutorial</a>.
                </p>

                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Upload videos/images for processing</h2>
                    <p className="mb-4">Only upload one type (video/image) at a time.</p>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                                Upload file(s):
                            </label>
                            <input
                                type="file"
                                name="file"
                                id="file"
                                multiple
                                onChange={(e) => setUploadedFiles(Array.from(e.target.files))}
                                className="file-input file-input-bordered file-input-primary bg-white w-full max-w-xs"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Upload</button>
                    </form>

                    {uploadedFiles.length > 0 && (
                        <div className="mt-4">
                            <p className="font-semibold">Selected files:</p>
                            <ul className="list-disc list-inside">
                                {uploadedFiles.map((file, index) => (
                                    <li key={index}>{file.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="bg-base-200 shadow-md rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Configuration</h2>
                    <div className="space-y-4 flex flex-col">
                        <div className="dropdown dropdown-bottom">
                            <label htmlFor="media-type" className="block text-sm font-medium text-gray-700 mb-2">
                                Media type:
                            </label>
                            <div tabIndex={0} role="button" className="btn m-1 w-full max-w-xs bg-white">
                                {mediaType ? mediaType : 'Media type'}
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-full max-w-xs">
                                <li><a onClick={() => setMediaType('video')}>Video</a></li>
                                <li><a onClick={() => setMediaType('image')}>Image</a></li>
                            </ul>
                        </div>

                        <div className="dropdown dropdown-bottom">
                            <label htmlFor="dry-run" className="block text-sm font-medium text-gray-700 mb-2">
                                Dry run:
                            </label>
                            <div tabIndex={0} role="button" className="btn m-1 w-full max-w-xs bg-white">
                                {dryRun ? dryRun : 'Dry run'}
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-full max-w-xs">
                                <li><a onClick={() => setDryRun('false')}>False</a></li>
                                <li><a onClick={() => setDryRun('true')}>True</a></li>
                            </ul>
                        </div>

                        <div className="dropdown dropdown-bottom">
                            <label htmlFor="output-classname" className="block text-sm font-medium text-gray-700 mb-2">
                                Output class name only:
                            </label>
                            <div tabIndex={0} role="button" className="btn m-1 w-full max-w-xs bg-white">
                                {outputClassname ? outputClassname : 'Output class name only'}
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-full max-w-xs">
                                <li><a onClick={() => setOutputClassname('false')}>False</a></li>
                                <li><a onClick={() => setOutputClassname('true')}>True</a></li>
                            </ul>
                        </div>

                        <div className="dropdown dropdown-bottom">
                            <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-2">
                                Choose a pretrained model:
                            </label>
                            <div tabIndex={0} role="button" className="btn m-1 w-full max-w-xs bg-white">
                                {selectedModel ? selectedModel : 'Choose a pretrained model'}
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-full max-w-xs">
                                <li><a onClick={() => setSelectedModel('time_distributed')}>time_distributed (default)</a></li>
                                <li><a onClick={() => setSelectedModel('blank_nonblank')}>blank_nonblank</a></li>
                                <li><a onClick={() => setSelectedModel('slowfast')}>slowfast</a></li>
                                <li><a onClick={() => setSelectedModel('european')}>european</a></li>
                            </ul>
                        </div>

                        <p className="text-sm text-gray-700">
                            Please select a pretrained model that ships with the zamba package. See the <a href="https://zamba.drivendata.org/docs/stable/models/species-detection/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Available Models</a> page for more details.
                        </p>

                        <div>
                            <p className="mb-2">Select the Process file(s) button to confirm processing the uploaded files. This process may take a while.</p>
                            <button onClick={triggerProcess} className="btn btn-primary">Process file(s)</button>
                        </div>

                        {taskStatus && (
                            <div className="alert alert-info">
                                <span>Task Status: {taskStatus}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="pb-8 text-center">
                <button onClick={() => window.location.href='/zamba/result'} className="btn btn-secondary">
                    See results
                </button>
            </div>
        </div>
    )
}

export default ZambaProcess;