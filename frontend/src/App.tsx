import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';

// Error boundary to catch runtime crashes and show useful error info
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crash:', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ef4444' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ccc', background: '#1a1a2e', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
            {this.state.error}
          </pre>
          <button
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            onClick={() => this.setState({ hasError: false, error: '' })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
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
// Phase 7: Learning Hub
import { TutorialHub } from './pages/TutorialHub';
import { ChallengePlayground } from './pages/ChallengePlayground';
import { TechniqueLibrary } from './pages/TechniqueLibrary';
import { BeforeAfterComparator } from './pages/BeforeAfterComparator';
// Phase 8: Workspace
import { ProjectManager } from './pages/ProjectManager';
import { VersionHistory } from './pages/VersionHistory';
import { PromptDiffViewer } from './pages/PromptDiffViewer';
import { FavoritesManager } from './pages/FavoritesManager';
// Phase 9: Testing
import { TestSuiteBuilder } from './pages/TestSuiteBuilder';
import { BatchRunner } from './pages/BatchRunner';
import { BenchmarkDashboard } from './pages/BenchmarkDashboard';
import { ConsistencyAnalyzer } from './pages/ConsistencyAnalyzer';
// Phase 10: Production
import { DeploymentExport } from './pages/DeploymentExport';
import { SnippetGenerator } from './pages/SnippetGenerator';
import { CostOptimizer } from './pages/CostOptimizer';
import { ModelComparison } from './pages/ModelComparison';
// Phase 11-12: Community & Auth
import { CommunityGallery } from './pages/CommunityGallery';
import { AuthPage } from './pages/AuthPage';

type PageKey =
  | 'dashboard' | 'feedback' | 'meeting' | 'quiz' | 'slides'
  | 'complaint' | 'custom' | 'templates' | 'history' | 'agents' | 'mcp'
  | 'grader' | 'abtester' | 'schema' | 'selfcorrect' | 'qualitygate'
  | 'decompose' | 'injection' | 'fewshot'
  | 'expertpanel' | 'documentqa' | 'compliance'
  | 'tone' | 'misconception' | 'cot'
  | 'rag' | 'scenario' | 'localizer'
  | 'tutorials' | 'challenges' | 'techniques' | 'beforeafter'
  | 'projects' | 'versions' | 'diff' | 'favorites'
  | 'testsuite' | 'batcheval' | 'benchmark' | 'consistency'
  | 'deployexport' | 'snippets' | 'costopt' | 'modelmatrix'
  | 'gallery' | 'auth';

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
      // Phase 7: Learning Hub
      case 'tutorials': return <TutorialHub />;
      case 'challenges': return <ChallengePlayground />;
      case 'techniques': return <TechniqueLibrary />;
      case 'beforeafter': return <BeforeAfterComparator />;
      // Phase 8: Workspace
      case 'projects': return <ProjectManager />;
      case 'versions': return <VersionHistory />;
      case 'diff': return <PromptDiffViewer />;
      case 'favorites': return <FavoritesManager />;
      // Phase 9: Testing
      case 'testsuite': return <TestSuiteBuilder />;
      case 'batcheval': return <BatchRunner />;
      case 'benchmark': return <BenchmarkDashboard />;
      case 'consistency': return <ConsistencyAnalyzer />;
      // Phase 10: Production
      case 'deployexport': return <DeploymentExport />;
      case 'snippets': return <SnippetGenerator />;
      case 'costopt': return <CostOptimizer />;
      case 'modelmatrix': return <ModelComparison />;
      // Phase 11-12: Community
      case 'gallery': return <CommunityGallery />;
      case 'auth': return <AuthPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as PageKey)} />
      <main className="main-content">
        <ErrorBoundary key={currentPage}>
          {renderPage()}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
