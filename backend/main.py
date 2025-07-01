# FastAPI Backend for Todo App - WITH DIARY SCHEDULING AND QUESTS
# File: main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Date, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from datetime import datetime, date, timezone, timedelta
from typing import List, Optional
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from jose import jwt, JWTError
from passlib.context import CryptContext
from typing import List, Optional
from sqlalchemy.orm import selectinload
import secrets
import requests
from fastapi.responses import RedirectResponse
import os
from dotenv import load_dotenv

load_dotenv()

# OAuth2 Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# Timezone compatibility function
def utc_now():
    """Returns timezone-aware UTC datetime compatible with all Python versions"""
    return datetime.now(timezone.utc)

# Database setup - MySQL configuration
# Šiht
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:pass@127.0.0.1:3306/side_projects")

# Doma
#DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@127.0.0.1:3306/side_projects")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=True if os.getenv("DEBUG", "False").lower() == "true" else False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

app = FastAPI(title="Todo App API", version="1.0.0")




# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Models - MySQL Compatible with HIERARCHY SUPPORT
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    google_id = Column(String(255), unique=True, index=True, nullable=True)  # NEW
    avatar_url = Column(String(500), nullable=True)  # NEW
    google_calendar_token = Column(Text)
    google_calendar_refresh_token = Column(Text)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    diary_entries = relationship("DiaryEntry", back_populates="user", cascade="all, delete-orphan")
    quests = relationship("Quest", back_populates="user", cascade="all, delete-orphan")

class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    color = Column(String(7), default="#3B82F6")
    parent_folder_id = Column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    user = relationship("User", back_populates="folders")
    tasks = relationship("Task", back_populates="folder")
    diary_entries = relationship("DiaryEntry", back_populates="folder")
    quests = relationship("Quest", back_populates="folder")

class Quest(Base):
    __tablename__ = "quests"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)  # Max 200 characters
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    user = relationship("User", back_populates="quests")
    folder = relationship("Folder", back_populates="quests")
    paragraphs = relationship("QuestParagraph", back_populates="quest", cascade="all, delete-orphan")

class QuestParagraph(Base):
    __tablename__ = "quest_paragraphs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quest_id = Column(Integer, ForeignKey("quests.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    quest = relationship("Quest", back_populates="paragraphs")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)
    parent_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)  # Hierarchy support
    title = Column(String(500), nullable=False)
    description = Column(Text)
    priority = Column(Integer, default=1)
    status = Column(String(20), default="pending")
    due_date = Column(DateTime, nullable=True)
    is_calendar_event = Column(Boolean, default=False)
    google_calendar_event_id = Column(String(255))
    indent_level = Column(Integer, default=0)  # Track indentation level
    order_index = Column(Integer, default=0)  # Track ordering within same level
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    user = relationship("User", back_populates="tasks")
    folder = relationship("Folder", back_populates="tasks")
    parent_task = relationship("Task", remote_side="Task.id", back_populates="subtasks")  # Parent relationship
    subtasks = relationship("Task", back_populates="parent_task", cascade="all, delete-orphan")  # Children relationship
    substeps = relationship("TaskSubstep", back_populates="task", cascade="all, delete-orphan")
    notes = relationship("TaskNote", back_populates="task", cascade="all, delete-orphan")

class TaskSubstep(Base):
    __tablename__ = "task_substeps"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    is_completed = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    task = relationship("Task", back_populates="substeps")

class TaskNote(Base):
    __tablename__ = "task_notes"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    
    task = relationship("Task", back_populates="notes")

class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)
    entry_date = Column(Date, nullable=False)
    title = Column(String(500))
    content = Column(Text, nullable=False)
    scheduled_date = Column(DateTime, nullable=True)  # When diary entry is scheduled for
    is_scheduled = Column(Boolean, default=False)  # Whether entry is scheduled
    google_calendar_event_id = Column(String(255))  # Google Calendar integration
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    user = relationship("User", back_populates="diary_entries")
    folder = relationship("Folder", back_populates="diary_entries")

# Pydantic models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    folder_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    priority: int = 1
    due_date: Optional[datetime] = None
    is_calendar_event: bool = False
    indent_level: int = 0
    order_index: int = 0

class TaskSubstepCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: int = 0

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: int
    status: str
    due_date: Optional[datetime]
    is_calendar_event: bool
    parent_task_id: Optional[int]
    indent_level: int
    order_index: int
    created_at: datetime
    folder_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class TaskIndentUpdate(BaseModel):
    indent_change: int

