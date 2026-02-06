import React from 'react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  key: string;
  label: string;
  icon: string;
}

const featureItems: NavItem[] = [
  { key: 'feedback', label: 'Feedback Analysis', icon: '💬' },
  { key: 'meeting', label: 'Meeting Summarizer', icon: '📝' },
  { key: 'quiz', label: 'Quiz Generator', icon: '📋' },
  { key: 'slides', label: 'Slide Scripts', icon: '📊' },
  { key: 'complaint', label: 'Complaint Response', icon: '🎧' },
  { key: 'custom', label: 'Custom Prompt', icon: '⚡' },
];

const advancedItems: NavItem[] = [
  { key: 'grader', label: 'Prompt Grader', icon: '🎯' },
  { key: 'abtester', label: 'A/B Tester', icon: '⚖️' },
  { key: 'schema', label: 'Schema Enforcer', icon: '📐' },
  { key: 'selfcorrect', label: 'Self-Correcting', icon: '🔄' },
  { key: 'qualitygate', label: 'Quality Gates', icon: '🛡️' },
  { key: 'decompose', label: 'Decomposition', icon: '🧩' },
  { key: 'injection', label: 'Injection Tester', icon: '🔒' },
  { key: 'fewshot', label: 'Few-Shot Builder', icon: '🎓' },
];

const knowledgeItems: NavItem[] = [
  { key: 'expertpanel', label: 'Expert Panel', icon: '👥' },
  { key: 'documentqa', label: 'Document Q&A', icon: '📄' },
  { key: 'compliance', label: 'Compliance Checker', icon: '✅' },
];

const specializedItems: NavItem[] = [
  { key: 'tone', label: 'Tone Transformer', icon: '🎨' },
  { key: 'misconception', label: 'Misconception Detector', icon: '🔍' },
  { key: 'cot', label: 'CoT Visualizer', icon: '🧠' },
];

const extendedItems: NavItem[] = [
  { key: 'rag', label: 'RAG Simulator', icon: '📚' },
  { key: 'scenario', label: 'Scenario Simulator', icon: '🎭' },
  { key: 'localizer', label: 'Localizer', icon: '🌐' },
];

const systemItems: NavItem[] = [
  { key: 'templates', label: 'Template Library', icon: '📚' },
  { key: 'agents', label: 'Multi-Agent', icon: '🤖' },
  { key: 'mcp', label: 'MCP Explorer', icon: '🔌' },
  { key: 'history', label: 'Execution History', icon: '📜' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>PromptForge</h1>
        <p>AI Prompt Engineering Platform</p>
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

        <div className="nav-section">
          <div className="nav-section-title">Prompt Features</div>
          {featureItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Advanced</div>
          {advancedItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Knowledge</div>
          {knowledgeItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Specialized</div>
          {specializedItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Extended</div>
          {extendedItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">System</div>
          {systemItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
};
