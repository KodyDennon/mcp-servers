/**
 * Security vulnerability data sources
 * - OSV (Open Source Vulnerabilities)
 * - GitHub Advisory Database
 */
export interface Vulnerability {
  id: string;
  summary: string;
  details?: string;
  severity?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  cvssScore?: number;
  aliases?: string[];
  published?: string;
  modified?: string;
  affected: Array<{
    package: {
      ecosystem: string;
      name: string;
    };
    ranges?: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
        last_affected?: string;
      }>;
    }>;
    versions?: string[];
  }>;
  references?: Array<{
    type: string;
    url: string;
  }>;
  database_specific?: Record<string, any>;
}
export interface GitHubAdvisory {
  ghsa_id: string;
  cve_id?: string;
  url: string;
  html_url: string;
  summary: string;
  description: string;
  severity: "low" | "moderate" | "high" | "critical";
  author: {
    login: string;
    type: string;
  };
  publisher: {
    login: string;
    type: string;
  };
  identifiers: Array<{
    type: string;
    value: string;
  }>;
  state: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  closed_at?: string;
  withdrawn_at?: string;
  vulnerabilities: Array<{
    package: {
      ecosystem: string;
      name: string;
    };
    severity: string;
    vulnerable_version_range: string;
    first_patched_version?: {
      identifier: string;
    };
  }>;
  cvss: {
    vector_string: string;
    score: number;
  };
  cwes: Array<{
    cwe_id: string;
    name: string;
  }>;
  credits?: Array<{
    user: {
      login: string;
      type: string;
    };
    type: string;
  }>;
}
export declare class SecurityDataSources {
  private osvClient;
  private githubClient;
  constructor();
  /**
   * Query OSV for vulnerabilities affecting a package
   */
  queryOSV(
    packageName: string,
    version?: string,
    ecosystem?: string,
  ): Promise<Vulnerability[]>;
  /**
   * Get vulnerability details from OSV by ID
   */
  getOSVVulnerability(vulnerabilityId: string): Promise<Vulnerability | null>;
  /**
   * Query GitHub Advisory Database
   */
  queryGitHubAdvisories(
    packageName: string,
    ecosystem?: string,
    severity?: "low" | "moderate" | "high" | "critical",
  ): Promise<GitHubAdvisory[]>;
  /**
   * Get specific GitHub advisory by GHSA ID
   */
  getGitHubAdvisory(ghsaId: string): Promise<GitHubAdvisory | null>;
  /**
   * Get comprehensive vulnerability report for a package
   */
  getVulnerabilityReport(
    packageName: string,
    version?: string,
    ecosystem?: string,
  ): Promise<{
    osv: Vulnerability[];
    github: GitHubAdvisory[];
    summary: {
      total: number;
      critical: number;
      high: number;
      moderate: number;
      low: number;
    };
  }>;
}
export declare const securitySources: SecurityDataSources;
//# sourceMappingURL=securitySources.d.ts.map
