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

// Common resolution strategies
const RESOLUTION_STRATEGIES = [
  {
    pattern: /price|cost|expensive/i,
    suggestions: [
      "Review pricing strategy and consider promotional offers",
      "Highlight value proposition more clearly in marketing materials",
      "Consider introducing a tiered pricing model"
    ]
  },
  {
    pattern: /delivery|shipping|arrived late/i,
    suggestions: [
      "Audit delivery partners and service level agreements",
      "Implement order tracking notifications",
      "Consider offering expedited shipping options"
    ]
  },
  {
    pattern: /app|ui|ux|interface/i,
    suggestions: [
      "Conduct usability testing sessions",
      "Review mobile app performance metrics",
      "Gather more detailed UX feedback through surveys"
    ]
  },
  {
    pattern: /customer service|support/i,
    suggestions: [
      "Implement customer service training program",
      "Add live chat support option",
      "Create a knowledge base for common issues"
    ]
  }
];

const FeedbackDashboard: React.FC = () => {
  const [feedbackData, setFeedbackData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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

  // Generate suggestions based on feedback analysis
  useEffect(() => {
    if (feedbackData.length > 0) {
      const recentFeedback = feedbackData
        .slice(-100) // Last 100 feedback items
        .filter(f => f.sentiment === 'negative' || f.sentiment === 'neutral');
      
      const commonIssues: Record<string, number> = {};
      
      // Count occurrences of common issues
      recentFeedback.forEach(feedback => {
        RESOLUTION_STRATEGIES.forEach(strategy => {
          if (strategy.pattern.test(feedback.feedbackText)) {
            const key = strategy.pattern.toString();
            commonIssues[key] = (commonIssues[key] || 0) + 1;
          }
        });
      });
      
      // Sort by most frequent issues
      const sortedIssues = Object.entries(commonIssues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Top 3 issues
      
      // Generate suggestions
      const generatedSuggestions: string[] = [];
      
      sortedIssues.forEach(([pattern]) => {
        const strategy = RESOLUTION_STRATEGIES.find(s => s.pattern.toString() === pattern);
        if (strategy) {
          generatedSuggestions.push(...strategy.suggestions.slice(0, 1)); // Take top suggestion for each issue
        }
      });
      
      // Fallback suggestions if no patterns matched
      if (generatedSuggestions.length === 0) {
        generatedSuggestions.push(
          "Consider sending a customer satisfaction survey to gather more detailed feedback",
          "Review recent product changes that might have affected user experience",
          "Analyze positive feedback to identify strengths to emphasize"
        );
      }
      
      setSuggestions(generatedSuggestions.slice(0, 3)); // Limit to 3 suggestions
    }
  }, [feedbackData]);

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
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
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

      {/* Suggestions Engine Section */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">Actionable Suggestions</h2>
        <div className="space-y-4">
          {suggestions.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-gray-700">
                  {suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No suggestions available. Not enough data to analyze.</p>
          )}
        </div>
        
        <button 
          onClick={() => {
            const recentFeedback = feedbackData.slice(-100);
            const newSuggestions = generateSuggestions(recentFeedback);
            setSuggestions(newSuggestions);
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Regenerate Suggestions
        </button>
      </div>
    </div>
  );
};

// Helper function to generate suggestions
function generateSuggestions(recentFeedback: any[]): string[] {
  const negativeFeedback = recentFeedback.filter(f => f.sentiment === 'negative' || f.sentiment === 'neutral');
  const commonIssues: Record<string, number> = {};
  
  negativeFeedback.forEach(feedback => {
    RESOLUTION_STRATEGIES.forEach(strategy => {
      if (strategy.pattern.test(feedback.feedbackText)) {
        const key = strategy.pattern.toString();
        commonIssues[key] = (commonIssues[key] || 0) + 1;
      }
    });
  });
  
  const sortedIssues = Object.entries(commonIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  const generatedSuggestions: string[] = [];
  
  sortedIssues.forEach(([pattern]) => {
    const strategy = RESOLUTION_STRATEGIES.find(s => s.pattern.toString() === pattern);
    if (strategy) {
      generatedSuggestions.push(...strategy.suggestions.slice(0, 1));
    }
  });
  
  if (generatedSuggestions.length === 0) {
    generatedSuggestions.push(
      "Consider sending a customer satisfaction survey to gather more detailed feedback",
      "Review recent product changes that might have affected user experience",
      "Analyze positive feedback to identify strengths to emphasize"
    );
  }
  
  return generatedSuggestions.slice(0, 3);
}

export default FeedbackDashboard;