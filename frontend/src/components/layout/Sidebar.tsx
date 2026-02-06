import React, { useState } from 'react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  key: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const sections: NavSection[] = [
  {
    title: 'Prompt Features',
    defaultOpen: true,
    items: [
      { key: 'feedback', label: 'Feedback Analysis', icon: '💬' },
      { key: 'meeting', label: 'Meeting Summarizer', icon: '📝' },
      { key: 'quiz', label: 'Quiz Generator', icon: '📋' },
      { key: 'slides', label: 'Slide Scripts', icon: '📊' },
      { key: 'complaint', label: 'Complaint Response', icon: '🎧' },
      { key: 'custom', label: 'Custom Prompt', icon: '⚡' },
    ],
  },
  {
    title: 'Advanced',
    defaultOpen: false,
    items: [
      { key: 'grader', label: 'Prompt Grader', icon: '🎯' },
      { key: 'abtester', label: 'A/B Tester', icon: '⚖️' },
      { key: 'schema', label: 'Schema Enforcer', icon: '📐' },
      { key: 'selfcorrect', label: 'Self-Correcting', icon: '🔄' },
      { key: 'qualitygate', label: 'Quality Gates', icon: '🛡️' },
      { key: 'decompose', label: 'Decomposition', icon: '🧩' },
      { key: 'injection', label: 'Injection Tester', icon: '🔒' },
      { key: 'fewshot', label: 'Few-Shot Builder', icon: '🎓' },
    ],
  },
  {
    title: 'Knowledge',
    defaultOpen: false,
    items: [
      { key: 'expertpanel', label: 'Expert Panel', icon: '👥' },
      { key: 'documentqa', label: 'Document Q&A', icon: '📄' },
      { key: 'compliance', label: 'Compliance Checker', icon: '✅' },
    ],
  },
  {
    title: 'Specialized',
    defaultOpen: false,
    items: [
      { key: 'tone', label: 'Tone Transformer', icon: '🎨' },
      { key: 'misconception', label: 'Misconception Detector', icon: '🔍' },
      { key: 'cot', label: 'CoT Visualizer', icon: '🧠' },
    ],
  },
  {
    title: 'Extended',
    defaultOpen: false,
    items: [
      { key: 'rag', label: 'RAG Simulator', icon: '📚' },
      { key: 'scenario', label: 'Scenario Simulator', icon: '🎭' },
      { key: 'localizer', label: 'Localizer', icon: '🌐' },
    ],
  },
  {
    title: 'Reasoning',
    defaultOpen: false,
    items: [
      { key: 'selfconsistency', label: 'Self-Consistency', icon: '🗳️' },
      { key: 'tot', label: 'Tree of Thoughts', icon: '🌳' },
      { key: 'reflection', label: 'Reflection Loop', icon: '🪞' },
    ],
  },
  {
    title: 'Agent Patterns',
    defaultOpen: false,
    items: [
      { key: 'react', label: 'ReAct Agent', icon: '⚡' },
      { key: 'roledesigner', label: 'Role Designer', icon: '🎭' },
      { key: 'coordinator', label: 'Coordinator', icon: '🔀' },
    ],
  },
  {
    title: 'Auto-Optimization',
    defaultOpen: false,
    items: [
      { key: 'ape', label: 'APE Studio', icon: '🤖' },
      { key: 'evolution', label: 'Prompt Evolution', icon: '🧬' },
      { key: 'metaprompt', label: 'Meta Prompt', icon: '🔮' },
    ],
  },
  {
    title: 'Safety',
    defaultOpen: false,
    items: [
      { key: 'guardrails', label: 'Guardrail Builder', icon: '🛡️' },
      { key: 'selfverify', label: 'Self-Verification', icon: '✔️' },
    ],
  },
  {
    title: 'Context & Memory',
    defaultOpen: false,
    items: [
      { key: 'contextpack', label: 'Context Packing', icon: '📦' },
      { key: 'memoryaware', label: 'Memory-Aware', icon: '🧠' },
    ],
  },
  {
    title: 'Learning Hub',
    defaultOpen: false,
    items: [
      { key: 'tutorials', label: 'Tutorials', icon: '📖' },
      { key: 'challenges', label: 'Challenges', icon: '🏆' },
      { key: 'techniques', label: 'Technique Library', icon: '📘' },
      { key: 'beforeafter', label: 'Before / After', icon: '🔀' },
    ],
  },
  {
    title: 'Workspace',
    defaultOpen: false,
    items: [
      { key: 'projects', label: 'Projects', icon: '📁' },
      { key: 'versions', label: 'Version History', icon: '🕐' },
      { key: 'diff', label: 'Prompt Diff', icon: '📝' },
      { key: 'favorites', label: 'Favorites', icon: '⭐' },
    ],
  },
  {
    title: 'Testing',
    defaultOpen: false,
    items: [
      { key: 'testsuite', label: 'Test Suites', icon: '🧪' },
      { key: 'batcheval', label: 'Batch Evaluation', icon: '📦' },
      { key: 'benchmark', label: 'Benchmark', icon: '📊' },
      { key: 'consistency', label: 'Consistency', icon: '🎯' },
    ],
  },
  {
    title: 'Production',
    defaultOpen: false,
    items: [
      { key: 'deployexport', label: 'Export Pack', icon: '📤' },
      { key: 'snippets', label: 'Code Snippets', icon: '💻' },
      { key: 'costopt', label: 'Cost Optimizer', icon: '💰' },
      { key: 'modelmatrix', label: 'Model Comparison', icon: '⚡' },
    ],
  },
  {
    title: 'Community',
    defaultOpen: false,
    items: [
      { key: 'gallery', label: 'Prompt Gallery', icon: '🌍' },
      { key: 'auth', label: 'Account', icon: '👤' },
    ],
  },
  {
    title: 'System',
    defaultOpen: false,
    items: [
      { key: 'templates', label: 'Template Library', icon: '📚' },
      { key: 'agents', label: 'Multi-Agent', icon: '🤖' },
      { key: 'mcp', label: 'MCP Explorer', icon: '🔌' },
      { key: 'history', label: 'Execution History', icon: '📜' },
    ],
  },
];

const CollapsibleSection: React.FC<{
  section: NavSection;
  currentPage: string;
  onNavigate: (page: string) => void;
}> = ({ section, currentPage, onNavigate }) => {
  const hasActive = section.items.some((i) => i.key === currentPage);
  const [open, setOpen] = useState(section.defaultOpen || hasActive);

  return (
    <div className="nav-section">
      <div
        className="nav-section-title"
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => setOpen(!open)}
      >
        <span>{section.title}</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{open ? '▼' : '▶'}</span>
      </div>
      {open &&
        section.items.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>PromptForge</h1>
        <p>AI Prompt Engineering IDE</p>
      </div>

      <nav>
        <div className="nav-section">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <span>📈</span> Dashboard
          </button>
        </div>

        {sections.map((section) => (
          <CollapsibleSection
            key={section.title}
            section={section}
            currentPage={currentPage}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
};
