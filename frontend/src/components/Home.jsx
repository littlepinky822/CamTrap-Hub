import React from 'react'

function Home() {

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
    }

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
    }

    const onClickMegaDetector = () => {
        window.open('/megadetector', '_blank');
    }

    return (
        <div>
            <h1>Camera Trapper App Store</h1>
            <button onClick={onClickAniml}>Animl</button>
            <button>Zamba</button>
            <button onClick={onClickMegaDetector}>MegaDetector</button>
            <button onClick={onClickTrapper}>Trapper</button>
            <div id="loading" style={{ display: 'none' }}>Loading...</div>
        </div>
    )
}

export default Home;