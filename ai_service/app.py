import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId # <-- Import ObjectId
from langchain_community.llms import Ollama 
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def mongo_json_serializer(obj):
    """Custom JSON serializer for MongoDB objects."""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

# --- Initialize App ---
app = Flask(__name__)
CORS(app)

# --- Initialize BOTH Language Models ---
# 1. Local Ollama Model
ollama_llm = Ollama(model="llama3:8b")

# 2. Google Gemini Model
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("Warning: GOOGLE_API_KEY not found in .env file. Gemini model will not be available.")
    gemini_llm = None
else:
    gemini_llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GOOGLE_API_KEY)

# --- MongoDB Connection ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_prod?authSource=admin")
client = MongoClient(MONGO_URI)
db = client.ym_prod
cutting_inspection_collection = db.cuttinginspections

# --- Prompts ---
mongo_aggregation_generation_template = """
You are a master MongoDB developer. Your only task is to generate a MongoDB Aggregation Pipeline based on a user's question about the 'cuttinginspections' collection.
You MUST respond with only the raw JSON array for the pipeline. Do NOT add explanations or markdown formatting like ```json.
If the question cannot be answered with a query, return an empty JSON array [].

---
**MONGO DB SCHEMA: `cuttinginspections`**
- _id: ObjectId
- inspectionDate: String ('M/D/YYYY', e.g., '7/5/2024')
- moNo: String
- buyer: String
- color: String
- cutting_emp_engName: String
- tableNo: String
- totalInspectionQty: Number (Total pieces inspected in the entire document)
- inspectionData: Array of Objects [
    {{
      "inspectedSize": String, (e.g., 'S', 'M', 'L')
      "totalPcsSize": Number, (Total pieces for this size)
      "passSize": {{ "total": Number }},
      "rejectSize": {{ "total": Number }},
      "rejectGarmentSize": {{ "total": Number }}, (Defects related to garment construction)
      "rejectMeasurementSize": {{ "total": Number }}, (Defects related to measurements)
      "bundleInspectionData": Array of Objects [
          {{
            "bundleNo": Number,
            "reject": {{ "total": Number }}
          }}
      ]
    }}
]
---

**QUERY EXAMPLES:**

1.  **Find Unique Values:**
    -   Q: "What are the MO numbers for today, {{today_date}}?"
    -   A: `[ {{$match: {{ "inspectionDate": "{{today_date}}" }}}}, {{$group: {{ "_id": "$moNo" }}}}, {{$project: {{ "moNo": "$_id", "_id": 0 }}}} ]`

2.  **Count Documents:**
    -   Q: "How many inspections were done by John Doe?"
    -   A: `[ {{$match: {{ "cutting_emp_engName": "John Doe" }}}}, {{$count: "total_inspections"}} ]`

3.  **Sum Top-Level Field:**
    -   Q: "What is the total inspection quantity for buyer 'ADIDAS'?"
    -   A: `[ {{$match: {{ "buyer": "ADIDAS" }}}}, {{$group: {{ "_id": null, "total": {{ "$sum": "$totalInspectionQty" }} }}}} ]`

4.  **Sum Nested Field (Most Common):** Use `$unwind` on `inspectionData`.
    -   Q: "What is the total number of rejected pieces for moNo 'GPAR11685'?"
    -   A: `[ {{$match: {{ "moNo": "GPAR11685" }}}}, {{$unwind: "$inspectionData"}}, {{$group: {{ "_id": "$moNo", "totalRejects": {{ "$sum": "$inspectionData.rejectSize.total" }} }}}} ]`

5.  **Sum by Category (Size):** Use `$unwind` and `$group` by a nested field.
    -   Q: "Show me the reject count per size for moNo 'GPAR11685'."
    -   A: `[ {{$match: {{ "moNo": "GPAR11685" }}}}, {{$unwind: "$inspectionData"}}, {{$group: {{ "_id": "$inspectionData.inspectedSize", "rejectCount": {{ "$sum": "$inspectionData.rejectSize.total" }} }}}}, {{$project: {{ "size": "$_id", "rejectCount": 1, "_id": 0 }}}} ]`

6.  **Complex Nested Sum (Rejects by Type):** Sum multiple nested fields.
    -   Q: "For moNo 'GPAR11685', how many garment rejects and measurement rejects were there?"
    -   A: `[ {{$match: {{ "moNo": "GPAR11685" }}}}, {{$unwind: "$inspectionData"}}, {{$group: {{ "_id": "$moNo", "garmentRejects": {{ "$sum": "$inspectionData.rejectGarmentSize.total" }}, "measurementRejects": {{ "$sum": "$inspectionData.rejectMeasurementSize.total" }} }}}} ]`

7.  **Find Specific Nested Info (Top Reject Bundle):** Use `$unwind`, `$sort`, and `$limit`.
    -   Q: "Which bundle had the most rejects in size M for moNo 'GPAR11685'?"
    -   A: `[ {{$match: {{ "moNo": "GPAR11685" }}}}, {{$unwind: "$inspectionData"}}, {{$match: {{ "inspectionData.inspectedSize": "M" }}}}, {{$unwind: "$inspectionData.bundleInspectionData"}}, {{$sort: {{ "inspectionData.bundleInspectionData.reject.total": -1 }}}}, {{$limit: 1}}, {{$project: {{ "bundleNo": "$inspectionData.bundleInspectionData.bundleNo", "rejects": "$inspectionData.bundleInspectionData.reject.total", "_id": 0 }}}} ]`

8.  **Simple Find (Full Document):**
    -   Q: "Give me info about today cutting inspection for MO No GPAR11685"
    -   A: `[ {{$match: {{ "inspectionDate": "{{today_date}}", "moNo": "GPAR11685" }}}} ]`
---

Generate the MongoDB Aggregation Pipeline for this question:
Question: "{question}"
"""
mongo_pipeline_prompt = ChatPromptTemplate.from_template(mongo_aggregation_generation_template)

