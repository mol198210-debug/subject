// Navigation Elements
const hamburgerBtn = document.getElementById('hamburger-btn');
const sideMenu = document.getElementById('side-menu');
const appWrapper = document.getElementById('app-wrapper');
const listOutputBtn = document.getElementById('list-output-btn');
const shutdownBtn = document.getElementById('shutdown-btn');
const smartSearchInput = document.getElementById('smart-search-input');
const searchGoBtn = document.getElementById('search-go-btn');

// Toggle Sidebar
hamburgerBtn.addEventListener('click', () => {
    sideMenu.classList.toggle('active');
    // Slide the app wrapper 320px to match sidebar width
    appWrapper.style.transform = sideMenu.classList.contains('active') ? 'translateX(320px)' : 'translateX(0)';
});

// Hide menu on outside click
document.addEventListener('click', (e) => {
    if (!sideMenu.contains(e.target) && e.target !== hamburgerBtn && sideMenu.classList.contains('active')) {
        sideMenu.classList.remove('active');
        appWrapper.style.transform = 'translateX(0)';
    }
});

// UI Helpers
let currentSection = '';
let sectionHistory = [];

function hideAllSections() {
    document.querySelectorAll('.content-box').forEach(box => box.classList.add('hidden'));
}

function showSection(id, isBack = false) {
    if (!isBack && currentSection && currentSection !== id) {
        sectionHistory.push(currentSection);
    }
    
    hideAllSections();
    const section = document.getElementById(id);
    if (section) section.classList.remove('hidden');
    currentSection = id;
    
    sideMenu.classList.remove('active');
    appWrapper.style.transform = 'translateX(0)';
}

const backBtn = document.getElementById('back-btn');
const refreshBtn = document.getElementById('refresh-btn');

if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (sectionHistory.length > 0) {
            const prev = sectionHistory.pop();
            showSection(prev, true);
        } else {
            hideAllSections();
            currentSection = '';
            window.history.back();
        }
    });
}

if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        window.location.reload();
    });
}

async function openPath(path) {
    await fetch('/api/open_path', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({path})
    });
}

// SMART SEARCH LOGIC (Core Feature)
searchGoBtn.addEventListener('click', handleSmartSearch);
smartSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSmartSearch(); });

function handleSmartSearch() {
    let query = smartSearchInput.value.trim();
    if (!query) return;

    const lowQuery = query.toLowerCase();

    // 1. "??에 대해" pattern
    if (query.includes('에 대해') || query.includes('에 대해서') || query.includes('에 대하여')) {
        const keyword = query.replace('에 대해서', '').replace('에 대하여', '').replace('에 대해', '').trim();
        window.open(`https://namu.wiki/w/${encodeURIComponent(keyword)}`);
        return;
    }

    // 2. Keyword matching
    if (lowQuery.includes('유튜브') || lowQuery.includes('youtube')) {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query.replace(/유튜브|youtube/gi,''))}`);
    } else if (lowQuery.includes('네이버') || lowQuery.includes('naver')) {
        window.open(`https://search.naver.com/search.naver?query=${encodeURIComponent(query.replace(/네이버|naver/gi,''))}`);
    } else if (lowQuery.includes('뉴스')) {
        fetchNews();
    } else if (lowQuery.includes('주식')) {
        fetchStocks('급상승 주식');
    } else if (lowQuery.includes('위키') || lowQuery.includes('백과')) {
        const keyword = query.replace(/위키|백과/gi, '').trim();
        window.open(`https://ko.wikipedia.org/wiki/${encodeURIComponent(keyword)}`);
    } else if (lowQuery.includes('틱톡')) {
        window.open(`https://www.tiktok.com/search?q=${encodeURIComponent(query.replace('틱톡',''))}`);
    } else {
        // Default Google
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    }
}

let cachedPrograms = null;
let isFetchingPrograms = false;

