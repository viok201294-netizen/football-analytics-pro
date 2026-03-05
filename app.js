/**
 * AI Football Analytics Pro - Version 6.0
 * Complete Application with History, Batch, Developer Panel
 */

// ============================================================================
// CONFIG
// ============================================================================

const CONFIG = {
    OU_OPTIONS: [
        { value: 1.5, label: 'Rất thấp' },
        { value: 1.75, label: 'Thấp' },
        { value: 2.0, label: 'Trung bình' },
        { value: 2.25, label: 'TB cao' },
        { value: 2.5, label: 'Phổ biến' },
        { value: 2.75, label: 'Cao' },
        { value: 3.0, label: 'Rất cao' },
        { value: 3.25, label: 'Rất cao' },
        { value: 3.5, label: 'Cực cao' },
        { value: 3.75, label: 'Cực cao' },
        { value: 4.0, label: 'Hiếm' },
        { value: 4.5, label: 'Hiếm' },
        { value: 5.0, label: 'Rất hiếm' },
        { value: 5.5, label: 'Rất hiếm' },
        { value: 6.0, label: 'Cực hiếm' }
    ],
    HANDICAP_OPTIONS: [
        { value: 0.0, label: 'Đồng banh' },
        { value: 0.25, label: '1/4 trái' },
        { value: 0.5, label: '1/2 trái' },
        { value: 0.75, label: '3/4 trái' },
        { value: 1.0, label: '1 trái' },
        { value: 1.25, label: '1 1/4 trái' },
        { value: 1.5, label: '1 1/2 trái' },
        { value: 1.75, label: '1 3/4 trái' },
        { value: 2.0, label: '2 trái' },
        { value: 2.25, label: '2 1/4 trái' },
        { value: 2.5, label: '2 1/2 trái' },
        { value: 2.75, label: '2 3/4 trái' },
        { value: 3.0, label: '3 trái' },
        { value: 3.5, label: '3 1/2 trái' },
        { value: 4.0, label: '4 trái' }
    ],
    ADMIN_PASSWORD: '123456',
    THRESHOLD_ODDS1: 1.55,
    THRESHOLD_HIGH_PROB: 0.8,
    THRESHOLD_MED_PROB: 0.65,
    GAP_LOW: 0.20,
    GAP_HIGH: 0.30
};

const state = {
    activeSelect: null,
    selectedOU: null,
    selectedHandicap: null,
    logoClicks: 0,
    adminLoggedIn: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('splashScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    }, 1500);

    initializeDropdowns();
    setupEventListeners();
    loadHistoryCount();
    loadDarkMode();
});

function initializeDropdowns() {
    const ouOptions = document.getElementById('ouOptions');
    CONFIG.OU_OPTIONS.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'option';
        div.role = 'option';
        div.onclick = () => selectOption('ou', opt.value, opt.label);
        div.innerHTML = `<span>${opt.value.toFixed(2)}</span><span class="option-value">${opt.label}</span>`;
        ouOptions.appendChild(div);
    });

    const handicapOptions = document.getElementById('handicapOptions');
    CONFIG.HANDICAP_OPTIONS.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'option';
        div.role = 'option';
        div.onclick = () => selectOption('handicap', opt.value, opt.label);
        div.innerHTML = `<span>${opt.value.toFixed(2)}</span><span class="option-value">${opt.label}</span>`;
        handicapOptions.appendChild(div);
    });
}

function setupEventListeners() {
    document.getElementById('analysisForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('adminForm').addEventListener('submit', verifyAdminPassword);
    document.getElementById('historyFilter').addEventListener('change', filterHistory);

    document.addEventListener('click', (e) => {
        if (state.activeSelect && !e.target.closest('#' + state.activeSelect + 'Select')) {
            closeSelect(state.activeSelect);
        }
    });

    addBatchRow();
}

// ============================================================================
// PAGE NAVIGATION
// ============================================================================

function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageName).classList.add('active');

    document.querySelectorAll('.nav-item').forEach((item, idx) => {
        item.classList.remove('active');
        const pages = ['home', 'analysis', 'history', 'batch', 'account'];
        if (pages[idx] === pageName) item.classList.add('active');
    });

    if (pageName === 'history') loadHistory();
}

