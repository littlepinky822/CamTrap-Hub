import React, {useState} from 'react';

function Preview({ appInfo, onClose }) {
    const [logoError, setLogoError] = useState(false);

    const handleLogoError = () => {
        setLogoError(true);
    };

    const onClickAniml = () => {
        fetch('/api/animl/start', {
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

        fetch('/api/trapper/start', {
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

    const onClickEcoSecrets = () => {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block';

        fetch('/api/ecosecrets/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'running') {
                console.log('opening', data.url);
                window.open(data.url, '_blank');
            } else {
                console.error('Failed to start EcoSecrets:', data.error);
                loadingElement.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loadingElement.style.display = 'none';
        });
    };

    const onClickIl2bb = async () => {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block';

        try {
            const response = await fetch('/api/il2bb/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const data = await response.json();
            if (data.status ==='running') {
                console.log('opening IL2BB URL');
                window.location.href = appInfo.link;
            } else {
                console.error('Failed to start IL2BB:', data.error);
                loadingElement.style.display = 'none';
            }
        }
        catch (error) {
            console.error('Error:', error);
            loadingElement.style.display = 'none';
        }
    }

    const onClickCameraTrapTools = () => {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block';

        fetch('/api/camera-trap-tools/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'running') {
                window.location.href = '/camera-trap-tools';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loadingElement.style.display = 'none';
        });
    }

    const onClickWildCoFaceBlur = () => {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block';

        fetch('/api/wildCoFaceBlur/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'running') {
                window.location.href = '/wildCoFaceBlur';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loadingElement.style.display = 'none';
        });
    }

    const onClickCameraTrapWorkflow = () => {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block';

        fetch('/api/camera-trap-workflow/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('data', data);
            if (data.status === 'running') {
                window.location.href = '/camera-trap-workflow';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loadingElement.style.display = 'none';
        });
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-2xl w-full">
                <div className="flex flex-row items-center">
                    {!logoError ? (
                        <img src={appInfo.logo} alt={appInfo.display_name} className="w-32 h-32 object-cover mr-4" onError={handleLogoError}/>
                    ) : (
                        <div className="avatar placeholder mr-4">
                            <div className="bg-accent text-neutral-content w-24 rounded">
                                <span className="text-2xl text-primary text-center">{appInfo.display_name}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold mb-4 text-primary">{appInfo.display_name}</h2>
                        <div className="rating mb-2">
                            <input type="radio" name="rating-1" className="mask mask-star bg-secondary" />
                            <input type="radio" name="rating-1" className="mask mask-star bg-secondary" />
                            <input type="radio" name="rating-1" className="mask mask-star bg-secondary" />
                            <input type="radio" name="rating-1" className="mask mask-star bg-secondary" defaultChecked />
                            <input type="radio" name="rating-1" className="mask mask-star bg-secondary" />
                        </div>
                        <div className="mb-4">
                            {appInfo.tags.map((tag, index) => (
                                <span key={index} className="badge badge-outline mr-2">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="divider"></div>
                <h3 className="text-xl text-primary font-bold mb-4">Description</h3>
                <div className="mb-4">
                    {appInfo.full_description.split('\n').map((line, index) => {
                        return <p key={index}>{line}</p>
                    })}
                </div>
                <div className="flex justify-between">
                    <button className="btn btn-primary" onClick={() => {
                        if (appInfo.display_name === 'Animl') {
                            onClickAniml();
                        } else if (appInfo.display_name === 'Trapper') {
                            onClickTrapper();
                        } else if (appInfo.display_name === 'EcoSecrets') {
                            onClickEcoSecrets();
                        } else if (appInfo.display_name === 'IL2BB') {
                            onClickIl2bb();
                        } else if (appInfo.display_name === 'Camera Trap Tools') {
                            onClickCameraTrapTools();
                        } else if (appInfo.display_name === 'WildCo-FaceBlur') {
                            onClickWildCoFaceBlur();
                        } else if (appInfo.display_name === 'Camera Trap Workflow') {
                            onClickCameraTrapWorkflow();
                        } else {
                            window.location.href = appInfo.link;
                        }
                    }}>Go to {appInfo.display_name}</button>
                    <span id="loading" style={{ display: 'none' }} className="loading loading-spinner loading-xs"></span>
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default Preview;