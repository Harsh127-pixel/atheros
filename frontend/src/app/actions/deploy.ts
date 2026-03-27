'use server';

export async function deployRepo(formData: FormData, token: string) {
  const repoUrl = formData.get('repoUrl') as string;
  const cloudProvider = formData.get('cloudProvider') as string || 'RENDER';

  if (!repoUrl) {
    return { error: 'GitHub repository URL is required' };
  }

  const backendUrl = process.env.RENDER_BACKEND_URL;
  if (!backendUrl) throw new Error('RENDER_BACKEND_URL not configured');

  try {
    const response = await fetch(`${backendUrl}/api/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        repoUrl,
        cloudProvider,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Deployment failed' };
    }

    return { success: true, deploymentId: data.deploymentId, message: data.message };
  } catch (err: any) {
    console.error('Error in deployment server action:', err);
    return { error: 'Failed to communicate with the AetherOS engine' };
  }
}