// ============================================================================
// DROPDOWN
// ============================================================================

function toggleSelect(type) {
    const options = document.getElementById(type + 'Options');
    const isShowing = options.classList.contains('show');

    document.querySelectorAll('.select-options').forEach(o => o.classList.remove('show'));

    if (!isShowing) {
        options.classList.add('show');
        state.activeSelect = type;
    } else {
        closeSelect(type);
    }
}

function closeSelect(type) {
    const options = document.getElementById(type + 'Options');
    options.classList.remove('show');
    if (state.activeSelect === type) state.activeSelect = null;
}

function selectOption(type, value, label) {
    const display = document.getElementById(type + 'Value');
    display.textContent = value.toFixed(2) + ' (' + label + ')';
    display.style.color = 'var(--text-primary)';

    if (type === 'ou') state.selectedOU = parseFloat(value);
    else if (type === 'handicap') state.selectedHandicap = parseFloat(value);

    closeSelect(type);
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateOdds(num) {
    const input = document.getElementById('odds' + num);
    const card = document.getElementById('card' + num);
    if (parseFloat(input.value) > 0) {
        card.classList.add('active');
    } else {
        card.classList.remove('active');
    }
}

function validateForm() {
    const errors = {};
    const homeTeam = document.getElementById('homeTeam').value.trim();
    const awayTeam = document.getElementById('awayTeam').value.trim();
    const odds1 = parseFloat(document.getElementById('odds1').value);
    const odds2 = parseFloat(document.getElementById('odds2').value);

    if (!homeTeam || !awayTeam) errors.teamError = 'Vui lòng nhập tên cả hai đội';
    if (homeTeam === awayTeam && homeTeam) errors.teamError = 'Hai đội không thể trùng tên';
    if (!odds1 || !odds2) errors.oddsError = 'Vui lòng nhập cả hai kèo';
    if (odds1 && odds1 >= odds2) errors.oddsError = 'Odds 2 phải lớn hơn Odds 1';
    if (!state.selectedOU || !state.selectedHandicap) errors.selectError = 'Vui lòng chọn kèo chính';

    clearErrors();
    Object.entries(errors).forEach(([id, msg]) => showError(id, msg));
    return Object.keys(errors).length === 0;
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.add('show');
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
}

// ============================================================================
// ANALYSIS
// ============================================================================

function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const homeTeam = document.getElementById('homeTeam').value.trim();
    const awayTeam = document.getElementById('awayTeam').value.trim();
    const odds1 = parseFloat(document.getElementById('odds1').value);
    const odds2 = parseFloat(document.getElementById('odds2').value);

    const btn = document.getElementById('analyzeBtn');
    const originalHTML = btn.innerHTML;
    btn.classList.add('loading');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div><span>AI đang phân tích...</span>';

    setTimeout(() => {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = originalHTML;

        const result = analyzeData(odds1, odds2, state.selectedOU, state.selectedHandicap);
        displayResults(result, homeTeam, awayTeam);

        saveAnalysis({
            homeTeam, awayTeam, odds1, odds2,
            mainOU: state.selectedOU,
            mainHandicap: state.selectedHandicap,
            result: result
        });

        document.getElementById('analysisForm').reset();
        state.selectedOU = null;
        state.selectedHandicap = null;
        document.getElementById('ouValue').textContent = 'Chọn số bàn';
        document.getElementById('handicapValue').textContent = 'Chọn chấp';
        document.getElementById('ouValue').style.color = 'var(--text-secondary)';
        document.getElementById('handicapValue').style.color = 'var(--text-secondary)';
    }, 1500);
}

