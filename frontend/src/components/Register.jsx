import React, { useState } from 'react';
import NavBar from './NavBar';

const Register = () => {
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                body: formData
            })
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                setSuccess(true);
            }
            window.location.href = '/login';
        }
        catch(error) {
            console.error('Error: ', error);
        }
    }

    return (
        <div>
            <NavBar />
            <div className="min-h-screen bg-base">
                <div className="container mx-auto px-4 py-8 flex flex-col justify-center items-center h-screen">
                    <h2 className="text-2xl font-bold mb-4">Sign up for an account</h2>
                    <div className="card w-96 bg-base-100 shadow-xl">
                        <div className="card-body">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="form-control">
                                    <label className="label">Email</label>
                                    <input type="text" name="email" className="input input-bordered" />
                                    <label className="label">Organisation/Company</label>
                                    <input type="text" name="organisation" className="input input-bordered" />
                                    <label className="label">Username</label>
                                    <input type="text" name="username" className="input input-bordered" />
                                    <label className="label">Password</label>
                                    <input type="password" name="password" className="input input-bordered" />
                                </div>
                                <div className="card-actions justify-center mt-4">
                                    <button type="submit" className="btn btn-secondary w-full">Register</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    {success && <p className="text-center mt-4">Account created successfully! Back to <a href="/login" className="text-secondary font-bold">Login</a></p>}
                    <p className="text-center mt-4">Already have an account? <a href="/login" className="text-secondary font-bold">Login here</a></p>
                </div>
            </div>
        </div>
    )
}

export default Register;