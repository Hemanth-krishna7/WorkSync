import os
import sqlite3
from datetime import datetime, timezone
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'employees.db')

def init_db():
    """Initializes the database and seeds 20 realistic employees if empty."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create employees table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            department TEXT NOT NULL,
            is_available BOOLEAN NOT NULL DEFAULT 1,
            last_updated TEXT NOT NULL
        )
    ''')
    
    # Check if the database needs seeding
    cursor.execute('SELECT COUNT(*) FROM employees')
    count = cursor.fetchone()[0]
    
    if count == 0:
        # 20 realistic employees with balanced statuses and departments
        employees = [
            ("Sarah Jenkins", "Engineering Manager", "Engineering", 1),
            ("Alex Rivera", "Senior Frontend Engineer", "Engineering", 1),
            ("Jordan Patel", "Backend Staff Engineer", "Engineering", 0),
            ("Emily Chen", "DevOps Specialist", "Engineering", 1),
            ("David Kim", "QA Lead", "Engineering", 1),
            ("Marcus Vance", "Full Stack Developer", "Engineering", 0),
            
            ("Elena Rostova", "Head of Design", "Design", 1),
            ("Liam O'Connor", "Senior UI/UX Designer", "Design", 1),
            ("Sophia Martinez", "Product Designer", "Design", 0),
            ("Lucas Berger", "Brand & Motion Designer", "Design", 1),
            
            ("Chloe Dupont", "Marketing Director", "Marketing", 1),
            ("Ryan Gallagher", "Growth & SEO Specialist", "Marketing", 0),
            ("Aisha Mwangi", "Social Media Coordinator", "Marketing", 1),
            ("Daniel Zhao", "Content Strategist", "Marketing", 1),
            ("Maya Lin", "Copywriter", "Marketing", 1),
            
            ("Olivia Taylor", "Chief People Officer", "HR", 1),
            ("James Wilson", "Technical Recruiter", "HR", 1),
            ("Priya Nair", "HR Operations Generalist", "HR", 0),
            ("Thomas Wright", "Talent Acquisition Specialist", "HR", 1),
            ("Emma Watson", "Employee Relations Lead", "HR", 1)
        ]
        
        current_time = datetime.now(timezone.utc).isoformat()
        
        cursor.executemany(
            'INSERT INTO employees (name, role, department, is_available, last_updated) VALUES (?, ?, ?, ?, ?)',
            [(e[0], e[1], e[2], e[3], current_time) for e in employees]
        )
        conn.commit()
        
    conn.close()

# Initialize database on load
init_db()

@app.route('/')
def index():
    """Renders the dashboard main page."""
    return render_template('index.html')

@app.route('/employees', methods=['GET'])
def get_employees():
    """Returns the list of all employees in JSON format."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM employees ORDER BY name ASC')
        rows = cursor.fetchall()
        conn.close()
        
        employees = []
        for r in rows:
            employees.append({
                'id': r['id'],
                'name': r['name'],
                'role': r['role'],
                'department': r['department'],
                'is_available': bool(r['is_available']),
                'last_updated': r['last_updated']
            })
        return jsonify(employees)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/toggle-status', methods=['POST'])
def toggle_status():
    """Updates the availability status of an employee."""
    try:
        data = request.get_json()
        if not data or 'id' not in data:
            return jsonify({'error': 'Missing employee ID'}), 400
            
        employee_id = data['id']
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if employee exists
        cursor.execute('SELECT * FROM employees WHERE id = ?', (employee_id,))
        employee = cursor.fetchone()
        
        if not employee:
            conn.close()
            return jsonify({'error': 'Employee not found'}), 404
            
        # Determine target status: toggle if not explicitly provided
        new_status = data.get('is_available')
        if new_status is None:
            new_status = 0 if employee['is_available'] else 1
        else:
            new_status = 1 if new_status else 0
            
        current_time = datetime.now(timezone.utc).isoformat()
        
        cursor.execute(
            'UPDATE employees SET is_available = ?, last_updated = ? WHERE id = ?',
            (new_status, current_time, employee_id)
        )
        conn.commit()
        
        # Fetch updated employee data
        cursor.execute('SELECT * FROM employees WHERE id = ?', (employee_id,))
        updated = cursor.fetchone()
        conn.close()
        
        return jsonify({
            'success': True,
            'employee': {
                'id': updated['id'],
                'name': updated['name'],
                'role': updated['role'],
                'department': updated['department'],
                'is_available': bool(updated['is_available']),
                'last_updated': updated['last_updated']
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
