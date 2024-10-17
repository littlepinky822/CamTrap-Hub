import {
    Chart as ChartJS,
    Filler,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import TitleCard from './TitleCard';
import { useState, useEffect } from 'react';
  
ChartJS.register(ArcElement, Tooltip, Legend,
    Tooltip,
    Filler,
    Legend);
  
function DoughnutChart(){
    const [usageData, setUsageData] = useState({ usage_data: [], total_runtime: 0 });
  
    useEffect(() => {
        const fetchUsageData = async () => {
            try {
                const response = await fetch('/api/apps/usage');
                const data = await response.json();
                setUsageData(data);
            } catch (error) {
                console.error('Error fetching usage data:', error);
            }
        };

        fetchUsageData();
    }, []);
  
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        const hours = (context.raw).toFixed(2);
                        label += `${hours} hours`;
                        return label;
                    }
                }
            }
        },
    };
    
    const labels = usageData.usage_data.map(item => item.app_name)
    
    const data = {
        labels,
        datasets: [
            {
                label: 'Runtime (hours)',
                data: usageData.usage_data.map(item => item.runtime_seconds / 3600),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            }
        ],
    };
  
    return(
        <TitleCard title={"Usage Time by App"}>
            <Doughnut options={options} data={data} />
        </TitleCard>
    )
}
  
export default DoughnutChart
