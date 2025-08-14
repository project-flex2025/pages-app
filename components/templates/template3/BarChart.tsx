import React from "react";
import { TemplateBarChartProps } from "../index";
import {
  
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line
} from "recharts";

const Template2BarChart: React.FC<TemplateBarChartProps> = ({
  widgetData,
  formattedData,
  loading,
  error,
}) => {
  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
  
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!formattedData.length) return <div className="alert alert-info">No data to display</div>;

  return (
    <div className="card custom-card">
      <div className="card-header">
        <h5 className="mb-0 text-center">{widgetData?.config?.title}</h5>
      </div>
      <hr className="m-0"/>
      <div className="card-body p-4">
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart
            data={formattedData}
            margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={widgetData?.config?.X_value}
              angle={-45}
              textAnchor="end"
              height={70}
              tick={{ fill: '#6c757d' }}
            />
            <YAxis tick={{ fill: '#6c757d' }} />
            <Tooltip 
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            {widgetData?.config?.bars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                fill={bar.color}
                name={bar.name || bar.dataKey}
                barSize={30}
              />
            ))}
            {/* Optional: Add a line to show trends */}
            <Line type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Template2BarChart;