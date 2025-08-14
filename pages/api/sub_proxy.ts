// pages/api/sub_proxy.ts
import type { NextApiRequest, NextApiResponse } from "next";

interface SearchCondition {
  field: string;
  value?: string;
  search_type: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const requestBody = req.body;
    const apiType = req.headers["x-api-type"] as string;
    let apiUrl = "";

    switch (apiType) {
      case "search":
        apiUrl = process.env.SEARCH_API!;
        if (requestBody.conditions) {
          requestBody.conditions = requestBody.conditions.map((condition: SearchCondition) => {
            if (condition.field === "feature_name" && process.env.FEATURE_NAME) {
              return {
                ...condition,
                value: process.env.FEATURE_NAME
              };
            }
            return condition;
          });
        }
        break;

      case "create":
        apiUrl = process.env.CREATE_API!;
        break;

      case "update":
        apiUrl = process.env.UPDATE_API!;
        if (requestBody.data && process.env.FEATURE_NAME) {
          requestBody.data = {
            ...requestBody.data,
            feature_name: process.env.FEATURE_NAME
          };
        }
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

    const payloadWithSecret = {
      ...requestBody,
      app_secret: process.env.FLEX_APP_SECRET
    };

    console.log("base url", process.env.SEARCH_API);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payloadWithSecret)
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
