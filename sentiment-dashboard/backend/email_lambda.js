import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoDb = new DynamoDBClient({ region: "us-east-2" });
const sesClient = new SESClient({ region: "us-east-2" });

export const handler = async (event) => {
  try {
    // 1. Query DynamoDB for recent negative feedback
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const params = {
      TableName: "Customer_Feedback",
      IndexName: "sentiment-timestamp-index",
      KeyConditionExpression: "sentiment = :sentiment AND #ts > :timestamp",
      ExpressionAttributeNames: {
        "#ts": "timestamp"
      },
      ExpressionAttributeValues: {
        ":sentiment": { S: "negative" },
        ":timestamp": { S: fiveMinutesAgo }
      },
      ScanIndexForward: false,
      Limit: 10
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    const negativeFeedback = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    if (negativeFeedback.length >= 5) {
      const examples = negativeFeedback.slice(0, 5).map(feedback => 
        `"${feedback.feedbackText}" (${new Date(feedback.timestamp).toLocaleString()} via ${feedback.source})`
      );

      const emailParams = {
        Destination: {
          ToAddresses: ["sannidhishetty9@gmail.com"],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: `
                <h3>⚠️ Negative Feedback Spike Detected</h3>
                <p><strong>Time Window:</strong> Last 5 minutes</p>
                <p><strong>Count:</strong> ${negativeFeedback.length} negative feedback items</p>
                <p><strong>Sources:</strong> ${[...new Set(negativeFeedback.map(f => f.source))].join(", ")}</p>
                <h4>Recent Examples:</h4>
                <ul>
                  ${examples.map(example => `<li>${example}</li>`).join("")}
                </ul>
                <p><a href="http://localhost:3000/">View Full Dashboard</a></p>
              `,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: `🚨 Negative Feedback Spike (${negativeFeedback.length} items)`,
          },
        },
        Source: "sannidhishetty9@gmail.com",
      };

      await sesClient.send(new SendEmailCommand(emailParams));
      console.log(`Alert sent for ${negativeFeedback.length} negative feedback items`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Checked feedback. Found ${negativeFeedback.length} negative items.`,
        thresholdMet: negativeFeedback.length >= 5
      })
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};