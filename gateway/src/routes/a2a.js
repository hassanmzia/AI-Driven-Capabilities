/**
 * Agent-to-Agent (A2A) Protocol Routes
 *
 * Implements the A2A protocol for multi-agent communication,
 * task delegation, and workflow orchestration.
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';
const A2A_VERSION = process.env.A2A_PROTOCOL_VERSION || '1.0';

// A2A Agent Card - describes this server's capabilities
router.get('/.well-known/agent.json', (req, res) => {
  res.json({
    name: 'Prompt Engineering Multi-Agent System',
    version: A2A_VERSION,
    description: 'AI-driven prompt engineering platform with specialized agents for content analysis, generation, and quality review.',
    url: `http://172.168.1.95:4070/a2a`,
    capabilities: {
      streaming: false,
      pushNotifications: true,
      stateTransitionHistory: true,
    },
    skills: [
      {
        id: 'feedback-analysis',
        name: 'Customer Feedback Analysis',
        description: 'Extracts structured insights from customer/patient reviews.',
        tags: ['NLP', 'sentiment', 'healthcare'],
      },
      {
        id: 'meeting-summarization',
        name: 'Meeting Summarization',
        description: 'Summarizes meeting transcripts into structured action items.',
        tags: ['NLP', 'summarization', 'productivity'],
      },
      {
        id: 'quiz-generation',
        name: 'Quiz Generation',
        description: 'Generates assessment quizzes from educational content.',
        tags: ['education', 'assessment', 'content-generation'],
      },
      {
        id: 'slide-script-generation',
        name: 'Slide Script Generation',
        description: 'Creates presentation scripts with speaker notes.',
        tags: ['presentation', 'content-generation'],
      },
      {
        id: 'complaint-response',
        name: 'Complaint Response',
        description: 'Generates empathetic customer complaint responses.',
        tags: ['customer-support', 'response-generation'],
      },
      {
        id: 'multi-agent-workflow',
        name: 'Multi-Agent Workflow',
        description: 'Orchestrates multi-agent pipelines with routing, execution, and quality review.',
        tags: ['orchestration', 'multi-agent'],
      },
    ],
    authentication: {
      schemes: ['none'],
    },
  });
});

// List available agents
router.get('/agents', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/v1/agents/cards/`, { timeout: 10000 });
    res.json(response.data);
  } catch {
    res.json({
      agents: [],
      protocol: 'A2A',
      version: A2A_VERSION,
    });
  }
});

// Send a task to the A2A system
router.post('/tasks/send', async (req, res) => {
  const { skill_id, input, metadata } = req.body;

  if (!skill_id || !input) {
    return res.status(400).json({ error: 'skill_id and input are required' });
  }

  const taskId = uuidv4();

  // Map skill to backend endpoint
  const skillMap = {
    'feedback-analysis': { url: '/api/v1/execute/feedback-analysis/', body: { review_text: input } },
    'meeting-summarization': { url: '/api/v1/execute/meeting-summarizer/', body: { transcript: input } },
    'quiz-generation': { url: '/api/v1/execute/quiz-generator/', body: { content: input, ...metadata } },
    'slide-script-generation': { url: '/api/v1/execute/slide-script/', body: { topic: input, ...metadata } },
    'complaint-response': { url: '/api/v1/execute/complaint-response/', body: { complaint: input, ...metadata } },
    'multi-agent-workflow': { url: '/api/v1/agents/workflow/', body: { task: input, category: metadata?.category || 'custom', input_data: input } },
  };

  const skill = skillMap[skill_id];
  if (!skill) {
    return res.status(404).json({ error: `Unknown skill: ${skill_id}` });
  }

  try {
    const response = await axios.post(`${BACKEND_URL}${skill.url}`, skill.body, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });

    const broadcast = req.app.get('broadcast');
    if (broadcast) {
      broadcast({
        type: 'a2a_task_complete',
        task_id: taskId,
        skill_id,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      id: taskId,
      status: 'completed',
      skill_id,
      result: {
        type: 'text',
        text: response.data.output || JSON.stringify(response.data),
      },
      metadata: {
        execution_id: response.data.execution_id,
        tokens_input: response.data.tokens_input,
        tokens_output: response.data.tokens_output,
        cost_estimate: response.data.cost_estimate,
        latency_ms: response.data.latency_ms,
      },
      history: [
        { state: 'submitted', timestamp: new Date().toISOString() },
        { state: 'working', timestamp: new Date().toISOString() },
        { state: 'completed', timestamp: new Date().toISOString() },
      ],
    });
  } catch (error) {
    res.status(500).json({
      id: taskId,
      status: 'failed',
      skill_id,
      error: error.response?.data?.error || error.message,
    });
  }
});

// Get task status
router.get('/tasks/:taskId', (req, res) => {
  // In a production system, this would look up the task in a persistent store
  res.json({
    id: req.params.taskId,
    status: 'completed',
    message: 'Task result available. Use /tasks/send for new executions.',
  });
});

module.exports = router;
