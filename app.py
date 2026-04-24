import os
import sys
import subprocess
import logging
from flask import Flask, render_template, request, jsonify

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
if getattr(sys, 'frozen', False) or (sys.executable and sys.executable.endswith('pythonw.exe')):
    log_file = os.path.join(os.path.expanduser('~'), 'app_debug_log.txt')
    sys.stdout = open(log_file, 'w', encoding='utf-8')
    sys.stderr = sys.stdout

# PyInstaller exe 지원을 위한 경로 설정
if getattr(sys, 'frozen', False):
    application_path = sys._MEIPASS
    app = Flask(__name__, template_folder=os.path.join(application_path, 'templates'), static_folder=os.path.join(application_path, 'static'))
else:
    application_path = os.path.dirname(os.path.abspath(__file__))
    app = Flask(__name__)

sys.path.append(application_path)

from modules import system_tools, media_tools, web_scraper, file_tools

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/processes', methods=['GET'])
def get_processes():
    try: return jsonify({"success": True, "data": system_tools.get_running_processes()})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

@app.route('/api/programs', methods=['GET'])
def get_programs():
    try: return jsonify({"success": True, "data": system_tools.get_installed_programs()})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

@app.route('/api/news', methods=['GET'])
def get_news():
    try: return jsonify({"success": True, "data": web_scraper.scrape_recent_news()})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    c = request.args.get('category', '급상승 주식')
    try: return jsonify({"success": True, "data": web_scraper.get_stock_data(c)})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

@app.route('/api/convert', methods=['POST'])
def convert_file():
    f = request.files['file']
    t = request.form.get('target_format')
    try: return jsonify({"success": True, "data": file_tools.handle_file_conversion(f, t)})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

@app.route('/api/rename', methods=['POST'])
def batch_rename():
    d = request.json
    try: return jsonify({"success": True, "count": file_tools.batch_rename_extension(d['path'], d['old_ext'], d['new_ext'])})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

@app.route('/api/mp3', methods=['POST'])
def mp3_analyze():
    u = request.json.get('url')
    try: return jsonify({"success": True, "data": media_tools.get_video_info(u)})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

@app.route('/api/lock_office', methods=['POST'])
def lock_office():
    f = request.files['file']
    p = request.form.get('password')
    try: return jsonify({"success": True, "data": file_tools.lock_office_file(f, p)})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

@app.route('/api/open_path', methods=['POST'])
def open_path():
    p = request.json.get('path')
    try:
        if os.path.exists(p):
            if os.path.isfile(p): subprocess.run(['explorer', '/select,', os.path.normpath(p)])
            else: os.startfile(p)
            return jsonify({"success": True})
        return jsonify({"success": False, "error": "Not found"})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

@app.route('/api/shutdown', methods=['POST'])
def shutdown():
    import threading
    threading.Timer(0.5, lambda: os._exit(0)).start()
    return jsonify({"success": True})

if __name__ == '__main__':
    from multiprocessing import freeze_support
    freeze_support()
    try:
        import webbrowser
        from threading import Timer
        Timer(1.5, lambda: webbrowser.open('http://127.0.0.1:5000/')).start()
        app.run(host='127.0.0.1', port=5000)
    except Exception as e:
        import traceback
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror('Runtime Error', traceback.format_exc())
