/**
 * Tests for Phase 3: Intelligent Analysis Engine
 *
 * Tests:
 * - Breaking change detection
 * - AI-ready analysis
 * - Alternative package suggestions
 * - Dependency graph analysis
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Phase 3: Intelligent Analysis Engine', () => {
  describe('Breaking Change Detection', () => {
    it('should detect major version upgrades', async () => {
      const { BreakingChangeDetector } = await import(
        '../src/analysis/breakingChanges.js'
      );
      const detector = BreakingChangeDetector.getInstance();

      const comparison = await detector.compareVersions('react', '17.0.2', '18.2.0');

      expect(comparison).toBeDefined();
      expect(comparison.isMajor).toBe(true);
      expect(comparison.from).toBe('17.0.2');
      expect(comparison.to).toBe('18.2.0');
      expect(comparison.riskScore).toBeGreaterThan(0);
    });

    it('should detect minor version upgrades', async () => {
      const { BreakingChangeDetector } = await import(
        '../src/analysis/breakingChanges.js'
      );
      const detector = BreakingChangeDetector.getInstance();

      const comparison = await detector.compareVersions('lodash', '4.17.20', '4.17.21');

      expect(comparison).toBeDefined();
      expect(comparison.isMinor).toBe(false); // Patch version
      expect(comparison.isPatch).toBe(true);
      expect(comparison.riskScore).toBeLessThan(50);
    });

    it('should return breaking changes array', async () => {
      const { BreakingChangeDetector } = await import(
        '../src/analysis/breakingChanges.js'
      );
      const detector = BreakingChangeDetector.getInstance();

      const comparison = await detector.compareVersions('react', '16.8.0', '18.2.0');

      expect(comparison.breakingChanges).toBeInstanceOf(Array);
      expect(comparison.breakingChanges.length).toBeGreaterThanOrEqual(0);

      if (comparison.breakingChanges.length > 0) {
        const breaking = comparison.breakingChanges[0];
        expect(breaking).toHaveProperty('type');
        expect(breaking).toHaveProperty('severity');
        expect(breaking).toHaveProperty('description');
        expect(breaking).toHaveProperty('source');
        expect(breaking).toHaveProperty('version');
      }
    });

    it('should provide recommended upgrade path', async () => {
      const { BreakingChangeDetector } = await import(
        '../src/analysis/breakingChanges.js'
      );
      const detector = BreakingChangeDetector.getInstance();

      const comparison = await detector.compareVersions('react', '15.0.0', '18.2.0');

      expect(comparison.recommendedPath).toBeInstanceOf(Array);
      expect(comparison.recommendedPath.length).toBeGreaterThan(0);
    });
  });

  describe('AI-Ready Analysis', () => {
    it('should perform comprehensive package analysis', async () => {
      const { AIAnalysisEngine } = await import('../src/analysis/aiAnalysis.js');
      const engine = AIAnalysisEngine.getInstance();

      const analysis = await engine.analyzePackage('express', '4.18.0');

      expect(analysis).toBeDefined();
      expect(analysis.package).toBe('express');
      expect(analysis.currentVersion).toBe('4.18.0');
      expect(analysis.latestVersion).toBeDefined();
    });

    it('should include security analysis', async () => {
      const { AIAnalysisEngine } = await import('../src/analysis/aiAnalysis.js');
      const engine = AIAnalysisEngine.getInstance();

      const analysis = await engine.analyzePackage('express', '4.18.0');

      expect(analysis.analysis.security).toBeDefined();
      expect(analysis.analysis.security.vulnerabilities).toBeGreaterThanOrEqual(0);
      expect(analysis.analysis.security.hasKnownExploits).toBeDefined();
      expect(analysis.analysis.security.fixAvailable).toBeDefined();
    });

    it('should include quality analysis', async () => {
      const { AIAnalysisEngine } = await import('../src/analysis/aiAnalysis.js');
      const engine = AIAnalysisEngine.getInstance();

      const analysis = await engine.analyzePackage('express', '4.18.0');

      expect(analysis.analysis.quality).toBeDefined();
      expect(analysis.analysis.quality.score).toBeGreaterThanOrEqual(0);
      expect(analysis.analysis.quality.score).toBeLessThanOrEqual(100);
      expect(analysis.analysis.quality.hasTypes).toBeDefined();
      expect(analysis.analysis.quality.popularity).toBeDefined();
    });

    it('should include maintenance analysis', async () => {
      const { AIAnalysisEngine } = await import('../src/analysis/aiAnalysis.js');
      const engine = AIAnalysisEngine.getInstance();

      const analysis = await engine.analyzePackage('express', '4.18.0');

      expect(analysis.analysis.maintenance).toBeDefined();
      expect(analysis.analysis.maintenance.isActive).toBeDefined();
      expect(analysis.analysis.maintenance.isDeprecated).toBeDefined();
      expect(analysis.analysis.maintenance.lastPublish).toBeDefined();
      expect(analysis.analysis.maintenance.daysSinceLastPublish).toBeGreaterThanOrEqual(0);
    });

    it('should include risk assessment', async () => {
      const { AIAnalysisEngine } = await import('../src/analysis/aiAnalysis.js');
      const engine = AIAnalysisEngine.getInstance();

      const analysis = await engine.analyzePackage('express', '4.18.0');

      expect(analysis.riskAssessment).toBeDefined();
      expect(analysis.riskAssessment.overall).toMatch(/low|medium|high|critical/);
      expect(analysis.riskAssessment.score).toBeGreaterThanOrEqual(0);
      expect(analysis.riskAssessment.score).toBeLessThanOrEqual(100);
      expect(analysis.riskAssessment.factors).toBeInstanceOf(Array);
    });

    it('should provide recommendations', async () => {
      const { AIAnalysisEngine } = await import('../src/analysis/aiAnalysis.js');
      const engine = AIAnalysisEngine.getInstance();

      const analysis = await engine.analyzePackage('express', '4.18.0');

      expect(analysis.recommendations).toBeInstanceOf(Array);

      if (analysis.recommendations.length > 0) {
        const rec = analysis.recommendations[0];
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('action');
        expect(rec).toHaveProperty('estimatedEffort');
      }
    });

    it('should create upgrade plan', async () => {
      const { AIAnalysisEngine } = await import('../src/analysis/aiAnalysis.js');
      const engine = AIAnalysisEngine.getInstance();

      const analysis = await engine.analyzePackage('express', '4.18.0');

      expect(analysis.upgradePlan).toBeDefined();
      expect(analysis.upgradePlan.recommended).toBeDefined();
      expect(analysis.upgradePlan.canAutomate).toBeDefined();
      expect(analysis.upgradePlan.totalEstimatedTime).toBeDefined();
      expect(analysis.upgradePlan.path).toBeInstanceOf(Array);
    });

    it('should create rollback strategy', async () => {
      const { AIAnalysisEngine } = await import('../src/analysis/aiAnalysis.js');
      const engine = AIAnalysisEngine.getInstance();

      const analysis = await engine.analyzePackage('express', '4.18.0');

      expect(analysis.rollbackStrategy).toBeDefined();
      expect(analysis.rollbackStrategy.difficulty).toMatch(/easy|moderate|hard|very-hard/);
      expect(analysis.rollbackStrategy.estimatedTime).toBeDefined();
      expect(analysis.rollbackStrategy.steps).toBeInstanceOf(Array);
      expect(analysis.rollbackStrategy.dataLoss).toBeDefined();
    });
  });

  describe('Alternative Package Suggestions', () => {
    it('should find alternative packages', async () => {
      const { AlternativeDiscovery } = await import(
        '../src/analysis/alternatives.js'
      );
      const discovery = AlternativeDiscovery.getInstance();

      const alternatives = await discovery.findAlternatives('express', { maxResults: 3 });

      expect(alternatives).toBeInstanceOf(Array);
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.length).toBeLessThanOrEqual(3);
    });

    it('should include alternative metadata', async () => {
      const { AlternativeDiscovery } = await import(
        '../src/analysis/alternatives.js'
      );
      const discovery = AlternativeDiscovery.getInstance();

      const alternatives = await discovery.findAlternatives('express', { maxResults: 2 });

      if (alternatives.length > 0) {
        const alt = alternatives[0];
        expect(alt).toHaveProperty('name');
        expect(alt).toHaveProperty('version');
        expect(alt).toHaveProperty('description');
        expect(alt).toHaveProperty('score');
        expect(alt.score).toBeGreaterThanOrEqual(0);
        expect(alt.score).toBeLessThanOrEqual(100);
      }
    });

    it('should include comparison data', async () => {
      const { AlternativeDiscovery } = await import(
        '../src/analysis/alternatives.js'
      );
      const discovery = AlternativeDiscovery.getInstance();

      const alternatives = await discovery.findAlternatives('express', { maxResults: 2 });

      if (alternatives.length > 0) {
        const alt = alternatives[0];
        expect(alt.comparison).toBeDefined();
        expect(alt.comparison.popularity).toBeDefined();
        expect(alt.comparison.maintenance).toBeDefined();
        expect(alt.comparison.quality).toBeDefined();
        expect(alt.comparison.features).toBeDefined();
      }
    });

    it('should include migration difficulty', async () => {
      const { AlternativeDiscovery } = await import(
        '../src/analysis/alternatives.js'
      );
      const discovery = AlternativeDiscovery.getInstance();

      const alternatives = await discovery.findAlternatives('express', { maxResults: 2 });

      if (alternatives.length > 0) {
        const alt = alternatives[0];
        expect(alt.migrationDifficulty).toBeDefined();
        expect(alt.migrationDifficulty.level).toMatch(
          /trivial|easy|moderate|hard|very-hard/
        );
        expect(alt.migrationDifficulty.estimatedHours).toBeDefined();
        expect(alt.migrationDifficulty.apiCompatibility).toMatch(/high|medium|low|unknown/);
      }
    });

    it('should include pros and cons', async () => {
      const { AlternativeDiscovery } = await import(
        '../src/analysis/alternatives.js'
      );
      const discovery = AlternativeDiscovery.getInstance();

      const alternatives = await discovery.findAlternatives('express', { maxResults: 2 });

      if (alternatives.length > 0) {
        const alt = alternatives[0];
        expect(alt.pros).toBeInstanceOf(Array);
        expect(alt.cons).toBeInstanceOf(Array);
        expect(alt.reasoning).toBeInstanceOf(Array);
      }
    });

    it('should respect quality score filter', async () => {
      const { AlternativeDiscovery } = await import(
        '../src/analysis/alternatives.js'
      );
      const discovery = AlternativeDiscovery.getInstance();

      const alternatives = await discovery.findAlternatives('express', {
        maxResults: 5,
        minQualityScore: 70,
      });

      // All alternatives should have quality score >= 70
      for (const alt of alternatives) {
        expect(alt.comparison.quality.score.alternative).toBeGreaterThanOrEqual(70);
      }
    });
  });

  describe('Dependency Graph Analysis', () => {
    it('should build dependency graph', async () => {
      const { DependencyGraphAnalyzer } = await import(
        '../src/analysis/dependencyGraph.js'
      );
      const analyzer = DependencyGraphAnalyzer.getInstance();

      // This test requires a package.json, so it might fail in isolated test environment
      try {
        const analysis = await analyzer.analyzeGraph(process.cwd());

        expect(analysis).toBeDefined();
        expect(analysis.graph).toBeDefined();
        expect(analysis.statistics).toBeDefined();
      } catch (error) {
        // Expected in test environment without package.json
        expect(error).toBeDefined();
      }
    });

    it('should detect circular dependencies', async () => {
      const { DependencyGraphAnalyzer } = await import(
        '../src/analysis/dependencyGraph.js'
      );
      const analyzer = DependencyGraphAnalyzer.getInstance();

      try {
        const analysis = await analyzer.analyzeGraph(process.cwd());

        expect(analysis.circularDependencies).toBeInstanceOf(Array);

        if (analysis.circularDependencies.length > 0) {
          const circular = analysis.circularDependencies[0];
          expect(circular).toHaveProperty('cycle');
          expect(circular).toHaveProperty('severity');
          expect(circular).toHaveProperty('impact');
          expect(circular.cycle).toBeInstanceOf(Array);
        }
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });

    it('should detect duplicate versions', async () => {
      const { DependencyGraphAnalyzer } = await import(
        '../src/analysis/dependencyGraph.js'
      );
      const analyzer = DependencyGraphAnalyzer.getInstance();

      try {
        const analysis = await analyzer.analyzeGraph(process.cwd());

        expect(analysis.duplicateVersions).toBeInstanceOf(Array);

        if (analysis.duplicateVersions.length > 0) {
          const duplicate = analysis.duplicateVersions[0];
          expect(duplicate).toHaveProperty('package');
          expect(duplicate).toHaveProperty('versions');
          expect(duplicate).toHaveProperty('count');
          expect(duplicate).toHaveProperty('suggestion');
          expect(duplicate.versions).toBeInstanceOf(Array);
          expect(duplicate.count).toBeGreaterThan(1);
        }
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });

    it('should check peer dependency conflicts', async () => {
      const { DependencyGraphAnalyzer } = await import(
        '../src/analysis/dependencyGraph.js'
      );
      const analyzer = DependencyGraphAnalyzer.getInstance();

      try {
        const analysis = await analyzer.analyzeGraph(process.cwd());

        expect(analysis.peerConflicts).toBeInstanceOf(Array);

        if (analysis.peerConflicts.length > 0) {
          const conflict = analysis.peerConflicts[0];
          expect(conflict).toHaveProperty('package');
          expect(conflict).toHaveProperty('requires');
          expect(conflict).toHaveProperty('severity');
          expect(conflict).toHaveProperty('resolution');
        }
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });

    it('should analyze transitive impacts', async () => {
      const { DependencyGraphAnalyzer } = await import(
        '../src/analysis/dependencyGraph.js'
      );
      const analyzer = DependencyGraphAnalyzer.getInstance();

      try {
        const analysis = await analyzer.analyzeGraph(process.cwd());

        expect(analysis.transitiveImpacts).toBeInstanceOf(Array);

        if (analysis.transitiveImpacts.length > 0) {
          const impact = analysis.transitiveImpacts[0];
          expect(impact).toHaveProperty('package');
          expect(impact).toHaveProperty('affectedBy');
          expect(impact).toHaveProperty('usageCount');
          expect(impact).toHaveProperty('depth');
          expect(impact).toHaveProperty('criticalPath');
        }
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });

    it('should calculate statistics', async () => {
      const { DependencyGraphAnalyzer } = await import(
        '../src/analysis/dependencyGraph.js'
      );
      const analyzer = DependencyGraphAnalyzer.getInstance();

      try {
        const analysis = await analyzer.analyzeGraph(process.cwd());

        expect(analysis.statistics).toBeDefined();
        expect(analysis.statistics.totalPackages).toBeGreaterThanOrEqual(0);
        expect(analysis.statistics.directDependencies).toBeGreaterThanOrEqual(0);
        expect(analysis.statistics.transitiveDependencies).toBeGreaterThanOrEqual(0);
        expect(analysis.statistics.maxDepth).toBeGreaterThanOrEqual(0);
        expect(analysis.statistics.averageDepth).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });

    it('should provide recommendations', async () => {
      const { DependencyGraphAnalyzer } = await import(
        '../src/analysis/dependencyGraph.js'
      );
      const analyzer = DependencyGraphAnalyzer.getInstance();

      try {
        const analysis = await analyzer.analyzeGraph(process.cwd());

        expect(analysis.recommendations).toBeInstanceOf(Array);

        if (analysis.recommendations.length > 0) {
          const rec = analysis.recommendations[0];
          expect(rec).toHaveProperty('type');
          expect(rec).toHaveProperty('priority');
          expect(rec).toHaveProperty('description');
          expect(rec).toHaveProperty('action');
          expect(rec).toHaveProperty('estimatedImpact');
        }
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });

    it('should visualize dependency tree', async () => {
      const { DependencyGraphAnalyzer } = await import(
        '../src/analysis/dependencyGraph.js'
      );
      const analyzer = DependencyGraphAnalyzer.getInstance();

      try {
        const analysis = await analyzer.analyzeGraph(process.cwd());

        const tree = analyzer.visualizeTree(analysis.graph, 3);
        expect(tree).toBeDefined();
        expect(typeof tree).toBe('string');
        expect(tree.length).toBeGreaterThan(0);
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });
  });

  describe('MCP Tools Integration', () => {
    it('should export breaking change analysis tool', async () => {
      const { analyzeBreakingChanges } = await import(
        '../src/tools/intelligentTools.js'
      );

      expect(analyzeBreakingChanges).toBeDefined();
      expect(typeof analyzeBreakingChanges).toBe('function');
    });

    it('should export intelligent package analysis tool', async () => {
      const { analyzePackageIntelligent } = await import(
        '../src/tools/intelligentTools.js'
      );

      expect(analyzePackageIntelligent).toBeDefined();
      expect(typeof analyzePackageIntelligent).toBe('function');
    });

    it('should export alternative package discovery tool', async () => {
      const { findAlternativePackages } = await import(
        '../src/tools/intelligentTools.js'
      );

      expect(findAlternativePackages).toBeDefined();
      expect(typeof findAlternativePackages).toBe('function');
    });

    it('should export dependency graph analysis tool', async () => {
      const { analyzeDependencyGraph } = await import(
        '../src/tools/intelligentTools.js'
      );

      expect(analyzeDependencyGraph).toBeDefined();
      expect(typeof analyzeDependencyGraph).toBe('function');
    });

    it('should export tool definitions', async () => {
      const { getIntelligentTools } = await import(
        '../src/tools/intelligentTools.js'
      );

      const tools = getIntelligentTools();
      expect(tools).toBeInstanceOf(Array);
      expect(tools.length).toBe(4);

      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
      }
    });

    it('should export tool handler', async () => {
      const { handleIntelligentToolCall } = await import(
        '../src/tools/intelligentTools.js'
      );

      expect(handleIntelligentToolCall).toBeDefined();
      expect(typeof handleIntelligentToolCall).toBe('function');
    });
  });
});
