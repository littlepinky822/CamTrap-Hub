import React from 'react';

function NavBar() {
    return (
        <div className='navbar bg-base'>
            <div className='flex-1'>
                <a className='btn btn-ghost text-2xl' onClick={() => window.location.href = '/'}>CamTrap Hub</a>
            </div>
            <div className='flex-none'>
                <ul className="menu menu-horizontal px-1">
                    <li><a>About</a></li>
                    <li><a>Apps</a></li>
                </ul>
            </div>
        </div>
    );
}

export default NavBar;