function analyzeData(odds1, odds2, mainOU, mainHandicap) {
    if (!odds1 || !odds2 || odds1 >= odds2) throw new Error('Invalid odds');

    const pBTTS_O15 = 1 / odds1;
    const pBTTS_O25 = 1 / odds2;
    const gap = odds2 - odds1;
    const pGivenBTTS = odds1 / odds2;
    let pTotalOver3 = pBTTS_O25 * 1.08;

    let trend = '', trendClass = '', recommendation = '', safeBet = '';

    if (odds1 <= CONFIG.THRESHOLD_ODDS1) {
        trend = 'TÀI MẠNH';
        trendClass = 'success';
        recommendation = 'Ưu tiên Tài';
        safeBet = 'Tài ' + (mainOU > 2.5 ? (mainOU - 0.25).toFixed(2) : mainOU.toFixed(2));
    } else if (odds1 >= 1.83) {
        if (pGivenBTTS > CONFIG.THRESHOLD_HIGH_PROB) {
            trend = 'TÀI (Cẩn trọng)';
            trendClass = 'warning';
            recommendation = 'Tài nhưng rủi ro cao';
            safeBet = 'Tài ' + (mainOU - 0.25).toFixed(2);
        } else {
            trend = 'XỈU MẠNH';
            trendClass = 'primary';
            recommendation = 'Ưu tiên Xỉu';
            safeBet = 'Xỉu ' + (mainOU + 0.25).toFixed(2);
        }
    } else {
        if (gap <= CONFIG.GAP_LOW && pGivenBTTS > 0.75) {
            trend = 'TÀI';
            trendClass = 'success';
            recommendation = 'Xu hướng Tài';
            safeBet = 'Tài ' + (mainOU - 0.25).toFixed(2);
        } else if (gap >= CONFIG.GAP_HIGH || pGivenBTTS < CONFIG.THRESHOLD_MED_PROB) {
            trend = 'XỈU';
            trendClass = 'primary';
            recommendation = 'Xu hướng Xỉu (1-1)';
            safeBet = 'Xỉu ' + (mainOU + 0.25).toFixed(2);
        } else {
            trend = 'TRUNG LẬP';
            trendClass = 'warning';
            recommendation = 'Không rõ ràng, nên tránh';
            safeBet = 'Không đề xuất';
        }
    }

    let baseHandicap = ((1.83 - odds1) / 0.28) * 0.5;
    if (gap <= CONFIG.GAP_LOW) baseHandicap += 0.25;
    else if (gap >= CONFIG.GAP_HIGH) baseHandicap -= 0.25;
    if (mainOU >= 2.75) baseHandicap += 0.25;
    else if (mainOU <= 2.25) baseHandicap -= 0.25;

    const suggestedHandicap = Math.round(baseHandicap * 4) / 4;
    const diff = Math.abs(suggestedHandicap - mainHandicap);
    let trapWarning = 'Kèo chấp hợp lý';
    let trapClass = 'success';

    if (diff >= 0.75) {
        trapWarning = `CẢNH BÁO BẪY: Chênh lệch ${suggestedHandicap.toFixed(2)} vs ${mainHandicap.toFixed(2)}`;
        trapClass = 'danger';
    } else if (diff >= 0.5) {
        trapWarning = 'Nghi ngờ bẫy: Chênh lệch đáng kể';
        trapClass = 'warning';
    }

    return {
        pBTTS_O15: (pBTTS_O15 * 100).toFixed(1),
        pBTTS_O25: (pBTTS_O25 * 100).toFixed(1),
        gap: gap.toFixed(2),
        pGivenBTTS: (pGivenBTTS * 100).toFixed(1),
        pTotalOver3: Math.min(pTotalOver3 * 100, 100).toFixed(1),
        trend, trendClass, recommendation, safeBet,
        suggestedHandicap: suggestedHandicap.toFixed(2),
        trapWarning, trapClass
    };
}