class DiaryEntryCreate(BaseModel):
    entry_date: date
    title: Optional[str] = None
    content: str
    folder_id: Optional[int] = None
    # NEW: Scheduling fields
    scheduled_date: Optional[datetime] = None
    is_scheduled: bool = False

class DiaryEntryResponse(BaseModel):
    id: int
    entry_date: date
    title: Optional[str]
    content: str
    folder_id: Optional[int]
    scheduled_date: Optional[datetime]
    is_scheduled: bool
    google_calendar_event_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FolderCreate(BaseModel):
    name: str
    color: str = "#3B82F6"
    parent_folder_id: Optional[int] = None


class QuestParagraphCreate(BaseModel):
    content: str
    order_index: int = 0

class QuestParagraphResponse(BaseModel):
    id: int
    content: str
    order_index: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class QuestCreate(BaseModel):
    title: str
    folder_id: Optional[int] = None
    paragraphs: List[QuestParagraphCreate] = []

class QuestResponse(BaseModel):
    id: int
    title: str
    folder_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    paragraphs: List[QuestParagraphResponse] = []
    
    class Config:
        from_attributes = True

# NEW: OAuth2 Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Global test user cache to prevent race conditions
_test_user_cache = None

# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    global _test_user_cache
    
    # For development, if no auth provided, return test user
    if not credentials:
        # Use cached test user if available
        if _test_user_cache:
            return _test_user_cache
            
        # Try to get existing test user first
        try:
            test_user = db.query(User).filter(User.email == "test@example.com").first()
            if test_user:
                _test_user_cache = test_user
                return test_user
        except Exception as e:
            print(f"Error querying for test user: {e}")
        
        # Create test user if it doesn't exist
        try:
            test_user = User(email="test@example.com", name="Test User")
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            _test_user_cache = test_user
            print(f"Created new test user with ID: {test_user.id}")
            return test_user
        except Exception as e:
            # If creation fails (likely due to race condition), try to get existing user again
            db.rollback()
            try:
                test_user = db.query(User).filter(User.email == "test@example.com").first()
                if test_user:
                    _test_user_cache = test_user
                    return test_user
            except Exception:
                pass
            # If everything fails, raise error
            raise HTTPException(status_code=500, detail="Failed to get or create test user")
    
    # Handle token-based authentication
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

def migrate_database():
    """Migrate existing database to add new hierarchy columns and diary scheduling"""
    try:
        with engine.connect() as connection:
            # Check if the new task columns exist
            result = connection.execute(text("SHOW COLUMNS FROM tasks LIKE 'parent_task_id'"))
            if not result.fetchone():
                print("Adding hierarchy columns to tasks table...")
                
                # Add the new columns
                connection.execute(text("ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER NULL"))
                connection.execute(text("ALTER TABLE tasks ADD COLUMN indent_level INTEGER DEFAULT 0 NOT NULL"))
                connection.execute(text("ALTER TABLE tasks ADD COLUMN order_index INTEGER DEFAULT 0 NOT NULL"))
                
                # Add foreign key constraint
                connection.execute(text("""
                    ALTER TABLE tasks 
                    ADD CONSTRAINT fk_parent_task 
                    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
                """))
                
                connection.commit()
                print("Successfully added hierarchy columns!")
            else:
                print("Hierarchy columns already exist, skipping migration.")
            
            # Check if diary scheduling columns exist
            result = connection.execute(text("SHOW COLUMNS FROM diary_entries LIKE 'scheduled_date'"))
            if not result.fetchone():
                print("Adding scheduling columns to diary_entries table...")
                
                # Add the new diary scheduling columns
                connection.execute(text("ALTER TABLE diary_entries ADD COLUMN scheduled_date DATETIME NULL"))
                connection.execute(text("ALTER TABLE diary_entries ADD COLUMN is_scheduled BOOLEAN DEFAULT FALSE NOT NULL"))
                connection.execute(text("ALTER TABLE diary_entries ADD COLUMN google_calendar_event_id VARCHAR(255) NULL"))
                
                connection.commit()
                print("Successfully added diary scheduling columns!")
            else:
                print("Diary scheduling columns already exist, skipping migration.")
                
    except Exception as e:
        print(f"Migration error: {e}")
        # If migration fails, we'll still try to create tables normally
        pass

