import axios from 'axios';
import type { ExecutionResult, DashboardStats, PromptTemplate, PromptExecution, MCPTool, AgentCard } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://172.168.1.95:4070';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// --- Prompt Execution APIs ---

export const executeFeedbackAnalysis = (data: {
  review_text: string; model?: string; temperature?: number;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/feedback-analysis/', data).then(r => r.data);

export const executeMeetingSummarizer = (data: {
  transcript: string; model?: string; temperature?: number;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/meeting-summarizer/', data).then(r => r.data);

export const executeQuizGenerator = (data: {
  content: string; num_questions?: number; difficulty_mix?: string; model?: string; temperature?: number;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/quiz-generator/', data).then(r => r.data);

export const executeSlideScript = (data: {
  topic: string; num_slides?: number; style?: string; model?: string; temperature?: number;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/slide-script/', data).then(r => r.data);

export const executeComplaintResponse = (data: {
  complaint: string; company_name?: string; agent_name?: string; model?: string; temperature?: number;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/complaint-response/', data).then(r => r.data);

export const executeCustomPrompt = (data: {
  system_prompt?: string; user_prompt: string; model?: string; temperature?: number; max_tokens?: number;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/custom/', data).then(r => r.data);

// --- Export APIs ---

const downloadBlob = (data: any, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportSlidesToPPTX = (executionId: string): Promise<void> =>
  api.post('/api/v1/export/slides-pptx/', { execution_id: executionId }, { responseType: 'blob' })
    .then(response => downloadBlob(response.data, 'presentation.pptx'));

export const exportMeetingToDocx = (executionId: string): Promise<void> =>
  api.post('/api/v1/export/meeting-docx/', { execution_id: executionId }, { responseType: 'blob' })
    .then(response => downloadBlob(response.data, 'meeting_summary.docx'));

export const exportQuizToDocx = (executionId: string): Promise<void> =>
  api.post('/api/v1/export/quiz-docx/', { execution_id: executionId }, { responseType: 'blob' })
    .then(response => downloadBlob(response.data, 'quiz.docx'));

// --- Template APIs ---

export const getTemplates = (params?: Record<string, string>): Promise<{ results: PromptTemplate[] }> =>
  api.get('/api/v1/templates/', { params }).then(r => r.data);

export const getTemplate = (id: string): Promise<PromptTemplate> =>
  api.get(`/api/v1/templates/${id}/`).then(r => r.data);

// --- Execution History APIs ---

export const getExecutions = (params?: Record<string, string>): Promise<{ results: PromptExecution[] }> =>
  api.get('/api/v1/executions/', { params }).then(r => r.data);

export const rateExecution = (id: string, rating: number, feedback?: string) =>
  api.post(`/api/v1/executions/${id}/rate/`, { rating, feedback }).then(r => r.data);

// --- Analytics APIs ---

export const getDashboardStats = (): Promise<DashboardStats> =>
  api.get('/api/v1/analytics/dashboard/').then(r => r.data);

export const getCostAnalysis = (days?: number): Promise<unknown> =>
  api.get('/api/v1/analytics/costs/', { params: { days } }).then(r => r.data);

// --- MCP APIs ---

export const getMCPTools = (): Promise<{ tools: MCPTool[] }> =>
  api.get('/mcp/tools').then(r => r.data);

export const executeMCPTool = (tool_name: string, args: Record<string, unknown>) =>
  api.post('/mcp/tools/execute', { tool_name, arguments: args }).then(r => r.data);

export const getMCPInfo = () =>
  api.get('/mcp/info').then(r => r.data);

// --- A2A APIs ---

export const getAgentCards = (): Promise<{ agents: AgentCard[] }> =>
  api.get('/a2a/agents').then(r => r.data);

export const sendA2ATask = (skill_id: string, input: string, metadata?: Record<string, unknown>) =>
  api.post('/a2a/tasks/send', { skill_id, input, metadata }).then(r => r.data);

// --- Multi-Agent APIs ---

export const runMultiAgentWorkflow = (task: string, category: string, input_data: string) =>
  api.post('/api/v1/agents/workflow/', { task, category, input_data }).then(r => r.data);

// --- Health ---

export const checkGatewayHealth = () =>
  api.get('/health').then(r => r.data);
