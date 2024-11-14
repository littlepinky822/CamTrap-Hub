import React, { useState, useContext } from 'react';
import NavBar from '../NavBar';
import ZambaProcess from './ZambaProcess';
import ZambaTrain from './ZambaTrain';
import { ThemeContext } from '../../ThemeContext';

const Zamba = () => {
    const [activeTab, setActiveTab] = useState('classification');
    const { theme, setTheme } = useContext(ThemeContext);

    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">Zamba</h1>
                <div role="tablist" className="tabs tabs-boxed">
                    <a role="tab" className={`tab ${activeTab === 'classification' ? 'tab-active' : ''}`} onClick={() => setActiveTab('classification')}>Classification</a>
                    <a role="tab" className={`tab ${activeTab === 'train' ? 'tab-active' : ''}`} onClick={() => setActiveTab('train')}>Train a model</a>
                </div>
            </div>

            {activeTab === 'classification' && <ZambaProcess />}
            {activeTab === 'train' && <ZambaTrain />}

        </div>
    )
}

export default Zamba;