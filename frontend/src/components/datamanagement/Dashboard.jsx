import React, { useState, useEffect } from 'react';
import Datepicker from "react-tailwindcss-datepicker"; 
import DoughnutChart from './dashboard/DoughnutChart';
import LineChart from './dashboard/LineChart';
import DashboardStats from './dashboard/DashboardStats';

/**
 * Reference: All components for the dashboard are from the following repository
 * Name: daisyui-admin-dashboard-template
 * Repo: https://github.com/robbins23/daisyui-admin-dashboard-template/tree/master
 * Last Accessed Date: 13 Nov 2024
 */

function Dashboard() {
    const [dateValue, setDateValue] = useState({ 
        startDate: new Date(), 
        endDate: new Date() 
    }); 
    
    const handleDatePickerValueChange = (newValue) => {
        console.log("newValue:", newValue); 
        setDateValue(newValue); 
    }

    const [userNumber, setUserNumber] = useState("0");
    const [dataNumber, setDataNumber] = useState("0");

    useEffect(() => {
        const fetchUserNumber = async () => {
            try {
                const response = await fetch('/api/user/number');
                const data = await response.json();
                setUserNumber(data.user_number);
            } catch (error) {
                console.error("Error fetching user number:", error);
            }
        };
        fetchUserNumber();
    }, []);

    useEffect(() => {
        const fetchDataNumber = async () => {
            try {
                const response = await fetch('/api/data/number');
                const data = await response.json();
                setDataNumber(data.total_files);
            } catch (error) {
                console.error("Error fetching data number:", error);
            }
        }
        fetchDataNumber();
    }, []);

    const statsData = [
        {title : "Total Users", value : userNumber, description : "person"},
        {title : "Total Files in Data Space", value : dataNumber, description : "Images/Videos"}
    ]

    return (
        <div>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-4 text-center text-primary">Insights</h1>
                <Datepicker 
                    containerClassName="w-72" 
                    value={dateValue} 
                    theme={"light"}
                    inputClassName="input input-bordered w-72" 
                    popoverDirection={"down"}
                    toggleClassName="invisible"
                    onChange={handleDatePickerValueChange} 
                    showShortcuts={true} 
                    primaryColor={"white"} 
                    popoverClassName="z-50"
                /> 
                {/* Overview Stats */}
                <div className="grid lg:grid-cols-4 mt-2 md:grid-cols-1 grid-cols-1 gap-6">
                    {
                        statsData.map((d, k) => {
                            return (
                                <DashboardStats key={k} {...d} colorIndex={k}/>
                            )
                        })
                    }
                </div>
                {/* Charts */}
                <div className="grid lg:grid-cols-2 mt-0 grid-cols-1 gap-6">
                    <DoughnutChart />  {/* docker usage chart */}
                    <LineChart />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;