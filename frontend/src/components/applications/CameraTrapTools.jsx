import React, { useState, useContext } from 'react';
import NavBar from '../NavBar';
import { ThemeContext } from '../../ThemeContext';
import ImageBrowserPopup from '../ImageBrowserPopup';

const CameraTrapTools = () => {
    const [activeTab, setActiveTab] = useState('imageProcessing');
    const { theme, setTheme } = useContext(ThemeContext);

    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">Camera Trap Tools</h1>
                <p className="text-lg mb-8 text-center text-gray-700">A suite of tools for managing time-lapse recordings taken by camera traps (a.k.a. trail cameras).</p>
                <div role="tablist" className="tabs tabs-boxed">
                    <a role="tab" className={`tab ${activeTab === 'imageProcessing' ? 'tab-active' : ''}`} onClick={() => setActiveTab('imageProcessing')}>Image Processing</a>
                    <a role="tab" className={`tab ${activeTab === 'annotation' ? 'tab-active' : ''}`} onClick={() => setActiveTab('annotation')}>Annotation</a>
                    <a role="tab" className={`tab ${activeTab === 'reports' ? 'tab-active' : ''}`} onClick={() => setActiveTab('reports')}>Reports</a>
                </div>
            </div>

            {activeTab === 'imageProcessing' && <CameraTrapToolsProcessing />}
            {activeTab === 'annotation' && <CameraTrapToolsAnnotation />}
            {activeTab === 'reports' && <CameraTrapToolsReports />}
        </div>
    )
}

