import React, {useState, useEffect, useContext} from 'react'
import NavBar from './NavBar'
import ApplicationCard from './ApplicationCard'
import { ThemeContext } from '../ThemeContext';

function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [purpose, setPurpose] = useState('');
    const { theme, setTheme } = useContext(ThemeContext);
    const [allApps, setAllApps] = useState([]);
    const [filteredApps, setFilteredApps] = useState(allApps);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const response = await fetch('/api/apps');
                const data = await response.json();
                setAllApps(data);
                setFilteredApps(data);
            } catch (error) {
                console.error('Error fetching apps:', error);
            }
        };

        fetchApps();
    }, []);
    
    const handleSearch = () => {
        const filtered = allApps.filter(app =>
            app.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (purpose === '' || app.tags.includes(purpose))
        );
        setFilteredApps(filtered);
    };

    return (
        <div>
            <NavBar theme={theme} setTheme={setTheme}/>

            {/* Hero Section */}
            <div className='relative'>
                <div className="hero bg-base-100">
                    <div className="hero-box bg-primary w-10/12 rounded-box h-[50vh] flex items-center justify-center">
                        <div className="hero-content text-center w-7/12">
                            <div className="max-w-full">
                                <h1 className="text-8xl font-bold text-base-100">CamTrap Hub</h1>
                                <p className="py-6 text-base-100">
                                    Your all-in-one camera trapper app store where you can find and run apps for image classification, object detection, and blank filtering.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <div className="bg-white rounded-full shadow-lg p-4">
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="text"
                                placeholder="Name"
                                className="input flex-grow bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="divider divider-horizontal"></div>
                            <select
                                className="select flex-grow bg-white"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                            >
                                <option value="" disabled selected>Purpose</option>
                                <option value="Classification">Image Classification</option>
                                <option value="Object Detection">Object Detection</option>
                                <option value="Filtering">Blank Filtering</option>
                                <option value="Train Model">Train Model</option>
                                <option value="">None</option>
                            </select>
                            <button className="btn btn-primary rounded-full" onClick={handleSearch}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                    className="h-4 w-4 opacity-70"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex flex-col items-center justify-center mt-20 mb-20 pt-8'>
                <h2 className='text-3xl text-primary font-bold mb-6'>Featured Apps</h2>
                <div className='flex flex-row gap-4 flex-wrap justify-center'>
                    {filteredApps.map((app, index) => (
                        <ApplicationCard appInfo={app} key={index} />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="footer footer-center bg-base-300 text-base-content p-4">
                <aside>
                    <p>Copyright © {new Date().getFullYear()} - All right reserved by Yan Tung Lam</p>
                </aside>
            </footer>
        </div>
    );
}

export default Home;