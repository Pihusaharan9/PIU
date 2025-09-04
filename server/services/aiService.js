const { OpenAI } = require('openai');

class AIService {
  constructor() {
    // Initialize availableModels array
    this.availableModels = [];
    
    // Check if OpenAI API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isAvailable = true;
      // Check available models in background
      this.checkAvailableModels();
    } else {
      console.log('⚠️  OpenAI API key not configured. AI features will use fallback methods.');
      this.isAvailable = false;
    }
  }

  /**
   * Check which models are available
   */
  async checkAvailableModels() {
    if (!this.isAvailable) return;
    
    try {
      console.log('🔍 Checking available OpenAI models...');
      const models = await this.openai.models.list();
      this.availableModels = models.data.map(m => m.id);
      console.log('✅ Available models:', this.availableModels.slice(0, 5), '...');
    } catch (error) {
      console.log('⚠️ Could not check available models:', error.message);
      // Use default models if we can't check
      this.availableModels = [];
    }
  }

  /**
   * Analyze and prioritize tasks using AI
   */
  async prioritizeTasks(tasks, userContext = {}) {
    console.log('🤖 AI Service: Starting task prioritization');
    console.log('📊 Tasks received:', tasks.length);
    console.log('👤 User context:', userContext);
    
    // If OpenAI is not available, use fallback
    if (!this.isAvailable) {
      console.log('Using fallback prioritization (OpenAI not configured)');
      return {
        success: false,
        error: 'OpenAI API not configured',
        fallback: this.generateFallbackPrioritization(tasks)
      };
    }

    try {
      const taskSummary = tasks.map(task => ({
        id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        project: task.project?.name || 'No Project',
        tags: task.tags
      }));

      const prompt = `
As an AI productivity assistant, analyze these tasks and provide intelligent prioritization and insights:

User Context:
- Current time: ${new Date().toISOString()}
- Total tasks: ${tasks.length}
- User preferences: ${JSON.stringify(userContext)}

Tasks to analyze:
${JSON.stringify(taskSummary, null, 2)}

Please provide:
1. Recommended priority order with task titles and project context
2. Productivity insights and recommendations
3. Time management suggestions
4. Potential task dependencies or conflicts
5. Estimated completion timeline

Respond in JSON format:
{
  "priorityOrder": [
    {
      "taskId": "taskId1",
      "title": "Task Title",
      "project": "Project Name",
      "priority": "high/medium/low",
      "reason": "Why this task is prioritized first"
    }
  ],
  "insights": {
    "productivity": "...",
    "timeManagement": "...",
    "workloadAnalysis": "...",
    "recommendations": ["...", "..."]
  },
  "timeline": {
    "estimatedCompletionDays": number,
    "criticalPath": ["taskId1", "taskId2"],
    "suggestedSchedule": "..."
  },
  "riskAssessment": {
    "overdueTasks": ["taskId1"],
    "potentialBottlenecks": ["..."],
    "urgentActions": ["..."]
  }
}`;

      // Use the same model selection logic as optimizeTaskDescription for consistency
      let models = ["gpt-4o-mini"];
      
      console.log('💰 Using gpt-4o-mini for task prioritization - Most cost-effective model: $0.00015 per 1K input + $0.0006 per 1K output');
      
      // If we have available models, check if gpt-4o-mini is available
      if (this.availableModels && this.availableModels.length > 0) {
        if (!this.availableModels.includes("gpt-4o-mini")) {
          console.log('⚠️ gpt-4o-mini not available, falling back to gpt-3.5-turbo');
          models = ["gpt-3.5-turbo"];
        }
        console.log('🎯 Using model for task prioritization:', models[0]);
      }
      
      let response;
      let lastError;

      for (const model of models) {
        try {
          console.log(`🔄 Trying model for task prioritization: ${model}`);
          response = await this.openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: "system",
                content: "You are an expert AI productivity assistant specializing in task management and workflow optimization. You MUST respond with clean, plain text in the exact format requested. NO markdown formatting, NO bold text, NO special characters. Use simple, readable text only."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 1500,
            temperature: 0.1 // Lower temperature for more consistent output
          });
          console.log(`✅ Successfully used model for task prioritization: ${model}`);
          break; // Exit loop if successful
        } catch (error) {
          console.log(`❌ Model ${model} failed for task prioritization:`, error.message);
          lastError = error;
          continue; // Try next model
        }
      }

      if (!response) {
        // If gpt-4o-mini failed, try gpt-3.5-turbo as fallback
        if (models[0] === "gpt-4o-mini") {
          console.log('🔄 gpt-4o-mini failed for task prioritization, trying gpt-3.5-turbo as fallback');
          try {
            response = await this.openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: "You are an expert AI productivity assistant specializing in task management and workflow optimization. You MUST respond with clean, plain text in the exact format requested. NO markdown formatting, NO bold text, NO special characters. Use simple, readable text only."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              max_tokens: 1500,
              temperature: 0.1
            });
            console.log('✅ Successfully used gpt-3.5-turbo fallback for task prioritization');
          } catch (fallbackError) {
            console.log('❌ Both models failed for task prioritization:', fallbackError.message);
            throw new Error('All AI models failed for task prioritization');
          }
        }
      }

      const aiResponse = JSON.parse(response.choices[0].message.content);
      return {
        success: true,
        data: aiResponse,
        usage: response.usage
      };
    } catch (error) {
      console.error('AI prioritization error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackPrioritization(tasks)
      };
    }
  }

  /**
   * Generate smart task suggestions
   */
  async generateTaskSuggestions(userContext, existingTasks = []) {
    try {
      const prompt = `
Based on the user's current tasks and context, suggest 3-5 new tasks that would improve their productivity and help them achieve their goals.

User Context:
${JSON.stringify(userContext, null, 2)}

Existing Tasks:
${existingTasks.map(t => `- ${t.title}: ${t.description || 'No description'}`).join('\n')}

Generate helpful task suggestions in JSON format:
{
  "suggestions": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "estimatedHours": number,
      "tags": ["tag1", "tag2"],
      "reasoning": "Why this task is important"
    }
  ],
  "rationale": "Overall explanation of the suggestions"
}`;

      // Use the same model selection logic as optimizeTaskDescription for consistency
      let models = ["gpt-4o-mini"];
      
      console.log('💰 Using gpt-4o-mini for task suggestions - Most cost-effective model: $0.00015 per 1K input + $0.0006 per 1K output');
      
      // If we have available models, check if gpt-4o-mini is available
      if (this.availableModels && this.availableModels.length > 0) {
        if (!this.availableModels.includes("gpt-4o-mini")) {
          console.log('⚠️ gpt-4o-mini not available, falling back to gpt-3.5-turbo');
          models = ["gpt-3.5-turbo"];
        }
        console.log('🎯 Using model for task suggestions:', models[0]);
      }
      
      let response;
      let lastError;

      for (const model of models) {
        try {
          console.log(`🔄 Trying model for task suggestions: ${model}`);
          response = await this.openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: "system",
                content: "You are a productivity expert AI that suggests meaningful, actionable tasks to help users achieve their goals. You MUST respond with clean, plain text in the exact format requested. NO markdown formatting, NO bold text, NO special characters. Use simple, readable text only."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.1 // Lower temperature for more consistent output
          });
          console.log(`✅ Successfully used model for task suggestions: ${model}`);
          break; // Exit loop if successful
        } catch (error) {
          console.log(`❌ Model ${model} failed for task suggestions:`, error.message);
          lastError = error;
          continue; // Try next model
        }
      }

      if (!response) {
        // If gpt-4o-mini failed, try gpt-3.5-turbo as fallback
        if (models[0] === "gpt-4o-mini") {
          console.log('🔄 gpt-4o-mini failed for task suggestions, trying gpt-3.5-turbo as fallback');
          try {
            response = await this.openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: "You are a productivity expert AI that suggests meaningful, actionable tasks to help users achieve their goals. You MUST respond with clean, plain text in the exact format requested. NO markdown formatting, NO bold text, NO special characters. Use simple, readable text only."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              max_tokens: 1000,
              temperature: 0.1
            });
            console.log('✅ Successfully used gpt-3.5-turbo fallback for task suggestions');
          } catch (fallbackError) {
            console.log('❌ Both models failed for task suggestions:', fallbackError.message);
            throw new Error('All AI models failed for task suggestions');
          }
        }
      }

      const aiResponse = JSON.parse(response.choices[0].message.content);
      return {
        success: true,
        data: aiResponse
      };
    } catch (error) {
      console.error('AI task suggestion error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackSuggestions()
      };
    }
  }

  /**
   * Analyze productivity patterns and provide insights
   */
  async analyzeProductivity(userStats, taskHistory = []) {
    try {
      const prompt = `
Analyze this user's productivity data and provide actionable insights:

Current Stats:
- Total tasks: ${userStats.total}
- Completed: ${userStats.completed}
- In Progress: ${userStats.inProgress}
- Pending: ${userStats.pending}
- Productivity rate: ${userStats.productivity}%

Recent Task History (last 30 days):
${taskHistory.slice(0, 20).map(t => `- ${t.title} (${t.status}) - Created: ${t.createdAt}`).join('\n')}

Provide productivity analysis in JSON format:
{
  "overallScore": number (1-100),
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "recommendations": [
    {
      "category": "time_management|focus|organization|workflow",
      "suggestion": "Specific actionable advice",
      "impact": "high|medium|low"
    }
  ],
  "patterns": {
    "completionTrends": "...",
    "procrastinationIndicators": "...",
    "optimalWorkTimes": "..."
  },
  "nextSteps": ["step1", "step2", "step3"]
}`;

      // Use the same model selection logic as optimizeTaskDescription for consistency
      let models = ["gpt-4o-mini"];
      
      console.log('💰 Using gpt-4o-mini for productivity analysis - Most cost-effective model: $0.00015 per 1K input + $0.0006 per 1K output');
      
      // If we have available models, check if gpt-4o-mini is available
      if (this.availableModels && this.availableModels.length > 0) {
        if (!this.availableModels.includes("gpt-4o-mini")) {
          console.log('⚠️ gpt-4o-mini not available, falling back to gpt-3.5-turbo');
          models = ["gpt-3.5-turbo"];
        }
        console.log('🎯 Using model for productivity analysis:', models[0]);
      }
      
      let response;
      let lastError;

      for (const model of models) {
        try {
          console.log(`🔄 Trying model for productivity analysis: ${model}`);
          response = await this.openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: "system",
                content: "You are a productivity analysis expert. You MUST respond with clean, plain text in the exact format requested. NO markdown formatting, NO bold text, NO special characters. Use simple, readable text only."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 1200,
            temperature: 0.1 // Lower temperature for more consistent output
          });
          console.log(`✅ Successfully used model for productivity analysis: ${model}`);
          break; // Exit loop if successful
        } catch (error) {
          console.log(`❌ Model ${model} failed for productivity analysis:`, error.message);
          lastError = error;
          continue; // Try next model
        }
      }

      if (!response) {
        // If gpt-4o-mini failed, try gpt-3.5-turbo as fallback
        if (models[0] === "gpt-4o-mini") {
          console.log('🔄 gpt-4o-mini failed for productivity analysis, trying gpt-3.5-turbo as fallback');
          try {
            response = await this.openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: "You are a productivity analysis expert. You MUST respond with clean, plain text in the exact format requested. NO markdown formatting, NO bold text, NO special characters. Use simple, readable text only."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              max_tokens: 1200,
              temperature: 0.1
            });
            console.log('✅ Successfully used gpt-3.5-turbo fallback for productivity analysis');
          } catch (fallbackError) {
            console.log('❌ Both models failed for productivity analysis:', fallbackError.message);
            throw new Error('All AI models failed for productivity analysis');
          }
        }
      }

      const aiResponse = JSON.parse(response.choices[0].message.content);
      return {
        success: true,
        data: aiResponse
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackAnalysis(userStats)
      };
    }
  }

  /**
   * Optimize task descriptions using AI
   */
  async optimizeTaskDescription(title, description) {
    // If OpenAI is not available, use fallback
    if (!this.isAvailable) {
      console.log('Using fallback task optimization (OpenAI not configured)');
      return {
        success: false,
        error: 'OpenAI API not configured',
        fallback: this.generateFallbackTaskOptimization(title, description)
      };
    }

    try {
      const prompt = `You are an expert project manager. Create a comprehensive task description and definition of done for this task:

TASK TITLE: "${title}"

IMPORTANT: Respond in this EXACT format with NO markdown formatting (no **, no bold, no special characters):

TASK DESCRIPTION:
[Write a detailed, clear description of what this task involves, what needs to be accomplished, and the expected outcomes. Make it comprehensive and actionable, similar to how you would explain it to a developer. Use plain text only.]

DEFINITION OF DONE:
[Write clear, measurable criteria that define when this task is considered complete. Include what deliverables are expected, quality standards, and how to verify completion. Use plain text with simple formatting like bullet points or numbered lists.]

Estimated Hours: [Number between 1-8]
Priority: [low/medium/high/urgent/critical]
Suggested Tags: [tag1, tag2, tag3]

Rules:
- NO markdown formatting (no **, no bold, no special characters)
- Use plain text only
- Start with "TASK DESCRIPTION:" on its own line
- Then "DEFINITION OF DONE:" on its own line
- Keep the format clean and readable`;

      // Use only gpt-4o-mini for cost-effectiveness
      let models = ["gpt-4o-mini"];
      
      console.log('💰 Using gpt-4o-mini only - Most cost-effective model: $0.00015 per 1K input + $0.0006 per 1K output');
      
      // If we have available models, check if gpt-4o-mini is available
      if (this.availableModels && this.availableModels.length > 0) {
        if (!this.availableModels.includes("gpt-4o-mini")) {
          console.log('⚠️ gpt-4o-mini not available, falling back to gpt-3.5-turbo');
          models = ["gpt-3.5-turbo"];
        }
        console.log('🎯 Using model:', models[0]);
      }
      let response;
      let lastError;

      for (const model of models) {
        try {
          console.log(`🔄 Trying model: ${model}`);
          response = await this.openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: "system",
                content: "You are an expert project manager. You MUST respond with clean, plain text in the exact format requested. NO markdown formatting, NO bold text, NO special characters. Use simple, readable text only."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.1 // Lower temperature for more consistent JSON output
          });
          console.log(`✅ Successfully used model: ${model}`);
          break; // Exit loop if successful
        } catch (error) {
          console.log(`❌ Model ${model} failed:`, error.message);
          lastError = error;
          continue; // Try next model
        }
      }

      if (!response) {
        // If gpt-4o-mini failed, try gpt-3.5-turbo as fallback
        if (models[0] === "gpt-4o-mini") {
          console.log('🔄 gpt-4o-mini failed, trying gpt-3.5-turbo as fallback');
          try {
                            response = await this.openai.chat.completions.create({
                  model: "gpt-3.5-turbo",
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert project manager. You MUST respond with clean, plain text in the exact format requested. NO markdown formatting, NO bold text, NO special characters. Use simple, readable text only."
                    },
                    {
                      role: "user",
                      content: prompt
                    }
                  ],
                  max_tokens: 1000,
                  temperature: 0.1
                });
            console.log('✅ Successfully used fallback model: gpt-3.5-turbo');
          } catch (error) {
            console.log('❌ Fallback model gpt-3.5-turbo failed:', error.message);
          }
        }
        
        if (!response) {
          throw new Error(`All models failed. Last error: ${lastError?.message}`);
        }
      }

      const aiResponse = response.choices[0].message.content;
      console.log('🤖 Raw AI Response:', aiResponse);
      
      // Calculate cost for this request
      const cost = this.calculateCost(response.usage, response.model);
      console.log(`💰 Cost for ${response.model}: $${cost.toFixed(6)}`);
      
      // Parse the AI response
      const result = this.parseAIResponse(aiResponse);
      console.log('📝 Parsed Result:', result);
      
      return {
        success: true,
        data: result,
        cost: cost,
        model: response.model
      };
    } catch (error) {
      console.error('AI task optimization error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackTaskOptimization(title, description)
      };
    }
  }

  /**
   * Calculate cost for OpenAI API request
   */
  calculateCost(usage, model) {
    const rates = {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },     // Primary model - cheapest
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },     // Fallback model
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },  // Alternative fallback
      'gpt-4o': { input: 0.0025, output: 0.01 },             // Not used
      'gpt-4-turbo': { input: 0.01, output: 0.03 },          // Not used
      'gpt-4': { input: 0.03, output: 0.06 }                 // Not used
    };
    
    const rate = rates[model] || rates['gpt-4o-mini'];
    const inputCost = (usage.prompt_tokens / 1000) * rate.input;
    const outputCost = (usage.completion_tokens / 1000) * rate.output;
    
    return inputCost + outputCost;
  }

  /**
   * Parse AI response and extract structured information
   */
  parseAIResponse(aiResponse) {
    try {
      console.log('Raw AI Response:', aiResponse);
      
      // Clean the response
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown formatting
      cleanResponse = cleanResponse
        .replace(/\*\*/g, '')           // Remove ** bold markers
        .replace(/```json\s*/g, '')     // Remove ```json code blocks
        .replace(/```\s*/g, '')         // Remove ``` code blocks
        .replace(/\[([^\]]+)\]/g, '$1') // Remove [bracket] formatting
        .replace(/\*\s/g, '• ')         // Replace * with bullet points
        .replace(/\n\*\s/g, '\n• ')     // Replace newline * with bullet points
      
      console.log('🧹 Cleaned Response:', cleanResponse);
      console.log('🔍 Looking for patterns in cleaned response...');
      
      // Extract Task Description
      let taskDescription = '';
      const taskDescMatch = cleanResponse.match(/TASK DESCRIPTION:\s*([\s\S]*?)(?=DEFINITION OF DONE|Estimated Hours|Priority|Suggested Tags|$)/i);
      if (taskDescMatch) {
        taskDescription = taskDescMatch[1].trim();
      }
      
      // Extract Definition of Done
      let definitionOfDone = '';
      const dodMatch = cleanResponse.match(/DEFINITION OF DONE:\s*([\s\S]*?)(?=Estimated Hours|Priority|Suggested Tags|$)/i);
      if (dodMatch) {
        definitionOfDone = dodMatch[1].trim();
      }
      
      // Extract Estimated Hours
      let estimatedHours = 2;
      const hoursMatch = cleanResponse.match(/Estimated Hours:\s*(\d+)/i) || 
                         cleanResponse.match(/Hours:\s*(\d+)/i) ||
                         cleanResponse.match(/Time:\s*(\d+)/i);
      if (hoursMatch) {
        estimatedHours = parseInt(hoursMatch[1]);
        console.log('✅ Extracted hours:', estimatedHours);
      } else {
        console.log('❌ Could not extract hours, using default:', estimatedHours);
      }
      
      // Extract Priority
      let priority = 'medium';
      const priorityMatch = cleanResponse.match(/Priority:\s*(low|medium|high|urgent|critical)/i) ||
                           cleanResponse.match(/Priority Level:\s*(low|medium|high|urgent|critical)/i);
      if (priorityMatch) {
        priority = priorityMatch[1].toLowerCase();
        console.log('✅ Extracted priority:', priority);
      } else {
        console.log('❌ Could not extract priority, using default:', priority);
      }
      
      // Extract Suggested Tags
      let suggestedTags = [];
      const tagsMatch = cleanResponse.match(/Suggested Tags:\s*\[([^\]]+)\]/i) ||
                       cleanResponse.match(/Tags:\s*\[([^\]]+)\]/i) ||
                       cleanResponse.match(/Suggested Tags:\s*([^,\n]+(?:,\s*[^,\n]+)*)/i);
      if (tagsMatch) {
        const tagsText = tagsMatch[1];
        suggestedTags = tagsText.split(',').map(tag => tag.trim());
        console.log('✅ Extracted tags:', suggestedTags);
      } else {
        console.log('❌ Could not extract tags, using default:', suggestedTags);
      }
      
      console.log('Parsed Response:', {
        taskDescription,
        definitionOfDone,
        estimatedHours,
        priority,
        suggestedTags
      });
      
      // Generate comprehensive description
      let comprehensiveDescription = taskDescription;
      if (definitionOfDone) {
        comprehensiveDescription += comprehensiveDescription ? '\n\n' : '';
        comprehensiveDescription += '📋 Definition of Done:\n';
        comprehensiveDescription += definitionOfDone;
      }
      
      return {
        optimizedTitle: '', // Keep original title
        optimizedDescription: comprehensiveDescription,
        definitionOfDone: definitionOfDone,
        suggestedTags: suggestedTags,
        estimatedComplexity: 'medium',
        estimatedHours: estimatedHours,
        priority: priority
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw AI response:', aiResponse);
      
      // Fallback: return the raw response
      return {
        optimizedTitle: '',
        optimizedDescription: aiResponse,
        definitionOfDone: '',
        suggestedTags: [],
        estimatedComplexity: 'medium',
        estimatedHours: 2,
        priority: 'medium'
      };
    }
  }

  /**
   * Fallback prioritization when AI is unavailable
   */
  generateFallbackPrioritization(tasks) {
    const prioritized = tasks.sort((a, b) => {
      // Sort by priority first, then by due date
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority] || 1;
      const bPriority = priorityWeight[b.priority] || 1;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // If same priority, sort by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    return {
      priorityOrder: prioritized.map(t => t._id),
      insights: {
        productivity: "Tasks sorted by priority and due date",
        timeManagement: "Focus on high-priority items first",
        workloadAnalysis: `You have ${tasks.length} tasks to complete`,
        recommendations: ["Complete high-priority tasks first", "Set realistic deadlines"]
      }
    };
  }

  /**
   * Fallback task suggestions
   */
  generateFallbackSuggestions() {
    return {
      suggestions: [
        {
          title: "Review and organize workspace",
          description: "Spend 15 minutes organizing your physical and digital workspace for better productivity",
          priority: "medium",
          estimatedHours: 0.25,
          tags: ["organization", "productivity"],
          reasoning: "A clean workspace improves focus and efficiency"
        },
        {
          title: "Plan tomorrow's priorities",
          description: "Set aside time to plan your top 3 priorities for tomorrow",
          priority: "low",
          estimatedHours: 0.5,
          tags: ["planning", "productivity"],
          reasoning: "Planning ahead reduces decision fatigue and improves focus"
        }
      ],
      rationale: "Basic productivity tasks to help you stay organized"
    };
  }

  /**
   * Fallback task optimization
   */
  generateFallbackTaskOptimization(title, description) {
    // Generate task-specific description based on title keywords
    let taskDescription = '';
    let definitionOfDone = '';
    let suggestedTags = [];
    let estimatedHours = 2;
    let priority = 'medium';

    // Analyze title to generate relevant content
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('bug') || titleLower.includes('fix') || titleLower.includes('error')) {
      taskDescription = `Fix the identified issue in ${title}. This involves debugging the problem, implementing the necessary corrections, testing the fix, and ensuring the system works as expected.`;
      definitionOfDone = `The bug is fixed, all tests pass, the fix is documented, and the solution is deployed or ready for deployment.`;
      suggestedTags = ['bug-fix', 'debugging', 'testing'];
      estimatedHours = 1;
      priority = 'high';
    } else if (titleLower.includes('implement') || titleLower.includes('create') || titleLower.includes('build')) {
      taskDescription = `Implement the feature: ${title}. This involves designing the solution, writing the necessary code, testing functionality, and ensuring it meets the specified requirements.`;
      definitionOfDone = `The feature is fully implemented, tested, documented, and ready for use. All acceptance criteria are met.`;
      suggestedTags = ['development', 'feature', 'implementation'];
      estimatedHours = 4;
      priority = 'medium';
    } else if (titleLower.includes('test') || titleLower.includes('review') || titleLower.includes('analyze')) {
      taskDescription = `Perform thorough testing and analysis for: ${title}. This involves executing test cases, reviewing code or documentation, identifying issues, and providing detailed feedback.`;
      definitionOfDone = `All tests are executed, issues are documented, feedback is provided, and a comprehensive report is completed.`;
      suggestedTags = ['testing', 'review', 'analysis'];
      estimatedHours = 2;
      priority = 'medium';
    } else {
      // Generic but more specific than before
      taskDescription = `Complete the task: ${title}. This involves understanding the specific requirements, planning the approach, executing the necessary steps, and delivering the expected outcomes.`;
      definitionOfDone = `The task is completed according to specifications, quality standards are met, and all deliverables are ready for handoff or use.`;
      suggestedTags = ['task', 'completion', 'delivery'];
      estimatedHours = 2;
      priority = 'medium';
    }

    // Generate comprehensive description
    let comprehensiveDescription = taskDescription;
    if (definitionOfDone) {
      comprehensiveDescription += comprehensiveDescription ? '\n\n' : '';
      comprehensiveDescription += '📋 Definition of Done:\n';
      comprehensiveDescription += definitionOfDone;
    }

    return {
      optimizedTitle: title,
      optimizedDescription: comprehensiveDescription,
      definitionOfDone: definitionOfDone,
      suggestedTags: suggestedTags,
      estimatedComplexity: 'medium',
      estimatedHours: estimatedHours,
      priority: priority
    };
  }

  /**
   * Fallback productivity analysis
   */
  generateFallbackAnalysis(userStats) {
    const completionRate = userStats.total > 0 ? (userStats.completed / userStats.total) * 100 : 0;
    
    return {
      overallScore: Math.min(completionRate + 20, 100),
      strengths: completionRate > 70 ? ["Good task completion rate"] : ["Actively managing tasks"],
      areasForImprovement: completionRate < 50 ? ["Task completion rate"] : ["Task organization"],
      recommendations: [
        {
          category: "workflow",
          suggestion: "Break large tasks into smaller, manageable subtasks",
          impact: "high"
        }
      ],
      patterns: {
        completionTrends: "Based on current data",
        procrastinationIndicators: "Monitor pending tasks",
        optimalWorkTimes: "Track your most productive hours"
      },
      nextSteps: ["Complete high-priority tasks", "Review task organization", "Set realistic deadlines"]
    };
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = aiService;
