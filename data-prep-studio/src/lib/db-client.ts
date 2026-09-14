import { MessageType, WorkerRequest, WorkerResponse, SchemaMetadata, RecipeStep, ProfileResult, PreviewResult, ExportResult } from '../worker/types';

type ResolverMap = Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>;

export class DBClient {
  private worker!: Worker;
  private resolvers: ResolverMap = new Map();
  private msgIdCount = 0;
  
  public onWorkerCrashed?: () => void;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (this.worker) {
      this.worker.terminate();
    }
    
    this.worker = new Worker(new URL('../worker/db-worker.ts', import.meta.url), { type: 'module' });
    
    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, success, payload, error } = e.data;
      const resolver = this.resolvers.get(id);
      if (resolver) {
        if (success) {
          resolver.resolve(payload);
        } else {
          resolver.reject(new Error(error || 'Worker operation failed'));
        }
        this.resolvers.delete(id);
      }
    };

    this.worker.onerror = (e) => {
      console.error("Worker fatal error caught:", e);
      // Reject all pending promises
      for (const resolver of this.resolvers.values()) {
        resolver.reject(new Error('Worker crashed or was terminated randomly.'));
      }
      this.resolvers.clear();
      
      if (this.onWorkerCrashed) {
        this.onWorkerCrashed();
      }
    };
  }

  public restartWorker() {
    this.initWorker();
  }

  private sendMessage(type: MessageType, payload?: any): Promise<any> {
    const id = `msg_${++this.msgIdCount}`;
    return new Promise((resolve, reject) => {
      this.resolvers.set(id, { resolve, reject });
      const req: WorkerRequest = { id, type, payload };
      this.worker.postMessage(req);
    });
  }

  public init() {
    return this.sendMessage('INIT');
  }

  public ingest(file: File): Promise<SchemaMetadata> {
    return this.sendMessage('INGEST', { file });
  }

  public applyRecipe(steps: RecipeStep[]): Promise<{ preview: any[] }> {
    return this.sendMessage('TRANSFORM', { steps });
  }

  public profile(): Promise<ProfileResult> {
    return this.sendMessage('PROFILE');
  }

  public preview(offset: number, limit: number): Promise<PreviewResult> {
    return this.sendMessage('PREVIEW', { offset, limit });
  }

  public exportData(format: 'csv' | 'parquet', expectedRows: number, expectedCols: number): Promise<ExportResult> {
    return this.sendMessage('EXPORT', { format, expectedRows, expectedCols });
  }
}

// Export a singleton instance
export const dbClient = new DBClient();