# Google Calendar Integration
def get_google_calendar_service(user: User):
    if not user.google_calendar_token:
        return None
    
    credentials = Credentials(
        token=user.google_calendar_token,
        refresh_token=user.google_calendar_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET")
    )
    
    return build('calendar', 'v3', credentials=credentials)

# Helper function to convert task to dict with progress info
def task_to_dict_with_progress(task, all_tasks):
    """Convert task to dictionary with calculated progress"""
    # Get subtasks for this task
    subtasks = [t for t in all_tasks if t.parent_task_id == task.id]
    completed_subtasks = sum(1 for t in subtasks if t.status == 'completed')
    total_subtasks = len(subtasks)
    
    # Calculate progress
    progress = completed_subtasks / total_subtasks if total_subtasks > 0 else None
    
    # Convert to dict
    task_dict = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "due_date": task.due_date,
        "is_calendar_event": task.is_calendar_event,
        "parent_task_id": task.parent_task_id,
        "indent_level": task.indent_level,
        "order_index": task.order_index,
        "created_at": task.created_at,
        "folder_id": task.folder_id,
        "progress": progress,
        "substeps": [{"id": s.id, "title": s.title, "is_completed": s.is_completed} for s in task.substeps],
        "notes": [{"id": n.id, "content": n.content, "created_at": n.created_at} for n in task.notes],
        "subtasks": []  # We'll populate this in the frontend if needed
    }
    
    return task_dict

def update_subtasks_folder_recursive(db: Session, task_id: int, folder_id: int | None):
    """Recursively update folder_id for all subtasks of a given task"""
    try:
        # Get all direct subtasks
        direct_subtasks = db.query(Task).filter(Task.parent_task_id == task_id).all()
        
        for subtask in direct_subtasks:
            # Update this subtask's folder_id
            subtask.folder_id = folder_id
            subtask.updated_at = utc_now()
            
            # Recursively update this subtask's children
            update_subtasks_folder_recursive(db, subtask.id, folder_id)
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error updating subtasks folder: {e}")


# Helper function to order tasks hierarchically
def get_hierarchical_task_order(tasks):
    """Return tasks in hierarchical order where children appear after their parents"""
    # Create a map for quick lookup
    task_map = {task.id: task for task in tasks}
    result = []
    processed = set()
    
    def add_task_and_children(task):
        """Recursively add task and its children to result"""
        if task.id in processed:
            return
            
        result.append(task)
        processed.add(task.id)
        
        # Get children of this task, sorted by order_index and created_at
        children = [t for t in tasks if t.parent_task_id == task.id]
        children.sort(key=lambda x: (x.order_index, x.created_at))
        
        # Recursively add each child and their children
        for child in children:
            add_task_and_children(child)
    
    # Start with root tasks (no parent), sorted by order_index and created_at
    root_tasks = [t for t in tasks if t.parent_task_id is None]
    root_tasks.sort(key=lambda x: (x.order_index, x.created_at))
    
    # Add each root task and its hierarchy
    for root_task in root_tasks:
        add_task_and_children(root_task)
    
    return result

# OAuth2 utility functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    """Get current authenticated user from JWT token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_oauth2_fields():
    """Add OAuth2 fields to existing users table"""
    try:
        with engine.connect() as connection:
            # Check if oauth2 columns exist
            result = connection.execute(text("SHOW COLUMNS FROM users LIKE 'google_id'"))
            if not result.fetchone():
                print("Adding OAuth2 columns to users table...")
                
                connection.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL"))
                connection.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL"))
                connection.execute(text("ALTER TABLE users ADD UNIQUE INDEX idx_google_id (google_id)"))
                
                connection.commit()
                print("Successfully added OAuth2 columns!")
            else:
                print("OAuth2 columns already exist, skipping migration.")
                
    except Exception as e:
        print(f"OAuth2 migration error: {e}")

# Create tables and run migrations
def create_tables():
    Base.metadata.create_all(bind=engine)


# Development-only route for testing without OAuth2
@app.post("/auth/dev-login")
async def dev_login(db: Session = Depends(get_db)):
    """Development-only login (creates/returns test user)"""
    if os.getenv("NODE_ENV") == "production":
        raise HTTPException(status_code=404, detail="Not found")
    
    # Get or create test user
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        user = User(
            email="test@example.com",
            name="Test User",
            google_id="test_user_123"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url
        }
    }

