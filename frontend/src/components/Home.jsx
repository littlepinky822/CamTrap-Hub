import React, {useState, useContext} from 'react'
import NavBar from './NavBar'
import ApplicationCard from './ApplicationCard'
import { ThemeContext } from '../ThemeContext';

function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [purpose, setPurpose] = useState('');
    const { theme, setTheme } = useContext(ThemeContext);

    // Hardcoded apps metadata - should be replaced with API call (fetch metadata)
    const animlInfo = {
        name: 'Animl',
        description: 'Animl is an open, extensible, cloud-based platform for managing camera trap data.',
        full_description: `Animl is an open, extensible, cloud-based platform for managing camera trap data. It provides:
                            \n• Ingest data from a variety of camera trap types (wireless, SD card based, IP, etc.)
                            \n• Systematically store and manage images in a single centralized, cloud-based repository
                            \n• Upload custom object detection and species clasification ML models and configure automated assisted-labeling pipelines
                            \n• Offer frontend web application to view images, review ML-assisted labels, perform manual labeling
                            \n• Offer an API for advanced querying and analysis of camera trap data
                            \n• Offer tools for exporting ML model training data`,
        logo: 'https://raw.githubusercontent.com/tnc-ca-geo/animl-frontend/d4b2542251007f7e01bb08956473d5b8f1c84314/public/favicon.ico',
        image: 'https://raw.githubusercontent.com/tnc-ca-geo/animl-frontend/main/src/assets/animl-logo.svg',
        link: '/animl',
        tags: ['Object Detection', 'Filtering']
    };

    const zambaInfo = {
        name: 'Zamba',
        description: 'Zamba is a tool built in Python that uses machine learning and computer vision to automatically detect and classify animals in camera trap videos.',
        full_description: `Zamba Cloud uses machine learning to automatically detect and classify animals in camera trap videos. You can use Zamba Cloud to:
                            \n• Classify which species appear in a video
                            \n• Identify blank videos
                            \n• Train a custom model with your own labeled data to identify species in your habitat
                            \n• Estimate the distance between animals in the frame and the camera
                            \n• And more! 🙈 🙉 🙊`,
        logo: 'https://drivendata-prod-public.s3.amazonaws.com/images/drivendata-logo.58f94dd407ef.svg',
        image: 'https://drivendata-prod-public.s3.amazonaws.com/images/drivendata-logo.58f94dd407ef.svg',
        link: '/zamba',
        tags: ['Classification', 'Train Model']
    };

    const megadetectorInfo = {
        name: 'MegaDetector',
        description: 'MegaDetector is an AI model that identifies animals, people, and vehicles in camera trap images.',
        full_description: `Conservation biologists invest a huge amount of time reviewing camera trap images, and a huge fraction of that time is spent reviewing images they aren't interested in. This primarily includes empty images, but for many projects, images of people and vehicles are also "noise", or at least need to be handled separately from animals.
                            "Machine learning can accelerate this process, letting biologists spend their time on the images that matter.
                            To this end, this page hosts a model we've trained - called "MegaDetector" - to detect animals, people, and vehicles in camera trap images. It does not identify animals to the species level, it just finds them.`,
        logo: 'https://camo.githubusercontent.com/1ee7509ad47f8cbc02dd27f8405b8064ce3507fd454f187c7fb7e22da36ed0a3/68747470733a2f2f692e696d6775722e636f6d2f464354627147482e706e67',
        image: 'https://camo.githubusercontent.com/1ee7509ad47f8cbc02dd27f8405b8064ce3507fd454f187c7fb7e22da36ed0a3/68747470733a2f2f692e696d6775722e636f6d2f464354627147482e706e67',
        link: '/megadetector',
        tags: ['Object Detection', 'Filtering']
    };

    const trapperInfo = {
        name: 'Trapper',
        description: 'TRAPPER is an open-source, Python, Django and Docker-based web application designed to manage camera trapping projects.',
        full_description: `TRAPPER is an open-source, Python, Django and Docker-based web application designed to manage camera trapping projects.
                            \n• Open-source and free for use in research, academia, or wildlife conservation projects (GPLv3).
                            \n• Offers a spatially-enabled database backend.
                            \n• Capable of handling both pictures and videos.
                            \n• Features a flexible model for AI-based and expert-based classifications.
                            \n• Promotes the Camtrap DP standard and encourages data re-use.
                            \n• Supports collaborative work on a project.`,
        logo: 'https://gitlab.com/trapper-project/trapper/-/raw/master/trapper/trapper-project/trapper/apps/common/static/images/logo/logo.png',
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