import React from 'react';
import { Calendar } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Custom chart colors for PIU premium theme
const PIU_COLORS = {
  primary: {
    blue: 'rgba(59, 130, 246, 0.9)',      // Blue-500
    blueBorder: 'rgba(59, 130, 246, 1)',
    purple: 'rgba(147, 51, 234, 0.9)',    // Purple-600
    purpleBorder: 'rgba(147, 51, 234, 1)',
    pink: 'rgba(236, 72, 153, 0.9)',      // Pink-500
    pinkBorder: 'rgba(236, 72, 153, 1)',
    emerald: 'rgba(16, 185, 129, 0.9)',   // Emerald-500
    emeraldBorder: 'rgba(16, 185, 129, 1)',
    teal: 'rgba(20, 184, 166, 0.9)',      // Teal-500
    tealBorder: 'rgba(20, 184, 166, 1)',
    yellow: 'rgba(245, 158, 11, 0.9)',    // Amber-500
    yellowBorder: 'rgba(245, 158, 11, 1)',
    orange: 'rgba(249, 115, 22, 0.9)',    // Orange-500
    orangeBorder: 'rgba(249, 115, 22, 1)',
  },
  dark: {
    background: 'rgba(30, 41, 59, 0.95)', // Slate-800
    text: 'rgba(241, 245, 249, 1)',       // Slate-100
    grid: 'rgba(148, 163, 184, 0.2)',     // Slate-400 with low opacity
    border: 'rgba(71, 85, 105, 0.3)',     // Slate-600 with low opacity
  }
};

export const TaskStatusChart = ({ stats }) => {
  // Ensure stats object exists and has required properties
  const safeStats = stats || { todo: 0, inProgress: 0, completed: 0 };
  
  const data = {
    labels: ['To Do', 'In Progress', 'Completed'],
    datasets: [
      {
        label: 'Tasks',
        data: [safeStats.todo || 0, safeStats.inProgress || 0, safeStats.completed || 0],
        backgroundColor: [
          PIU_COLORS.primary.yellow,      // Amber for to do
          PIU_COLORS.primary.blue,        // Blue for in progress
          PIU_COLORS.primary.emerald,     // Emerald for completed
        ],
        borderColor: [
          PIU_COLORS.primary.yellowBorder,
          PIU_COLORS.primary.blueBorder,
          PIU_COLORS.primary.emeraldBorder,
        ],
        borderWidth: 3,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 40,
        maxBarThickness: 50,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(236, 72, 153, 1)', // Pink color for better visibility
          font: {
            size: 13,
            weight: '600',
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: false, // Removed as we have custom header in dashboard
      },
      tooltip: {
        backgroundColor: PIU_COLORS.dark.background,
        titleColor: PIU_COLORS.dark.text,
        bodyColor: PIU_COLORS.dark.text,
        borderColor: PIU_COLORS.dark.border,
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: PIU_COLORS.dark.text,
          font: {
            size: 12,
            weight: '500',
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 8,
        },
        grid: {
          color: PIU_COLORS.dark.grid,
          lineWidth: 1,
          drawBorder: false,
        },
        border: {
          color: PIU_COLORS.dark.border,
          width: 1,
        },
      },
      x: {
        ticks: {
          color: PIU_COLORS.dark.text,
          font: {
            size: 12,
            weight: '500',
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 8,
        },
        grid: {
          display: false,
        },
        border: {
          color: PIU_COLORS.dark.border,
          width: 1,
        },
      },
    },
    elements: {
      bar: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
  };

  return (
    <div className="relative h-80 w-full">
      <Bar data={data} options={options} />
    </div>
  );
};

export const ProductivityChart = ({ stats }) => {
  const data = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [stats.completed, stats.total - stats.completed],
        backgroundColor: [
          PIU_COLORS.primary.emerald,     // Green for completed
          PIU_COLORS.dark.grid,           // Slate for remaining
        ],
        borderColor: [
          PIU_COLORS.primary.emeraldBorder,
          PIU_COLORS.dark.border,
        ],
        borderWidth: 3,
        cutout: '70%',
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: PIU_COLORS.dark.text,
          font: {
            size: 12,
            weight: '600',
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: PIU_COLORS.dark.background,
        titleColor: PIU_COLORS.dark.text,
        bodyColor: PIU_COLORS.dark.text,
        borderColor: PIU_COLORS.dark.border,
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        padding: 12,
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
  };

  return (
    <div className="relative h-80 w-full">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {stats.productivity}%
          </div>
          <div className="text-sm font-semibold text-slate-300">
            Productivity
          </div>
        </div>
      </div>
    </div>
  );
};

export const WeeklyProgressChart = ({ weeklyData = null }) => {
  // Use provided weekly data or show empty chart
  const data = weeklyData || [
    { day: 'Mon', completed: 0, created: 0 },
    { day: 'Tue', completed: 0, created: 0 },
    { day: 'Wed', completed: 0, created: 0 },
    { day: 'Thu', completed: 0, created: 0 },
    { day: 'Fri', completed: 0, created: 0 },
    { day: 'Sat', completed: 0, created: 0 },
    { day: 'Sun', completed: 0, created: 0 },
  ];

  // Check if there's any activity in the week
  const hasActivity = data.some(day => day.completed > 0 || day.created > 0);

  const chartData = {
    labels: data.map(item => item.day),
    datasets: [
      {
        label: 'Tasks Completed',
        data: data.map(item => item.completed),
        backgroundColor: PIU_COLORS.primary.emerald,
        borderColor: PIU_COLORS.primary.emeraldBorder,
        borderWidth: 3,
        borderRadius: 8,
        barThickness: 25,
        maxBarThickness: 30,
      },
      {
        label: 'Tasks Created',
        data: data.map(item => item.created),
        backgroundColor: PIU_COLORS.primary.blue,
        borderColor: PIU_COLORS.primary.blueBorder,
        borderWidth: 3,
        borderRadius: 8,
        barThickness: 25,
        maxBarThickness: 30,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: PIU_COLORS.dark.text,
          font: {
            size: 13,
            weight: '600',
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: PIU_COLORS.dark.background,
        titleColor: PIU_COLORS.dark.text,
        bodyColor: PIU_COLORS.dark.text,
        borderColor: PIU_COLORS.dark.border,
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: PIU_COLORS.dark.text,
          font: {
            size: 12,
            weight: '500',
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 8,
        },
        grid: {
          color: PIU_COLORS.dark.grid,
          lineWidth: 1,
          drawBorder: false,
        },
        border: {
          color: PIU_COLORS.dark.border,
          width: 1,
        },
      },
      x: {
        ticks: {
          color: PIU_COLORS.dark.text,
          font: {
            size: 12,
            weight: '500',
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 8,
        },
        grid: {
          display: false,
        },
        border: {
          color: PIU_COLORS.dark.border,
          width: 1,
        },
      },
    },
    elements: {
      bar: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
  };

  // If no activity in the week, show a premium empty state
  if (!hasActivity) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-400">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-300 mb-2">No Activity This Week</p>
          <p className="text-sm text-slate-400">Create or complete tasks to see your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-80 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};