answer_generation_template = """
You are an intelligent assistant for a garment factory Quality Management System.
Your goal is to answer the user's question based on the data provided.
Be concise, friendly, and format your answer clearly. If the data is empty, state that you couldn't find any information.
If the data is a list of items (like MO numbers), format it as a bulleted or comma-separated list.

User's Question: {question}

Data from Database:
{context}

Answer:
"""
answer_prompt = ChatPromptTemplate.from_template(answer_generation_template)

@app.route('/ask', methods=['POST'])
def ask_bot():
    try:
        data = request.get_json()
        question = data.get('question')
        selected_model = data.get('selectedModel', 'local')

        if not question:
            return jsonify({"error": "No question provided"}), 400

        print(f"Original question: {question} (Using model: {selected_model})")

        if selected_model == 'gemini' and gemini_llm:
            llm = gemini_llm
            print("Using Google Gemini Flash model.")
        else:
            llm = ollama_llm
            print("Using local Ollama Llama3 model.")

        pipeline_generation_chain = mongo_pipeline_prompt | llm | StrOutputParser()
        answer_generation_chain = answer_prompt | llm | StrOutputParser()

        processed_question = preprocess_question_for_dates(question)
        print(f"Processed question with date: {processed_question}")

        generated_pipeline_str = pipeline_generation_chain.invoke({"question": processed_question})
        print(f"Generated pipeline string: {generated_pipeline_str}")

        pipeline = []
        try:
            clean_str = generated_pipeline_str.strip()
            if "```json" in clean_str:
                clean_str = clean_str.split("```json")[1].split("```")[0].strip()
            
            pipeline = json.loads(clean_str)
            if not isinstance(pipeline, list):
                pipeline = [pipeline]

        except json.JSONDecodeError:
            print("Error: LLM did not return valid JSON for the pipeline.")
            pipeline = []

        context_data = []
        if pipeline:
            print(f"Executing MongoDB pipeline: {pipeline}")
            results = cutting_inspection_collection.aggregate(pipeline)
            context_data = [doc for doc in results]
        else:
            print("No valid pipeline generated. Skipping database lookup.")
        
        context_str = json.dumps(context_data, indent=2, default=mongo_json_serializer)

        final_answer = answer_generation_chain.invoke({
            "question": question,
            "context": context_str
        })

        print(f"Final answer: {final_answer}")
        return jsonify({"answer": final_answer})

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500

def preprocess_question_for_dates(question):
    today = datetime.now()
    today_str = today.strftime('%#m/%#d/%Y') if os.name == 'nt' else today.strftime('%-m/%-d/%Y')
    yesterday = today - timedelta(days=1)
    yesterday_str = yesterday.strftime('%#m/%#d/%Y') if os.name == 'nt' else yesterday.strftime('%-m/%-d/%Y')

    if 'today' in question.lower():
        return question + f" (for today, use date string: '{today_str}')"
    if 'yesterday' in question.lower():
        return question + f" (for yesterday, use date string: '{yesterday_str}')"
    
    return question

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)