@app.get("/auth/google")
async def google_auth():
    """Initiate Google OAuth2 flow"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth2 not configured")
    
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"scope=openid email profile https://www.googleapis.com/auth/calendar&"
        f"response_type=code&"
        f"access_type=offline&"
        f"prompt=consent"
    )
    
    return {"auth_url": google_auth_url}

@app.get("/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth2 callback"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth2 not configured")
    
    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_REDIRECT_URI,
    }
    
    try:
        token_response = requests.post(token_url, data=token_data)
        token_response.raise_for_status()
        tokens = token_response.json()
        
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        
        # Get user info from Google
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
        user_response = requests.get(user_info_url)
        user_response.raise_for_status()
        user_data = user_response.json()
        
        # Find or create user
        user = db.query(User).filter(User.google_id == user_data["id"]).first()
        if not user:
            # Check if user exists by email
            user = db.query(User).filter(User.email == user_data["email"]).first()
            if user:
                # Update existing user with Google ID
                user.google_id = user_data["id"]
                user.avatar_url = user_data.get("picture")
                user.google_calendar_token = access_token
                user.google_calendar_refresh_token = refresh_token
            else:
                # Create new user
                user = User(
                    email=user_data["email"],
                    name=user_data["name"],
                    google_id=user_data["id"],
                    avatar_url=user_data.get("picture"),
                    google_calendar_token=access_token,
                    google_calendar_refresh_token=refresh_token
                )
                db.add(user)
        else:
            # Update existing user tokens
            user.google_calendar_token = access_token
            user.google_calendar_refresh_token = refresh_token
            user.avatar_url = user_data.get("picture")
        
        db.commit()
        db.refresh(user)
        
        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        # Redirect to frontend with token
        redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
        return RedirectResponse(url=redirect_url)
        
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to authenticate with Google: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

@app.post("/auth/logout")
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Logged out successfully"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# API Routes
@app.post("/api/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # If parent_task_id is provided, verify it exists and belongs to the user
    parent_folder_id = None
    if task.parent_task_id:
        parent_task = db.query(Task).filter(
            Task.id == task.parent_task_id, 
            Task.user_id == current_user.id
        ).first()
        if not parent_task:
            raise HTTPException(status_code=404, detail="Parent task not found")
        
        # Set indent level based on parent
        task.indent_level = parent_task.indent_level + 1
        
        # INHERIT PARENT'S FOLDER_ID
        parent_folder_id = parent_task.folder_id
        
        # Set order_index for subtasks
        existing_siblings = db.query(Task).filter(Task.parent_task_id == task.parent_task_id).all()
        task.order_index = len(existing_siblings)
    else:
        # Set order_index for root tasks
        existing_root_tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.parent_task_id.is_(None),
            Task.folder_id == task.folder_id
        ).all()
        task.order_index = len(existing_root_tasks)
    
    # Use model_dump instead of dict()
    task_data = task.model_dump()
    
    # Override folder_id if this is a subtask (inherit from parent)
    if parent_folder_id is not None:
        task_data['folder_id'] = parent_folder_id
    
    db_task = Task(**task_data, user_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # If it's a calendar event, add to Google Calendar
    if task.is_calendar_event and task.due_date:
        calendar_service = get_google_calendar_service(current_user)
        if calendar_service:
            try:
                event = {
                    'summary': task.title,
                    'description': task.description,
                    'start': {'dateTime': task.due_date.isoformat()},
                    'end': {'dateTime': task.due_date.isoformat()},
                }
                created_event = calendar_service.events().insert(calendarId='primary', body=event).execute()
                db_task.google_calendar_event_id = created_event['id']
                db.commit()
            except Exception as e:
                print(f"Calendar integration failed: {e}")
    
    return db_task

@app.post("/api/quests", response_model=QuestResponse)
def create_quest(quest: QuestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate title length
    if len(quest.title) > 200:
        raise HTTPException(status_code=400, detail="Quest title cannot exceed 200 characters")
    
    # Create quest
    db_quest = Quest(
        title=quest.title,
        folder_id=quest.folder_id,
        user_id=current_user.id
    )
    db.add(db_quest)
    db.commit()
    db.refresh(db_quest)
    
    # Create paragraphs
    for i, paragraph in enumerate(quest.paragraphs):
        db_paragraph = QuestParagraph(
            quest_id=db_quest.id,
            content=paragraph.content,
            order_index=paragraph.order_index or i
        )
        db.add(db_paragraph)
    
    db.commit()
    
    # IMPORTANT: Re-fetch the quest with eager-loaded paragraphs
    db_quest = db.query(Quest).options(selectinload(Quest.paragraphs)).filter(Quest.id == db_quest.id).first()
    
    return db_quest

@app.get("/api/quests")
def get_quests(folder_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Quest).options(selectinload(Quest.paragraphs)).filter(Quest.user_id == current_user.id)
    if folder_id:
        query = query.filter(Quest.folder_id == folder_id)
    return query.order_by(Quest.created_at.desc()).all()

@app.put("/api/quests/{quest_id}")
def update_quest(quest_id: int, updates: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify quest belongs to user
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Validate title length if being updated
    if 'title' in updates and len(updates['title']) > 200:
        raise HTTPException(status_code=400, detail="Quest title cannot exceed 200 characters")
    
    # Update quest fields
    for field, value in updates.items():
        if hasattr(quest, field):
            setattr(quest, field, value)
    
    quest.updated_at = utc_now()
    db.commit()
    
    # IMPORTANT: Re-fetch the quest with eager-loaded paragraphs
    quest = db.query(Quest).options(selectinload(Quest.paragraphs)).filter(Quest.id == quest_id).first()
    
    return quest

@app.delete("/api/quests/{quest_id}")
def delete_quest(quest_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify quest belongs to user
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    quest_title = quest.title
    db.delete(quest)
    db.commit()
    
    return {"message": f"Quest '{quest_title}' deleted successfully", "id": quest_id}

@app.post("/api/quests/{quest_id}/paragraphs")
def add_quest_paragraph(quest_id: int, paragraph: QuestParagraphCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify quest belongs to user
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # If no order_index provided, set to end
    if paragraph.order_index == 0:
        max_order = db.query(QuestParagraph).filter(QuestParagraph.quest_id == quest_id).count()
        paragraph.order_index = max_order
    
    db_paragraph = QuestParagraph(
        quest_id=quest_id,
        content=paragraph.content,
        order_index=paragraph.order_index
    )
    db.add(db_paragraph)
    db.commit()
    db.refresh(db_paragraph)
    return db_paragraph

@app.put("/api/quests/{quest_id}/paragraphs/{paragraph_id}")
def update_quest_paragraph(quest_id: int, paragraph_id: int, updates: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify quest belongs to user
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Verify paragraph belongs to quest
    paragraph = db.query(QuestParagraph).filter(QuestParagraph.id == paragraph_id, QuestParagraph.quest_id == quest_id).first()
    if not paragraph:
        raise HTTPException(status_code=404, detail="Paragraph not found")
    
    # Update paragraph fields
    for field, value in updates.items():
        if hasattr(paragraph, field):
            setattr(paragraph, field, value)
    
    paragraph.updated_at = utc_now()
    db.commit()
    db.refresh(paragraph)
    return paragraph

@app.delete("/api/quests/{quest_id}/paragraphs/{paragraph_id}")
def delete_quest_paragraph(quest_id: int, paragraph_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify quest belongs to user
    quest = db.query(Quest).filter(Quest.id == quest_id, Quest.user_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Verify paragraph belongs to quest
    paragraph = db.query(QuestParagraph).filter(QuestParagraph.id == paragraph_id, QuestParagraph.quest_id == quest_id).first()
    if not paragraph:
        raise HTTPException(status_code=404, detail="Paragraph not found")
    
    db.delete(paragraph)
    db.commit()
    
    return {"message": "Paragraph deleted successfully", "id": paragraph_id}


@app.put("/api/folders/{folder_id}")
def update_folder(folder_id: int, updates: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify folder belongs to user
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Validate folder name length if it's being updated
    if 'name' in updates:
        name = updates['name'].strip()
        if not name:
            raise HTTPException(status_code=400, detail="Folder name cannot be empty")
        if len(name) > 16:
            raise HTTPException(status_code=400, detail="Folder name cannot exceed 16 characters")
        updates['name'] = name
    
    # Update folder fields
    for field, value in updates.items():
        if hasattr(folder, field):
            setattr(folder, field, value)
    
    folder.updated_at = utc_now()
    db.commit()
    db.refresh(folder)
    return folder

@app.get("/api/tasks")
def get_tasks(folder_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if folder_id:
        query = query.filter(Task.folder_id == folder_id)
    
    # Get all tasks first
    all_tasks = query.all()
    
    # Order tasks hierarchically
    hierarchical_tasks = get_hierarchical_task_order(all_tasks)
    
    # Convert to dictionaries with progress info
    result = []
    for task in hierarchical_tasks:
        task_dict = task_to_dict_with_progress(task, all_tasks)
        result.append(task_dict)
    
    return result

@app.post("/api/tasks/{task_id}/subtasks")
def create_subtask(task_id: int, subtask: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify parent task belongs to user
    parent_task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not parent_task:
        raise HTTPException(status_code=404, detail="Parent task not found")
    
    # Create subtask with parent reference
    subtask.parent_task_id = task_id
    subtask.indent_level = parent_task.indent_level + 1
    
    # INHERIT PARENT'S FOLDER_ID
    subtask.folder_id = parent_task.folder_id
    
    # Set order_index to appear at the end of parent's children
    existing_children = db.query(Task).filter(Task.parent_task_id == task_id).all()
    subtask.order_index = len(existing_children)
    
    # Use model_dump instead of dict()
    db_subtask = Task(**subtask.model_dump(), user_id=current_user.id)
    db.add(db_subtask)
    db.commit()
    db.refresh(db_subtask)
    return db_subtask

@app.put("/api/tasks/{task_id}/indent")
def update_task_indent(task_id: int, update: TaskIndentUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update task indentation level"""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    indent_change = update.indent_change
    new_indent_level = max(0, task.indent_level + indent_change)
    
    # If indenting (moving right), find a potential parent
    if indent_change > 0 and new_indent_level > 0:
        # Find the task above this one that could be a parent
        potential_parent = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.folder_id == task.folder_id,
            Task.indent_level == new_indent_level - 1,
            Task.created_at < task.created_at
        ).order_by(Task.created_at.desc()).first()
        
        if potential_parent:
            task.parent_task_id = potential_parent.id
        else:
            # Can't indent without a parent
            new_indent_level = task.indent_level
    
    # If outdenting (moving left), clear parent if moving to level 0
    elif indent_change < 0:
        if new_indent_level == 0:
            task.parent_task_id = None
        else:
            # Find new parent at the target level
            potential_parent = db.query(Task).filter(
                Task.user_id == current_user.id,
                Task.folder_id == task.folder_id,
                Task.indent_level == new_indent_level - 1,
                Task.created_at < task.created_at
            ).order_by(Task.created_at.desc()).first()
            
            task.parent_task_id = potential_parent.id if potential_parent else None
    
    task.indent_level = new_indent_level
    task.updated_at = utc_now()
    
    # Update all child tasks' indent levels recursively
    def update_children_indent(parent_id, level_delta):
        children = db.query(Task).filter(Task.parent_task_id == parent_id).all()
        for child in children:
            child.indent_level = max(0, child.indent_level + level_delta)
            db.commit()
            update_children_indent(child.id, level_delta)
    
    if indent_change != 0:
        update_children_indent(task.id, indent_change)
    
    db.commit()
    db.refresh(task)
    return task