const CameraTrapToolsProcessing = () => {
    const [success, setSuccess] = useState(false);
    const [videoSuccess, setVideoSuccess] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [allowedTypes, setAllowedTypes] = useState([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleOpenFileBrowser = () => {
        let allowedTypes = ['image'];
        setAllowedTypes(allowedTypes);
        document.getElementById('file_browser_modal').showModal();
    };

    const handleSelectItems = (items) => {
        setSelectedItems(items);
    };

    const handleUpload = async () => {
        try {
            const formData = new FormData();

            selectedItems.forEach(item => {
                formData.append('images', item.path);
            });

            const response = await fetch('/api/camera-trap-tools/autocopy/upload', {
                method: 'POST',
                body: formData
            })
            const data = await response.json()
            setUploadSuccess(true);
            console.log(data);
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    const handleProcess = async () => {
        const animalDetection = document.querySelector('.detector').checked;
        try {
            const response = await fetch('/api/camera-trap-tools/autocopy/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ animalDetection })
            })
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                setSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        };
    }

    const handleDownload = async () => {
        try {
            const response = await fetch('/api/camera-trap-tools/autocopy/download', {
                method: 'GET'
            })
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'CameraTrapTools_autocopy_result.zip'
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    }

    const handleCreateVideo = async () => {
        try {
            const response = await fetch('/api/camera-trap-tools/create-video', {
                method: 'POST'
            })
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                setVideoSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        }
    }

    const handleDownloadVideos = async () => {
        try {
            const response = await fetch('/api/camera-trap-tools/create-video/download', {
                method: 'GET'
            })
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'CameraTrapTools_createvideos_result.zip'
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    }

    return (
        <div className="min-h-screen bg-base">
            <div className="container mx-auto px-4 py-8">
                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-3xl font-semibold mb-4 text-center">Autocopy</h2>
                    <p className="text-sm text-gray-700 text-center">Downloading and automatic renaming of images from SD cards.</p>
                    <h3 className="text-2xl font-semibold mb-4">Upload Images for renaming</h3>
                    <div>
                        <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                            Upload image(s):
                        </label>
                        <button onClick={() => handleOpenFileBrowser()} name="images" className="btn btn-primary mr-2">Select Images</button>
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
                    <button className='btn btn-primary mt-4' onClick={handleUpload}>Upload Selected Images</button>
                    {uploadSuccess && (
                        <div role="alert" className="alert alert-success mt-4">
                            <span>Uploaded successfully!</span>
                        </div>
                    )}

                    <label className="label cursor-pointer justify-start">
                        <span className="label-text mr-4">Activate animal detection? </span>
                        <input type="checkbox" className="detector toggle toggle-primary" defaultChecked />
                    </label>

                    <button className='btn btn-secondary mt-4' onClick={handleProcess}>Process data</button>
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

                    <div className="divider"></div>

                    <h2 className="text-2xl font-semibold mb-4">Download results</h2>
                    <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the results here.</p>
                    <p className="text-sm text-gray-700">Inside the the .zip file, you will find:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        <li>a log file</li>
                        <li>a status HTML file</li>
                        <li>copies of uploaded images that were labeled inside 'RawImages' folder</li>
                    </ul>
                    <button className='btn btn-secondary mt-4' onClick={handleDownload}>Download results</button>
                </div>

                <div className="bg-base-200 shadow-md rounded-lg p-6 mt-8 mb-8">
                    <h2 className="text-3xl font-semibold mb-4 text-center text-primary">Create video</h2>
                    <p className="text-sm text-gray-700 text-center">Compressing images to MP4 video files.</p>
                    <h3 className="text-2xl font-semibold mb-4">Create video using autocopy results</h3>
                    <p className="text-sm text-gray-700">Note: this will only work if autocopy has been run before.</p>
                    <button className='btn btn-secondary mt-4' onClick={handleCreateVideo}>Create video</button>
                    {videoSuccess && (
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
                            <span>Video creation completed! You may download the result now.</span>
                        </div>
                    )}

                    <div className="divider"></div>

                    <h2 className="text-2xl font-semibold mb-4">Download videos</h2>
                    <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the videos here.</p>
                    <p className="text-sm text-gray-700">Inside the the .zip file, you will find:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        <li>videos created from labeled images</li>
                    </ul>
                    <button className='btn btn-secondary mt-4' onClick={handleDownloadVideos}>Download videos</button>
                </div>
            </div>
            <ImageBrowserPopup onSelect={handleSelectItems} allowedTypes={allowedTypes} />
        </div>
    );
};

const CameraTrapToolsAnnotation = () => {
    const [annotationSuccess, setAnnotationSuccess] = useState(false);

    const handleCreateAnnotation = async () => {
        try {
            const response = await fetch('/api/camera-trap-tools/create-annotation', {
                method: 'POST'
            })
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                setAnnotationSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        }
    }

    const handleDownloadAnnotation = async () => {
        try {
            const response = await fetch('/api/camera-trap-tools/create-annotation/download', {
                method: 'GET'
            })
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'CameraTrapTools_annotation_files.zip'
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    }
    return (
        <div className="container mx-auto px-4">
            <div className="bg-base-200 shadow-md rounded-lg p-6 my-8">
                <h2 className="text-3xl font-semibold mb-4 text-center text-primary">Create annotation</h2>
                <p className="text-sm text-gray-700 text-center">Create Draft Annotation From Animal Detector Output.</p>
                <h3 className="text-2xl font-semibold mb-4">Create draft annotation</h3>
                <p className="text-sm text-gray-700">Note: this will only work if you select animal dectection when running autocopy.</p>
                <button className='btn btn-secondary mt-4' onClick={handleCreateAnnotation}>Create annotation</button>
                {annotationSuccess && (
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
                        <span>Annotation creation completed! You may download the result now.</span>
                    </div>
                )}

                <div className="divider"></div>

                <h2 className="text-2xl font-semibold mb-4">Download annotation files</h2>
                <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the files here.</p>
                <p className="text-sm text-gray-700">Inside the the .zip file, you will find:</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                    <li>annotation files created based on your animal detector output</li>
                </ul>
                <button className='btn btn-secondary mt-4' onClick={handleDownloadAnnotation}>Download annotation files</button>
            </div>
        </div>
    )
}

const CameraTrapToolsReports = () => { 
    const [annotationReportSuccess, setAnnotationReportSuccess] = useState(false);
    const [captureReportSuccess, setCaptureReportSuccess] = useState(false);
    const [captureReportMonth, setCaptureReportMonth] = useState('');

    const handleCreateAnnotationReport = async () => {
        try {
            const response = await fetch('/api/camera-trap-tools/create-annotation/report', {
                method: 'POST'
            })
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                setAnnotationReportSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        }
    }

    const handleDownloadAnnotationReport = async () => {
        try {
            const response = await fetch('/api/camera-trap-tools/create-annotation/report/download', {
                method: 'GET'
            })
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'CameraTrapTools_annotation_report.csv'
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    }

    const handleCreateCaptureReport = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            setCaptureReportMonth(formData.get('capture-report-month'));
            const response = await fetch('/api/camera-trap-tools/capture-report', {
                method: 'POST',
                body: formData
            })
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                setCaptureReportSuccess(true);
            }
        }
        catch(error) {
            console.error('Error: ', error);
        }
    }

    const handleDownloadCaptureReport = async () => {
        try {
            const response = await fetch('/api/camera-trap-tools/capture-report/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 'capture-report-month': captureReportMonth })
            })
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CameraTrapTools_capture_report_${captureReportMonth}.csv`
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Download failed');
            }
        }
        catch (error) {
            console.error('Error: ', error);
        }
    }

    return (
        <div className="container mx-auto px-4">
            <div className="bg-base-200 shadow-md rounded-lg p-6 my-8">
                <h2 className="text-3xl font-semibold mb-4 text-center text-primary">Generate reports</h2>
                <p className="text-sm text-gray-700 text-center">Generate reports for analysis or status of camera data processing.</p>
                <h3 className="text-2xl font-semibold mb-4">Generate annotation report</h3>
                <p className="text-sm text-gray-700">This program combines the contents of all video annotation files and dumps them to a single CSV file suitable for analyzing with the statistical software of your choice. Each record (line) of the report represents one annotation and contains the following information:</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                    <li>site: Camera site</li>
                    <li>file: The name of the annotation file this record came from</li>
                    <li>activity: The name of the activity or event associated with this annotation</li>
                    <li>kind: Kind of animal associated with this annotation, either 'focal' or 'commensal'</li>
                    <li>individual: ID of the animal associated with this annotation</li>
                    <li>startTime: Time the activity began</li>
                    <li>endTime: Time the activity ended</li>
                    <li>user: Name of the user who created the annotation</li>
                </ul>
                <button className='btn btn-secondary mt-4 mb-4' onClick={handleCreateAnnotationReport}>Create annotation report</button>
                {annotationReportSuccess && (
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
                        <span>Annotation report creation completed! You may download the result now.</span>
                    </div>
                )}

                <h2 className="text-2xl font-semibold mb-4">Download annotation report</h2>
                <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the files here.</p>
                <button className='btn btn-secondary mt-4' onClick={handleDownloadAnnotationReport}>Download annotation report</button>

                <div className="divider"></div>

                <h3 className="text-2xl font-semibold mb-4">Generate capture report from video</h3>
                <p className="text-sm text-gray-700">This program generates a CSV file detailing the number of images captured by each camera on each day, whether those images have been compressed into videos, and if an annotation file exists for that camera day.</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                    <li>Camera: Camera site and view</li>
                    <li>Date</li>
                    <li>ImageCount: Number of images in the default_image_folder that are associated with this camera day</li>
                    <li>FrameCount: Number of frames in the video associated with this camera day</li>
                    <li>Video: Boolean value indicating if a compressed video exists for this camera day</li>
                    <li>Annotation: Boolean value indicating if an annotation file exists for this camera day</li>
                </ul>
                <form onSubmit={handleCreateCaptureReport}>
                    <div className="form-control flex flex-row items-center mt-4">
                        <label htmlFor="capture-report-month" className="block text-base font-medium text-gray-700 mb-2">Capture report month: </label>
                        <input
                            type="text"
                            placeholder="YYYY-MM"
                            name="capture-report-month"
                            className="input input-bordered w-full max-w-xs ml-4"
                            pattern="\d{4}-\d{2}"
                            title="Please enter a date in the format YYYY-MM"
                            required
                        />
                    </div>
                    <button className='btn btn-secondary mt-4 mb-4' type="submit">Create capture report</button>
                </form>
                {captureReportSuccess && (
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
                        <span>Capture report creation completed! You may download the result now.</span>
                    </div>
                )}

                <h2 className="text-2xl font-semibold mb-4">Download capture report</h2>
                <p className="text-sm text-gray-700">Once the pipeline has finished processing, you can download the files here.</p>
                <button className='btn btn-secondary mt-4' onClick={handleDownloadCaptureReport}>Download capture report</button>
            </div>
        </div>
    )
}

export default CameraTrapTools;