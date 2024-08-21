import React, { useState, useEffect } from 'react'
import NavBar from './NavBar';

function ZambaResult() {
    const [results, setResults] = useState([]);
    useEffect(() => {
        // When the component mounts, we call getResult to fetch the data
        getResult().then(data => {
            // Once we have the data, we update our state
            setResults(data);
        });
    }, []);

    const getResult = async () => {
        const response = await fetch('/zamba/result');
        const data = await response.json();
        console.log(data);
        return data;
    }

    const handleDownload = () => {
        fetch('/zamba/download')
            .then(response => {
                if (response.ok) {
                    return response.blob();
                }
                throw new Error('Network response was not ok.');
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'zamba_predictions.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => console.error('Download error:', error));
    }

    return (
        <div className='min-h-screen bg-base'>
            <NavBar />
            <div className='container mx-auto px-4 py-8'>
                <h1 className='text-4xl font-bold mb-4 text-center text-primary'>Zamba Classification Results</h1>
                <p className='text-lg mb-8 text-center text-primary'>Only result of selected most likely class will the display here. You can still download the CSV file to see the result.</p>
                <h2 className='text-center text-primary'>Download the original CSV file <a href="#" className='link' onClick={handleDownload}>here</a></h2>
                <table border="1" className='table table-zebra'>
                    <thead>
                        <tr>
                            <th>Filepath</th>
                            <th>Classname</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((item, index) => (
                            <tr key={index}>
                                <td>{item.filepath}</td>
                                <td>{item.classname}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button className='btn btn-primary mt-4' onClick={() => window.location.href='/zamba'}>Back to Zamba</button>
            </div>
        </div>
    )
}

export default ZambaResult;