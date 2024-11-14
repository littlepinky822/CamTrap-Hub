import React, { useState } from 'react'
import Preview from './Preview';

function ApplicationCard({ appInfo }) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <div className="card bg-base-100 w-96 shadow-xl">
            <figure className="w-full h-48 bg-base-200">
                {!imageError ? (
                    <img
                        src={appInfo.image}
                        alt={appInfo.display_name}
                        onError={handleImageError}
                    />
                ) : (
                    <div className="avatar placeholder">
                        <div className="bg-accent text-neutral-content w-40 rounded-full">
                            <span className="text-3xl text-primary text-center">{appInfo.display_name}</span>
                        </div>
                    </div>
                )}
            </figure>
            <div className="card-body">
                <h2 className="card-title">{appInfo.display_name}</h2>
                <p>{appInfo.description}</p>
                <div className="card-actions justify-between items-center">
                    <div>
                        {appInfo.tags.map((tag, index) => (
                            <div key={index} className="badge badge-outline mr-2">{tag}</div>
                        ))}
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsPreviewOpen(true)}>Details</button>
                </div>
            </div>
            {isPreviewOpen && <Preview appInfo={appInfo} onClose={() => setIsPreviewOpen(false)} />}
        </div>
    )
}

export default ApplicationCard;
