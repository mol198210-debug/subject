import psutil
import winreg
import subprocess

def get_running_processes(limit=15):
    """Memory-intensive process listing for HUD and full lists."""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent']):
        try:
            info = proc.info
            if info['name'] and 'idle' not in info['name'].lower():
                processes.append({
                    'pid': info['pid'],
                    'name': info['name'],
                    'memory_mb': round(info['memory_info'].rss / (1024 * 1024), 2) if info['memory_info'] else 0,
                    'cpu': info['cpu_percent']
                })
        except: pass
    processes.sort(key=lambda x: x['memory_mb'], reverse=True)
    return processes[:limit]

def get_installed_programs():
    """Ultimate 3-stage program fetcher with categorization."""
    programs = set()
    # 1. Registry
    paths = [
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
        (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall")
    ]
    for hkey, path in paths:
        try:
            key = winreg.OpenKey(hkey, path)
            for i in range(winreg.QueryInfoKey(key)[0]):
                try:
                    name, _ = winreg.QueryValueEx(winreg.OpenKey(key, winreg.EnumKey(key, i)), "DisplayName")
                    if name: programs.add(name)
                except: pass
        except: pass
    # 2. WMIC Fallback
    if len(programs) < 5:
        try:
            out = subprocess.check_output('wmic product get name', shell=True, creationflags=0x08000000).decode('utf-8', errors='ignore')
            for line in out.split('\n')[1:]:
                if line.strip(): programs.add(line.strip())
        except: pass
    # 3. PowerShell Fallback
    if len(programs) < 5:
        try:
            out = subprocess.check_output('powershell "Get-Package | Select-Object Name"', shell=True, creationflags=0x08000000).decode('utf-8', errors='ignore')
            for line in out.split('\n'):
                if line.strip() and 'Name' not in line and '---' not in line: programs.add(line.strip())
        except: pass
    
    flat_list = sorted(list(programs)) if programs else []
    
    categorized = {
        '웹 브라우저': [],
        '개발 및 프로그래밍': [],
        '미디어 및 디자인': [],
        '게임': [],
        '오피스 및 문서': [],
        '기본 시스템 및 기타': []
    }
    
    for p in flat_list:
        lp = p.lower()
        if any(x in lp for x in ['chrome', 'edge', 'firefox', 'whale', 'brave', 'opera']):
            categorized['웹 브라우저'].append(p)
        elif any(x in lp for x in ['python', 'visual studio', 'git', 'java', 'node', 'docker', 'vmware', 'postman', 'mysql', 'sql']):
            categorized['개발 및 프로그래밍'].append(p)
        elif any(x in lp for x in ['adobe', 'vlc', 'obs ', 'spotify', 'zoom', 'discord', '팟플레이어', '알캡처']):
            categorized['미디어 및 디자인'].append(p)
        elif any(x in lp for x in ['steam', 'riot', 'epic', 'blizzard', 'nexon', 'league', 'pubg', 'overwatch']):
            categorized['게임'].append(p)
        elif any(x in lp for x in ['office', 'excel', 'word', 'powerpoint', '한컴', 'hwp', 'pdf', 'acrobat']):
            categorized['오피스 및 문서'].append(p)
        else:
            if p and len(p) > 2:
                categorized['기본 시스템 및 기타'].append(p)
            
    # filter empty
    final_dict = {k: v for k, v in categorized.items() if len(v) > 0}
    if not final_dict:
        return {"에러": ["프로그램을 불러올 수 없습니다."]}
    return final_dict
