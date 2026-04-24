import os
from dotenv import load_dotenv
from pinecone import Pinecone
from groq import Groq
import re

load_dotenv()

groq_client = None

def _get_groq_client():
    global groq_client
    if groq_client is None:
        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY must be set in environment")
        groq_client = Groq(api_key=GROQ_API_KEY)
    return groq_client

pc = None
index = None

def _get_index():
    global pc, index
    if index is None:
        PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
        if not PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY must be set in environment")
        pc = Pinecone(api_key=PINECONE_API_KEY)
        INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "finmate")
        index = pc.Index(INDEX_NAME)
    return pc, index

# -----------------------------
# Query Pinecone for top-k matches
# -----------------------------
def query_pinecone(input_text, top_k=5, namespace=""):
    try:
        pc, index = _get_index()
        query_response = pc.inference.embed(
            model="llama-text-embed-v2",
            inputs=[input_text],
            parameters={"input_type": "query"}
        )

        query_embedding = query_response.data[0].values

        res = index.query(
            namespace=namespace,
            vector=query_embedding,
            top_k=top_k,
            include_values=False,
            include_metadata=True
        )

        return res.matches if res.matches else []
    except Exception as e:
        print(f"[Pinecone Error]: {e}")
        return []

# -----------------------------
# Groq classification
# -----------------------------
def classify_transaction_groq(query_text, pinecone_matches):
    # Build few-shot nearest examples
    examples_text = "\n\n".join([
        f"{i+1}. Description: {m['metadata']['description']}\n   Category: {m['metadata']['category']}\n   similarity_score: {m['score']:.4f}"
        for i, m in enumerate(pinecone_matches)
    ]) or "No examples found."

    # Prompt
    system_prompt = (
        "You are an assistant that classifies bank transaction descriptions into categories. "
        "Use the retrieved nearest examples to guide your classification. "
        "Choose from these categories: Mandatory/Utilities, Non-Mandatory, Luxury/Discretionary, Travel, Investment/Savings, Adjustment"
    )

    user_prompt = f"""
User description to classify:
\"\"\"{query_text}\"\"\"

Nearest examples (few-shot):
{examples_text}

Tasks:
1) Predict the best category for the user description from the available categories.
2) Provide a confidence score between 0 and 1.
3) Give a short justification referring to the nearest examples and their similarity scores.

Output format (exactly):
Category: <category>
Confidence: <confidence_score between 0-1>
Justification: <text>
"""

    try:
        client = _get_groq_client()
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[Groq API Error]: {e}")
        return "Error: Could not generate classification."

# -----------------------------
# Parse classification output
# -----------------------------
def parse_classification_output(output):
    try:
        lines = output.strip().split('\n')
        category = None
        confidence = None
        justification = None
        
        for line in lines:
            if line.startswith('Category:'):
                category = line.replace('Category:', '').strip()
            elif line.startswith('Confidence:'):
                confidence_str = line.replace('Confidence:', '').strip()
                try:
                    confidence = float(confidence_str)
                except ValueError:
                    confidence = 0.0
            elif line.startswith('Justification:'):
                justification = line.replace('Justification:', '').strip()
        
        # Validate category
        valid_categories = [
            "Mandatory/Utilities", 
            "Non-Mandatory", 
            "Luxury/Discretionary", 
            "Travel", 
            "Investment/Savings", 
            "Adjustment"
        ]
        
        if category not in valid_categories:
            category = "Adjustment"  # Default fallback
        
        return {
            'category': category,
            'confidence': confidence or 0.0,
            'justification': justification or "No justification provided"
        }
    except Exception as e:
        print(f"[Parse Error]: {e}")
        return {
            'category': 'Adjustment',
            'confidence': 0.0,
            'justification': 'Error in parsing classification'
        }

# -----------------------------
# Main categorization function
# -----------------------------
def categorize_transaction(description):
    """
    Categorize a single transaction description
    Returns: dict with category, confidence, and justification
    """
    try:
        # Step 1: Retrieve nearest matches from Pinecone
        matches = query_pinecone(description, top_k=5)
        
        # Step 2: Classify using Groq LLM
        output = classify_transaction_groq(description, matches)
        
        # Step 3: Parse the output
        result = parse_classification_output(output)
        
        return result
    except Exception as e:
        print(f"[Categorization Error]: {e}")
        return {
            'category': 'Adjustment',
            'confidence': 0.0,
            'justification': f'Error in categorization: {str(e)}'
        }

# -----------------------------
# Batch categorization function
# -----------------------------
def categorize_transactions_batch(descriptions):
    """
    Categorize multiple transaction descriptions
    Returns: list of dicts with category, confidence, and justification
    """
    results = []
    for desc in descriptions:
        result = categorize_transaction(desc)
        results.append(result)
    return results
