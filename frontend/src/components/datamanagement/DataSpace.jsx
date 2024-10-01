import React, { useState, useCallback, useEffect } from 'react';

const DataSpace = () => {
    const [files, setFiles] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [fileStructure, setFileStructure] = useState({});
    const [selectedFolder, setSelectedFolder] = useState(null);
    const s3Folder = 'uploads/'; // Define the S3 folder prefix
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [selectedUploadFolder, setSelectedUploadFolder] = useState('');

    // Handle file upload
    const handleFileChange = useCallback((event) => {
        const selectedFiles = event.target.files || event.dataTransfer.files;
        console.log("Selected files:", selectedFiles);
        setFiles(Array.from(selectedFiles));
    }, []);

    useEffect(() => {
        console.log("Updated files state:", files);
        console.log("Files length:", files.length);
    }, [files]);

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        handleFileChange(event);
    }, [handleFileChange]);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
    }, []);

    const handleUpload = async () => {
        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }
        formData.append('folder', selectedUploadFolder !== '' ? `${selectedUploadFolder}/` : selectedUploadFolder);

        try {
            const response = await fetch('/api/dataSpace/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            console.log('Upload response:', data);
            fetchUploadedFiles();
            setFiles([]); // Clear the file selection after upload
            setSelectedUploadFolder(''); // Reset the selected folder
        } catch (error) {
            console.error('Upload error:', error);
        }
    };

    // Handle S3 file structure display
    useEffect(() => {
        fetchFileStructure();
    }, []);

    const fetchFileStructure = async () => {
        try {
            const response = await fetch('/api/dataSpace/list_files');
            const data = await response.json();
            setFileStructure(data.file_structure);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const fetchUploadedFiles = async () => {
        try {
            const response = await fetch('/api/dataSpace/list_files');
            const data = await response.json();
            setUploadedFiles(data.files);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    // Fetch files once on mount
    useEffect(() => {
        fetchUploadedFiles();
    }, []);

    const handleFolderSelect = (folderPath) => {
        const fullPath = `${s3Folder}${folderPath}`;
        setSelectedFolder(fullPath);
    };

    const renderFileStructure = (structure, path = '') => {
        return Object.keys(structure).map((key) => {
            const currentPath = path ? `${path}/${key}` : key;
            if (key === 'files') {
                return structure[key].map((file, index) => (
                    <li key={index}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                            {file.name}
                        </a>
                    </li>
                ));
            } else {
                return (
                    <li key={key}>
                        <details>
                            <summary onClick={() => handleFolderSelect(currentPath)}>{key}</summary>
                            <ul>{renderFileStructure(structure[key], currentPath)}</ul>
                        </details>
                    </li>
                );
            }
        });
    };

    const filteredFiles = selectedFolder
        ? uploadedFiles.filter(file => file.path && file.path.startsWith(selectedFolder))
        : uploadedFiles;

    const searchFiles = useCallback((query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        const lowercasedQuery = query.toLowerCase();
        const results = uploadedFiles.filter(file => 
            file.name.toLowerCase().includes(lowercasedQuery)
        );
        setSearchResults(results);
    }, [uploadedFiles]);

    useEffect(() => {
        searchFiles(searchQuery);
    }, [searchQuery, searchFiles]);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const displayedFiles = searchQuery ? searchResults : filteredFiles;

    // Delete file from S3
    const openDeleteConfirmation = (file) => {
        setFileToDelete(file);
    };

    const closeDeleteConfirmation = () => {
        setFileToDelete(null);
    };

    const handleDelete = async () => {
        if (!fileToDelete) return;

        try {
            const response = await fetch(`/api/dataSpace/delete?path=${fileToDelete.path}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Delete response:', data);
                // Refresh the file list after successful deletion
                fetchUploadedFiles();
            } else {
                console.error('Delete failed:', data.error);
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
        closeDeleteConfirmation();
    };

    return (
        <div>
            <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">Data Space</h1>
                {/* Upload Files */}
                <div className="flex items-center justify-center w-full">
                    <label 
                        htmlFor="dropzone-file" 
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" multiple onChange={handleFileChange}/>
                    </label>
                </div>
                {/* Select Upload Destination */}
                <div className="mb-4">
                    <span className="mr-2">Upload destination:</span>
                    <select 
                        value={selectedUploadFolder} 
                        onChange={(e) => setSelectedUploadFolder(e.target.value)}
                        className="select select-bordered w-full max-w-xs"
                    >
                        <option value="">Root</option>
                        {Object.keys(fileStructure).map((folder) => (
                            <option key={folder} value={folder}>{folder}</option>
                        ))}
                    </select>
                </div>
                {files.length > 0 && (
                    <div className="mt-4">
                        <h2 className="text-2xl font-bold mb-4">Selected Files</h2>
                        <ul>
                            {files.map((file, index) => (
                                <li key={index}>{file.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <button className="btn btn-secondary mt-4" onClick={handleUpload}>Upload</button>

                {/* S3 File struture display */}
                <div className="mt-4 w-full">
                    <h2 className="text-2xl font-bold mb-4 text-center">Uploaded Files</h2>
                    <div id="file-list-container" className="flex w-full">
                        {/* Folder Structure Menu */}
                        <div id="file-structure" className="w-64 flex-shrink-0">
                            <ul className="menu menu-xs bg-base-200 rounded-lg w-full h-full">
                                {renderFileStructure(fileStructure)}
                            </ul>
                        </div>
                        <div id="file-list" className="flex-grow overflow-hidden">
                            {/* Action Bar - Breadcrumbs and Search Bar */}
                            <div id="action-bar" className="flex justify-between items-center mb-4">
                                <div className="breadcrumbs text-sm ml-4">
                                    <ul>
                                        <li><a>Home</a></li>
                                        <li><a>Documents</a></li>
                                        <li>Add Document</li>
                                    </ul>
                                </div>
                                <label className="input input-bordered flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        className="grow" 
                                        placeholder="Search" 
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                    />
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 16 16"
                                        fill="currentColor"
                                        className="h-4 w-4 opacity-70">
                                        <path
                                        fillRule="evenodd"
                                        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                                        clipRule="evenodd" />
                                    </svg>
                                </label>
                            </div>
                            {/* File List Table */}
                            <div className="overflow-x-auto w-full">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>
                                                <label>
                                                    <input type="checkbox" className="checkbox" />
                                                </label>
                                            </th>
                                            <th>Image</th>
                                            <th>Type</th>
                                            <th>Last Modified</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedFiles && displayedFiles.length > 0 ? (
                                            displayedFiles.map((file, index) => (
                                                <tr key={index}>
                                                    <th>
                                                        <label>
                                                            <input type="checkbox" className="checkbox" />
                                                        </label>
                                                    </th>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar">
                                                                <div className="mask mask-square h-12 w-12">
                                                                    <img
                                                                        src={file.content}
                                                                        alt={file.name} />
                                                                </div>
                                                            </div>
                                                            <div>{file.name}</div>
                                                        </div>
                                                    </td>
                                                    <td>{file.type}</td>
                                                    <td>{file.uploadDate}</td>
                                                    <th>
                                                        <button 
                                                            onClick={() => openDeleteConfirmation(file)} 
                                                            className="btn btn-ghost btn-xs"
                                                        >
                                                            delete
                                                        </button>
                                                    </th>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center">No files to display</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Confirmation Dialog */}
            <dialog id="delete_confirmation" className={`modal ${fileToDelete ? 'modal-open' : ''}`}>
                <form method="dialog" className="modal-box">
                    <h3 className="font-bold text-lg">Confirm Deletion</h3>
                    <p className="py-4">Are you sure you want to delete {fileToDelete?.name}?</p>
                    <div className="modal-action">
                        <button className="btn" onClick={closeDeleteConfirmation}>Cancel</button>
                        <button className="btn btn-error" onClick={handleDelete}>Delete</button>
                    </div>
                </form>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={closeDeleteConfirmation}>close</button>
                </form>
            </dialog>
        </div>
    );
};

export default DataSpace;