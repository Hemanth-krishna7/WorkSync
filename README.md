# WorkSync

WorkSync is a production-ready Workforce Availability Management Dashboard that allows managers to monitor employee availability and update employee status in real time. 

Built with a modern, high-end SaaS aesthetic inspired by Linear, Stripe, and Vercel, it features a unified dashboard, live filtering and searching, instant state synchronizations, dark mode persistence, and toast feedback.

## Features

- **Dynamic Metrics Dashboard**: Tracks total employees, available employees, busy employees, and real-time availability percentages with adaptive trend indicators.
- **Department Distribution**: Displays employee counts by department (Engineering, Design, Marketing, HR).
- **Responsive Employee Cards**: Displays employee details, role, department, initials-based avatars, last updated relative time, and current availability status.
- **Unified Real-time Search**: Search bar that filters cards instantly on character input.
- **Department Filter**: Clickable filter controls that instantly filter cards without page refreshes.
- **Status Management**: Instantly toggle employee availability state via standard switch inputs. Changes synchronize to the local SQLite database and update metrics and badges.
- **Toast Notifications**: Automatic dismissive status feedback alerts.
- **Persistent Dark Mode**: Toggle theme matching system preferences and persisting inside `localStorage`.
- **Skeleton Loaders**: Muted animated skeleton grids displaying on page load.
- **Empty States**: UI layouts for zero search matches, empty departments, and empty database states.

## Tech Stack

- **Backend**: Python (Flask micro-framework)
- **Database**: SQLite (relational, persistent local storage)
- **Frontend**: HTML5, CSS3 (Vanilla design tokens, CSS variables), Vanilla JavaScript (ES6+), Jinja templates.

---

## Project Structure

```text
WorkSync/
├── app.py
├── requirements.txt
├── render.yaml
├── README.md
├── database/
│   └── employees.db
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
```

---

## Local Setup & Development

### 1. Prerequisites
Make sure you have **Python 3.8+** installed on your machine.

### 2. Clone/Copy Project
Ensure all files are placed in a directory named `WorkSync`.

### 3. Install Dependencies
Run the following command to install required modules:
```bash
pip install -r requirements.txt
```

### 4. Launch Application
Start the Flask server:
```bash
python app.py
```
Upon launching, Flask will automatically create the database directory and initialize a database seed with 20 realistic employee profiles at `database/employees.db`.

### 5. Access Dashboard
Open your browser and navigate to:
```text
http://127.0.0.1:5000/
```

---

## Production Deployment (Render)

WorkSync is configured for zero-setup deployment on [Render](https://render.com/).

### Deployment Configuration
The repository contains `render.yaml` and `requirements.txt` pre-configured:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`
- **Runtime**: `Python 3.11.0` (specified in variables)

To deploy:
1. Push this project to GitHub.
2. Link the repository to your Render account.
3. Render will detect `render.yaml` and deploy it automatically as a Web Service.
