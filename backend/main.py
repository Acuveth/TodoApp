# FastAPI Backend for Todo App - WITH DELETE FUNCTIONALITY
# File: main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Date, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import List, Optional
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from jose import jwt
from passlib.context import CryptContext

# Database setup - MySQL configuration
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@127.0.0.1:3306/side_projects")

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
    allow_origins=["http://localhost:3000"],  # React dev server
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
    google_calendar_token = Column(Text)
    google_calendar_refresh_token = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    diary_entries = relationship("DiaryEntry", back_populates="user", cascade="all, delete-orphan")

class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    color = Column(String(7), default="#3B82F6")
    parent_folder_id = Column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="folders")
    tasks = relationship("Task", back_populates="folder")
    diary_entries = relationship("DiaryEntry", back_populates="folder")

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
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    task = relationship("Task", back_populates="substeps")

class TaskNote(Base):
    __tablename__ = "task_notes"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    task = relationship("Task", back_populates="notes")

class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)
    entry_date = Column(Date, nullable=False)
    title = Column(String(500))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
    
    class Config:
        from_attributes = True

class TaskIndentUpdate(BaseModel):
    indent_change: int

class DiaryEntryCreate(BaseModel):
    entry_date: date
    title: Optional[str] = None
    content: str
    folder_id: Optional[int] = None

class FolderCreate(BaseModel):
    name: str
    color: str = "#3B82F6"
    parent_folder_id: Optional[int] = None

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
    """Migrate existing database to add new hierarchy columns"""
    try:
        with engine.connect() as connection:
            # Check if the new columns exist
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
        "progress": progress,
        "substeps": [{"id": s.id, "title": s.title, "is_completed": s.is_completed} for s in task.substeps],
        "notes": [{"id": n.id, "content": n.content, "created_at": n.created_at} for n in task.notes],
        "subtasks": []  # We'll populate this in the frontend if needed
    }
    
    return task_dict

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

# API Routes
@app.post("/api/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # If parent_task_id is provided, verify it exists and belongs to the user
    if task.parent_task_id:
        parent_task = db.query(Task).filter(
            Task.id == task.parent_task_id, 
            Task.user_id == current_user.id
        ).first()
        if not parent_task:
            raise HTTPException(status_code=404, detail="Parent task not found")
        
        # Set indent level based on parent
        task.indent_level = parent_task.indent_level + 1
        
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
    db_task = Task(**task.model_dump(), user_id=current_user.id)
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
    task.updated_at = datetime.utcnow()
    
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

@app.post("/api/diary")
def create_diary_entry(entry: DiaryEntryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # ALWAYS create a new entry - no more overwriting!
    # Use model_dump instead of dict()
    db_entry = DiaryEntry(**entry.model_dump(), user_id=current_user.id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/api/diary")
def get_diary_entries(entry_date: Optional[date] = None, folder_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(DiaryEntry).filter(DiaryEntry.user_id == current_user.id)
    if entry_date:
        query = query.filter(DiaryEntry.entry_date == entry_date)
    if folder_id:
        query = query.filter(DiaryEntry.folder_id == folder_id)
    return query.order_by(DiaryEntry.entry_date.desc()).all()

@app.post("/api/folders")
def create_folder(folder: FolderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Use model_dump instead of dict()
    db_folder = Folder(**folder.model_dump(), user_id=current_user.id)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@app.get("/api/folders")
def get_folders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Folder).filter(Folder.user_id == current_user.id).all()

@app.delete("/api/diary/{entry_id}")
def delete_diary_entry(entry_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify diary entry belongs to user
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
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
    return {"message": "Todo App API is running!", "status": "healthy"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection - Using text() wrapper
        result = db.execute(text("SELECT 1 as test"))
        row = result.fetchone()
        user_count = db.query(User).count()
        return {
            "status": "healthy", 
            "database": "connected",
            "test_query": row[0] if row else None,
            "user_count": user_count
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
    
    # Update task fields
    for field, value in updates.items():
        if hasattr(task, field):
            setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task

# Optional: Add a separate endpoint for updating specific entries
@app.put("/api/diary/{entry_id}")
def update_diary_entry(entry_id: int, updates: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify diary entry belongs to user
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    # Update entry fields
    for field, value in updates.items():
        if hasattr(entry, field):
            setattr(entry, field, value)
    
    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry

# Startup event to create tables
@app.on_event("startup")
async def startup_event():
    create_tables()
    migrate_database()
    print("Database tables created and migrated successfully!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)