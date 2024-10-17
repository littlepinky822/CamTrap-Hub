import React, { useContext } from 'react';
import NavBar from './NavBar';
import { ThemeContext } from '../ThemeContext';

const About = () => {
    const { theme, setTheme } = useContext(ThemeContext);
    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            {/* Hero */}
            <div className="hero bg-base-100">
                <div className="hero-box bg-primary w-10/12 rounded-box h-[50vh] flex items-center justify-center">
                    <div className="hero-content text-center w-7/12">
                        <div className="max-w-full">
                            <h1 className="text-8xl font-bold text-base-100">About Us</h1>
                            <p className="py-6 text-xl text-base-100">
                                Welcome to the CamTrap Hub: Where Wildlife Meets Tech!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-8">
                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <p className="text-lg text-primary mb-6">
                    Does the journey from setting up camera traps to analyzing wildlife data seem daunting? Say hello to CamTrap Hub—your ultimate ally in the intricate world of wildlife research. With us, managing camera traps becomes not just manageable but downright enjoyable! Our platform brings together a suite of applications meticulously designed to support every phase of camera trap data processing.
                    </p>
                    {/* Timeline - Stages of camera trap data processing */}
                    <h2 className="text-2xl font-bold mb-6 text-primary">This probably is your typical workflow:</h2>
                    <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical mt-10">
                        <li>
                            <div className="timeline-middle">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-5 w-5 text-primary">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd" />
                            </svg>
                            </div>
                            <div className="timeline-start mb-10 md:text-end">
                                <div className="text-lg font-black text-primary">Data Retrieval</div>
                                <p className="text-base-content">Retrieve images and related data from camera trap. Store the data in a database for further use. These data include project metadata, media files, deployments information, and observation metadata.</p>
                            </div>
                            <hr />
                        </li>
                        <li>
                            <hr />
                            <div className="timeline-middle">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-5 w-5 text-primary">
                                    <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="timeline-end mb-10">
                                <div className="text-lg font-black text-primary">Data Review and Organisation</div>
                                <p className="text-base-content">Review raw data from camera traps, files may need to be labelled and organised into folders. The most common workflow is to categorise images into separate folders per locality or time period.</p>
                            </div>
                            <hr />
                        </li>
                        <li>
                            <hr />
                            <div className="timeline-middle">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-5 w-5 text-primary">
                                    <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="timeline-start mb-10 md:text-end">
                                <div className="text-lg font-black text-primary">Identification and Annotation</div>
                                <p className="text-base-content">Identify species and annotate images. This stage is often the most time-consuming one. Image annotation such as extraction of metadata from images can be performed completely manually, but is becoming more facilitated by technology especially with the development of AI.</p>
                            </div>
                            <hr />
                        </li>
                        <li>
                            <hr />
                            <div className="timeline-middle">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-5 w-5 text-primary">
                                    <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="timeline-end mb-10">
                                <div className="text-lg font-black text-primary">Data Analysis</div>
                                <p className="text-base-content">Analyse the data to extract information about species presence and activity and answer ecological and biological questions.</p>
                            </div>
                            <hr />
                        </li>
                        <li>
                            <hr />
                            <div className="timeline-middle">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-5 w-5 text-primary">
                                    <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="timeline-start mb-10 md:text-end">
                                <div className="text-lg font-black text-primary">Data Sharing and Publication</div>
                                <p className="text-base-content">Share and publish the data for scientific research and conservation efforts. Data publication is the process of making biodiversity data open and FAIR, which guarantees that your camera trap data can be found, accessed, integrated and reused.</p>
                            </div>
                        </li>
                    </ul>
                    <p className="text-lg text-primary mt-6">At CamTrap Hub, we understand that not everyone speaks the intricate language of programming. That's why we've curated tools that require zero coding skills, all equipped with intuitive interfaces that make wildlife data analysis as natural as observing the wild itself. Whether you're a veteran researcher or a budding naturalist, our hub turns complex data into compelling insights with just a few clicks. Embrace the simplicity of our all-in-one platform, where your focus shifts from figuring out software to uncovering the secrets of the natural world.</p>
                </div>
            </div>
        </div>
    );
};

export default About;