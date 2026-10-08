import sqlite3

conn = sqlite3.connect("zoom.db")
c = conn.cursor()

# 1. Delete duplicate guest or leftover vinayak@zoomclone records first
c.execute("""
    DELETE FROM users 
    WHERE id != 1 AND (
        email LIKE '%vinayak@zoomclone%' 
        OR email IN ('guest@zoomclone.local', 'guest@zoomclone.com', 'guest@zomclone.com')
        OR personal_meeting_id = '5001234567'
    )
""")

# 2. Update user 1 to be the primary Guest account
c.execute("""
    UPDATE users 
    SET name = 'Guest', 
        email = 'guest@zoomclone.com', 
        avatar_url = NULL,
        personal_meeting_id = '5001234567', 
        timezone = 'Asia/Kolkata' 
    WHERE id = 1
""")

# 3. Ensure all pre-seeded meetings belong to Guest (id = 1)
c.execute("""
    UPDATE meetings 
    SET host_id = 1 
    WHERE host_id != 1 AND host_id NOT IN (SELECT id FROM users)
""")

# 4. Update personal room title and code for Guest
c.execute("""
    UPDATE meetings 
    SET title = "Guest's Personal Meeting Room",
        meeting_code = '5001234567'
    WHERE type = 'personal' AND host_id = 1
""")

# 5. Update any chat message text mentioning Vinayak to Guest
c.execute("""
    UPDATE chat_messages 
    SET content = REPLACE(content, 'Vinayak', 'Guest')
""")

conn.commit()

# Print current state
print("Users in database:")
for u in c.execute("SELECT id, name, email, personal_meeting_id FROM users").fetchall():
    print(u)

print("\nMeetings count for Guest (host_id=1):")
count = c.execute("SELECT count(*) FROM meetings WHERE host_id = 1").fetchone()[0]
print(f"Total: {count}")

conn.close()
print("\nDatabase migration completed successfully: Guest is primary and only pre-seeded host.")
