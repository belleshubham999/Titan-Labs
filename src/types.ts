export type BuildTarget = 'web' | 'android' | 'ios' | 'macos' | 'windows' | 'linux';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface AppRecord {
  id: string;
  title: string;
  prompt: string;
  spokenInput: string;
  targets: BuildTarget[];
  status: 'building' | 'ready' | 'failed';
  stack: string;
  deployPath: string;
  customDomain?: string;
  files: GeneratedFile[];
  createdAt: string;
  updatedAt: string;
}
