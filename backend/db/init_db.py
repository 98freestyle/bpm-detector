#!/usr/bin/env python3

import sqlite3
import os

# Database configuration
DB_DIR = 'db'
DB_PATH = os.path.join(DB_DIR, 'rate_limits.db')

def create_database():
    # Create db directory if it doesn't exist
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)
        print(f"Created database directory: {DB_DIR}")
    
    # Remove existing database
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing database: {DB_PATH}")
    
    # Connect to database (creates file)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create rate_limits table
    cursor.execute('''
        CREATE TABLE rate_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT NOT NULL,
            timestamp REAL NOT NULL,
            success INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create failed_attempts table
    cursor.execute('''
        CREATE TABLE failed_attempts (
            ip_address TEXT PRIMARY KEY,
            count INTEGER DEFAULT 0,
            blocked_until REAL DEFAULT 0,
            last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes for performance
    cursor.execute('CREATE INDEX idx_ip_timestamp ON rate_limits(ip_address, timestamp)')
    cursor.execute('CREATE INDEX idx_timestamp ON rate_limits(timestamp)')
    cursor.execute('CREATE INDEX idx_ip_blocked ON failed_attempts(ip_address, blocked_until)')
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print(f"Database initialized successfully: {DB_PATH}")

if __name__ == "__main__":
    create_database()