function displayResults(result, homeTeam, awayTeam) {
    const html = `
        <div class="result-section animate-in">
            <div class="section-title">
                <i class="fas fa-shield-alt" aria-hidden="true"></i>
                Thông tin trận đấu
            </div>
            <div class="result-card primary">
                <div class="result-label">Trận đấu</div>
                <div class="result-value large">${escapeHtml(homeTeam)} vs ${escapeHtml(awayTeam)}</div>
                <div style="margin-top: 8px; font-size: 13px; color: var(--text-secondary);">
                    Kèo: OU ${state.selectedOU?.toFixed(2)} | HC ${state.selectedHandicap?.toFixed(2)}
                </div>
            </div>
        </div>

        <div class="result-section animate-in" style="animation-delay: 0.1s;">
            <div class="section-title">
                <i class="fas fa-brain" aria-hidden="true"></i>
                Dự đoán AI
            </div>
            <div class="result-card ${result.trendClass}">
                <div class="result-label">Xu hướng</div>
                <div class="result-value large">${result.trend}</div>
                <span class="badge badge-${result.trendClass}">${result.recommendation}</span>
            </div>
            <div class="result-card">
                <div class="result-label">Kèo an toàn</div>
                <div class="result-value" style="color: var(--success);">${result.safeBet}</div>
            </div>
        </div>

        <div class="result-section animate-in" style="animation-delay: 0.2s;">
            <div class="section-title">
                <i class="fas fa-chart-pie" aria-hidden="true"></i>
                Xác suất
            </div>
            <div class="result-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div class="result-label">P(BTTS + ≥2)</div>
                    <div style="font-weight: 700; color: var(--primary-blue);">${result.pBTTS_O15}%</div>
                </div>
                <div class="probability-bar">
                    <div class="probability-fill ${result.pBTTS_O15 > 60 ? 'high' : result.pBTTS_O15 > 50 ? 'medium' : 'low'}" style="width: ${result.pBTTS_O15}%"></div>
                </div>
            </div>
            <div class="result-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div class="result-label">P(≥3 | BTTS)</div>
                    <div style="font-weight: 700; color: var(--primary-blue);">${result.pGivenBTTS}%</div>
                </div>
                <div class="probability-bar">
                    <div class="probability-fill ${result.pGivenBTTS > 80 ? 'high' : result.pGivenBTTS > 60 ? 'medium' : 'low'}" style="width: ${result.pGivenBTTS}%"></div>
                </div>
            </div>
        </div>

        <div class="result-section animate-in" style="animation-delay: 0.3s;">
            <div class="section-title">
                <i class="fas fa-balance-scale" aria-hidden="true"></i>
                Kèo chấp
            </div>
            <div class="result-card">
                <div class="result-label">Tham khảo</div>
                <div class="result-value">${result.suggestedHandicap}</div>
            </div>
            <div class="result-card ${result.trapClass}">
                <div class="result-label">Đánh giá</div>
                <div class="result-value" style="font-size: 16px;">${result.trapWarning}</div>
            </div>
        </div>
    `;

    document.getElementById('resultsContent').innerHTML = html;
    document.getElementById('resultModal').classList.add('show');
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, c => map[c]);
}

function closeModal(event) {
    if (!event || event.target === document.getElementById('resultModal')) {
        document.getElementById('resultModal').classList.remove('show');
    }
}

// ============================================================================
// HISTORY
// ============================================================================