// List Output (Top Right)
listOutputBtn.addEventListener('click', async () => {
    const targetSection = document.getElementById('programs-section');
    if (targetSection && !targetSection.classList.contains('hidden')) {
        hideAllSections();
        currentSection = '';
        return;
    }
    showSection('programs-section');
    const pList = document.getElementById('program-list');
    const fullPList = document.getElementById('process-list');
    
    fullPList.innerHTML = "<div style='color:#38bdf8; text-align:center; padding:20px'>프로세스 목록을 분석 중입니다...</div>";
    
    const renderPrograms = (data) => {
        let html = '';
        for (const [category, progs] of Object.entries(data)) {
            html += `<div style="padding:10px; background:rgba(0,0,0,0.3); border-radius:12px; margin-bottom:12px;">
                        <h4 style="margin:0 0 10px 0; color:var(--accent); border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px;">📂 ${category} <span style="font-size:0.8em; color:var(--text-dim)">(${progs.length})</span></h4>
                        <ul style="margin:0; padding-left:20px; font-size:0.9rem; max-height:150px; overflow-y:auto;">
                            ${progs.map(p => `<li style="padding:4px 0; color:var(--text-pure);">${p}</li>`).join('')}
                        </ul>
                     </div>`;
        }
        if (html === '') {
             pList.innerHTML = "<div style='color:#94a3b8; text-align:center; padding:20px'>설치된 프로그램 목록을 가져올 수 없습니다.</div>";
        } else {
             pList.innerHTML = html;
        }
    };

    if (cachedPrograms) {
        renderPrograms(cachedPrograms);
    } else if (!isFetchingPrograms) {
        isFetchingPrograms = true;
        pList.innerHTML = "<div style='color:#38bdf8; text-align:center; padding:20px'>프로그램 목록을 최초 1회 읽어오는 중입니다. 시간(5~10초)이 소요될 수 있습니다...</div>";
        try {
            const pRes = await fetch('/api/programs');
            const pJson = await pRes.json();
            if (pJson.success) {
                cachedPrograms = pJson.data;
                renderPrograms(cachedPrograms);
            } else {
                pList.innerHTML = "<div style='color:#94a3b8; text-align:center; padding:20px'>설치된 프로그램 목록을 가져올 수 없습니다.</div>";
            }
        } catch(e) {
            pList.innerHTML = "<div style='color:#ef4444; text-align:center;'>오류가 발생했습니다.</div>";
        } finally {
            isFetchingPrograms = false;
        }
    }

    try {
        const procRes = await fetch('/api/processes');
        const procJson = await procRes.json();
        if (procJson.success) {
            fullPList.innerHTML = procJson.data.map(p => `
                <div style="display:flex; justify-content:space-between; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span>${p.name}</span>
                    <span style="color:#00ff88; font-weight:bold">${p.memory_mb} MB</span>
                </div>
            `).join('');
        }
    } catch(e) {
        fullPList.innerHTML = "<div style='color:#ef4444; text-align:center;'>오류가 발생했습니다.</div>";
    }
});

// REAL-TIME HUD (Bottom Left)
async function updateHUD() {
    const container = document.getElementById('hud-process-list');
    try {
        const res = await fetch('/api/processes');
        const json = await res.json();
        if (json.success) {
            container.innerHTML = json.data.slice(0, 10).map(p => `
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:3px;">
                    <span>${p.name.substring(0,15)}</span>
                    <span style="color:#00ff88">${p.memory_mb}MB</span>
                </div>
            `).join('');
        }
    } catch(e) {}
}
setInterval(updateHUD, 5000);
updateHUD();

// UTILITY TOOLS
// Extension Rename
document.getElementById('rename-run-btn').onclick = async () => {
    const path = document.getElementById('rename-path').value;
    const old_ext = document.getElementById('old-ext').value;
    const new_ext = document.getElementById('new-ext').value;
    const resDiv = document.getElementById('rename-res');
    if (!path || !old_ext || !new_ext) return alert("All fields are required");
    resDiv.innerText = "처리 중...";
    const res = await fetch('/api/rename', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({path, old_ext, new_ext})
    });
    const json = await res.json();
    resDiv.innerText = json.success ? `✅ 완료: ${json.count}개 파일 변경됨` : `❌ 오류: ${json.error}`;
};

// File Convert (Drag & Drop)
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('convert-file-input');
const curFormatDisplay = document.getElementById('current-format-display');

dropZone.onclick = () => fileInput.click();
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.border = '2px dashed #38bdf8'; };
dropZone.ondragleave = () => { dropZone.style.border = '2px dashed rgba(255,255,255,0.1)'; };

function handleFileSelect(files) {
    if (files.length) {
        fileInput.files = files;
        dropZone.querySelector('p').innerText = "파일 준비됨: " + files[0].name;
        if(curFormatDisplay) {
            let name = files[0].name;
            let ext = name.includes('.') ? name.substring(name.lastIndexOf('.')).toUpperCase() : '알 수 없음';
            curFormatDisplay.innerText = ext;
        }
        const opts = document.getElementById('format-options-container');
        if(opts) opts.style.display = 'flex';
    }
}

dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.style.border = '2px dashed rgba(255,255,255,0.1)';
    handleFileSelect(e.dataTransfer.files);
};

