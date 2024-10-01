import React, { useState, useEffect, useMemo, useCallback } from 'react';

const ImageBrowserPopup = ({ onSelect, allowedTypes = ['image', 'video', 'folder'] }) => {
    const [files, setFiles] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fileStructure, setFileStructure] = useState({});
    const [selectedFolder, setSelectedFolder] = useState(null);
    const s3Folder = 'uploads/';
    const fileTypesDict = {'image': ['jpg', 'jpeg', 'png', 'gif'], 'video': ['mp4', 'mov', 'avi', 'mkv'], 'folder': ['folder']};

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/dataSpace/list_files');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setFiles(data.files);
            setFileStructure(data.file_structure);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleItemSelect = useCallback((item) => {
        console.log('Item selected:', item);
        setSelectedItems(prevSelected => {
            if (prevSelected.some(i => i.path === item.path)) {
                return prevSelected.filter(i => i.path !== item.path);
            } else {
                return [...prevSelected, item];
            }
        });
    }, []);

    const handleSelectItems = () => {
        if (selectedItems.length > 0) {
            console.log('Found selected items:', selectedItems);
            onSelect(selectedItems);
            document.getElementById('file_browser_modal').close();
        }
    };
    
    // const isFileTypeAllowed = (file) => {
    //     console.log('Checking file:', file);
    //     console.log('Allowed types:', allowedTypes);
    
    //     if (!file || !file.category) {
    //         console.log('File or file category is undefined');
    //         return false;
    //     }
    
    //     console.log('File category:', file.category);
    
    //     return allowedTypes.some(type => {
    //         console.log('Checking allowed type:', type);
    //         if (type === 'folder') {
    //             return file.category === 'folder';
    //         }
    //         const isAllowed = file.category === type;
    //         console.log(`Is ${file.category} allowed for ${type}:`, isAllowed);
    //         return isAllowed;
    //     });
    // };
    const isFileTypeAllowed = useCallback((file) => {
        if (!file || !file.category) {
            return false;
        }
        return allowedTypes.some(type => {
            if (type === 'folder') {
                return file.category === 'folder';
            }
            return file.category === type;
        });
    }, [allowedTypes]);

    const renderFileStructure = useMemo(() => {
        const render = (structure, path = '') => {
            return Object.keys(structure).map((key) => {
                const currentPath = path ? `${path}/${key}` : key;
                if (key === 'files') {
                    return structure[key].map((fileInStructure, index) => {
                        const file = files.find(f => f.path === fileInStructure.path);
                        const isAllowed = file ? isFileTypeAllowed(file) : false;
                        return (
                            <li key={index}>
                                <label className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="checkbox mr-2" 
                                        checked={selectedItems.some(item => item.path === fileInStructure.path)}
                                        onChange={() => handleItemSelect(file || fileInStructure)}
                                        disabled={!isAllowed}
                                    />
                                    {fileInStructure.name} ({file ? file.type : 'Unknown'})
                                </label>
                            </li>
                        );
                    });
                } else {
                    return (
                        <li key={key}>
                            <details>
                                <summary>
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            className="checkbox mr-2" 
                                            checked={selectedItems.some(item => item.path === currentPath)}
                                            onChange={() => handleItemSelect({path: currentPath, type: 'folder', name: key})}
                                            disabled={!allowedTypes.includes('folder')}
                                        />
                                        {key}
                                    </label>
                                </summary>
                                <ul>{render(structure[key], currentPath)}</ul>
                            </details>
                        </li>
                    );
                }
            });
        };
        return render;
    }, [files, selectedItems, allowedTypes, isFileTypeAllowed, handleItemSelect]);

    return (
        <dialog id="file_browser_modal" className="modal">
            <div className="modal-box w-11/12 max-w-5xl">
                <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
                <h3 className="font-bold text-lg mb-2">Select files or folders</h3>
                <p className="mb-4 text-sm">Use the checkbox to select files or folders. You can select multiple files and folders to upload.</p>
                {isLoading && <p>Loading data...</p>}
                {error && <p className="text-red-500">{error}</p>}
                <div className="file-structure overflow-y-auto max-h-96">
                    <ul className="menu menu-xs bg-base-200 rounded-lg w-full">
                        {renderFileStructure(fileStructure)}
                    </ul>
                </div>
                <div className="modal-action">
                    <form method="dialog">
                        <button className="btn btn-secondary mr-2">Cancel</button>
                    </form>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSelectItems} 
                        disabled={selectedItems.length === 0}
                    >
                        Select ({selectedItems.length})
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default ImageBrowserPopup;