function saveAnalysis(data) {
    let history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    history.push({
        ...data,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('analysisHistory', JSON.stringify(history));
    loadHistoryCount();
    showToast('✅ Đã lưu phân tích');
}

function loadHistoryCount() {
    const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    document.getElementById('totalAnalysis').textContent = history.length;
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    const listEl = document.getElementById('historyList');

    if (history.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Chưa có phân tích nào</p>';
        return;
    }

    const filterDate = document.getElementById('historyFilter').value;
    let filtered = history;

    if (filterDate) {
        filtered = history.filter(h => h.timestamp.startsWith(filterDate));
    }

    if (filtered.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Không có phân tích trong ngày này</p>';
        return;
    }

    listEl.innerHTML = filtered.reverse().map((h, i) => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-match">${h.homeTeam} vs ${h.awayTeam}</div>
                <div class="history-time">${new Date(h.timestamp).toLocaleString('vi-VN')}</div>
            </div>
            <div class="history-result">${h.result.trend}</div>
            <button onclick="deleteHistoryItem(${history.length - i - 1})" class="batch-delete-btn">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

function filterHistory() {
    loadHistory();
}

function deleteHistoryItem(index) {
    if (!confirm('Xóa phân tích này?')) return;
    let history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('analysisHistory', JSON.stringify(history));
    loadHistory();
    loadHistoryCount();
    showToast('✅ Đã xóa');
}

function clearAllHistory() {
    if (!confirm('Xóa TẤT CẢ lịch sử? (Không thể hoàn tác)')) return;
    localStorage.removeItem('analysisHistory');
    loadHistory();
    loadHistoryCount();
    showToast('✅ Đã xóa tất cả');
}

function exportHistoryCSV() {
    const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    if (history.length === 0) {
        showToast('⚠️ Không có dữ liệu để xuất');
        return;
    }

    const csv = ['Chủ nhà,Khách,Odds1,Odds2,OU,HC,Xu hướng,Ngày'];
    history.forEach(h => {
        csv.push(`"${h.homeTeam}","${h.awayTeam}",${h.odds1},${h.odds2},${h.mainOU},${h.mainHandicap},"${h.result.trend}","${new Date(h.timestamp).toLocaleString('vi-VN')}"`);
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('✅ Đã xuất CSV');
}

// ============================================================================
// BATCH ANALYSIS
// ============================================================================

function addBatchRow() {
    const tbody = document.getElementById('batchBody');
    const rowNum = tbody.children.length;
    const row = document.createElement('tr');
    row.id = 'batch-row-' + rowNum;
    row.innerHTML = `
        <td><input type="text" maxlength="20" placeholder="Chủ nhà" data-home></td>
        <td><input type="text" maxlength="20" placeholder="Khách" data-away></td>
        <td><input type="number" step="0.01" min="1" placeholder="1.55" data-odds1></td>
        <td><input type="number" step="0.01" min="1" placeholder="1.83" data-odds2></td>
        <td><input type="number" step="0.01" placeholder="2.5" data-ou></td>
        <td><input type="number" step="0.01" placeholder="0" data-hc></td>
        <td><button type="button" onclick="removeBatchRow(${rowNum})" class="batch-delete-btn">✕</button></td>
    `;
    tbody.appendChild(row);
}

function removeBatchRow(rowNum) {
    const row = document.getElementById('batch-row-' + rowNum);
    if (row) row.remove();
}

function analyzeAllMatches() {
    const rows = document.querySelectorAll('#batchBody tr');
    const matches = [];

    for (let row of rows) {
        const home = row.querySelector('[data-home]').value.trim();
        const away = row.querySelector('[data-away]').value.trim();
        const odds1 = parseFloat(row.querySelector('[data-odds1]').value);
        const odds2 = parseFloat(row.querySelector('[data-odds2]').value);
        const ou = parseFloat(row.querySelector('[data-ou]').value);
        const hc = parseFloat(row.querySelector('[data-hc]').value);

        if (home && away && odds1 && odds2 && ou && hc !== '') {
            if (odds1 < odds2) {
                try {
                    const result = analyzeData(odds1, odds2, ou, hc);
                    matches.push({ home, away, odds1, odds2, ou, hc, result });
                } catch (e) {
                    console.error('Error analyzing:', e);
                }
            }
        }
    }

    if (matches.length === 0) {
        showToast('⚠️ Vui lòng nhập đủ dữ liệu');
        return;
    }

    const resultHTML = `
        <div style="background: rgba(0,122,255,0.1); border-radius: 12px; padding: 16px; border-left: 4px solid var(--primary-blue);">
            <h3 style="margin-bottom: 12px;">📊 Kết quả ${matches.length} trận</h3>
            ${matches.map(m => `
                <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid var(--warning);">
                    <div style="font-weight: 600; margin-bottom: 6px;">${m.home} vs ${m.away}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">
                        <span style="background: rgba(52,199,89,0.2); padding: 2px 8px; border-radius: 4px; margin-right: 8px; color: var(--success); font-weight: 600;">${m.result.trend}</span>
                        <span>${m.result.recommendation}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('batchResults').innerHTML = resultHTML;
    showToast('✅ Phân tích xong');
}

// ============================================================================
// DEVELOPER PANEL
// ============================================================================

function handleLogoClick() {
    state.logoClicks++;
    if (state.logoClicks >= 5) {
        showDevModal();
        state.logoClicks = 0;
    }
}

function showDevModal() {
    document.getElementById('devModal').classList.add('show');
}

function closeDevModal(event) {
    if (!event || event.target === document.getElementById('devModal')) {
        document.getElementById('devModal').classList.remove('show');
        document.getElementById('devPasswordForm').style.display = state.adminLoggedIn ? 'none' : 'block';
        document.getElementById('devOptions').style.display = state.adminLoggedIn ? 'block' : 'none';
    }
}

function verifyAdminPassword(e) {
    e.preventDefault();
    const pass = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('adminError');

    if (pass === CONFIG.ADMIN_PASSWORD) {
        state.adminLoggedIn = true;
        document.getElementById('devPasswordForm').style.display = 'none';
        document.getElementById('devOptions').style.display = 'block';
        loadDevSettings();
        errorEl.textContent = '';
        showToast('✅ Đăng nhập thành công');
    } else {
        errorEl.textContent = '❌ Sai mật khẩu';
        errorEl.classList.add('show');
    }
}

function loadDevSettings() {
    const settings = JSON.parse(localStorage.getItem('devSettings') || '{}');
    document.getElementById('devThreshold').value = settings.THRESHOLD_ODDS1 || CONFIG.THRESHOLD_ODDS1;
    document.getElementById('devGapLow').value = settings.GAP_LOW || CONFIG.GAP_LOW;
    document.getElementById('devGapHigh').value = settings.GAP_HIGH || CONFIG.GAP_HIGH;
}

function saveDevSettings() {
    const settings = {
        THRESHOLD_ODDS1: parseFloat(document.getElementById('devThreshold').value),
        GAP_LOW: parseFloat(document.getElementById('devGapLow').value),
        GAP_HIGH: parseFloat(document.getElementById('devGapHigh').value)
    };

    Object.assign(CONFIG, settings);
    localStorage.setItem('devSettings', JSON.stringify(settings));
    showToast('✅ Đã lưu cài đặt');
}

function exportAllData() {
    const data = {
        history: JSON.parse(localStorage.getItem('analysisHistory') || '[]'),
        settings: JSON.parse(localStorage.getItem('devSettings') || '{}'),
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('✅ Đã xuất dữ liệu');
}

function resetAllData() {
    if (!confirm('🚨 Xóa TẤT CẢ dữ liệu? Không thể hoàn tác!')) return;
    localStorage.clear();
    location.reload();
}

// ============================================================================
// SETTINGS
// ============================================================================

function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    if (isDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.removeItem('darkMode');
    }
}

function loadDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.getElementById('darkModeToggle').checked = true;
        document.body.classList.add('dark-mode');
    }
}

// ============================================================================
// UTILS
// ============================================================================

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}