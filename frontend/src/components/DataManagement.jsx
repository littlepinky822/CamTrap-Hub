import React, { useState, useContext } from 'react';
import NavBar from './NavBar';
import Dashboard from './datamanagement/Dashboard';
import DataSpace from './datamanagement/DataSpace';
import { ThemeContext } from '../ThemeContext';

const DataManagement = () => {
    const [activeTab, setActiveTab] = useState('dataSpace');
    const { theme, setTheme } = useContext(ThemeContext);

    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">Data Management</h1>
                <div role="tablist" className="tabs tabs-boxed">
                    <a role="tab" className={`tab ${activeTab === 'dashboard' ? 'tab-active' : ''}`} onClick={() => setActiveTab('dashboard')}>Insights</a>
                    <a role="tab" className={`tab ${activeTab === 'dataSpace' ? 'tab-active' : ''}`} onClick={() => setActiveTab('dataSpace')}>Data Space</a>
                </div>
            </div>

            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'dataSpace' && <DataSpace />}

        </div>
    )
}

export default DataManagement;