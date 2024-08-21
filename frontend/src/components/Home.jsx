import React, {useState} from 'react'
import NavBar from './NavBar'
import ApplicationCard from './ApplicationCard'

function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [purpose, setPurpose] = useState('');

    // Hardcoded apps - should be replaced with API call (fetch metadata)
    const animlInfo = {
        name: 'Animl',
        description: 'Animl is an open, extensible, cloud-based platform for managing camera trap data.',
        image: 'https://raw.githubusercontent.com/tnc-ca-geo/animl-frontend/main/src/assets/animl-logo.svg',
        link: '/animl',
        tags: ['Object Detection', 'Filtering']
    };

    const zambaInfo = {
        name: 'Zamba',
        description: 'Zamba is a tool built in Python that uses machine learning and computer vision to automatically detect and classify animals in camera trap videos.',
        image: 'https://drivendata-prod-public.s3.amazonaws.com/images/drivendata-logo.58f94dd407ef.svg',
        link: '/zamba',
        tags: ['Classification', 'Train Model']
    };

    const megadetectorInfo = {
        name: 'MegaDetector',
        description: 'MegaDetector is an AI model that identifies animals, people, and vehicles in camera trap images.',
        image: 'https://camo.githubusercontent.com/1ee7509ad47f8cbc02dd27f8405b8064ce3507fd454f187c7fb7e22da36ed0a3/68747470733a2f2f692e696d6775722e636f6d2f464354627147482e706e67',
        link: '/megadetector',
        tags: ['Object Detection', 'Filtering']
    };

    const trapperInfo = {
        name: 'Trapper',
        description: 'TRAPPER is an open-source, Python, Django and Docker-based web application designed to manage camera trapping projects.',
        image: 'https://gitlab.com/trapper-project/trapper/-/raw/master/trapper/trapper-project/trapper/apps/common/static/images/logo/logo_text.png',
        link: 'http://localhost:8000/',
        tags: ['Object Detection', 'Filtering']
    };

    const allApps = [animlInfo, zambaInfo, megadetectorInfo, trapperInfo];
    const [filteredApps, setFilteredApps] = useState(allApps);

    const handleSearch = () => {
        const filtered = allApps.filter(app =>
            app.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (purpose === '' || app.tags.includes(purpose))
        );
        setFilteredApps(filtered);
    };

    return (
        <div>
            <NavBar />

            {/* Hero Section */}
            <div className='relative'>
                <div className="hero bg-base-100">
                    <div className="hero-box bg-primary w-10/12 rounded-box h-[50vh] flex items-center justify-center">
                        <div className="hero-content text-center">
                            <div className="max-w-lg">
                                <h1 className="text-5xl font-bold text-neutral">CamTrap Hub</h1>
                                <p className="py-6 text-neutral">
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

            <div className='flex flex-col items-center justify-center mt-20 pt-8'>
                <h2 className='text-3xl font-bold mb-6'>Featured Apps</h2>
                <div className='flex flex-row gap-4 flex-wrap justify-center'>
                    {filteredApps.map((app, index) => (
                        <ApplicationCard appInfo={app} key={index} />
                    ))}
                </div>
                {/* <div>
                    <button className='btn btn-primary' onClick={onClickAniml}>Animl</button>
                    <button className='btn btn-secondary' onClick={onClickZamba}>Zamba</button>
                    <button className='btn btn-accent' onClick={onClickMegaDetector}>MegaDetector</button>
                    <button className='btn btn-neutral' onClick={onClickTrapper}>Trapper</button>
                </div>
                <div id="loading" style={{ display: 'none' }}>Loading...</div> */}
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