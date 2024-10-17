import React, { useState, useEffect } from 'react'
import ImageBrowserPopup from './ImageBrowserPopup';

function ZambaTrain() {
    const [labelCsv, setLabelCsv] = useState(null);
    const [trainStatus, setTrainStatus] = useState('');
    const [taskStatus, setTaskStatus] = useState('');
    const [taskId, setTaskId] = useState(null);
    const [model, setModel] = useState('time_distributed');
    const [dryRun, setDryRun] = useState('false');
    const [selectedItems, setSelectedItems] = useState([]);
    const [allowedTypes, setAllowedTypes] = useState([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    useEffect(() => {
        let interval;
        if (taskId) {
            interval = setInterval(() => {
                fetch(`/api/task_status/${taskId}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                        const message = data.result ? data.result.message : 'Not available yet';
                        const output = data.result ? data.result.output : '';
                        setTaskStatus(`Task Status: ${data.status}\nMessage: ${message}\nOutput: ${output}`);
        
                        if (data.status === 'SUCCESS') {
                            clearInterval(interval);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching task status:', error);
                        setTaskStatus(`Error fetching task status: ${error.message}`);
                    });
            }, 60000);
        }
        return () => clearInterval(interval);
    }, [taskId]);

    const handleOpenFileBrowser = () => {
        let allowedTypes = ['video'];
        console.log('Setting allowed types:', allowedTypes);  // Add this log
        setAllowedTypes(allowedTypes);
        document.getElementById('file_browser_modal').showModal();
    };

    const handleSelectItems = (items) => {
        setSelectedItems(items);
    };

    const handleUpload = () => {
        const formData = new FormData();

        if (labelCsv) {
            formData.append('labelCsv', labelCsv);
        }

        selectedItems.forEach(item => {
            formData.append('videos', item.path);
        });

        fetch('/api/zamba/train/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            setUploadSuccess(true);
        })
        .catch(error => {
            console.error('Error uploading files:', error);
        });
    }

    function triggerTrain() {
        const labels = labelCsv ? (labelCsv.filename || labelCsv) : '';

        if (!labels) {
            setTrainStatus('Error: No label file specified');
            return;
        }

        fetch('/api/zamba/train/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, dryRun, labels }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.error) {
                setTrainStatus(`Error: ${data.error}`);
            } else {
                setTrainStatus(`Training started: ${data.message}\nTask ID: ${data.task_id}`);
                setTaskId(data.task_id);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            setTrainStatus(`Error: ${error.message}`);
        });
    }

    return (
        <div className="min-h-screen bg-base">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">Train a model on labeled videos or images</h1>
                <p className="text-lg mb-8 text-center text-primary">
                    For more detailed information, check the <a href="https://zamba.drivendata.org/docs/stable/train-tutorial/" className="link">User Tutorial</a>.
                </p>

                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Upload a CSV containing the video labels to use as ground truth during training:</h2>
                    <p className="mb-4">There must be columns for both <code>filepath</code> and <code>label</code>.</p>
                    {/* CSV file upload */}
                    <div>
                        <label htmlFor="labelCsv" className="block text-sm font-medium text-gray-700 mb-2">
                            CSV file:
                        </label>
                        <input
                            type="file"
                            name="labelCsv"
                            accept=".csv"
                            className="file-input file-input-bordered file-input-primary bg-white w-full max-w-xs"
                            onChange={(e) => setLabelCsv(e.target.files[0])}
                        />
                        {labelCsv && (
                            <div className="mt-4">
                                <p className="font-semibold">Selected label CSV file:</p>
                                <ul>
                                    <li>{labelCsv.name}</li>
                                </ul>
                            </div>
                        )}
                    </div>
                    {/* Videos upload */}
                    <div className='mt-2'>
                        <label htmlFor="videos" className="block text-sm font-medium text-gray-700 mb-2">
                            Videos:
                        </label>
                        <button onClick={() => handleOpenFileBrowser()} name="videos" className="btn btn-primary mr-2">Select Videos</button>
                        {selectedItems.length > 0 && (
                            <div className="mt-4">
                                <h3>Selected Images/Videos:</h3>
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
                </div>

                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Configuration</h2>
                    <p className="mb-4">If you wish to finetune an existing model, please select the model here:</p>
                    
                    <div className='flex flex-col'>
                        <div className='dropdown dropdown-bottom'>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                                Model:
                            </label>
                            <div tabIndex={0} role="button" className="btn m-1 w-full max-w-xs bg-white">
                                {model ? model : 'Model'}
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-full max-w-xs">
                                <li><button onClick={() => setModel('time_distributed')}>time_distributed (default)</button></li>
                                <li><button onClick={() => setModel('blank_nonblank')}>blank_nonblank</button></li>
                                <li><button onClick={() => setModel('slowfast')}>slowfast</button></li>
                                <li><button onClick={() => setModel('european')}>european</button></li>
                            </ul>
                        </div>

                        <div className='dropdown dropdown-bottom'>
                            <label htmlFor="dryRun" className='block text-sm font-medium text-gray-700 mb-2'>
                                Dry run:
                            </label>
                            <div tabIndex={0} role="button" className="btn m-1 w-full max-w-xs bg-white">
                                {dryRun ? dryRun : 'Dry run'}
                            </div>
                            <ul tabIndex={0} className='dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-full max-w-xs'>
                                <li><button onClick={() => setDryRun('false')}>false</button></li>
                                <li><button onClick={() => setDryRun('true')}>true</button></li>
                            </ul>
                        </div>
                    </div>

                    
                </div>
                {/* Submit request */}
                <p>Select the Train model button to confirm training the model. This process may take a while.</p>
                <button className='btn btn-primary' onClick={triggerTrain}>Train model</button>

                {/* Display task status/progress when running classification */}
                <div className='mt-4'>{trainStatus}</div>
                <div className='mt-4'>{taskStatus}</div>
            </div>
            <ImageBrowserPopup onSelect={handleSelectItems} allowedTypes={allowedTypes} />
        </div>
    )
}

export default ZambaTrain;