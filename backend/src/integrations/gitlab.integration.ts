export interface GitLabPipelineResult {
  pipelineId: number;
  pipelineUrl: string;
  status: string;
}

export const triggerGitLabPipeline = async (
  requestId: number
): Promise<GitLabPipelineResult> => {
  const apiUrl = process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4';
  const projectId = process.env.GITLAB_PROJECT_ID;
  const triggerToken = process.env.GITLAB_TRIGGER_TOKEN;
  const ref = process.env.GITLAB_REF || 'main';

  if (!projectId || !triggerToken) {
    throw new Error('GitLab integration is not configured.');
  }

  const body = new URLSearchParams({
    token: triggerToken,
    ref,
    'variables[REQUEST_ID]': String(requestId)
  });

  const response = await fetch(
    `${apiUrl}/projects/${encodeURIComponent(projectId)}/trigger/pipeline`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitLab pipeline trigger failed with HTTP ${response.status}.`
    );
  }

  const pipeline = await response.json() as {
    id: number;
    web_url: string;
    status: string;
  };

  return {
    pipelineId: pipeline.id,
    pipelineUrl: pipeline.web_url,
    status: pipeline.status
  };
};
