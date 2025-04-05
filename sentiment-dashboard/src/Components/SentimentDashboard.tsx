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

// Enhanced resolution strategies with more actionable items
const RESOLUTION_STRATEGIES = [
  {
    pattern: /price|cost|expensive/i,
    suggestions: [
      "Implement a limited-time 15% discount for customers mentioning pricing issues",
      "Create a value comparison chart to highlight competitive advantages by Friday",
      "Add a pricing FAQ section explaining your value proposition within 3 days"
    ]
  },
  {
    pattern: /delivery|shipping|arrived late/i,
    suggestions: [
      "Contact shipping partners within 24 hours to resolve current delays",
      "Send apology emails with tracking updates to affected customers today",
      "Offer free expedited shipping on next order for delayed packages"
    ]
  },
  {
    pattern: /app|ui|ux|interface/i,
    suggestions: [
      "Schedule usability testing sessions with 5 customers this week",
      "Create quick-start guide videos for confusing features by EOW",
      "Implement contextual tooltips for complex interface elements"
    ]
  },
  {
    pattern: /customer service|support/i,
    suggestions: [
      "Implement mandatory sensitivity training for staff by Friday",
      "Launch live chat support with 5-minute response SLA this week",
      "Create standardized response templates for common issues"
    ]
  }
];

const FALLBACK_SUGGESTIONS = [
  "Schedule customer interviews this week to identify pain points",
  "Review analytics for customer journey drop-off points",
  "Conduct competitive analysis for similar product offerings"
];

