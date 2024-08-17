import React, { useState } from 'react';

const MegaDetector = () => {
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

        fetch('/megadetector/upload', {
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

    const handleModelChange = (e) => {
        setModel(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        fetch('/megadetector/run/batch', {
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
        <div>
            <h1>MegaDetector</h1>
            <p>MegaDetector is an AI model that identifies animals, people, and vehicles in camera trap images (which also makes it useful for eliminating blank images).</p>

            <form onSubmit={handleUpload} enctype="multipart/form-data">
                <label htmlFor="image">Upload an image:</label>
                <input type="file" name="image" id="image" accept="image/*" multiple />
                <br />
                <input type="submit" value="Upload" />
            </form>
            <br />
            <form onSubmit={handleSubmit}>
                <label htmlFor="model">Select a model:</label>
                <select name="model" id="model" onChange={handleModelChange}>
                    <option value="MDV5A">MDv5a</option>
                    <option value="MDV5B">MDv5b</option>
                    <option value="MDV4">MDv4</option>
                </select>
                <br />
                {model === 'MDV4' && (
                    <div style={{ color: 'red', fontWeight: 'bold' }}>
                        <p>Warning: MDv4 is not recommended, please only select this if you have a really good reason to do so.</p>
                    </div>
                )}
                <input type="submit" value="Run Batch" />
            </form>

            <button onClick={() => window.open('/megadetector/report', '_blank')}>View Report</button>
        </div>
    );
};

export default MegaDetector;