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
import { PromptGrader } from './pages/PromptGrader';
import { ABTester } from './pages/ABTester';
import { SchemaEnforcer } from './pages/SchemaEnforcer';
import { SelfCorrectingLoop } from './pages/SelfCorrectingLoop';
import { QualityGatePipeline } from './pages/QualityGatePipeline';
import { DecompositionWorkflow } from './pages/DecompositionWorkflow';
import { InjectionTester } from './pages/InjectionTester';
import { FewShotBuilder } from './pages/FewShotBuilder';
import { ExpertPanel } from './pages/ExpertPanel';
import { DocumentQA } from './pages/DocumentQA';
import { ComplianceChecker } from './pages/ComplianceChecker';
import { ToneTransformer } from './pages/ToneTransformer';
import { MisconceptionDetector } from './pages/MisconceptionDetector';
import { CoTVisualizer } from './pages/CoTVisualizer';
import { RAGSimulator } from './pages/RAGSimulator';
import { ScenarioSimulator } from './pages/ScenarioSimulator';
import { Localizer } from './pages/Localizer';

type PageKey =
  | 'dashboard' | 'feedback' | 'meeting' | 'quiz' | 'slides'
  | 'complaint' | 'custom' | 'templates' | 'history' | 'agents' | 'mcp'
  | 'grader' | 'abtester' | 'schema' | 'selfcorrect' | 'qualitygate'
  | 'decompose' | 'injection' | 'fewshot'
  | 'expertpanel' | 'documentqa' | 'compliance'
  | 'tone' | 'misconception' | 'cot'
  | 'rag' | 'scenario' | 'localizer';

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
      case 'grader': return <PromptGrader />;
      case 'abtester': return <ABTester />;
      case 'schema': return <SchemaEnforcer />;
      case 'selfcorrect': return <SelfCorrectingLoop />;
      case 'qualitygate': return <QualityGatePipeline />;
      case 'decompose': return <DecompositionWorkflow />;
      case 'injection': return <InjectionTester />;
      case 'fewshot': return <FewShotBuilder />;
      case 'expertpanel': return <ExpertPanel />;
      case 'documentqa': return <DocumentQA />;
      case 'compliance': return <ComplianceChecker />;
      case 'tone': return <ToneTransformer />;
      case 'misconception': return <MisconceptionDetector />;
      case 'cot': return <CoTVisualizer />;
      case 'rag': return <RAGSimulator />;
      case 'scenario': return <ScenarioSimulator />;
      case 'localizer': return <Localizer />;
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
