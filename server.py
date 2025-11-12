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
from dotenv import load_dotenv

# Add new imports for resume processing and Excel
import pdfplumber
import docx2txt
import base64
import io
import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from datetime import datetime
import re

load_dotenv()

# ---------------- Globals ----------------
llm = ChatGroq(
    model_name="groq/compound", 
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

sessions = {}
vectorstores = {}

# ---------------- Resume Processing Globals ----------------
ROLE_KEYWORDS = {
    "ACCOUNTANT": ["accountant", "accounting", "entries", "closing", "state accounting", "reconciled", "dfas", "journal", "clerical", "financial statements", "bank", "payroll", "journal entries", "senior accountant", "account"],
    "ADVOCATE": ["advocate", "service advocate", "child", "aix", "court", "law", "illinois", "fundraising", "customer", "advocacy", "instrumentation", "provider", "biomedical", "banker", "welfare"],
    "AGRICULTURE": ["agriculture", "soil", "formulation", "mi", "land", "agricultural", "water", "extension", "protein", "epic", "fraud", "supervisor", "therapeutic", "farmers", "security"],
    "APPAREL": ["apparel", "merchandising", "fashion", "store", "stylist", "buyer", "production", "seasonal", "manager", "color", "merchandise", "assistant", "shipping", "holder", "cashier"],
    "ARTS": ["arts", "arts teacher", "dental", "art", "language arts", "dance", "school", "music", "instructor", "creative writing", "creative", "june", "english language", "middle", "professional development"],
    "AUTOMOBILE": ["automobile", "claims", "etl", "tibco", "aaa", "mdm", "yrs", "organization development", "airlines", "liability", "service", "criminal", "mechanical", "road", "public safety"],
    "AVIATION": ["aviation", "aircraft", "flight", "navy", "ammunition", "travel", "supply", "brigade", "ordnance", "aviation supply", "avionics", "operation", "mechanic", "pump", "schedules"],
    "BANKING": ["banking", "bank", "chase", "partners", "teradata", "lending", "financial", "medicaid", "loans", "underwriting", "financial aid", "teller", "regional sales", "commercial", "ticket"],
    "BPO": ["bpo", "process", "cisco", "agents", "google", "configuration", "various", "metrics", "travel", "details", "north america", "functional", "customer services", "mortgage", "india"],
    "BUSINESS-DEVELOPMENT": ["business development", "development manager", "development", "business", "director business", "sales", "sales marketing", "new accounts", "development executive", "year", "credit union", "engine", "coursework", "martin", "development director"],
    "CHEF": ["chef", "food", "kitchen", "culinary", "sushi", "cook", "pastry", "cooking", "menu", "recipes", "executive chef", "fort", "category", "coding", "banquet"],
    "CONSTRUCTION": ["construction", "concrete", "que", "paint", "wire", "medal", "worker", "safety", "energy", "project", "electric", "fiber", "la", "job sites", "job"],
    "CONSULTANT": ["consultant", "consulting", "consultant professional", "oracle", "citrix", "module", "deloitte", "drilling", "oil", "japan", "windows", "market", "leasing", "film", "end"],
    "DESIGNER": ["designer", "design", "hair", "drawings", "instructional designer", "designing", "floral", "interior", "instructional", "modeling", "graphic", "adobe", "parts", "autocad", "fit"],
    "DIGITAL-MEDIA": ["digital", "media", "digital media", "sept", "marketing", "ad", "social", "analytics", "nfl", "twitter", "instagram", "channel", "video", "philadelphia", "optimization"],
    "ENGINEERING": ["engineering", "engineering technician", "engineering manager", "engineering intern", "manufacturing", "electrical", "drafting", "nm", "cnc", "process", "json", "technician", "software development", "scout", "pm"],
    "FINANCE": ["finance", "finance manager", "finance director", "finance officer", "floor", "director finance", "financial", "hotels", "programme", "reconciliation", "operations", "budgets", "forecasting", "director", "vehicle"],
    "FITNESS": ["fitness", "fitness instructor", "spa", "club", "gym", "instructor", "members", "exercise", "nutrition", "facility", "recreation", "personal training", "cleanliness", "tourism", "service"],
    "HEALTHCARE": ["healthcare", "care", "billing", "medical", "services", "contest", "medicare", "daily living", "reporting", "medicine", "recruiter", "winner", "candidates", "doctors", "clinical"],
    "HR": ["hr", "employee", "hr assistant", "employee relations", "human resources", "performance management", "administrative support", "hr manager", "human", "unemployment", "new hire", "hire", "assist", "payroll", "recruiting"],
    "INFORMATION-TECHNOLOGY": ["information technology", "technology", "information", "technology specialist", "technology manager", "football", "security", "infrastructure", "pharmacy", "application", "letter", "qa", "drupal", "peoplesoft", "cisco"],
    "PUBLIC-RELATIONS": ["public relations", "public", "relations", "press", "events", "pr", "photo", "communications", "communication", "research", "event", "relations manager", "admissions", "clerk", "proposals"],
    "SALES": ["sales", "sales associate", "customers", "associate", "sales representative", "forklift", "atlanta", "keeping", "health care", "run", "sales service", "price", "quick learner", "items", "communications"],
    "TEACHER": ["teacher", "mathematics", "lessons", "grade", "classroom", "learning", "activities", "student learning", "colombia", "parent", "special education", "th", "math", "spanish", "preschool"]
}

# ---------------- Excel Storage Functions ----------------

def setup_excel_file():
    """Initialize or load Excel file for candidate storage"""
    excel_file = "candidate_evaluation_dashboard.xlsx"
    
    try:
        if os.path.exists(excel_file):
            # Load existing workbook
            workbook = openpyxl.load_workbook(excel_file)
            print(f"📊 Loaded existing Excel file: {excel_file}")
        else:
            # Create new workbook
            workbook = Workbook()
            # Remove default sheet
            workbook.remove(workbook.active)
            print(f"📊 Created new Excel file: {excel_file}")
        
        # Create or get candidates sheet
        if "Candidates" not in workbook.sheetnames:
            candidates_sheet = workbook.create_sheet("Candidates")
            setup_candidates_sheet(candidates_sheet)
        
        # Create analytics sheet
        if "Analytics" not in workbook.sheetnames:
            analytics_sheet = workbook.create_sheet("Analytics")
            setup_analytics_sheet(analytics_sheet)
        
        workbook.save(excel_file)
        return excel_file
        
    except Exception as e:
        print(f"❌ Excel setup failed: {e}")
        return None

def setup_candidates_sheet(sheet):
    """Setup candidates sheet with SIMPLIFIED headers - only what we actually use"""
    headers = [
        "Timestamp",              # 1. When processed
        "Name",                   # 2. Candidate name
        "Email",                  # 3. Contact email
        "Role Applied",           # 4. Target role (HR, ENGINEERING, etc.)
        "Position",               # 5. Specific position title
        "Overall Score",          # 6. LLM role-fit score (0-100)
        "Selection",              # 7. Yes/No recommendation
        "Status",                 # 8. shortlisted/reviewed/pending
        "Skills",                 # 9. Comma-separated skills
        "Matched Keywords",       # 10. Role-relevant skills
        "Experience",             # 11. Experience description
        "Source"                  # 12. Always "email" for now
    ]
    sheet.append(headers)
    
    # Format headers with professional styling
    header_font = Font(bold=True, color="FFFFFF", size=12)
    header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'), 
        right=Side(style='thin'), 
        top=Side(style='thin'), 
        bottom=Side(style='thin')
    )
    
    for col in range(1, len(headers) + 1):
        cell = sheet.cell(row=1, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border
        # Default column width
        sheet.column_dimensions[openpyxl.utils.get_column_letter(col)].width = 15
    
    # Set specific column widths for readability
    sheet.column_dimensions['A'].width = 20  # Timestamp
    sheet.column_dimensions['B'].width = 25  # Name
    sheet.column_dimensions['C'].width = 30  # Email
    sheet.column_dimensions['D'].width = 20  # Role Applied
    sheet.column_dimensions['E'].width = 25  # Position
    sheet.column_dimensions['F'].width = 15  # Overall Score
    sheet.column_dimensions['G'].width = 12  # Selection
    sheet.column_dimensions['H'].width = 15  # Status
    sheet.column_dimensions['I'].width = 40  # Skills (wider for comma-separated list)
    sheet.column_dimensions['J'].width = 35  # Matched Keywords
    sheet.column_dimensions['K'].width = 30  # Experience
    sheet.column_dimensions['L'].width = 12  # Source

def setup_analytics_sheet(sheet):
    """Setup analytics sheet with headers"""
    headers = [
        "Role", "Total Candidates", "Average Score", "Shortlisted Count", 
        "Reviewed Count", "Pending Count", "High Scores (80%+)", "Low Scores (<50%)",
        "Top Skill", "Most Common Position"
    ]
    sheet.append(headers)
    
    # Format analytics headers
    header_font = Font(bold=True, color="FFFFFF", size=12)
    header_fill = PatternFill(start_color="4F81BD", end_color="4F81BD", fill_type="solid")
    
    for col in range(1, len(headers) + 1):
        cell = sheet.cell(row=1, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")
        sheet.column_dimensions[openpyxl.utils.get_column_letter(col)].width = 18

def save_to_excel(candidate_data, role):
    """Save candidate data to Excel with CLEAN structure"""
    excel_file = "candidate_evaluation_dashboard.xlsx"
    
    try:
        workbook = openpyxl.load_workbook(excel_file)
        sheet = workbook["Candidates"]
        
        # ✅ CLEAN DATA: Only 12 meaningful columns
        row_data = [
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),         # 1. Timestamp
            candidate_data.get('name', 'Unknown'),                # 2. Name
            candidate_data.get('email', ''),                      # 3. Email
            role,                                                 # 4. Role Applied
            candidate_data.get('position', ''),                   # 5. Position
            candidate_data.get('overallScore', 0),                # 6. Overall Score
            candidate_data.get('selectionRecommendation', 'No'),  # 7. Selection (Yes/No)
            candidate_data.get('status', 'pending'),              # 8. Status
            ", ".join(candidate_data.get('skills', [])),          # 9. Skills
            ", ".join(candidate_data.get('matchedKeywords', [])), # 10. Matched Keywords
            candidate_data.get('experience', ''),                 # 11. Experience
            candidate_data.get('source', 'email')                 # 12. Source
        ]
        
        sheet.append(row_data)
        
        # Get the row number that was just appended
        new_row_num = sheet.max_row
        
        # Apply conditional formatting
        apply_row_formatting(sheet, new_row_num, candidate_data)
        
        # Update analytics dashboard
        update_analytics(workbook)
        
        workbook.save(excel_file)
        print(f"✅ Saved {candidate_data['name']} to Excel with {len(row_data)} columns")
        return True
        
    except PermissionError as e:
        print("\n" + "❌"*20)
        print("     EXCEL FILE IS OPEN - PLEASE CLOSE IT")
        print("     File: candidate_evaluation_dashboard.xlsx")
        print("❌"*20)
        return False
    except Exception as e:
        print(f"❌ Failed to save to Excel: {e}")
        import traceback
        traceback.print_exc()
        return False

def apply_row_formatting(sheet, row_num, candidate_data):
    """Apply conditional formatting to candidate row"""
    thin_border = Border(
        left=Side(style='thin'), 
        right=Side(style='thin'), 
        top=Side(style='thin'), 
        bottom=Side(style='thin')
    )
    
    # Apply borders to all cells in the row
    for col in range(1, sheet.max_column + 1):
        cell = sheet.cell(row=row_num, column=col)
        cell.border = thin_border
        cell.alignment = Alignment(vertical="center")
    
    # Color code Overall Score (Column F - index 6)
    overall_score = candidate_data.get('overallScore', 0)
    score_cell = sheet.cell(row=row_num, column=6)
    
    if overall_score >= 80:
        score_cell.fill = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")  # Light Green
        score_cell.font = Font(color="006100", bold=True, size=11)
    elif overall_score >= 60:
        score_cell.fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")  # Light Yellow
        score_cell.font = Font(color="9C6500", bold=True, size=11)
    else:
        score_cell.fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")  # Light Red
        score_cell.font = Font(color="9C0006", bold=True, size=11)
    
    score_cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Color code Selection (Column G - index 7)
    selection_cell = sheet.cell(row=row_num, column=7)
    selection = candidate_data.get('selectionRecommendation', 'No')
    
    if selection == 'Yes':
        selection_cell.fill = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
        selection_cell.font = Font(color="006100", bold=True, size=11)
    else:
        selection_cell.fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
        selection_cell.font = Font(color="9C0006", bold=True, size=11)
    
    selection_cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Color code Status (Column H - index 8)
    status_cell = sheet.cell(row=row_num, column=8)
    status = candidate_data.get('status', 'pending')
    
    if status == 'shortlisted':
        status_cell.fill = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
        status_cell.font = Font(color="006100", bold=True)
    elif status == 'reviewed':
        status_cell.fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
        status_cell.font = Font(color="9C6500", bold=True)
    else:
        status_cell.fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
        status_cell.font = Font(color="9C0006", bold=True)
    
    status_cell.alignment = Alignment(horizontal="center", vertical="center")

def update_analytics(workbook):
    """Update analytics sheet with summary data"""
    try:
        candidates_sheet = workbook["Candidates"]
        analytics_sheet = workbook["Analytics"]
        
        # Clear old analytics data (keep headers)
        analytics_sheet.delete_rows(2, analytics_sheet.max_row)
        
        # Get all candidates data
        candidates_data = []
        for row in range(2, candidates_sheet.max_row + 1):
            role = candidates_sheet.cell(row=row, column=4).value
            score = candidates_sheet.cell(row=row, column=6).value or 0
            status = candidates_sheet.cell(row=row, column=7).value
            skills = candidates_sheet.cell(row=row, column=8).value or ""
            position = candidates_sheet.cell(row=row, column=5).value or ""
            
            if role:
                candidates_data.append({
                    'role': role,
                    'score': score,
                    'status': status,
                    'skills': skills,
                    'position': position
                })
        
        # Calculate analytics by role
        from collections import defaultdict
        role_stats = defaultdict(lambda: {
            'total': 0, 'scores': [], 'shortlisted': 0, 'reviewed': 0, 'pending': 0,
            'skills': [], 'positions': []
        })
        
        for candidate in candidates_data:
            role = candidate['role']
            role_stats[role]['total'] += 1
            role_stats[role]['scores'].append(candidate['score'])
            role_stats[role]['skills'].extend(candidate['skills'].split(', '))
            role_stats[role]['positions'].append(candidate['position'])
            
            if candidate['status'] == 'shortlisted':
                role_stats[role]['shortlisted'] += 1
            elif candidate['status'] == 'reviewed':
                role_stats[role]['reviewed'] += 1
            else:
                role_stats[role]['pending'] += 1
        
        # Write analytics to sheet
        for role, stats in role_stats.items():
            avg_score = sum(stats['scores']) / len(stats['scores']) if stats['scores'] else 0
            high_scores = len([s for s in stats['scores'] if s >= 80])
            low_scores = len([s for s in stats['scores'] if s < 50])
            
            # Find most common skill and position
            from collections import Counter
            top_skill = Counter(stats['skills']).most_common(1)
            top_position = Counter(stats['positions']).most_common(1)
            
            analytics_sheet.append([
                role,
                stats['total'],
                round(avg_score, 2),
                stats['shortlisted'],
                stats['reviewed'],
                stats['pending'],
                high_scores,
                low_scores,
                top_skill[0][0] if top_skill else "N/A",
                top_position[0][0] if top_position else "N/A"
            ])
        
        print("📈 Analytics updated successfully")
        
    except Exception as e:
        print(f"❌ Analytics update failed: {e}")

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

# ---------------- Resume Processing Functions ----------------

def extract_text_from_resume(attachments):
    """Extract text from PDF or DOCX resume attachments"""
    for attachment in attachments:
        filename = attachment.get('filename', '').lower()
        
        # Check if it's a resume file
        if filename.endswith('.pdf') or filename.endswith('.docx'):
            try:
                print(f"📄 Processing resume: {filename}")
                
                # Handle different attachment formats
                if 'filepath' in attachment:
                    # Local file path
                    if filename.endswith('.pdf'):
                        with pdfplumber.open(attachment['filepath']) as pdf:
                            text = ""
                            for page in pdf.pages:
                                text += page.extract_text() or ""
                        return text
                    else:  # docx
                        return docx2txt.process(attachment['filepath'])
                        
                elif 'content' in attachment:
                    # Base64 encoded content
                    file_content = base64.b64decode(attachment['content'])
                    file_like = io.BytesIO(file_content)
                    
                    if filename.endswith('.pdf'):
                        with pdfplumber.open(file_like) as pdf:
                            text = ""
                            for page in pdf.pages:
                                text += page.extract_text() or ""
                        return text
                    else:  # docx
                        return docx2txt.process(file_like)
                else:
                    # If no filepath or content, try to use filename as mock
                    print(f"⚠️ No file content for {filename}, using mock data")
                    return f"Resume for {filename}"
                        
            except Exception as e:
                print(f"❌ Error extracting text from {filename}: {e}")
                continue
    
    return ""

async def analyze_resume_with_llm(resume_text, role, email_data):
    """Use Groq LLM for role-relevance focused resume analysis"""
    
    # Get role-specific keywords for matching
    role_keywords = ROLE_KEYWORDS.get(role, [])
    keywords_str = ", ".join(role_keywords[:15])  # Top 15 keywords
    
    # Enhanced prompt with role relevance focus
    analysis_prompt = f"""
You are an expert HR analyst. Analyze this resume for a **{role}** position and determine how well the candidate matches the role requirements.

**TARGET ROLE:** {role}
**KEY ROLE REQUIREMENTS:** {keywords_str}

**RESUME CONTENT:**
{resume_text[:6000]}

Your task is to:
1. Extract candidate information (name, email, skills)
2. Evaluate role relevance by checking:
   - Does the candidate have experience in {role} or similar roles?
   - Do their skills match the required keywords?
   - Is their background aligned with this role's requirements?
3. Provide a **role_fit_score** (0-100) that reflects:
   - 80-100: Excellent match - Strong experience and skills aligned with {role}
   - 60-79: Good match - Relevant experience with some gaps
   - 40-59: Moderate match - Some transferable skills but limited direct experience
   - 20-39: Weak match - Minimal alignment with role requirements
   - 0-19: Poor match - No relevant experience or skills for this role
4. Provide a **selection_recommendation** (Yes/No):
   - "Yes" = Score 70+ and candidate should move forward
   - "No" = Score below 70 or not suitable for the role

Return EXACTLY this JSON structure:
{{
    "name": "candidate full name",
    "email": "candidate email address",
    "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "role_fit_score": 75,
    "selection_recommendation": "Yes"
}}

**CRITICAL RULES:**
- Be STRICT about role fit - only give high scores (80+) if resume clearly shows {role} experience
- If resume is for a DIFFERENT role (e.g., applying as {role} but resume shows Chef experience), score should be LOW (0-30) and recommendation "No"
- Extract ONLY skills that are actually relevant to the {role} position
- Selection recommendation must be EXACTLY "Yes" or "No" (nothing else)
- Return ONLY valid JSON, no additional text or explanations
- If information is missing, use reasonable defaults

**SCORING EXAMPLES:**
- Resume shows "Senior Accountant with 5 years in financial reporting" for ACCOUNTANT role = 85+ score, "Yes"
- Resume shows "Software Engineer with Python, Java experience" for ENGINEERING role = 80+ score, "Yes"
- Resume shows "Junior Developer with 1 year experience" for ENGINEERING role = 65 score, "No"
- Resume shows "Chef with culinary expertise" for ACCOUNTANT role = 10-20 score, "No"
- Resume shows "Sales Manager" for ENGINEERING role = 15-25 score, "No"
"""
    
    try:
        print(f"🧠 Analyzing resume for {role} role with relevance check...")
        
        response = await llm.ainvoke(analysis_prompt)
        llm_response = response.content.strip()
        
        # Remove markdown code blocks if present
        if llm_response.startswith("```json"):
            llm_response = llm_response.split("```json")[1].split("```")[0].strip()
        elif llm_response.startswith("```"):
            llm_response = llm_response.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        analysis_result = json.loads(llm_response)
        
        # Fallback for name/email from email data
        sender = email_data.get('sender', '')
        if not analysis_result.get('name') or analysis_result['name'] == 'candidate name':
            analysis_result['name'] = extract_name_from_email(sender)
        
        if not analysis_result.get('email') or analysis_result['email'] == 'candidate email':
            analysis_result['email'] = sender
        
        # Use role_fit_score as overall_rating
        overall_score = analysis_result.get('role_fit_score', 0)
        
        # Validate score is reasonable
        if not isinstance(overall_score, (int, float)) or overall_score < 0 or overall_score > 100:
            print(f"⚠️ Invalid score {overall_score}, defaulting to 30")
            overall_score = 30
        
        analysis_result['overall_rating'] = int(overall_score)
        
        # Validate selection recommendation
        recommendation = analysis_result.get('selection_recommendation', 'No')
        if recommendation not in ['Yes', 'No']:
            # Default based on score
            recommendation = 'Yes' if overall_score >= 70 else 'No'
            analysis_result['selection_recommendation'] = recommendation
        
        print(f"✅ Analysis complete: {analysis_result['name']}")
        print(f"   Role Fit Score: {overall_score}%")
        print(f"   Selection Recommendation: {recommendation}")
        print(f"   Skills Found: {len(analysis_result.get('skills', []))}")
        
        return analysis_result
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing failed: {e}")
        print(f"LLM Response: {llm_response[:500]}")
        return create_clean_error_result(email_data, role, "JSON parsing failed")
    except Exception as e:
        print(f"❌ LLM analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return create_clean_error_result(email_data, role, str(e))

def create_clean_error_result(email_data, role, error_msg):
    """Clean error result without complex fallbacks"""
    sender = email_data.get('sender', '')
    return {
        "name": extract_name_from_email(sender),
        "email": sender,
        "skills": ["Analysis Failed"],
        "overall_rating": 0,
        "skill_ratings": [],
        "error": error_msg
    }

def extract_name_from_email(email):
    """Extract name from email address"""
    if '<' in email and '>' in email:
        # Format: "Name <email@domain.com>"
        name_part = email.split('<')[0].strip()
        return name_part
    else:
        # Format: "email@domain.com" or "name.email@domain.com"
        name_part = email.split('@')[0]
        # Convert "john.doe" to "John Doe"
        return ' '.join([part.capitalize() for part in name_part.split('.')])

def extract_position_from_subject(subject):
    """Extract position from email subject"""
    patterns = [
        r'Application for (.+?)(?:\s+position|\s*$)',
        r'(.+?)\s+Position',
        r'Applying for (.+)',
        r'(.+?)\s+Application'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, subject, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    # Fallback to role-based guess
    subject_lower = subject.lower()
    if any(word in subject_lower for word in ['engineer', 'developer', 'software']):
        return 'Software Engineer'
    elif any(word in subject_lower for word in ['accountant', 'finance', 'financial']):
        return 'Accountant'
    elif any(word in subject_lower for word in ['sales', 'business']):
        return 'Sales Professional'
    elif any(word in subject_lower for word in ['hr', 'human resources']):
        return 'HR Manager'
    
    return 'Professional'

# ---------------- API Setup ----------------
app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
        "http://localhost:5173",
        "null"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    session_id: str | None = None

class ProcessResumeRequest(BaseModel):
    role: str
    email_data: dict

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

# Initialize Excel storage
print("📊 Setting up Excel storage...")
excel_file = setup_excel_file()
if excel_file:
    print(f"✅ Excel file ready: {excel_file}")
else:
    print("❌ Excel setup failed")

# Build the vectorstore
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
        "active_sessions": len(sessions),
        "resume_processing": "available",
        "excel_storage": "available" if excel_file else "unavailable"
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

@app.post("/process-resume")
async def process_resume(request: ProcessResumeRequest):
    """Process resume with role-relevance checking"""
    print(f"🎯 Processing resume for role: {request.role}")
    
    try:
        email_data = request.email_data
        attachments = email_data.get('attachments', [])
        
        # Extract text from resume
        resume_text = extract_text_from_resume(attachments)
        
        if not resume_text:
            resume_text = f"{email_data.get('subject', '')} {email_data.get('body', '')}"
        
        print(f"📄 Resume text extracted: {len(resume_text)} characters")
        
        # Use LLM for role-relevance analysis
        analysis_result = await analyze_resume_with_llm(resume_text, request.role, email_data)
        
        # Determine status based on role fit score
        overall_score = analysis_result["overall_rating"]
        selection_recommendation = analysis_result.get("selection_recommendation", "No")
        
        if overall_score >= 75:
            status = "shortlisted"
        elif overall_score >= 50:
            status = "reviewed"
        else:
            status = "pending"
        
        # Convert to frontend format - simplified structure
        frontend_data = {
            "name": analysis_result["name"],
            "email": analysis_result["email"],
            "skills": analysis_result["skills"],
            "scores": [],  # Empty array
            "overallScore": overall_score,
            "position": request.role,
            "experience": "Analyzed from resume",
            "status": status,
            "matchedKeywords": analysis_result["skills"],  # Use skills as matched keywords
            "selectionRecommendation": selection_recommendation,  # Add Yes/No recommendation
            "source": "email"
        }
        
        # Save to Excel
        save_to_excel(frontend_data, request.role)
        
        print(f"✅ Role-Relevance Analysis Complete:")
        print(f"   Name: {analysis_result['name']}")
        print(f"   Role Fit Score: {overall_score}%")
        print(f"   Status: {status}")
        print(f"   Selection: {selection_recommendation}")
        
        return {
            "success": True,
            "data": frontend_data
        }
        
    except Exception as e:
        print(f"❌ Error in /process-resume: {e}")
        import traceback
        traceback.print_exc()
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "data": None
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
        6. Only answer question if related information is found in our vector database
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
    print("🎯 Resume processing endpoint: /process-resume")
    print("📊 Excel storage: candidate_evaluation_dashboard.xlsx")
    print("🌐 Server running at: http://127.0.0.1:8000")
    print("💡 Make sure to serve the frontend with a local server (e.g., Live Server extension)\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
