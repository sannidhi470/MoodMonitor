import json
import boto3
from boto3.dynamodb.types import Decimal  # Import Decimal

# DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Customer_Feedback')  # Replace with your DynamoDB table name

def lambda_handler(event, context):
    try:
        # Query or Scan the table to get all feedback records
        response = table.scan()  # Use scan or query depending on your use case
        
        # Extract feedback data from response
        feedback_data = response.get('Items', [])

        # Remove Decimal values (or ignore them)
        feedback_data = remove_decimal_values(feedback_data)

        # Success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully fetched feedback data',
                'feedback_data': feedback_data
            })
        }
    except Exception as e:
        # Error response
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Failed to fetch feedback data',
                'error': str(e)
            })
        }

# Helper function to remove Decimal values from the response
def remove_decimal_values(data):
    if isinstance(data, list):
        return [remove_decimal_values(item) for item in data]
    elif isinstance(data, dict):
        return {key: remove_decimal_values(value) for key, value in data.items()}
    elif isinstance(data, Decimal):
        return str(data)  # You can choose to return as a string or simply remove the value
    else:
        return data