const FeedbackDashboard: React.FC = () => {
  const [feedbackData, setFeedbackData] = useState<any[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;
  
  // Filter states
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const availableSources = ['App', 'Web', 'Email'];

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
        setFilteredFeedback(parsedBody.feedback_data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (feedbackData.length > 0) {
      let filtered = [...feedbackData];
      
      // Apply date range filter
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        filtered = filtered.filter(feedback => {
          const feedbackDate = new Date(feedback.timestamp);
          return feedbackDate >= startDate && feedbackDate <= endDate;
        });
      }
      
      // Apply source filter
      if (selectedSources.length > 0) {
        filtered = filtered.filter(feedback => 
          selectedSources.includes(feedback.source)
        );
      }
      
      setFilteredFeedback(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    }
  }, [dateRange, selectedSources, feedbackData]);

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

    filteredFeedback.forEach(feedback => {
      if (sources.includes(feedback.source)) {
        if (sentiments.includes(feedback.sentiment)) {
          sourceSentimentCount[feedback.source][feedback.sentiment]++;
        }
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

 
  // Process data for time series chart (sentiment by hour)
  const processTimeSeriesData = () => {
    const hourSentimentMap: Record<string, Record<string, number>> = {};

    filteredFeedback.forEach(feedback => {
      const date = new Date(feedback.timestamp);
      const hour = `${date.getHours()}:00`; // Format as "HH:00"
      
      if (!hourSentimentMap[hour]) {
        hourSentimentMap[hour] = {
          positive: 0,
          negative: 0,
          neutral: 0
        };
      }

      if (feedback.sentiment === 'positive') {
        hourSentimentMap[hour].positive++;
      } else if (feedback.sentiment === 'negative') {
        hourSentimentMap[hour].negative++;
      } else {
        hourSentimentMap[hour].neutral++;
      }
    });

    // Create all 24 hours to ensure complete timeline
    const allHours = Array.from({length: 24}, (_, i) => `${i}:00`);
    
    // Fill in missing hours with zero values
    allHours.forEach(hour => {
      if (!hourSentimentMap[hour]) {
        hourSentimentMap[hour] = {
          positive: 0,
          negative: 0,
          neutral: 0
        };
      }
    });

    const sortedHours = Object.keys(hourSentimentMap).sort((a, b) => {
      const hourA = parseInt(a.split(':')[0]);
      const hourB = parseInt(b.split(':')[0]);
      return hourA - hourB;
    });

    return {
      labels: sortedHours,
      datasets: [
        {
          label: 'Positive',
          data: sortedHours.map(hour => hourSentimentMap[hour].positive),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Negative',
          data: sortedHours.map(hour => hourSentimentMap[hour].negative),
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Neutral',
          data: sortedHours.map(hour => hourSentimentMap[hour].neutral),
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
    if (filteredFeedback.length > 0) {
      const recentFeedback = filteredFeedback
        .slice(-100) // Last 100 feedback items
        .filter(f => f.sentiment === 'negative');
      
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
          generatedSuggestions.push(strategy.suggestions[0]); // Take top suggestion for each issue
        }
      });

      // Ensure we always have exactly 3 suggestions
      while (generatedSuggestions.length < 3) {
        const fallbackIndex = generatedSuggestions.length % FALLBACK_SUGGESTIONS.length;
        generatedSuggestions.push(FALLBACK_SUGGESTIONS[fallbackIndex]);
      }
      
      setSuggestions(generatedSuggestions.slice(0, 3)); // Limit to 3 suggestions
    }
  }, [filteredFeedback]);

  const barChartData = processBarChartData();
  const timeSeriesData = processTimeSeriesData();

  const handleSourceChange = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  // Calculate pagination variables
  const totalItems = filteredFeedback.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedFeedback = filteredFeedback.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) return <div className="p-4">Loading sentiment data...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 ">
      {/* Bar Chart Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="card-header card-header-center">
      <h2 className="card-title">Sentiment Analysis by Source</h2>
      </div>
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
        <div className="card-header card-header-center">
      <h2 className="card-title">Feedback Volume Over Time</h2>
      </div>
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Individual Feedback Items</h2>
          <div className="flex space-x-4">
            {/* Date Range Filter */}
            <div className="flex items-center space-x-2">
              <label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                From:
              </label>
              <input
                type="date"
                id="start-date"
                className="border rounded px-2 py-1 text-sm"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                To:
              </label>
              <input
                type="date"
                id="end-date"
                className="border rounded px-2 py-1 text-sm"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
            
            {/* Source Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sources:</span>
              {availableSources.map(source => (
                <label key={source} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(source)}
                    onChange={() => handleSourceChange(source)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{source}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
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
              {paginatedFeedback.length > 0 ? (
                paginatedFeedback.map((feedback, index) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No feedback matches the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalItems > itemsPerPage && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              of <span className="font-medium">{totalItems}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`btn ${currentPage === 1 ? 'bg-gray-100 cursor-not-allowed' : 'btn-primary'}`}
              >
                Previous
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`btn ${currentPage === totalPages ? 'bg-gray-100 cursor-not-allowed' : 'btn-primary'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions Engine Section */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">Actionable Suggestions</h2>
        <div className="space-y-4">
          {suggestions.length > 0 ? (
            <ol className="list-decimal pl-5 space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-gray-700">
                  {suggestion}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-gray-500">No suggestions available. Not enough data to analyze.</p>
          )}
        </div>
        
        <button 
          onClick={() => {
            const recentFeedback = filteredFeedback.slice(-100);
            const negativeFeedback = recentFeedback.filter(f => f.sentiment === 'negative');
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
            
            const newSuggestions: string[] = [];
            
            sortedIssues.forEach(([pattern]) => {
              const strategy = RESOLUTION_STRATEGIES.find(s => s.pattern.toString() === pattern);
              if (strategy) {
                newSuggestions.push(strategy.suggestions[0]);
              }
            });

            // Ensure we always have exactly 3 suggestions
            while (newSuggestions.length < 3) {
              const fallbackIndex = newSuggestions.length % FALLBACK_SUGGESTIONS.length;
              newSuggestions.push(FALLBACK_SUGGESTIONS[fallbackIndex]);
            }
            
            setSuggestions(newSuggestions.slice(0, 3));
          }}
          className="btn btn-primary mt-4">
          Regenerate Suggestions
        </button>
      </div>
    </div>
  );
};

export default FeedbackDashboard;