import sqlite3

conn = sqlite3.connect("zoom.db")
c = conn.cursor()

# Ensure user 1 email is vinayak@zoomclone.com
c.execute("UPDATE users SET email = 'vinayak@zoomclone.com' WHERE id = 1")

# Ensure Guest user exists
c.execute("SELECT id FROM users WHERE email = 'guest@zoomclone.local'")
if not c.fetchone():
    c.execute("""
        INSERT INTO users (name, email, avatar_url, personal_meeting_id, timezone, created_at)
        VALUES ('Guest', 'guest@zoomclone.local', NULL, '5001234567', 'Asia/Kolkata', datetime('now'))
    """)

conn.commit()
conn.close()
print("Local database migrated successfully: Vinayak & Guest ready.")