fileInput.onchange = () => {
    handleFileSelect(fileInput.files);
};
document.getElementById('convert-run-btn').onclick = async () => {
    if (!fileInput.files.length) return alert("파일을 선택하세요");
    const targetFormat = document.getElementById('target-format').value;
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('target_format', targetFormat);
    const resDiv = document.getElementById('convert-res');
    resDiv.innerText = "변환 중...";
    const res = await fetch('/api/convert', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.success) {
        resDiv.innerHTML = `<span>✅ 완료: ${json.data.filename}</span> <button class="action-btn" style="width:auto; padding:5px 10px; margin-left:10px" onclick="openPath('${json.data.path.replace(/\\/g,'\\\\')}')">열기</button>`;
    } else {
        resDiv.innerHTML = `<span style="color:#ef4444">❌ 오류: ${json.error}</span>`;
    }
};

// MP3
document.getElementById('mp3-run-btn').onclick = async () => {
    const url = document.getElementById('mp3-url').value;
    if (!url) return;
    const resDiv = document.getElementById('mp3-res');
    resDiv.innerText = "분석 중...";
    const res = await fetch('/api/mp3', { method: 'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url}) });
    const json = await res.json();
    if (json.success) resDiv.innerHTML = `<b>${json.data.title}</b><br><span style="color:#3b82f6">${json.data.status}</span>`;
    else resDiv.innerText = "Error";
};

// Office Lock
document.getElementById('office-run-btn').onclick = async () => {
    const file = document.getElementById('office-file').files[0];
    const pw = document.getElementById('office-pw').value;
    if (!file || !pw) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', pw);
    const resDiv = document.getElementById('office-res');
    resDiv.innerText = "보안 설정 적용 중...";
    const res = await fetch('/api/lock_office', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.success) {
        resDiv.innerHTML = `<span>✅ ${json.data.message}</span> <button class="action-btn" style="width:auto; padding:5px 10px; margin-left:10px" onclick="openPath('${json.data.path.replace(/\\/g,'\\\\')}')">열기</button>`;
    } else {
        resDiv.innerHTML = `<span style="color:#ef4444">❌ 오류: ${json.error}</span>`;
    }
};

// Global Data Fetch
async function fetchNews() {
    showSection('news-section');
    const resDiv = document.getElementById('news-res');
    const res = await fetch('/api/news');
    const json = await res.json();
    if (json.success) resDiv.innerHTML = json.data.map(n => `<div style="margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:5px;"><a href="${n.link}" target="_blank" style="color:#3b82f6; text-decoration:none">${n.title}</a></div>`).join('');
}

async function fetchStocks(cat) {
    showSection('stocks-section');
    document.getElementById('stock-title-h').innerText = cat;
    const resDiv = document.getElementById('stocks-res');
    resDiv.innerHTML = "<div style='color:#38bdf8; text-align:center; padding:20px'>실시간 주가 및 시총을 불러오고 있습니다...</div>";
    
    try {
        const res = await fetch(`/api/stocks?category=${cat}`);
        const json = await res.json();
        if (json.success) {
            resDiv.innerHTML = json.data.map(s => `
                <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:bold; font-size:1.1rem">${s.name} <span style="font-size:0.8rem; color:#94a3b8">(${s.symbol})</span></span>
                        <span style="color:#94a3b8; font-size:0.85rem;">시가총액: ${s.market_cap}</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span style="color:#00ff88; font-weight:bold; font-size:1.2rem">${s.price.toLocaleString()}</span>
                    </div>
                </div>
            `).join('');
        } else {
            resDiv.innerHTML = "<div style='color:#ef4444; text-align:center; padding:20px'>주식 데이터를 불러오는데 실패했습니다.</div>";
        }
    } catch (e) {
        resDiv.innerHTML = "<div style='color:#ef4444; text-align:center; padding:20px'>에러가 발생했습니다.</div>";
    }
}

// Exit
shutdownBtn.onclick = async () => {
    try { await fetch('/api/shutdown', { method: 'POST' }); } catch(e) {}
    document.body.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#0f172a; color:#fff;">
            <h1 style="color:#38bdf8; font-size:3rem; margin-bottom:20px; font-weight:800;">종료 완료</h1>
            <p style="color:#94a3b8; font-size:1.2rem;">로컬 서버가 성공적으로 종료되었습니다.<br>이 브라우저 창(또는 탭)을 닫으셔도 됩니다.</p>
            <button onclick="window.close()" style="margin-top:30px; padding:12px 24px; background:#ef4444; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:bold; font-size:1.1rem;">창 닫기 시도</button>
        </div>
    `;
    setTimeout(() => window.close(), 100);
};

// Toggle HUD
const toggleHudBtn = document.getElementById('toggle-hud-btn');
const hudContainer = document.getElementById('hud-container');
if (toggleHudBtn && hudContainer) {
    toggleHudBtn.addEventListener('click', () => {
        hudContainer.style.display = (hudContainer.style.display === 'none') ? 'flex' : 'none';
    });
}
