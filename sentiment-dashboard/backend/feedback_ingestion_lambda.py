import json
import boto3
import random
from datetime import datetime
import urllib.request

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Customer_Feedback')
hf_token = os.getenv("HF_ACCESS_TOKEN")
def lambda_handler(event, context):
    try:
        feedback_text = generate_feedback_text()
        sentiment_result = analyze_sentiment(feedback_text)
        
        feedback = {
            'feedback_id': f"feedback-{int(datetime.now().timestamp())}",
            'timestamp': datetime.now().isoformat(),
            'source': random.choice(['App', 'Web', 'Email']),
            'sentiment': sentiment_result['label'].lower(),
            'sentimentScore': str(sentiment_result['score']),
            'feedbackText': feedback_text,
        }

        table.put_item(Item=feedback)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Feedback stored', 'feedback': feedback})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Failed to store feedback', 'error': str(e)})
        }

def analyze_sentiment(text):
    API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"
    headers = {
        "Authorization": "Bearer {hf_token}",  # Replace with your API key
        "Content-Type": "application/json"
    }
    
    data = json.dumps({"inputs": text}).encode('utf-8')
    req = urllib.request.Request(API_URL, data=data, headers=headers)
    
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
    
    return {
        'label': result[0][0]['label'],
        'score': result[0][0]['score']
    }

def generate_feedback_text():
    feedback_texts = [
        'Great service!', 'Could be better.', 'Very disappointed.',
        'Amazing experience!', 'Not what I expected.', 'I love this product!',
        'Terrible customer service.', 'Highly recommended!', 'Waste of money.'
    ]
    return random.choice(feedback_texts)