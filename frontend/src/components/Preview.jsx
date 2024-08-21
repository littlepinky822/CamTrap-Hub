import React from 'react';

function Preview({ appInfo, onClose }) {

    const onClickAniml = () => {
        fetch('/animl/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'running') {
                    window.open(data.url, '_blank');
                } else {
                    console.error('Failed to start Animl:', data.error);
                }
            })
            .catch(error => console.error('Error:', error));
    };

    const onClickTrapper = () => {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block';

        fetch('/trapper/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'running') {
                    window.open(data.url, '_blank');
                } else {
                    console.error('Failed to start Trapper:', data.error);
                    loadingElement.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                loadingElement.style.display = 'none';
            });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-4">{appInfo.name}</h2>
                <img src={appInfo.image} alt={appInfo.name} className="w-full h-64 object-cover mb-4" />
                <p className="mb-4">{appInfo.description}</p>
                <div className="mb-4">
                    {appInfo.tags.map((tag, index) => (
                        <span key={index} className="badge badge-outline mr-2">{tag}</span>
                    ))}
                </div>
                <div className="flex justify-between">
                    <button className="btn btn-primary" onClick={() => {
                        if (appInfo.name === 'Animl') {
                            onClickAniml();
                        } else if (appInfo.name === 'Trapper') {
                            onClickTrapper();
                        } else (window.location.href = appInfo.link)
                    }}>Go to {appInfo.name}</button>
                    <span id="loading" style={{ display: 'none' }} className="loading loading-spinner loading-xs"></span>
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default Preview;