import os
os.environ['FLASK_ENV'] = 'production'

from app import app, db

with app.app_context():
    result = db.session.execute(db.text('SELECT "id", "name", "email" FROM "user" ORDER BY "id"'))
    users = result.fetchall()
    print(f"Users: {len(users)}")
    for u in users:
        print(f"  ID:{u[0]} Name:{u[1]} Email:{u[2]}")