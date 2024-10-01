import React, { useState } from 'react';
import Datepicker from "react-tailwindcss-datepicker"; 
import DoughnutChart from './dashboard/DoughnutChart';
import LineChart from './dashboard/LineChart';

function Dashboard() {
    const [dateValue, setDateValue] = useState({ 
        startDate: new Date(), 
        endDate: new Date() 
    }); 
    
    const handleDatePickerValueChange = (newValue) => {
        console.log("newValue:", newValue); 
        setDateValue(newValue); 
    }

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
                {/* Charts */}
                
                <div className="grid lg:grid-cols-2 mt-0 grid-cols-1 gap-6">
                    <DoughnutChart />
                    <LineChart />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;