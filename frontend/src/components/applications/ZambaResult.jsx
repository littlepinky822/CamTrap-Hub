import React, { useState, useEffect, useContext } from 'react'
import NavBar from '../NavBar';
import { ThemeContext } from '../../ThemeContext';

function ZambaResult() {
    const { theme, setTheme } = useContext(ThemeContext);
    const [results, setResults] = useState([]);
    useEffect(() => {
        getResult().then(data => {
            setResults(data);
        });
    }, []);

    const getResult = async () => {
        const response = await fetch('/api/zamba/result');
        const data = await response.json();
        console.log(data);
        return data;
    }

    const handleDownload = () => {
        fetch('/api/zamba/download')
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
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className='container mx-auto px-4 py-8'>
                <h1 className='text-4xl font-bold mb-4 text-center text-primary'>Zamba Classification Results</h1>
                <p className='text-lg mb-8 text-center text-primary'>Only result of selected most likely class will be displayed here. You can still download the CSV file to see the full result.</p>
                <h2 className='text-center text-primary'>Download the original CSV file <a href="#" className='link' onClick={handleDownload}>here</a></h2>
                
                {results.length > 0 ? (
                    <table border="1" className='table table-zebra'>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Filepath</th>
                                <th>Classname</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((item, index) => (
                                <tr key={index}>
                                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                                    <td>{item.filepath}</td>
                                    <td>{item.classname}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div role="alert" className="alert alert-info">
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
                        <span>No classification results available. Please run the Zamba process first.</span>
                    </div>
                )}
                
                <button className='btn btn-primary mt-4' onClick={() => window.location.href='/zamba'}>Back to Zamba</button>
            </div>
        </div>
    )
}

export default ZambaResult;