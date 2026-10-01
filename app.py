from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)
app.secret_key = "anosha-portfolio-secret-key"

DATABASE = "portfolio.db"

ADMIN_USERNAME = "Anosha Oad"

# ================= VEDHI WIDGET STATUS (contact page) =================
SITE_STATUS = {
    "available": True,
    "activity": "Interning at Verge Systems, building AI and web projects",
    "location": "Hyderabad, Sindh, Pakistan",
    "email": "anoshaoad5@gmail.com",
    "phone": "+92 3XX XXXXXXX"
}

# Optional email notifications — leave blank to skip safely
EMAIL_USER = ""
EMAIL_APP_PASSWORD = ""
NOTIFY_TO = SITE_STATUS["email"]

# ================= SITE-WIDE SOCIAL LINKS =================
SITE_INFO = {
    "github": "https://github.com/anoshaoad5-byte",
    "linkedin": "https://www.linkedin.com/in/your-actual-linkedin-here",
    "email": "anoshaoad5@gmail.com",
    "phone": "+92 3XX XXXXXXX"
}


@app.context_processor
def inject_site_info():
    return {"site": SITE_INFO}


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            technology TEXT,
            github TEXT,
            demo TEXT,
            image TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            source TEXT DEFAULT 'vedhi',
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            github TEXT,
            linkedin TEXT,
            instagram TEXT,
            phone TEXT,
            password_hash TEXT
        )
    """)
    if conn.execute("SELECT COUNT(*) FROM settings").fetchone()[0] == 0:
        conn.execute(
            "INSERT INTO settings (id, github, linkedin, instagram, phone, password_hash) VALUES (1, ?, ?, ?, ?, ?)",
            ("", "", "", "", generate_password_hash("1625"))
        )

    conn.commit()
    conn.close()


def get_settings():
    conn = get_db()
    row = conn.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    conn.close()
    return row


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))
        return view_func(*args, **kwargs)
    return wrapped


def send_notification_email(name, email, message):
    if not EMAIL_USER or not EMAIL_APP_PASSWORD:
        return
    try:
        body = f"New message from {name} ({email}):\n\n{message}"
        msg = MIMEText(body)
        msg["Subject"] = f"New portfolio message from {name}"
        msg["From"] = EMAIL_USER
        msg["To"] = NOTIFY_TO

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_APP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print("Email notification failed (non-fatal):", e)


def save_message(name, email, message, subject=None, source="vedhi"):
    conn = get_db()
    conn.execute(
        "INSERT INTO messages (name, email, subject, message, source) VALUES (?, ?, ?, ?, ?)",
        (name, email, subject, message, source)
    )
    conn.commit()
    conn.close()
    send_notification_email(name, email, f"[{subject}] {message}" if subject else message)


# ================= PUBLIC PAGES =================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/projects")
def projects():
    conn = get_db()
    rows = conn.execute("SELECT * FROM projects ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("projects.html", projects=rows)


@app.route("/contact", methods=["GET", "POST"])
def contact():
    success = False
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        subject = request.form.get("subject", "").strip()
        message = request.form.get("message", "").strip()

        # BUG FIX: this data used to be read and then discarded.
        # It is now actually saved, so it shows up in /admin/messages.
        if name and email and message:
            save_message(name, email, message, subject=subject, source="contact_form")
            success = True

    return render_template("contact.html", success=success, status=SITE_STATUS)


# ================= VEDHI CHAT WIDGET (visitor-facing, contact page) =================

@app.route("/api/vedhi/status")
def vedhi_status():
    return jsonify(SITE_STATUS)


@app.route("/api/vedhi/message", methods=["POST"])
def vedhi_message():
    data = request.get_json(silent=True) or request.form

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()

    if not name or not email or not message:
        return jsonify({"ok": False, "error": "All fields are required."}), 400

    save_message(name, email, message, subject=None, source="vedhi")

    return jsonify({"ok": True})


# ================= ADMIN AUTH =================

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        row = get_settings()

        if username == ADMIN_USERNAME and row and check_password_hash(row["password_hash"], password):
            session["admin_logged_in"] = True
            return redirect(url_for("admin_dashboard"))
        error = "Invalid username or password"

    return render_template("admin/login.html", error=error)


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin_logged_in", None)
    return redirect(url_for("admin_login"))


# ================= ADMIN PAGES (protected) =================

@app.route("/admin/dashboard")
@login_required
def admin_dashboard():
    conn = get_db()
    rows = conn.execute("SELECT * FROM projects ORDER BY id DESC").fetchall()
    unread_count = conn.execute(
        "SELECT COUNT(*) FROM messages WHERE is_read = 0"
    ).fetchone()[0]
    conn.close()
    return render_template("admin/dashboard.html", projects=rows, unread_count=unread_count)


@app.route("/api/admin/unread_count")
@login_required
def api_unread_count():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM messages WHERE is_read = 0").fetchone()[0]
    conn.close()
    return jsonify({"count": count})


@app.route("/admin/messages")
@login_required
def admin_messages():
    conn = get_db()
    rows = conn.execute("SELECT * FROM messages ORDER BY created_at DESC").fetchall()
    conn.execute("UPDATE messages SET is_read = 1")
    conn.commit()
    conn.close()
    return render_template("admin/messages.html", messages=rows)


@app.route("/admin/delete_message/<int:message_id>", methods=["POST"])
@login_required
def delete_message(message_id):
    conn = get_db()
    conn.execute("DELETE FROM messages WHERE id=?", (message_id,))
    conn.commit()
    conn.close()
    return redirect(url_for("admin_messages"))


@app.route("/admin/profile")
@login_required
def admin_profile():
    row = get_settings()
    settings = {
        "username": ADMIN_USERNAME,
        "github": row["github"] if row else "",
        "linkedin": row["linkedin"] if row else "",
        "instagram": row["instagram"] if row else "",
        "phone": row["phone"] if row else "",
    }
    return render_template(
        "admin/profile.html",
        settings=settings,
        profile_updated=(request.args.get("updated") == "1"),
        password_error=session.pop("password_error", None),
        password_success=session.pop("password_success", None),
    )


@app.route("/admin/update_profile", methods=["POST"])
@login_required
def update_profile():
    github = request.form.get("github", "").strip()
    linkedin = request.form.get("linkedin", "").strip()
    instagram = request.form.get("instagram", "").strip()
    phone = request.form.get("phone", "").strip()

    conn = get_db()
    conn.execute(
        "UPDATE settings SET github=?, linkedin=?, instagram=?, phone=? WHERE id=1",
        (github, linkedin, instagram, phone)
    )
    conn.commit()
    conn.close()

    return redirect(url_for("admin_profile", updated=1))


@app.route("/admin/change_password", methods=["POST"])
@login_required
def change_password():
    old_password = request.form.get("old_password", "").strip()
    new_password = request.form.get("new_password", "").strip()

    row = get_settings()
    if not row or not check_password_hash(row["password_hash"], old_password):
        session["password_error"] = "Current password is incorrect."
        return redirect(url_for("admin_profile"))

    if not new_password:
        session["password_error"] = "Please enter a new password."
        return redirect(url_for("admin_profile"))

    conn = get_db()
    conn.execute("UPDATE settings SET password_hash=? WHERE id=1", (generate_password_hash(new_password),))
    conn.commit()
    conn.close()

    session["password_success"] = "Password updated successfully."
    return redirect(url_for("admin_profile"))


@app.route("/admin/add_project", methods=["POST"])
@login_required
def add_project():
    title = request.form["title"]
    description = request.form.get("description", "")
    technology = request.form["technology"]
    github = request.form["github"]
    demo = request.form.get("demo", "")
    image = request.form.get("image", "")

    conn = get_db()
    conn.execute("""
        INSERT INTO projects (title, description, technology, github, demo, image)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (title, description, technology, github, demo, image))
    conn.commit()
    conn.close()

    return redirect(url_for("admin_dashboard"))


