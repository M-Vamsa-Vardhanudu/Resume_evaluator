from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
import uvicorn
from uuid import uuid4
import asyncio
import requests
from bs4 import BeautifulSoup
import os, tempfile, json
from email_reader import get_email_summary, fetch_unread_emails

# ---------------- Globals ----------------
llm = ChatGroq(
    model_name="groq/compound", 
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

sessions = {}
vectorstores = {}

# ---------------- Utility Functions ----------------

def scrape_article(url: str) -> str:
    """Scrape text content from a Coursera article URL"""
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.content, "html.parser")
        # Remove scripts/styles
        for script in soup(["script", "style"]):
            script.decompose()
        text = soup.get_text(separator="\n")
        # Clean up multiple newlines
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return "\n".join(lines)
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return ""

def build_vectorstore_from_links(links: list, persist_dir: str):
    """Scrape multiple articles, chunk text, and create a Chroma vectorstore"""
    all_documents = []
    
    for link in links:
        print(f"Scraping: {link}")
        text = scrape_article(link)
        if text:
            all_documents.append(Document(page_content=text, metadata={"source": link}))
    
    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(all_documents)
    
    print(f"Created {len(chunks)} chunks from {len(all_documents)} documents")
    
    # Build vectorstore
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_dir
    )
    return vectorstore

# ---------------- API Setup ----------------
app = FastAPI()

# IMPORTANT: Configure CORS properly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
        "null"  # Allow file:// protocol during development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    session_id: str | None = None

# ---------------- Preload Knowledge Base ----------------
role_links = [
    "https://www.coursera.org/articles/data-scientist-skills",
    "https://www.coursera.org/in/articles/data-engineer-skills",
    "https://www.coursera.org/in/articles/how-to-become-a-data-analyst",
    "https://www.coursera.org/articles/software-engineer-skills",
    "https://www.coursera.org/in/articles/essential-skills-for-ux-designers"
]

# Persist directory for Chroma
kb_dir = "kb_coursera"
os.makedirs(kb_dir, exist_ok=True)

# Build the vectorstore (check if already exists)
print("Initializing knowledge base...")
try:
    if os.path.exists(os.path.join(kb_dir, "chroma.sqlite3")):
        print("Loading existing vectorstore...")
        vectorstore = Chroma(persist_directory=kb_dir, embedding_function=embeddings)
    else:
        print("Building new vectorstore from Coursera articles...")
        vectorstore = build_vectorstore_from_links(role_links, kb_dir)
    print("Knowledge base ready!")
except Exception as e:
    print(f"Error initializing vectorstore: {e}")
    vectorstore = None

# ---------------- API Endpoints ----------------

@app.get("/")
async def root():
    return {"message": "Resume Evaluator API is running", "status": "ok"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "vectorstore_loaded": vectorstore is not None,
        "active_sessions": len(sessions)
    }

@app.get("/emails/unread")
async def get_unread_emails():
    """Fetch unread emails with PDF attachments"""
    print("\n" + "="*60)
    print("🌐 API ENDPOINT: /emails/unread called")
    print("="*60)
    
    try:
        print("📧 DEBUG: Calling get_email_summary()...")
        result = get_email_summary()
        
        print(f"📧 DEBUG: Email summary received:")
        print(f"   Total: {result.get('total_unread', 0)}")
        print(f"   With resumes: {result.get('emails_with_resumes', 0)}")
        print(f"   Email objects: {len(result.get('emails', []))}")
        
        response_data = {
            "success": True,
            "data": result
        }
        
        print(f"✅ DEBUG: Returning success response")
        return response_data
        
    except Exception as e:
        print(f"❌ DEBUG: Error in /emails/unread endpoint: {e}")
        import traceback
        traceback.print_exc()
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "data": {
                    "total_unread": 0,
                    "emails_with_resumes": 0,
                    "emails": []
                }
            }
        )

@app.post("/emails/analyze")
async def analyze_email_resume(email_body: dict):
    """Analyze a resume received via email using RAG"""
    try:
        if vectorstore is None:
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "answer": "⚠️ Knowledge base not initialized."
                }
            )
        
        # Create temporary session for email analysis
        sid = str(uuid4())
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        
        qa = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
            memory=memory,
            return_source_documents=False
        )
        
        # Construct analysis prompt
        prompt = f"""
        Analyze this resume received via email:
        
        From: {email_body.get('sender', 'Unknown')}
        Subject: {email_body.get('subject', 'No Subject')}
        
        Email Content:
        {email_body.get('body', '')}
        
        Please provide:
        1. Candidate's likely role/position based on the email
        2. Key skills mentioned or implied
        3. Experience level assessment
        4. Recommendation on whether to proceed with this candidate
        5. Any red flags or notable strengths
        """
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: qa({"question": prompt}))
        answer = result.get("answer", "⚠️ No analysis available.")
        
        return {
            "success": True,
            "analysis": answer
        }
        
    except Exception as e:
        print(f"Error analyzing email: {e}")
        import traceback
        traceback.print_exc()
        
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "analysis": "⚠️ Error analyzing the email content."
            }
        )

@app.post("/ask")
async def ask_question(request: QueryRequest):
    try:
        if vectorstore is None:
            return JSONResponse(
                status_code=500,
                content={
                    "session_id": None,
                    "answer": "⚠️ Knowledge base not initialized. Please restart the server."
                }
            )
        
        # Create new session if needed
        if request.session_id and request.session_id in sessions:
            sid = request.session_id
            memory = sessions[sid]
        else:
            sid = str(uuid4())
            memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
            sessions[sid] = memory

        # Build RAG chain with custom prompt
        qa = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
            memory=memory,
            return_source_documents=False
        )

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: qa({"question": request.query}))
        answer = result.get("answer", "⚠️ No response from assistant.")
        
        return {"session_id": sid, "answer": answer}
        
    except Exception as e:
        print(f"Error processing query: {e}")
        import traceback
        traceback.print_exc()
        
        return JSONResponse(
            status_code=200,  # Return 200 to avoid fetch errors
            content={
                "session_id": request.session_id,
                "answer": f"⚠️ I encountered an error processing your request. Please try rephrasing your question or check if the server is running properly."
            }
        )

# ---------------- Run ----------------
if __name__ == "__main__":
    print("\n🚀 Starting Resume Evaluator API server...")
    print("📚 Knowledge base initialized with career development content")
    print("🌐 Server running at: http://127.0.0.1:8000")
    print("💡 Make sure to serve the frontend with a local server (e.g., Live Server extension)\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
