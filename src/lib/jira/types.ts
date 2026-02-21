export interface JiraBoard {
    id: number;
    name: string;
    type?: string;
  }
  
  export interface JiraSprint {
    id: number;
    name: string;
    state: 'active' | 'future' | 'closed';
  }
  
  export interface JiraIssue {
    id: string;
    key: string;
    summary: string;
    status?: string;
    storyPoints?: number | null;
  }
  
  // This helps your fetchPaginated helper know what it's returning
  export interface JiraPaginatedResponse<T> {
    values: T[];
    isLast: boolean;
    startAt: number;
  }