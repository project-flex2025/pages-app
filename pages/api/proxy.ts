// pages/api/proxy.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false, // Required for formidable to handle form-data
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const apiType = req.headers["x-api-type"] as string;
    let apiUrl = "";
    let requestBody: any = null;

    if (apiType === "aws_s3") {
      // Parse multipart/form-data
      requestBody = await new Promise<any>((resolve, reject) => {
        const form = formidable();
        form.parse(req, (err, fields) => {
          if (err) reject(err);
          else resolve(fields);
        });
      });
    } else {
      // JSON body (Next.js automatically parses if bodyParser not disabled)
      const buffers: Uint8Array[] = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const bodyString = Buffer.concat(buffers).toString();
      requestBody = JSON.parse(bodyString || "{}");
    }

    // Map API type to endpoint
    switch (apiType) {
      case "search":
        apiUrl = process.env.SEARCH_API!;
        break;
      case "create":
        apiUrl = process.env.CREATE_API!;
        break;
      case "update":
        apiUrl = process.env.UPDATE_API!;
        break;
      case "delete":
        apiUrl = process.env.DELETE_API!;
        break;
      case "aws_s3":
        apiUrl = process.env.AWS_S3_API!;
        break;
      default:
        return res.status(400).json({ error: "Invalid API type" });
    }

    // Build payload
    let payloadWithSecret: any;
    if (apiType === "aws_s3") {
      const postJson = JSON.parse(requestBody.post_json as string);
      payloadWithSecret = {
        postJson,
        user_id: requestBody.user_id,
        config: requestBody.config,
        download_type: requestBody.download_type,
        file_name: requestBody.file_name,
        app_secret: process.env.FLEX_APP_SECRET,
      };
    } else {
      payloadWithSecret = {
        ...requestBody,
        app_secret: process.env.FLEX_APP_SECRET,
      };
    }

    // Call target API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payloadWithSecret),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Error in proxy route:", error);
    return res.status(500).json({ error: "Failed to fetch data" });
  }
}
