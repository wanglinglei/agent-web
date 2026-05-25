export interface UploadGeneralFileResult {
  key: string;
  url: string;
}

const GENERAL_UPLOAD_ENDPOINT = '/ai-agent/general/upload';

/**
 * 上传通用文件并返回可访问地址。
 *
 * @param file 浏览器文件对象。
 * @returns 上传后的 URL 与 key。
 */
export async function uploadGeneralFile(
  file: File,
): Promise<UploadGeneralFileResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(GENERAL_UPLOAD_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const fallback = `上传失败（${response.status}）`;
    try {
      const contentType = response.headers.get('Content-Type') ?? '';
      if (contentType.includes('application/json')) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || fallback);
      }
      const text = await response.text();
      throw new Error(text || fallback);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(fallback);
    }
  }

  return (await response.json()) as UploadGeneralFileResult;
}

