type RecordDataItem =
  | {
      record_label: string;
      record_value_text: string;
      record_type: "type_text";
    }
  | {
      record_label: string;
      record_value_number: number;
      record_type: "type_number";
    }
  | {
      record_label: string;
      record_value: string[] | Record<string, unknown>[];
      record_type: "type_array";
    }
  | {
      record_label: string;
      record_value: Record<string, unknown>;
      record_type: "type_json";
    };

interface FeatureData {
  record_data: RecordDataItem[];
}

interface LogRequestBody {
  data: {
    record_id: string;
    feature_name: string;
    added_by: string;
    record_status: string;
    created_on_date: string;
    feature_data: FeatureData;
    more_data?: Record<string, unknown>;
  };
  dataset: string;
}

interface LogResponse {
  status: string;
  message: string;
  [key: string]: unknown;
}

export async function sendLog(body: LogRequestBody): Promise<LogResponse | null> {
  try {
    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TYPE": "create",
      },
      body: JSON.stringify(body),
    });

    return (await response.json()) as LogResponse;
  } catch (err) {
    console.error("Error sending activity log:", err);
    return null;
  }
}
