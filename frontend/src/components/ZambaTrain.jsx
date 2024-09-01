import React, { useState, useEffect } from 'react'

function ZambaTrain() {
    const [labelCsv, setLabelCsv] = useState(null);
    const [videofiles, setVideofiles] = useState([]);
    const [trainStatus, setTrainStatus] = useState('');
    const [taskStatus, setTaskStatus] = useState('');
    const [taskId, setTaskId] = useState(null);
    const [model, setModel] = useState('time_distributed');
    const [dryRun, setDryRun] = useState('false');

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

    const handleUpload = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        fetch('/api/zamba/train/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log('Received data:', data);
            setLabelCsv(data.labelCsv);
            setVideofiles(data.videofiles);
        })
        .catch(error => {
            console.error('Error uploading files:', error);
        });
    }

    function triggerTrain() {
        const labels = labelCsv ? (labelCsv.filename || labelCsv) : '';
        // const dryRun = document.getElementById('dry-run').value;

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
                    <form encType="multipart/form-data" onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label htmlFor="label-file" className="block text-sm font-medium text-gray-700 mb-2">
                                CSV file:
                            </label>
                            <input 
                                type="file" 
                                name="label-file" 
                                accept=".csv" 
                                className="file-input file-input-bordered file-input-primary bg-white w-full max-w-xs" 
                            />
                        </div>
                        <div>
                            <label htmlFor="training-video-file" className="block text-sm font-medium text-gray-700 mb-2">
                                Videos for model training (at least 3 videos per label):
                            </label>
                            <input 
                                type="file" 
                                name="training-video-file" 
                                multiple 
                                className="file-input file-input-bordered file-input-primary bg-white w-full max-w-xs" 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Upload</button>
                    </form>

                    {labelCsv && (
                        <div className="mt-4">
                            <p className="font-semibold">Selected label CSV file:</p>
                            <ul>
                                <li>{labelCsv}</li>
                            </ul>
                        </div>
                    )}

                    {videofiles.length > 0 && (
                        <div className='mt-4'>
                            <p className='font-semibold'>Selected videos:</p>
                            <ul>
                                {videofiles.map((video, index) => (
                                    <li key={index}>{video}</li>
                                ))}
                            </ul>
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
                                <li><a onClick={() => setModel('time_distributed')}>time_distributed (default)</a></li>
                                <li><a onClick={() => setModel('blank_nonblank')}>blank_nonblank</a></li>
                                <li><a onClick={() => setModel('slowfast')}>slowfast</a></li>
                                <li><a onClick={() => setModel('european')}>european</a></li>
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
                                <li><a onClick={() => setDryRun('false')}>false</a></li>
                                <li><a onClick={() => setDryRun('true')}>true</a></li>
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
        </div>
    )
}

export default ZambaTrain;