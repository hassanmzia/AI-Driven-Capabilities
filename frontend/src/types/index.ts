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
  | 'custom';
