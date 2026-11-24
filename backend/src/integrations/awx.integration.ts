export interface AwxJobResult {
  jobId: number;
  jobUrl: string;
  status: string;
}

export const launchAwxJob = async (
  requestId: number
): Promise<AwxJobResult> => {
  const baseUrl = process.env.AWX_BASE_URL;
  const jobTemplateId = process.env.AWX_JOB_TEMPLATE_ID;
  const token = process.env.AWX_TOKEN;

  if (!baseUrl || !jobTemplateId || !token) {
    throw new Error('AWX integration is not configured.');
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, '')}/api/v2/job_templates/${jobTemplateId}/launch/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        extra_vars: {
          request_id: requestId,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`AWX job launch failed with HTTP ${response.status}.`);
  }

  const job = await response.json() as {
    id: number;
    url: string;
    status: string;
  };

  return {
    jobId: job.id,
    jobUrl: job.url,
    status: job.status,
  };
};
