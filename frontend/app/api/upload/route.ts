import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get("type") as string;

    if (type === "json") {
      const metadata = formData.get("metadata") as string;
      const json = JSON.parse(metadata);

      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: json,
          pinataMetadata: { name: json.name },
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return NextResponse.json({ cid: data.IpfsHash });
    }

    // Irudia
    const file = formData.get("file") as File;
    const pinataForm = new FormData();
    pinataForm.append("file", file);
    pinataForm.append("pinataMetadata", JSON.stringify({ name: file.name }));

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataForm,
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return NextResponse.json({ cid: data.IpfsHash });

  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}