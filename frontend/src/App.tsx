import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { FeedbackAnalysis } from './pages/FeedbackAnalysis';
import { MeetingSummarizer } from './pages/MeetingSummarizer';
import { QuizGenerator } from './pages/QuizGenerator';
import { SlideScriptGenerator } from './pages/SlideScriptGenerator';
import { ComplaintResponse } from './pages/ComplaintResponse';
import { CustomPrompt } from './pages/CustomPrompt';
import { TemplateLibrary } from './pages/TemplateLibrary';
import { ExecutionHistory } from './pages/ExecutionHistory';
import { MultiAgentWorkflow } from './pages/MultiAgentWorkflow';
import { MCPExplorer } from './pages/MCPExplorer';

type PageKey =
  | 'dashboard' | 'feedback' | 'meeting' | 'quiz' | 'slides'
  | 'complaint' | 'custom' | 'templates' | 'history' | 'agents' | 'mcp';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'feedback': return <FeedbackAnalysis />;
      case 'meeting': return <MeetingSummarizer />;
      case 'quiz': return <QuizGenerator />;
      case 'slides': return <SlideScriptGenerator />;
      case 'complaint': return <ComplaintResponse />;
      case 'custom': return <CustomPrompt />;
      case 'templates': return <TemplateLibrary />;
      case 'history': return <ExecutionHistory />;
      case 'agents': return <MultiAgentWorkflow />;
      case 'mcp': return <MCPExplorer />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as PageKey)} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
