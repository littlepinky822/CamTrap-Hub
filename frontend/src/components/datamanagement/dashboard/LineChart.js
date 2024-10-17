import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import TitleCard from './TitleCard';
  
ChartJS.register(
CategoryScale,
LinearScale,
PointElement,
LineElement,
Title,
Tooltip,
Filler,
Legend
);
  
function LineChart(){

const options = {
    responsive: true,
    plugins: {
    legend: {
        position: 'top',
    },
    },
};
  
    
const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

const data = {
labels,
datasets: [
    {
    fill: false,
    label: 'Lion',
    data: labels.map(() => { return Math.random() * 100 + 500 }),
    borderColor: 'rgb(53, 162, 235)',
    backgroundColor: 'rgba(53, 162, 235, 0.5)',
    },
    {
        fill: false,
        label: 'Leopard',
        data: labels.map(() => { return Math.random() * 100 + 500 }),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
    },
],
};
    
  
    return(
    <TitleCard title={"Activity Pattern"} >
        <Line data={data} options={options}/>
    </TitleCard>
    )
}
  
  
export default LineChart