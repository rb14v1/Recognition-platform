# api/ai_utils.py
import json
import os
from dotenv import load_dotenv
from openai import AzureOpenAI

# 1. Load environment variables from .env file
load_dotenv()

# 2. Initialize Client using os.getenv
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION")
)

DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT")

def get_nomination_sentiment(nominations_list):
    """
    Analyzes a list of nominations and returns sentiment + summary.
    Expects nominations_list to be a list of dicts: [{'id': 1, 'reason': '...'}, ...]
    """

    prompt = f"""
    You are an expert HR Consultant writing executive recognition summaries.
    
    Input Data:
    {json.dumps(nominations_list)}

    Tasks:
    1. "summary": Write a polished, professional 1-sentence summary (max 35 words).
       - The input contains "Focus: Category (Metric) -> Reason".
       - Naturally weave these keywords into the sentence.
       - Do NOT start with "Praised for...". Use active verbs like "Recognized for driving...", "Commended for...", "Highlighted for...".
       - Example Output: "Recognized for driving Innovation & Growth by implementing Digital Transformation initiatives that significantly accelerated product development cycles."
    
    2. "sentiment": strictly one of ["Positive", "Neutral", "Negative"].
    
    Output Format:
    Return strictly a raw JSON array of objects with keys: "id", "summary", "sentiment".
    """
    try:
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME, 
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3, 
            max_tokens=1000
        )

        raw_content = response.choices[0].message.content.strip()
        
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:-3]
        elif raw_content.startswith("```"):
            raw_content = raw_content[3:-3]

        return json.loads(raw_content)

    except Exception as e:
        print(f"Azure OpenAI Error: {str(e)}")
        return []