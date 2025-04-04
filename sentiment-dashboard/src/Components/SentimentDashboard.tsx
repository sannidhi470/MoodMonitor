import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const FeedbackDashboard: React.FC = () => {
  const [feedbackData, setFeedbackData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://97kd65oeg6.execute-api.us-east-2.amazonaws.com/dev');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        const parsedBody = JSON.parse(data.body);
        setFeedbackData(parsedBody.feedback_data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Process data for bar chart (sentiment by source)
  const processBarChartData = () => {
    const sources = ['App', 'Web', 'Email'];
    const sentiments = ['positive', 'negative', 'neutral'];
    
    const sourceSentimentCount: Record<string, Record<string, number>> = {};
    sources.forEach(source => {
      sourceSentimentCount[source] = {
        positive: 0,
        negative: 0,
        neutral: 0
      };
    });

    feedbackData.forEach(feedback => {
      if (sources.includes(feedback.source) && sentiments.includes(feedback.sentiment)) {
        sourceSentimentCount[feedback.source][feedback.sentiment]++;
      }
    });

    return {
      labels: sources,
      datasets: [
        {
          label: 'Positive',
          data: sources.map(source => sourceSentimentCount[source].positive),
          backgroundColor: '#4CAF50',
          borderColor: '#388E3C',
          borderWidth: 1
        },
        {
          label: 'Negative',
          data: sources.map(source => sourceSentimentCount[source].negative),
          backgroundColor: '#F44336',
          borderColor: '#D32F2F',
          borderWidth: 1
        },
        {
          label: 'Neutral',
          data: sources.map(source => sourceSentimentCount[source].neutral),
          backgroundColor: '#FFC107',
          borderColor: '#FFA000',
          borderWidth: 1
        }
      ]
    };
  };

  // Process data for time series chart (sentiment over time)
  const processTimeSeriesData = () => {
    // Group feedback by date and sentiment
    const dateSentimentMap: Record<string, Record<string, number>> = {};

    feedbackData.forEach(feedback => {
      const date = new Date(feedback.timestamp).toLocaleDateString();
      
      if (!dateSentimentMap[date]) {
        dateSentimentMap[date] = {
          positive: 0,
          negative: 0,
          neutral: 0
        };
      }

      if (feedback.sentiment === 'positive') {
        dateSentimentMap[date].positive++;
      } else if (feedback.sentiment === 'negative') {
        dateSentimentMap[date].negative++;
      } else {
        dateSentimentMap[date].neutral++;
      }
    });

    // Sort dates chronologically
    const sortedDates = Object.keys(dateSentimentMap).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Positive',
          data: sortedDates.map(date => dateSentimentMap[date].positive),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Negative',
          data: sortedDates.map(date => dateSentimentMap[date].negative),
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Neutral',
          data: sortedDates.map(date => dateSentimentMap[date].neutral),
          borderColor: '#FFC107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  const barChartData = processBarChartData();
  const timeSeriesData = processTimeSeriesData();

  if (loading) return <div className="p-4">Loading sentiment data...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      {/* Bar Chart Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Sentiment Analysis by Source</h2>
        <div className="h-96">
          <Bar 
            data={barChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    boxWidth: 12,
                    padding: 20,
                    usePointStyle: true
                  }
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.dataset.label || '';
                      const value = context.raw as number;
                      const total = barChartData.datasets.reduce((sum, dataset) => 
                        sum + (dataset.data[context.dataIndex] as number), 0);
                      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Feedback Source',
                    font: {
                      weight: 'bold'
                    }
                  }
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Responses',
                    font: {
                      weight: 'bold'
                    }
                  },
                  ticks: {
                    precision: 0
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Time Series Chart Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Feedback Volume Over Time</h2>
        <div className="h-96">
          <Line
            data={timeSeriesData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    boxWidth: 12,
                    padding: 20,
                    usePointStyle: true
                  }
                }
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Date',
                    font: {
                      weight: 'bold'
                    }
                  }
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Feedback Items',
                    font: {
                      weight: 'bold'
                    }
                  },
                  ticks: {
                    precision: 0
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Feedback Table Section */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">Individual Feedback Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback Text</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbackData.map((feedback, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(feedback.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feedback.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      feedback.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                      feedback.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {feedback.sentiment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(parseFloat(feedback.sentimentScore) * 100)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {feedback.feedbackText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;