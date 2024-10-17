import React, { useContext, useState, useEffect } from 'react';
import NavBar from './NavBar';
import { ThemeContext } from '../ThemeContext';
import { useAuth } from './AuthContext';

const Profile = () => {
    const { theme, setTheme } = useContext(ThemeContext);
    const { currentUser, checkLoginStatus } = useAuth();
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        organisation: '',
        title: ''
    });

    useEffect(() => {
        if (currentUser) {
            setProfileData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                organisation: currentUser.organisation || '',
                title: currentUser.title || ''
            });
        }
    }, [currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Profile data to update:', profileData);
        try {
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Profile data to update:', data);
        }
        catch(error) {
            console.error('Error: ', error);
        }
        // After updating, you might want to refresh the user data
        await checkLoginStatus();
    };

    return (
        <div className="min-h-screen bg-base">
            <NavBar theme={theme} setTheme={setTheme}/>
            <div className="container mx-auto px-4 py-8">
                <div className="bg-base-200 shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-primary">Profile Settings</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <label className="form-control w-full max-w-xs">
                                <div className="label">
                                    <span className="label-text">Name</span>
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    value={profileData.username}
                                    onChange={handleInputChange}
                                    className="input input-bordered w-full max-w-xs"
                                />
                            </label>
                            <label className="form-control w-full max-w-xs">
                                <div className="label">
                                    <span className="label-text">Email</span>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleInputChange}
                                    className="input input-bordered w-full max-w-xs"
                                />
                            </label>
                            <label className="form-control w-full max-w-xs">
                                <div className="label">
                                    <span className="label-text">Organisation</span>
                                </div>
                                <input
                                    type="text"
                                    name="organisation"
                                    value={profileData.organisation}
                                    onChange={handleInputChange}
                                    className="input input-bordered w-full max-w-xs"
                                />
                            </label>
                            <label className="form-control w-full max-w-xs">
                                <div className="label">
                                    <span className="label-text">Title</span>
                                </div>
                                <input
                                    type="text"
                                    name="title"
                                    value={profileData.title}
                                    onChange={handleInputChange}
                                    className="input input-bordered w-full max-w-xs"
                                />
                            </label>
                        </div>
                        <button type="submit" className="btn btn-primary">Update</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;