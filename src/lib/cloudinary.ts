import api from './api';

interface UploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const signatureResponse = await api.post<UploadSignature>('/occasions/profile-image-signature/');
  const { signature, timestamp, api_key, cloud_name, folder } = signatureResponse.data;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  // Uploads straight to Cloudinary, not through our backend — the signed
  // params above prove this request was authorized without ever exposing
  // the API secret to the browser.
  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image.');
  }

  const data = await uploadResponse.json();
  return data.secure_url as string;
}
