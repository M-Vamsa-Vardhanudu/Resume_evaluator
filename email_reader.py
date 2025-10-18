import imaplib
import email
from email.header import decode_header
import os
from datetime import datetime
import time

IMAP_HOST = "imap.gmail.com"
USER = "vamsivardhan25@gmail.com"
PWD = "vbzp skyk eory oius"

def decode_mime_words(s):
    """Decode MIME encoded-words in headers"""
    if s is None:
        return ""
    decoded_parts = decode_header(s)
    decoded_string = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            decoded_string += part.decode(encoding or 'utf-8', errors='ignore')
        else:
            decoded_string += part
    return decoded_string

def fetch_unread_emails(download_dir="email_attachments", limit=10):
    """Fetch latest emails and download PDF attachments"""
    print(f"\n🔍 DEBUG: Starting email fetch (limit={limit})")
    print(f"🔍 DEBUG: Download directory: {download_dir}")
    
    os.makedirs(download_dir, exist_ok=True)
    print(f"🔍 DEBUG: Directory created/verified")
    
    emails_data = []
    
    try:
        print(f"🔍 DEBUG: Connecting to {IMAP_HOST}...")
        with imaplib.IMAP4_SSL(IMAP_HOST) as M:
            print(f"🔍 DEBUG: Logging in as {USER}...")
            M.login(USER, PWD)
            print(f"🔍 DEBUG: Login successful!")
            
            print(f"🔍 DEBUG: Selecting INBOX...")
            M.select("INBOX")
            print(f"🔍 DEBUG: INBOX selected")
            
            # Search for ALL emails instead of just UNSEEN
            print(f"🔍 DEBUG: Searching for ALL emails...")
            typ, data = M.search(None, "ALL")
            print(f"🔍 DEBUG: Search result type: {typ}")
            print(f"🔍 DEBUG: Search data: {data}")
            
            if not data[0]:
                print("⚠️ DEBUG: No emails found in search")
                return []
            
            # Get all email IDs and reverse to get latest first
            email_ids = data[0].split()
            print(f"🔍 DEBUG: Total emails found: {len(email_ids)}")
            email_ids.reverse()
            
            # Limit to the specified number of latest emails
            email_ids = email_ids[:limit]
            print(f"🔍 DEBUG: Processing latest {len(email_ids)} emails")
            
            for idx, num in enumerate(email_ids, 1):
                print(f"\n📧 DEBUG: Fetching email {idx}/{len(email_ids)} (ID: {num.decode()})...")
                typ, msg_data = M.fetch(num, "(RFC822)")
                msg = email.message_from_bytes(msg_data[0][1])

                sender = decode_mime_words(msg.get("From", ""))
                subject = decode_mime_words(msg.get("Subject", ""))
                date = msg.get("Date", "")
                
                print(f"   From: {sender}")
                print(f"   Subject: {subject}")
                print(f"   Date: {date}")

                # Extract plain text body
                body = ""
                attachments = []
                
                print(f"   DEBUG: Is multipart: {msg.is_multipart()}")
                
                if msg.is_multipart():
                    part_count = 0
                    for part in msg.walk():
                        part_count += 1
                        content_type = part.get_content_type()
                        content_disposition = str(part.get("Content-Disposition", ""))
                        
                        print(f"   DEBUG: Part {part_count} - Type: {content_type}, Disposition: {content_disposition[:50]}")
                        
                        # Get email body
                        if content_type == "text/plain" and "attachment" not in content_disposition:
                            try:
                                body = part.get_payload(decode=True).decode(errors="ignore")
                                print(f"   DEBUG: Body extracted (length: {len(body)})")
                            except Exception as e:
                                print(f"   ⚠️ DEBUG: Error extracting body: {e}")
                        
                        # Handle attachments
                        elif "attachment" in content_disposition:
                            filename = part.get_filename()
                            if filename:
                                filename = decode_mime_words(filename)
                                print(f"   DEBUG: Found attachment: {filename}")
                                
                                # Download PDF attachments
                                if filename.lower().endswith('.pdf'):
                                    filepath = os.path.join(download_dir, f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}")
                                    try:
                                        with open(filepath, "wb") as f:
                                            f.write(part.get_payload(decode=True))
                                        print(f"   ✅ DEBUG: PDF saved to {filepath}")
                                        attachments.append({
                                            "filename": filename,
                                            "filepath": filepath,
                                            "type": "pdf"
                                        })
                                    except Exception as e:
                                        print(f"   ⚠️ DEBUG: Error saving PDF: {e}")
                                else:
                                    print(f"   DEBUG: Skipping non-PDF attachment: {filename}")
                else:
                    try:
                        body = msg.get_payload(decode=True).decode(errors="ignore")
                        print(f"   DEBUG: Single-part body extracted (length: {len(body)})")
                    except Exception as e:
                        print(f"   ⚠️ DEBUG: Error extracting single-part body: {e}")

                email_data = {
                    "sender": sender,
                    "subject": subject,
                    "date": date,
                    "body": body[:500] if body else "",  # First 500 chars
                    "full_body": body,
                    "attachments": attachments,
                    "has_resume": len([a for a in attachments if a['type'] == 'pdf']) > 0
                }
                
                print(f"   DEBUG: Email has {len(attachments)} PDF attachments")
                emails_data.append(email_data)

            M.logout()
            print(f"\n✅ DEBUG: Successfully logged out")
            print(f"✅ DEBUG: Total emails processed: {len(emails_data)}")
            
    except Exception as e:
        print(f"\n❌ DEBUG: Error fetching emails: {e}")
        import traceback
        traceback.print_exc()
        return []
    
    return emails_data

def get_email_summary():
    """Get a summary of latest 10 emails"""
    print("\n" + "="*60)
    print("Starting get_email_summary()")
    print("="*60)
    
    emails = fetch_unread_emails(limit=10)
    
    print(f"\n📊 DEBUG: Summary statistics:")
    print(f"   Total emails fetched: {len(emails)}")
    print(f"   Emails with PDF resumes: {len([e for e in emails if e['has_resume']])}")
    
    result = {
        "total_unread": len(emails),
        "emails_with_resumes": len([e for e in emails if e['has_resume']]),
        "emails": emails
    }
    
    print(f"\n✅ DEBUG: Returning result with {result['total_unread']} emails")
    return result

if __name__ == "__main__":
    while True:
        print("\nFetching unread emails...")
        result = get_email_summary()
        print(f"\nTotal unread: {result['total_unread']}")
        print(f"Emails with PDF attachments: {result['emails_with_resumes']}")
        
        for idx, email_data in enumerate(result['emails'], 1):
            print(f"\n--- Email {idx} ---")
            print(f"From: {email_data['sender']}")
            print(f"Subject: {email_data['subject']}")
            print(f"Attachments: {len(email_data['attachments'])}")
            for att in email_data['attachments']:
                print(f"  - {att['filename']} (saved to {att['filepath']})")
        
        print("Sleeping 5 minutes...\n")
        time.sleep(300)  # 300 seconds = 5 minutes
