export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "image");

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.cid;
}

export async function uploadMetadata(metadata: {
  name: string;
  description: string;
  imageCID: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append("type", "json");
  formData.append("metadata", JSON.stringify({
    name: metadata.name,
    description: metadata.description,
    image: `ipfs://${metadata.imageCID}`,
  }));

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.cid;
}

export const getIPFSUrl = (cid: string) =>
  `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${cid}`;