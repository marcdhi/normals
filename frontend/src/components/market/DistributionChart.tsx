import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DistributionChartProps {
  market: { mean: number; sigma:number };
  proposed: { mu: number; sigma: number };
}

// Function to calculate the Probability Density Function (PDF) of a normal distribution
const pdf = (x: number, mu: number, sigma: number): number => {
  if (sigma === 0) return x === mu ? Infinity : 0;
  const exponent = -((x - mu) ** 2) / (2 * sigma ** 2);
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
};

const DistributionChart: React.FC<DistributionChartProps> = ({ market, proposed }) => {
  const generateChartData = () => {
    if (!market) return [];
    
    // Determine the range for the x-axis
    const rangeSigma = Math.max(market.sigma, proposed.sigma);
    const rangeMean = market.mean;
    const minX = rangeMean - 4 * rangeSigma;
    const maxX = rangeMean + 4 * rangeSigma;
    
    const data = [];
    const steps = 100;
    const stepSize = (maxX - minX) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = minX + i * stepSize;
      data.push({
        price: x,
        market: pdf(x, market.mean, market.sigma),
        proposed: pdf(x, proposed.mu, proposed.sigma),
      });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="price" 
          type="number" 
          domain={['dataMin', 'dataMax']} 
          tickFormatter={(value) => `$${value.toFixed(0)}`}
          label={{ value: 'Solana Price ($)', position: 'insideBottom', offset: -15 }}
          stroke="#9ca3af"
        />
        <YAxis 
          tickFormatter={(value) => value.toFixed(2)} 
          axisLine={false}
          tickLine={false}
          stroke="#9ca3af"
        />
        <Tooltip
          formatter={(value: number, name) => [value.toFixed(4), name]}
          labelFormatter={(label) => `Price: $${label.toFixed(2)}`}
        />
        <Legend verticalAlign="top" height={36}/>
        <Line type="monotone" dataKey="market" stroke="#ff69b4" strokeWidth={2} dot={false} name="Market Consensus"/>
        <Line type="monotone" dataKey="proposed" stroke="#79c600" strokeWidth={2} dot={false} name="Your Proposal" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DistributionChart;