@app.route("/admin/edit_project/<int:project_id>", methods=["GET", "POST"])
@login_required
def edit_project(project_id):
    conn = get_db()

    if request.method == "POST":
        title = request.form["title"]
        description = request.form.get("description", "")
        technology = request.form["technology"]
        github = request.form["github"]
        demo = request.form.get("demo", "")
        image = request.form.get("image", "")

        conn.execute("""
            UPDATE projects
            SET title=?, description=?, technology=?, github=?, demo=?, image=?
            WHERE id=?
        """, (title, description, technology, github, demo, image, project_id))
        conn.commit()
        conn.close()
        return redirect(url_for("admin_dashboard"))

    project = conn.execute("SELECT * FROM projects WHERE id=?", (project_id,)).fetchone()
    conn.close()

    if project is None:
        return redirect(url_for("admin_dashboard"))

    return render_template("admin/edit_project.html", project=project)


@app.route("/admin/delete_project/<int:project_id>", methods=["POST"])
@login_required
def delete_project(project_id):
    conn = get_db()
    conn.execute("DELETE FROM projects WHERE id=?", (project_id,))
    conn.commit()
    conn.close()

    return redirect(url_for("admin_dashboard"))


if __name__ == "__main__":
    init_db()
    app.run(port=5001, debug=True);