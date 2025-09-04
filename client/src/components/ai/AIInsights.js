import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, Clock, Lightbulb, Star, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';

const AIInsights = ({ onClose }) => {
  const { insights, getProductivityInsights, isLoading } = useAI();
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProductivityInsights().catch((err) => {
      setError(err.message);
    });
  }, []);

  if (isLoading && !insights) {
    return (
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-300">AI is analyzing your productivity...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Failed to Load AI Insights
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              getProductivityInsights().catch((err) => setError(err.message));
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Insights Available
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Create some tasks to get AI-powered productivity insights.
          </p>
          <button
            onClick={() => getProductivityInsights().catch((err) => setError(err.message))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              AI Productivity Insights
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Powered by artificial intelligence
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Overall Score */}
          <div className={`px-4 py-2 rounded-xl ${getScoreBg(insights.overallScore)}`}>
            <div className="flex items-center space-x-2">
              <TrendingUp className={`w-4 h-4 ${getScoreColor(insights.overallScore)}`} />
              <span className={`font-bold ${getScoreColor(insights.overallScore)}`}>
                {insights.overallScore}/100
              </span>
            </div>
          </div>
          
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Close insights"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Strengths */}
      {insights.strengths && insights.strengths.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Star className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">Strengths</h4>
          </div>
          <div className="space-y-2">
            {insights.strengths.slice(0, 2).map((strength, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-300">{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas for Improvement */}
      {insights.areasForImprovement && insights.areasForImprovement.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-4 h-4 text-orange-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">Areas for Improvement</h4>
          </div>
          <div className="space-y-2">
            {insights.areasForImprovement.slice(0, 2).map((area, index) => (
              <div key={index} className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-300">{area}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">AI Recommendations</h4>
          </div>
          <div className="space-y-3">
            {insights.recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <div className="flex items-start space-x-2">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    rec.impact === 'high' ? 'bg-red-500' :
                    rec.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        {rec.category?.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.impact === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {rec.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {rec.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {insights.nextSteps && insights.nextSteps.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-slate-900 dark:text-white">Next Steps</h4>
          </div>
          <div className="space-y-2">
            {insights.nextSteps.slice(0, 3).map((step, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-300">{index + 1}</span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show More Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all duration-200 text-sm font-medium"
      >
        {showDetails ? 'Show Less' : 'View Detailed Analysis'}
      </button>

      {/* Detailed View */}
      {showDetails && insights.patterns && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
        >
          <h4 className="font-medium text-slate-900 dark:text-white mb-3">Detailed Patterns</h4>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {insights.patterns.completionTrends && (
              <div>
                <strong>Completion Trends:</strong> {insights.patterns.completionTrends}
              </div>
            )}
            {insights.patterns.procrastinationIndicators && (
              <div>
                <strong>Procrastination Indicators:</strong> {insights.patterns.procrastinationIndicators}
              </div>
            )}
            {insights.patterns.optimalWorkTimes && (
              <div>
                <strong>Optimal Work Times:</strong> {insights.patterns.optimalWorkTimes}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIInsights;
