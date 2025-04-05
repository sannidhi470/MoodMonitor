# Real-Time Sentiment Analytics & Insights Dashboard

## 📊 Project Overview

A real-time sentiment analytics dashboard built for internal teams (Customer Experience, Marketing) to monitor customer feedback from various sources. The system includes real-time data ingestion, sentiment analysis, insights generation, and alerting mechanisms.

**Features:**
- Real-time customer feedback ingestion
- Sentiment analysis using Hugging Face models
- Dashboard for visualizing trends and individual feedback
- Actionable suggestion generation based on recent trends
- Email alerts for negative sentiment spikes

---

## 🧑‍💻 Tech Stack

- **Frontend:** React + TypeScript, Chart.js
- **Backend:** AWS Lambda, API Gateway, DynamoDB, EventBridge, SES
- **Sentiment Analysis:** Hugging Face Transformers (via `HF_ACCESS_TOKEN`)

---

## 🚀 Setup Instructions

### 📦 Frontend

1. Clone the repo:
  git clone [https://github.com/your-username/sentiment-dashboard.git](https://github.com/sannidhi470/MoodMonitor.git)
  cd sentiment-dashboard

2. Install dependencies:
   npm install

3. Run locally:
   npm start

Note :  Make sure the API endpoint from your API Gateway is set correctly in the frontend file (SentimentDashboard.tsx).

## ☁️ Backend (AWS)

### 🔧 Prerequisites

- AWS account
- IAM permissions for:
  - Lambda
  - DynamoDB
  - SES
  - EventBridge
  - API Gateway

---

### 1️⃣ Set environment variable in all Lambda functions:

HF_ACCESS_TOKEN (for accessing Hugging Face models)

### 2️⃣ Create Dynamo DB table - Customer_Feedback with feedback_id as partition key and timestamp as sort key

### 3️⃣ Deploy Lambda functions (located in backend/ folder):

feedback_ingestion_lambda: Generates feedback every 1 minute (scheduled via EventBridge)

analyze_sentiment_lambda: Analyzes and stores sentiment for feedback entries

read_table_lambda: Exposed via REST API using AWS API Gateway

### 4️⃣ Setup email_alert_lambda:

Configure with AWS SES (verified sender email)

Schedule via EventBridge to run every 5 minutes

### 5️⃣Create API Gateway for read_table_lambda:

Expose REST GET endpoint to fetch feedback and analytics

Use this endpoint in the frontend to fetch data

Expose REST endpoint to fetch feedback and analytics

Use this endpoint in the frontend to fetch data

## 📊 Dashboard Features

- **Time-series chart** for sentiment over time
- **Bar chart** for sentiment distribution by source (App, Web, Email)
- **Feedback table** displaying:
  - 🕒 Timestamp  
  - 🌐 Source  
  - 😊 Sentiment label and score  
  - 💬 Raw feedback text  
- **Filters** for:
  - Source (App, Web, Email)
  - Time range
- **Top 3 Generated Suggestions** based on recent feedback

---

### RESULT

[📄 View Results](https://docs.google.com/document/d/1S8JSaj-52MhEqxYDYuCgRYphd8Lk8Ii8-u5IGhhmrk0/edit?usp=sharing)


