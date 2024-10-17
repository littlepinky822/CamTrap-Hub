import React, { useState } from 'react';
import NavBar from './NavBar';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [success, setSuccess] = useState(false);
    const [alert, setAlert] = useState("");
    const { isLoggedIn, checkLoginStatus } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        if (username.length === 0) {
            setAlert('Username cannot be empty');
        }
        else if (password.length === 0) {
            setAlert('Password cannot be empty');
        }
        else {
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setSuccess(true);
                    setAlert('');
                    checkLoginStatus();
                    navigate('/');
                }
            }
            catch(error) {
                setAlert('Error: ' + error.message);
            }
        }
    }

    if (isLoggedIn) {
        navigate('/');
        return null;
    }

    return (
        <div>
            <NavBar />
            <div className="min-h-screen bg-base">
                <div className="container mx-auto px-4 py-8 flex flex-col justify-center items-center h-screen">
                        <h2 className="text-2xl font-bold mb-4">Sign in to your account</h2>
                        <div className="card w-96 bg-base-100 shadow-xl">
                        <div className="card-body">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="form-control">
                                    <label className="label" htmlFor="username">Username</label>
                                    <input type="text" name="username" className="input input-bordered" />
                                    <label className="label" htmlFor="password">Password</label>
                                    <input type="password" name="password" className="input input-bordered" />
                                </div>
                                {alert && 
                                    <div role="alert" className="alert alert-error">
                                        <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 shrink-0 stroke-current"
                                        fill="none"
                                        viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{alert}</span>
                                    </div>
                                }
                                <div className="card-actions justify-center mt-4">
                                    <button type="submit" className="btn btn-secondary w-full">Sign in</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    {success && <p className="text-center mt-4">Login successful! Back to <a href="/" className="text-secondary font-bold">Home</a></p>}
                    <p className="text-center mt-4">Don't have an account? <a href="/register" className="text-secondary font-bold">Register</a></p>
                </div>
            </div>
        </div>
    )
}

export default Login;