import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Clock, Lightbulb, Star, AlertCircle, CheckCircle, X, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';

const AITaskPrioritization = ({ onClose }) => {
  const { prioritizeTasks } = useAI();
  const [isLoading, setIsLoading] = useState(false);
  const [prioritizationResult, setPrioritizationResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrioritization = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await prioritizeTasks();
        
        // Handle different response formats
        if (result && result.data) {
          setPrioritizationResult(result.data);
        } else if (result && result.priorityOrder) {
          setPrioritizationResult(result);
        } else {
          setPrioritizationResult(result);
        }
      } catch (err) {
        setError(err.message || 'Failed to get AI prioritization');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrioritization();
  }, []); // Empty dependency array to run only once


  
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-300">AI is analyzing and prioritizing your tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-8 text-center">
          <div className="text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!prioritizationResult) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-8 text-center">
          <div className="text-slate-500">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-slate-600 dark:text-slate-300">No prioritization data available</p>
            <p className="text-xs text-slate-400 mt-2">This usually means you have no tasks to prioritize</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityIcon = (index) => {
    if (index === 0) return <ArrowUp className="w-4 h-4 text-red-500" />;
    if (index === 1) return <ArrowUp className="w-4 h-4 text-orange-500" />;
    if (index === 2) return <ArrowRight className="w-4 h-4 text-yellow-500" />;
    return <ArrowDown className="w-4 h-4 text-green-500" />;
  };

  const getPriorityColor = (index) => {
    if (index === 0) return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700';
    if (index === 1) return 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700';
    if (index === 2) return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700';
    return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700';
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              AI Task Prioritization Results
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your tasks ordered by AI-recommended priority
            </p>
          </div>
        </div>
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Close prioritization"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>



      {/* Priority Order */}
      {prioritizationResult?.priorityOrder && prioritizationResult.priorityOrder.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">Recommended Priority Order</h4>
          </div>
          <div className="space-y-3">
            {prioritizationResult.priorityOrder.map((task, index) => {
              // Handle both old format (just taskId) and new format (task object)
              const taskTitle = typeof task === 'string' ? `Unknown Task` : task.title;
              const projectName = typeof task === 'string' ? 'Unknown Project' : (task.project || 'No Project');
              const priority = typeof task === 'string' ? 'medium' : (task.priority || 'medium');
              const reason = typeof task === 'string' ? '' : (task.reason || '');
              
              return (
                <div key={index} className={`flex items-start space-x-3 p-4 rounded-lg border ${getPriorityColor(index)}`}>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {getPriorityIcon(index)}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {taskTitle}
                      </h5>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {priority}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      📁 Project: {projectName}
                    </div>
                    
                    {reason && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 italic">
                        💡 {reason}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      {prioritizationResult?.insights && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">AI Insights</h4>
          </div>
          <div className="space-y-2">
            {prioritizationResult.insights.productivity && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Productivity:</strong> {prioritizationResult.insights.productivity}
              </div>
            )}
            {prioritizationResult.insights.timeManagement && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Time Management:</strong> {prioritizationResult.insights.timeManagement}
              </div>
            )}
            {prioritizationResult.insights.workloadAnalysis && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Workload Analysis:</strong> {prioritizationResult.insights.workloadAnalysis}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {prioritizationResult?.insights?.recommendations && prioritizationResult.insights.recommendations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Star className="w-4 h-4 text-yellow-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">Recommendations</h4>
          </div>
          <div className="space-y-2">
            {prioritizationResult.insights.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600 dark:text-slate-300">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {prioritizationResult?.timeline && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">Timeline & Schedule</h4>
          </div>
          <div className="space-y-2">
            {prioritizationResult.timeline.estimatedCompletionDays && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Estimated Completion:</strong> {prioritizationResult.timeline.estimatedCompletionDays} days
              </div>
            )}
            {prioritizationResult.timeline.suggestedSchedule && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Suggested Schedule:</strong> {prioritizationResult.timeline.suggestedSchedule}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {prioritizationResult?.riskAssessment && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">Risk Assessment</h4>
          </div>
          <div className="space-y-2">
            {prioritizationResult.riskAssessment.overdueTasks && prioritizationResult.riskAssessment.overdueTasks.length > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Overdue Tasks:</strong> You have {prioritizationResult.riskAssessment.overdueTasks.length} overdue task(s) that need immediate attention
              </div>
            )}
            {prioritizationResult.riskAssessment.potentialBottlenecks && prioritizationResult.riskAssessment.potentialBottlenecks.length > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Potential Bottlenecks:</strong> {prioritizationResult.riskAssessment.potentialBottlenecks.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AITaskPrioritization;