@app.post("/api/tasks/{task_id}/substeps")
def create_substep(task_id: int, substep: TaskSubstepCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify task belongs to user
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Use model_dump instead of dict()
    db_substep = TaskSubstep(**substep.model_dump(), task_id=task_id)
    db.add(db_substep)
    db.commit()
    db.refresh(db_substep)
    return db_substep

@app.post("/api/tasks/{task_id}/notes")
def create_note(task_id: int, content: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify task belongs to user
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_note = TaskNote(task_id=task_id, content=content)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@app.post("/api/diary", response_model=DiaryEntryResponse)
def create_diary_entry(entry: DiaryEntryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # ALWAYS create a new entry - no more overwriting!
    # Use model_dump instead of dict()
    db_entry = DiaryEntry(**entry.model_dump(), user_id=current_user.id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # NEW: If diary entry is scheduled, add to Google Calendar
    if db_entry.is_scheduled and db_entry.scheduled_date:
        calendar_service = get_google_calendar_service(current_user)
        if calendar_service:
            try:
                event_title = f"📖 {db_entry.title or 'Diary Entry'}"
                event = {
                    'summary': event_title,
                    'description': f"Scheduled diary entry\n\n{db_entry.content[:200]}...",
                    'start': {'dateTime': db_entry.scheduled_date.isoformat()},
                    'end': {'dateTime': db_entry.scheduled_date.isoformat()},
                }
                created_event = calendar_service.events().insert(calendarId='primary', body=event).execute()
                db_entry.google_calendar_event_id = created_event['id']
                db.commit()
                db.refresh(db_entry)
            except Exception as e:
                print(f"Calendar integration failed for diary: {e}")
    
    return db_entry

@app.get("/api/diary")
def get_diary_entries(entry_date: Optional[date] = None, folder_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(DiaryEntry).filter(DiaryEntry.user_id == current_user.id)
    if entry_date:
        query = query.filter(DiaryEntry.entry_date == entry_date)
    if folder_id:
        query = query.filter(DiaryEntry.folder_id == folder_id)
    return query.order_by(DiaryEntry.created_at.desc()).all()

@app.post("/api/folders")
def create_folder(folder: FolderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Use model_dump instead of dict()
    db_folder = Folder(**folder.model_dump(), user_id=current_user.id)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@app.delete("/api/folders/{folder_id}")
def delete_folder(folder_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify folder belongs to user
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Get the folder name for response
    folder_name = folder.name
    
    # Delete the folder (tasks and diary entries will have their folder_id set to NULL due to SET NULL constraint)
    db.delete(folder)
    db.commit()
    
    return {"message": f"Folder '{folder_name}' deleted successfully", "id": folder_id}

@app.get("/api/folders")
def get_folders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Folder).filter(Folder.user_id == current_user.id).all()

@app.delete("/api/diary/{entry_id}")
def delete_diary_entry(entry_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify diary entry belongs to user
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    # NEW: Delete from Google Calendar if it was scheduled
    if entry.google_calendar_event_id:
        calendar_service = get_google_calendar_service(current_user)
        if calendar_service:
            try:
                calendar_service.events().delete(calendarId='primary', eventId=entry.google_calendar_event_id).execute()
            except Exception as e:
                print(f"Failed to delete calendar event for diary: {e}")
    
    # Delete the entry
    db.delete(entry)
    db.commit()
    
    return {"message": "Diary entry deleted successfully", "id": entry_id}

# NEW: Delete task endpoint with CASCADE DELETE for subtasks
@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a task and all its subtasks (CASCADE DELETE)"""
    # Verify task belongs to user
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get the task title for response
    task_title = task.title
    
    # The CASCADE DELETE is handled by SQLAlchemy relationship configuration
    # All subtasks, substeps, and notes will be automatically deleted
    db.delete(task)
    db.commit()
    
    return {"message": f"Task '{task_title}' and all subtasks deleted successfully", "id": task_id}

# Health check and basic endpoints
@app.get("/")
async def root():
    return {"message": "Todo App API is running!", "status": "healthy", "auth": "OAuth2 enabled"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1 as test"))
        row = result.fetchone()
        user_count = db.query(User).count()
        return {
            "status": "healthy", 
            "database": "connected",
            "test_query": row[0] if row else None,
            "user_count": user_count,
            "auth": "OAuth2 enabled"
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "database": "disconnected", 
            "error": str(e)
        }

@app.get("/test-db")
async def test_database(db: Session = Depends(get_db)):
    try:
        user_count = db.query(User).count()
        return {"users_count": user_count, "message": "Database connection successful"}
    except Exception as e:
        return {"error": str(e), "message": "Database connection failed"}

# Create a test user endpoint (for development only)
@app.post("/test/create-user")
async def create_test_user(db: Session = Depends(get_db)):
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            # Create a test token
            token_data = {"user_id": existing_user.id}
            token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
            
            return {
                "message": "Test user already exists",
                "user_id": existing_user.id,
                "token": token,
                "email": existing_user.email
            }
        
        # Create test user
        test_user = User(
            email="test@example.com",
            name="Test User"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        # Create a test token
        token_data = {"user_id": test_user.id}
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "message": "Test user created successfully",
            "user_id": test_user.id,
            "token": token,
            "email": test_user.email
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create test user: {str(e)}")

@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, updates: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify task belongs to user
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if folder_id is being updated
    folder_id_changed = 'folder_id' in updates and updates['folder_id'] != task.folder_id
    new_folder_id = updates.get('folder_id') if folder_id_changed else None
    
    # Update task fields
    for field, value in updates.items():
        if hasattr(task, field):
            setattr(task, field, value)
    
    task.updated_at = utc_now()
    db.commit()
    
    # If folder_id changed and this is not a subtask, update all subtasks recursively
    if folder_id_changed and not task.parent_task_id:
        update_subtasks_folder_recursive(db, task_id, new_folder_id)
    
    db.refresh(task)
    return task

# NEW: Updated diary entry endpoint with scheduling support
@app.put("/api/diary/{entry_id}")
def update_diary_entry(entry_id: int, updates: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify diary entry belongs to user
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    # Store old calendar event ID for potential cleanup
    old_calendar_event_id = entry.google_calendar_event_id
    
    # Update entry fields
    for field, value in updates.items():
        if hasattr(entry, field):
            if field == 'scheduled_date' and value:
                # Convert string to datetime if needed
                if isinstance(value, str):
                    try:
                        value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    except:
                        pass
            setattr(entry, field, value)
    
    entry.updated_at = utc_now()
    
    # Handle Google Calendar integration for scheduling
    calendar_service = get_google_calendar_service(current_user)
    if calendar_service:
        try:
            # If entry is now scheduled and has a date
            if entry.is_scheduled and entry.scheduled_date:
                event_title = f"📖 {entry.title or 'Diary Entry'}"
                event = {
                    'summary': event_title,
                    'description': f"Scheduled diary entry\n\n{entry.content[:200]}...",
                    'start': {'dateTime': entry.scheduled_date.isoformat()},
                    'end': {'dateTime': entry.scheduled_date.isoformat()},
                }
                
                if old_calendar_event_id:
                    # Update existing calendar event
                    calendar_service.events().update(
                        calendarId='primary', 
                        eventId=old_calendar_event_id, 
                        body=event
                    ).execute()
                else:
                    # Create new calendar event
                    created_event = calendar_service.events().insert(calendarId='primary', body=event).execute()
                    entry.google_calendar_event_id = created_event['id']
            
            # If entry is no longer scheduled, delete the calendar event
            elif not entry.is_scheduled and old_calendar_event_id:
                calendar_service.events().delete(calendarId='primary', eventId=old_calendar_event_id).execute()
                entry.google_calendar_event_id = None
                
        except Exception as e:
            print(f"Calendar integration failed for diary update: {e}")
    
    db.commit()
    db.refresh(entry)
    return entry
def debug_env_variables():
    """Debug function to check environment variables"""
    print("=" * 50)
    print("🔍 ENVIRONMENT VARIABLES DEBUG")
    print("=" * 50)
    
    # Check if .env file exists
    env_file_path = os.path.join(os.getcwd(), '.env')
    print(f"📁 Current working directory: {os.getcwd()}")
    print(f"📄 .env file path: {env_file_path}")
    print(f"📄 .env file exists: {os.path.exists(env_file_path)}")
    print()
    
    # Check Google OAuth variables
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    print("🔐 Google OAuth Variables:")
    print(f"GOOGLE_CLIENT_ID: {google_client_id[:20] + '...' if google_client_id else 'NOT SET'}")
    print(f"GOOGLE_CLIENT_SECRET: {google_client_secret[:20] + '...' if google_client_secret else 'NOT SET'}")
    print(f"GOOGLE_REDIRECT_URI: {os.getenv('GOOGLE_REDIRECT_URI')}")
    print()
    
    # Check other variables
    print("🛠️  Other Variables:")
    print(f"SECRET_KEY: {os.getenv('SECRET_KEY', 'NOT SET')[:20]}...")
    print(f"NODE_ENV: {os.getenv('NODE_ENV', 'NOT SET')}")
    print(f"FRONTEND_URL: {os.getenv('FRONTEND_URL', 'NOT SET')}")
    print()
    
    # Check OAuth2 configuration status
    oauth2_configured = bool(google_client_id and google_client_secret)
    print(f"✅ OAuth2 configured: {oauth2_configured}")
    print("=" * 50)
    
    return oauth2_configured

# Startup event to create tables
@app.on_event("startup")
async def startup_event():
    create_tables()
    migrate_database()
    migrate_oauth2_fields()
    
    # Add this debug call
    debug_env_variables()
    
    print("Database tables created and migrated successfully!")
    print(f"OAuth2 configured: {bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)