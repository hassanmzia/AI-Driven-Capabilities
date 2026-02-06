export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  category_display: string;
  difficulty: string;
  system_prompt: string;
  user_prompt_template: string;
  example_input: string;
  example_output: string;
  parameters: Record<string, ParameterSchema>;
  tags: string[];
  is_active: boolean;
  is_builtin: boolean;
  usage_count: number;
  avg_rating: number;
  created_at: string;
  updated_at: string;
  version_count: number;
}

export interface ParameterSchema {
  type: string;
  label: string;
  required?: boolean;
  default?: string | number;
  min?: number;
  max?: number;
  options?: string[];
}

export interface ExecutionResult {
  execution_id: string;
  output: string;
  error?: string;
  tokens_input: number;
  tokens_output: number;
  cost_estimate: number;
  latency_ms: number;
  model: string;
}

export interface PromptExecution {
  id: string;
  template: string | null;
  template_name: string;
  category: string;
  input_data: string;
  system_prompt: string;
  user_prompt: string;
  output_data: string;
  status: string;
  model_used: string;
  tokens_input: number;
  tokens_output: number;
  cost_estimate: number;
  latency_ms: number;
  rating: number | null;
  feedback: string;
  created_at: string;
}

export interface DashboardStats {
  total_executions: number;
  recent_executions_7d: number;
  total_tokens_input: number;
  total_tokens_output: number;
  total_cost: number;
  avg_latency_ms: number;
  avg_rating: number;
  category_breakdown: CategoryStat[];
  daily_usage: DailyUsage[];
  model_usage: ModelUsage[];
  top_templates: TopTemplate[];
}

export interface CategoryStat {
  category: string;
  count: number;
  avg_lat: number;
  avg_rate: number;
}

export interface DailyUsage {
  date: string;
  count: number;
  cost: number;
}

export interface ModelUsage {
  model_used: string;
  count: number;
  total_cost: number;
}

export interface TopTemplate {
  id: string;
  name: string;
  category: string;
  usage_count: number;
  avg_rating: number;
}

export interface AgentCard {
  agent_id: string;
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  model: string;
  mcp_endpoint: string;
  protocol_version: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface A2ATask {
  id: string;
  status: string;
  skill_id: string;
  result?: { type: string; text: string };
  metadata?: Record<string, unknown>;
  error?: string;
}

export type FeatureCategory =
  | 'feedback_analysis'
  | 'meeting_summarizer'
  | 'quiz_generator'
  | 'slide_script'
  | 'complaint_response'
  | 'custom'
  | 'prompt_grader'
  | 'prompt_compare'
  | 'schema_enforcer'
  | 'self_correcting'
  | 'quality_pipeline'
  | 'decomposition'
  | 'injection_tester'
  | 'fewshot_builder'
  | 'expert_panel'
  | 'document_qa'
  | 'compliance_checker'
  | 'tone_transformer'
  | 'misconception_detector'
  | 'cot_visualizer'
  | 'rag_simulator'
  | 'scenario_simulator'
  | 'localizer'
  | 'self_consistency'
  | 'tree_of_thoughts'
  | 'reflection_loop'
  | 'react_agent'
  | 'agent_role_designer'
  | 'coordinator_router'
  | 'ape_studio'
  | 'prompt_evolution'
  | 'meta_prompt'
  | 'guardrail_builder'
  | 'self_verification'
  | 'context_packer'
  | 'memory_aware';

export interface CompareResult extends ExecutionResult {
  output_a?: string;
  output_b?: string;
}

// --- Platform Types ---

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  theme: string;
  onboarding_completed: boolean;
  avatar_color: string;
  profile_picture: string;
  phone: string;
  address: string;
  bio: string;
  company: string;
  job_title: string;
  date_joined: string;
}

export interface PromptProject {
  id: string;
  name: string;
  description: string;
  is_shared: boolean;
  tags: string[];
  prompt_count: number;
  test_suite_count: number;
  created_at: string;
  updated_at: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  prompt_text: string;
  system_prompt: string;
  model: string;
  project: string | null;
  test_cases: TestCase[];
  run_count: number;
  created_at: string;
}

export interface TestCase {
  id: string;
  suite: string;
  name: string;
  input_text: string;
  expected_output: string;
  criteria: string;
  order: number;
}

export interface TestRun {
  id: string;
  suite: string;
  prompt_text: string;
  model: string;
  total_cases: number;
  passed_cases: number;
  avg_score: number;
  total_tokens: number;
  total_cost: number;
  total_latency_ms: number;
  pass_rate: number;
  results: TestResultItem[];
  created_at: string;
}

export interface TestResultItem {
  id: string;
  test_case_name: string;
  actual_output: string;
  score: number;
  passed: boolean;
  evaluation: string;
  tokens_used: number;
  latency_ms: number;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  content: string;
  example_prompt: string;
  example_input: string;
  sandbox_enabled: boolean;
  order: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  criteria: string;
  test_input: string;
  expected_behavior: string;
  hints: string[];
  points: number;
  submission_count: number;
  best_score: number | null;
}

export interface ChallengeSubmission {
  submission_id: string;
  output: string;
  evaluation: string;
  score: number;
  tokens_input: number;
  cost_estimate: number;
  latency_ms: number;
  model: string;
}

export interface SharedPrompt {
  id: string;
  title: string;
  description: string;
  system_prompt: string;
  user_prompt_template: string;
  category: string;
  tags: string[];
  author_name: string;
  upvotes: number;
  downloads: number;
  created_at: string;
}

export interface Technique {
  name: string;
  category: string;
  description: string;
  when_to_use: string;
  example: string;
}

export interface PromptCollection {
  id: string;
  name: string;
  description: string;
  favorite_count: number;
  created_at: string;
}

export interface PromptFavorite {
  id: string;
  execution: string;
  collection: string | null;
  notes: string;
  created_at: string;
}
