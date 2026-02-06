/**
 * Model Context Protocol (MCP) Routes
 *
 * Implements MCP server endpoints for tool discovery, context management,
 * and prompt execution through the MCP protocol.
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

// MCP Tool Registry - defines available tools for MCP clients
const MCP_TOOLS = [
  {
    name: 'analyze_feedback',
    description: 'Analyze customer/patient feedback and extract structured insights including sentiment, ratings, and issues.',
    inputSchema: {
      type: 'object',
      properties: {
        review_text: { type: 'string', description: 'The customer review/feedback text to analyze' },
        model: { type: 'string', default: 'gpt-4o-mini' },
        temperature: { type: 'number', default: 0.0, minimum: 0, maximum: 2 },
      },
      required: ['review_text'],
    },
    endpoint: '/api/v1/execute/feedback-analysis/',
  },
  {
    name: 'summarize_meeting',
    description: 'Summarize meeting transcripts into structured notes with objectives, participants, and action items.',
    inputSchema: {
      type: 'object',
      properties: {
        transcript: { type: 'string', description: 'The meeting transcript to summarize' },
        model: { type: 'string', default: 'gpt-4o-mini' },
        temperature: { type: 'number', default: 0.0 },
      },
      required: ['transcript'],
    },
    endpoint: '/api/v1/execute/meeting-summarizer/',
  },
  {
    name: 'generate_quiz',
    description: 'Generate multiple-choice quiz questions from provided educational content.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Source content for quiz generation' },
        num_questions: { type: 'integer', default: 5, minimum: 1, maximum: 20 },
        difficulty_mix: { type: 'string', default: '2 easy, 2 intermediate, 1 hard' },
        model: { type: 'string', default: 'gpt-4o-mini' },
      },
      required: ['content'],
    },
    endpoint: '/api/v1/execute/quiz-generator/',
  },
  {
    name: 'generate_slide_script',
    description: 'Generate presentation slide scripts with titles, bullet points, and speaker notes.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Presentation topic' },
        num_slides: { type: 'integer', default: 3, minimum: 1, maximum: 20 },
        style: { type: 'string', default: 'professional', enum: ['professional', 'casual', 'academic', 'sales'] },
        model: { type: 'string', default: 'gpt-4o-mini' },
      },
      required: ['topic'],
    },
    endpoint: '/api/v1/execute/slide-script/',
  },
  {
    name: 'respond_to_complaint',
    description: 'Generate professional and empathetic customer complaint responses with sentiment analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        complaint: { type: 'string', description: 'Customer complaint text' },
        company_name: { type: 'string', default: 'Our Company' },
        agent_name: { type: 'string', default: 'Support Agent' },
        model: { type: 'string', default: 'gpt-4o-mini' },
      },
      required: ['complaint'],
    },
    endpoint: '/api/v1/execute/complaint-response/',
  },
  {
    name: 'custom_prompt',
    description: 'Execute a custom prompt with configurable system and user messages.',
    inputSchema: {
      type: 'object',
      properties: {
        system_prompt: { type: 'string', default: '' },
        user_prompt: { type: 'string', description: 'The prompt to execute' },
        model: { type: 'string', default: 'gpt-4o-mini' },
        temperature: { type: 'number', default: 0.7 },
        max_tokens: { type: 'integer', default: 1024 },
      },
      required: ['user_prompt'],
    },
    endpoint: '/api/v1/execute/custom/',
  },
];

// MCP Server Info
router.get('/info', (req, res) => {
  res.json({
    name: 'Prompt Engineering MCP Server',
    version: '1.0.0',
    protocol: 'MCP',
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: true,
      resources: true,
      prompts: true,
    },
    description: 'AI-driven prompt engineering platform with multi-agent capabilities.',
  });
});

// List available MCP tools
router.get('/tools', (req, res) => {
  res.json({
    tools: MCP_TOOLS.map(({ endpoint, ...tool }) => tool),
  });
});

// Execute an MCP tool
router.post('/tools/execute', async (req, res) => {
  const { tool_name, arguments: args } = req.body;
  const tool = MCP_TOOLS.find((t) => t.name === tool_name);

  if (!tool) {
    return res.status(404).json({ error: `Tool not found: ${tool_name}` });
  }

  try {
    const response = await axios.post(`${BACKEND_URL}${tool.endpoint}`, args, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });

    const broadcast = req.app.get('broadcast');
    if (broadcast) {
      broadcast({
        type: 'mcp_tool_executed',
        tool: tool_name,
        execution_id: response.data.execution_id,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      content: [
        {
          type: 'text',
          text: response.data.output || JSON.stringify(response.data),
        },
      ],
      metadata: {
        execution_id: response.data.execution_id,
        tokens_input: response.data.tokens_input,
        tokens_output: response.data.tokens_output,
        cost_estimate: response.data.cost_estimate,
        latency_ms: response.data.latency_ms,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.response?.data?.error || error.message,
      isError: true,
    });
  }
});

// MCP Resources - list available prompt templates as resources
router.get('/resources', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/v1/templates/`, { timeout: 10000 });
    const templates = response.data.results || response.data;

    res.json({
      resources: templates.map((t) => ({
        uri: `prompt-template://${t.id}`,
        name: t.name,
        description: t.description,
        mimeType: 'application/json',
        metadata: {
          category: t.category,
          difficulty: t.difficulty,
          usage_count: t.usage_count,
        },
      })),
    });
  } catch {
    res.json({ resources: [] });
  }
});

// MCP Prompts - list available prompt patterns
router.get('/prompts', (req, res) => {
  res.json({
    prompts: [
      {
        name: 'feedback_analysis',
        description: 'Analyze customer feedback for structured insights',
        arguments: [
          { name: 'review_text', description: 'The review to analyze', required: true },
        ],
      },
      {
        name: 'meeting_summary',
        description: 'Summarize meeting transcripts',
        arguments: [
          { name: 'transcript', description: 'Meeting transcript', required: true },
        ],
      },
      {
        name: 'quiz_generation',
        description: 'Generate training quizzes',
        arguments: [
          { name: 'content', description: 'Source material', required: true },
          { name: 'num_questions', description: 'Number of questions', required: false },
        ],
      },
      {
        name: 'slide_script',
        description: 'Generate presentation scripts',
        arguments: [
          { name: 'topic', description: 'Presentation topic', required: true },
          { name: 'num_slides', description: 'Number of slides', required: false },
        ],
      },
      {
        name: 'complaint_response',
        description: 'Generate complaint responses',
        arguments: [
          { name: 'complaint', description: 'Customer complaint', required: true },
        ],
      },
    ],
  });
});

module.exports = router;
