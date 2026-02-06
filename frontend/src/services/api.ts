import axios from 'axios';
import type {
  ExecutionResult, CompareResult, DashboardStats, PromptTemplate, PromptExecution, MCPTool, AgentCard,
  UserInfo, PromptProject, TestSuite, TestCase, TestRun, Tutorial, Challenge, ChallengeSubmission,
  SharedPrompt, Technique, PromptCollection, PromptFavorite,
} from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://172.168.1.95:4070';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// JWT token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const sessionId = localStorage.getItem('session_id');
  if (sessionId) config.headers['X-Session-Id'] = sessionId;
  return config;
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

// --- Advanced Prompt Engineering APIs ---

export const executePromptGrader = (data: {
  prompt_text: string; task_type?: string; domain?: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/prompt-grader/', data).then(r => r.data);

export const executePromptOptimizer = (data: {
  prompt_text: string; grading_output: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/prompt-optimizer/', data).then(r => r.data);

export const executePromptCompare = (data: {
  prompt_a: string; prompt_b: string; test_input: string; model?: string;
}): Promise<CompareResult> =>
  api.post('/api/v1/execute/prompt-compare/', data).then(r => r.data);

export const executeSchemaEnforcer = (data: {
  prompt_text: string; schema_text: string; input_text: string; max_retries?: number; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/schema-enforcer/', data).then(r => r.data);

export const executeSelfCorrecting = (data: {
  prompt_text: string; input_text: string; criteria?: string; max_rounds?: number; threshold?: number; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/self-correcting/', data).then(r => r.data);

export const executeQualityPipeline = (data: {
  task_prompt: string; input_text: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/quality-pipeline/', data).then(r => r.data);

export const executeDecomposition = (data: {
  task_description: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/decomposition/', data).then(r => r.data);

export const executeInjectionTester = (data: {
  system_prompt: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/injection-tester/', data).then(r => r.data);

export const executeFewShotBuilder = (data: {
  task_description: string; examples: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/fewshot-builder/', data).then(r => r.data);

// --- Phase 4: Knowledge Workflow APIs ---

export const executeExpertPanel = (data: {
  topic: string; personas: string[]; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/expert-panel/', data).then(r => r.data);

export const executeDocumentQA = (data: {
  question: string; documents: Array<{ label: string; text: string }>; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/document-qa/', data).then(r => r.data);

export const executeComplianceChecker = (data: {
  policy_text: string; document_text: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/compliance-checker/', data).then(r => r.data);

// --- Phase 5: Specialized Tool APIs ---

export const executeToneTransformer = (data: {
  text: string; target_tone: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/tone-transformer/', data).then(r => r.data);

export const executeMisconceptionDetector = (data: {
  topic: string; student_answer: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/misconception-detector/', data).then(r => r.data);

export const executeCoTVisualizer = (data: {
  question: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/cot-visualizer/', data).then(r => r.data);

// --- Phase 6: Extended Feature APIs ---

export const executeRAGSimulator = (data: {
  query: string; knowledge_chunks: string[]; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/rag-simulator/', data).then(r => r.data);

export const executeScenarioSimulator = (data: {
  plan: string; stakeholders: string[]; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/scenario-simulator/', data).then(r => r.data);

export const executeLocalizer = (data: {
  prompt_text: string; target_language: string; cultural_context?: string; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/execute/localizer/', data).then(r => r.data);

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

// ==================================================================
// Platform APIs (Phases 7-12)
// ==================================================================

// --- Auth ---
export const registerUser = (data: { username: string; email: string; password: string; first_name?: string; last_name?: string }) =>
  api.post('/api/v1/platform/auth/register/', data).then(r => r.data);

export const loginUser = (data: { username: string; password: string }): Promise<{ access: string; refresh: string }> =>
  api.post('/api/v1/platform/auth/login/', data).then(r => r.data);

export const refreshToken = (refresh: string): Promise<{ access: string }> =>
  api.post('/api/v1/platform/auth/refresh/', { refresh }).then(r => r.data);

export const getMe = (): Promise<{ user: UserInfo | null }> =>
  api.get('/api/v1/platform/auth/me/').then(r => r.data);

export const updateProfile = (data: { theme?: string; onboarding_completed?: boolean; avatar_color?: string }) =>
  api.patch('/api/v1/platform/auth/profile/', data).then(r => r.data);

// --- Projects ---
export const getProjects = (): Promise<{ results: PromptProject[] }> =>
  api.get('/api/v1/platform/projects/').then(r => r.data);

export const createProject = (data: { name: string; description?: string; tags?: string[] }): Promise<PromptProject> =>
  api.post('/api/v1/platform/projects/', data).then(r => r.data);

export const deleteProject = (id: string) =>
  api.delete(`/api/v1/platform/projects/${id}/`);

// --- Collections & Favorites ---
export const getCollections = (): Promise<{ results: PromptCollection[] }> =>
  api.get('/api/v1/platform/collections/').then(r => r.data);

export const createCollection = (data: { name: string; description?: string }): Promise<PromptCollection> =>
  api.post('/api/v1/platform/collections/', data).then(r => r.data);

export const getFavorites = (): Promise<{ results: PromptFavorite[] }> =>
  api.get('/api/v1/platform/favorites/').then(r => r.data);

export const addFavorite = (data: { execution: string; collection?: string; notes?: string }): Promise<PromptFavorite> =>
  api.post('/api/v1/platform/favorites/', data).then(r => r.data);

export const removeFavorite = (id: string) =>
  api.delete(`/api/v1/platform/favorites/${id}/`);

// --- Test Suites ---
export const getTestSuites = (): Promise<{ results: TestSuite[] }> =>
  api.get('/api/v1/platform/test-suites/').then(r => r.data);

export const createTestSuite = (data: Partial<TestSuite>): Promise<TestSuite> =>
  api.post('/api/v1/platform/test-suites/', data).then(r => r.data);

export const deleteTestSuite = (id: string) =>
  api.delete(`/api/v1/platform/test-suites/${id}/`);

export const createTestCase = (data: Partial<TestCase>): Promise<TestCase> =>
  api.post('/api/v1/platform/test-cases/', data).then(r => r.data);

export const deleteTestCase = (id: string) =>
  api.delete(`/api/v1/platform/test-cases/${id}/`);

export const getTestRuns = (suiteId?: string): Promise<{ results: TestRun[] }> =>
  api.get('/api/v1/platform/test-runs/', { params: suiteId ? { suite: suiteId } : {} }).then(r => r.data);

export const runTestSuite = (data: { suite_id: string; model?: string; prompt_text?: string }): Promise<TestRun> =>
  api.post('/api/v1/platform/run-test-suite/', data).then(r => r.data);

// --- Batch & Consistency ---
export const runBatchEvaluation = (data: {
  prompt_text: string; system_prompt?: string; inputs: string[]; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/platform/batch-evaluation/', data).then(r => r.data);

export const runConsistencyCheck = (data: {
  prompt_text: string; system_prompt?: string; input_text: string; num_runs?: number; model?: string;
}): Promise<ExecutionResult> =>
  api.post('/api/v1/platform/consistency-check/', data).then(r => r.data);

// --- Tutorials ---
export const getTutorials = (): Promise<{ results: Tutorial[] }> =>
  api.get('/api/v1/platform/tutorials/').then(r => r.data);

export const completeTutorial = (tutorialId: string, sessionId: string) =>
  api.post('/api/v1/platform/complete-tutorial/', { tutorial_id: tutorialId, session_id: sessionId }).then(r => r.data);

export const getTutorialProgress = (): Promise<{ progress: Array<{ id: string; title: string; completed: boolean }>; completed_count: number; total_count: number }> =>
  api.get('/api/v1/platform/tutorial-progress/').then(r => r.data);

// --- Challenges ---
export const getChallenges = (): Promise<{ results: Challenge[] }> =>
  api.get('/api/v1/platform/challenges/').then(r => r.data);

export const submitChallenge = (data: { challenge_id: string; prompt_text: string; model?: string }): Promise<ChallengeSubmission> =>
  api.post('/api/v1/platform/submit-challenge/', data).then(r => r.data);

// --- Techniques ---
export const getTechniqueLibrary = (): Promise<{ techniques: Technique[] }> =>
  api.get('/api/v1/platform/technique-library/').then(r => r.data);

// --- Production ---
export const runCostOptimizer = (data: { prompt_text: string; system_prompt?: string; model?: string }): Promise<ExecutionResult> =>
  api.post('/api/v1/platform/cost-optimizer/', data).then(r => r.data);

export const runModelComparison = (data: {
  prompt_text: string; system_prompt?: string; input_text: string; models: string[];
}): Promise<ExecutionResult> =>
  api.post('/api/v1/platform/model-comparison/', data).then(r => r.data);

export const generateSnippet = (data: {
  system_prompt: string; user_prompt_template: string; model?: string; language: string;
}): Promise<{ snippet: string; language: string }> =>
  api.post('/api/v1/platform/snippet-generator/', data).then(r => r.data);

// --- Community ---
export const getCommunityPrompts = (): Promise<{ results: SharedPrompt[] }> =>
  api.get('/api/v1/platform/community/').then(r => r.data);

export const sharePrompt = (data: Partial<SharedPrompt>): Promise<SharedPrompt> =>
  api.post('/api/v1/platform/community/', data).then(r => r.data);

export const upvotePrompt = (id: string) =>
  api.post(`/api/v1/platform/community/${id}/upvote/`).then(r => r.data);

export const downloadSharedPrompt = (id: string): Promise<SharedPrompt> =>
  api.post(`/api/v1/platform/community/${id}/download/`).then(r => r.data);

// --- Search ---
export const globalSearch = (query: string, scope?: string) =>
  api.post('/api/v1/platform/search/', { query, scope: scope || 'all' }).then(r => r.data);

// --- Seed ---
export const seedPlatformData = () =>
  api.post('/api/v1/platform/seed-data/').then(r => r.data);
