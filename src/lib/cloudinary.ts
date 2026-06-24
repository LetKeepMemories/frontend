import api from './api';

interface UploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
}

export async function uploadToCloudinary(
  file: File, 
  signatureEndpoint: string = '/occasions/profile-image-signature/',
  resourceType: 'image' | 'video' | 'auto' | 'raw' = 'image'
): Promise<string> {
  const signatureResponse = await api.post<UploadSignature>(signatureEndpoint, {
    estimated_file_size: file.size
  });
  const { signature, timestamp, api_key, cloud_name, folder } = signatureResponse.data;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.text();
    console.error("Cloudinary upload failed:", uploadResponse.status, errorData);
    throw new Error('Failed to upload file.');
  }

  const data = await uploadResponse.json();
  return data.secure_url as string;
}
