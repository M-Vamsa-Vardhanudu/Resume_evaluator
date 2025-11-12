from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.messages import HumanMessage
import asyncio
import os, tempfile
import uvicorn
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)

llm = ChatGroq(
    model_name="groq/compound",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    query: str
    resume_text: str | None = None

def extract_pdf_text(file: UploadFile):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name
    loader = PyPDFLoader(tmp_path)
    documents = loader.load()
    # Fix: handle both Document objects and plain strings
    text = "\n".join([
        doc.page_content if hasattr(doc, "page_content") else str(doc)
        for doc in documents
    ])
    os.unlink(tmp_path)
    return text

@app.get("/health")
async def health_check():
    logging.info("Health check requested")
    return {"status": "healthy"}

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    logging.info(f"Received PDF upload: {file.filename if file else 'No file'}")
    try:
        resume_text = extract_pdf_text(file)
        logging.info(f"Extracted resume text length: {len(resume_text)}")
        return {"resume_text": resume_text}
    except Exception as e:
        logging.error(f"Error extracting PDF: {e}", exc_info=True)
        return {"error": str(e)}

@app.post("/ask")
async def ask(request: AskRequest = Body(...)):
    logging.info(f"/ask called with query: {request.query[:100]}...")  # Log first 100 chars
    try:
        prompt = (
            f"{request.query}\n\nResume Provided:\n{request.resume_text}"
            if request.resume_text and len(request.resume_text.strip()) > 0
            else request.query
        )
        logging.info(f"Prompt sent to LLM: {prompt[:200]}...")  # Log first 200 chars
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: llm.invoke([HumanMessage(content=prompt)]))
        logging.info(f"Raw LLM response: {response}")
        # Extract answer from response object
        if hasattr(response, "content"):
            answer = response.content
        elif hasattr(response, "text"):
            answer = response.text
        else:
            answer = str(response)
        logging.info(f"Final answer: {answer[:200]}...")  # Log first 200 chars
        if not answer or not isinstance(answer, str) or answer.strip() == "":
            answer = "⚠️ No response from assistant. Please try rephrasing your question."
        return {"answer": answer}
    except Exception as e:
        logging.error(f"Error in /ask: {e}", exc_info=True)
        return {"answer": f"⚠️ Error: {str(e)}"}

@app.post("/ask_resume")
async def ask_resume(
    sender: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    pdf_file: UploadFile | None = File(None)
):
    logging.info(f"/ask_resume called for sender: {sender}, subject: {subject}")
    try:
        resume_text = ""
        if pdf_file:
            logging.info(f"PDF file received: {pdf_file.filename}")
            resume_text = extract_pdf_text(pdf_file)
            logging.info(f"Extracted resume text length: {len(resume_text)}")
        prompt = (
            "Analyze this resume/email:\n\n"
            f"From: {sender}\n"
            f"Subject: {subject}\n\n"
            f"Email Content:\n{body}\n\n"
        )
        if resume_text:
            prompt += f"Resume Provided:\n{resume_text}\n\n"
        prompt += (
            "Please provide:\n"
            "1. Candidate's likely role\n"
            "2. Key skills\n"
            "3. Experience level\n"
            "4. Recommendation\n"
            "5. Notable strengths or red flags\n"
        )
        logging.info(f"Prompt sent to LLM (resume): {prompt[:200]}...")
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: llm.invoke([HumanMessage(content=prompt)]))
        logging.info(f"Raw LLM response (resume): {response}")
        # Extract answer from response object
        if hasattr(response, "content"):
            answer = response.content
        elif hasattr(response, "text"):
            answer = response.text
        else:
            answer = str(response)
        logging.info(f"Final analysis: {answer[:200]}...")
        return {"analysis": answer}
    except Exception as e:
        logging.error(f"Error in /ask_resume: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    print("🚀 Starting Resume & PDF Evaluator API...")
    logging.info("API server starting...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
