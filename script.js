// データ管理
let customers = [];
let treatments = [];
let currentCustomerId = null;
let designImages = [];

// ==========================================
// 自動バックアップシステム
// ==========================================

const BackupSystem = {
    config: {
        maxBackups: 30,
        autoBackupInterval: 5 * 60 * 1000,  // 5分
        backupOnChange: true,
        backupPrefix: 'nail_backup_'
    },

    init() {
        console.log('🔄 自動バックアップシステム起動');
        this.startAutoBackup();
        window.addEventListener('beforeunload', () => {
            this.createBackup('ページ終了時');
        });
        this.createBackup('システム起動時');
    },

    startAutoBackup() {
        setInterval(() => {
            this.createBackup('定期バックアップ');
        }, this.config.autoBackupInterval);
    },

    createBackup(trigger = 'manual') {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                trigger: trigger,
                data: {
                    customers: localStorage.getItem('nail_customers'),
                    treatments: localStorage.getItem('nail_treatments'),
                    gallery: localStorage.getItem('nail_gallery')
                },
                stats: {
                    customerCount: customers.length,
                    treatmentCount: treatments.length
                }
            };

            const backupKey = this.config.backupPrefix + Date.now();
            localStorage.setItem(backupKey, JSON.stringify(backup));
            this.cleanOldBackups();
            
            console.log(`✅ バックアップ完了: ${trigger} (${backup.stats.customerCount}人)`);
            return backupKey;
        } catch (error) {
            console.error('❌ バックアップ失敗:', error);
        }
    },

    cleanOldBackups() {
        const backups = this.getBackupList();
        if (backups.length > this.config.maxBackups) {
            const toDelete = backups.slice(0, backups.length - this.config.maxBackups);
            toDelete.forEach(backup => {
                localStorage.removeItem(backup.key);
            });
        }
    },

    getBackupList() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.config.backupPrefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key: key,
                        timestamp: data.timestamp,
                        trigger: data.trigger,
                        stats: data.stats
                    });
                } catch (e) {
                    console.error('バックアップ読み込みエラー:', key);
                }
            }
        }
        return backups.sort((a, b) => a.key.localeCompare(b.key));
    },

    restore(backupKey) {
        try {
            const backup = JSON.parse(localStorage.getItem(backupKey));
            if (!backup) {
                alert('バックアップが見つかりません');
                return false;
            }

            this.createBackup('復元前の自動保存');

            if (backup.data.customers) {
                localStorage.setItem('nail_customers', backup.data.customers);
            }
            if (backup.data.treatments) {
                localStorage.setItem('nail_treatments', backup.data.treatments);
            }
            if (backup.data.gallery) {
                localStorage.setItem('nail_gallery', backup.data.gallery);
            }

            alert(`✅ データを復元しました\n日時: ${new Date(backup.timestamp).toLocaleString()}`);
            location.reload();
            return true;
        } catch (error) {
            console.error('復元エラー:', error);
            alert('復元に失敗しました');
            return false;
        }
    },

    getLatestBackup() {
        const backups = this.getBackupList();
        return backups[backups.length - 1] || null;
    }
};

// バックアップ管理UI
function renderBackupPage() {
    const backups = BackupSystem.getBackupList();
    const latest = BackupSystem.getLatestBackup();
    
    let html = `
        <div class="form-section">
            <h3 class="form-section-title">📊 バックアップ状況</h3>
            <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
    `;
    
    if (latest) {
        const date = new Date(latest.timestamp);
        html += `
            <p><strong>最終バックアップ:</strong> ${date.toLocaleString()}</p>
            <p><strong>顧客数:</strong> ${latest.stats.customerCount}人 / <strong>施術数:</strong> ${latest.stats.treatmentCount}件</p>
            <p><strong>保存済み世代:</strong> ${backups.length}個（最大30個）</p>
        `;
    } else {
        html += '<p>バックアップがありません</p>';
    }
    
    html += `
            </div>
            <button class="btn btn-primary" onclick="BackupSystem.createBackup('手動'); renderBackupPage();">
                💾 今すぐバックアップ
            </button>
        </div>
        
        <div class="form-section">
            <h3 class="form-section-title">📁 バックアップ履歴</h3>
            <div style="max-height: 400px; overflow-y: auto;">
    `;
    
    if (backups.length > 0) {
        html += `<div style="display: flex; flex-direction: column; gap: 12px;">`;
        
        backups.reverse().forEach((backup, index) => {
            const date = new Date(backup.timestamp);
            const isLatest = index === 0;
            
            html += `
                <div style="padding: 16px; border: 1px solid #dee2e6; border-radius: 8px; ${isLatest ? 'background: #e8f5e9;' : 'background: white;'}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${date.toLocaleString()}</strong>
                            ${isLatest ? '<span style="color: #28a745; font-weight: bold; margin-left: 8px;">最新</span>' : ''}
                            <br>
                            <small style="color: #666;">
                                ${backup.trigger} - ${backup.stats.customerCount}人の顧客データ
                            </small>
                        </div>
                        <div>
                            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; margin-right: 8px;" 
                                    onclick="if(confirm('このバックアップから復元しますか？\\n現在のデータは上書きされます')) BackupSystem.restore('${backup.key}')">
                                復元
                            </button>
                            ${!isLatest ? `
                                <button class="btn btn-outline-danger" style="padding: 6px 12px; font-size: 12px;" 
                                        onclick="if(confirm('削除しますか？')) { localStorage.removeItem('${backup.key}'); renderBackupPage(); }">
                                    削除
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    } else {
        html += '<p style="text-align: center; color: #666; padding: 40px;">バックアップ履歴がありません</p>';
    }
    
    html += `
            </div>
        </div>
        
        <div class="form-section">
            <h3 class="form-section-title">⚙️ 自動バックアップ設定</h3>
            <div style="padding: 16px; background: #e3f2fd; border-radius: 8px;">
                <p>✅ ${BackupSystem.config.autoBackupInterval / 60000}分ごとに自動保存</p>
                <p>✅ データ変更時に自動保存</p>
                <p>✅ ページ終了時に自動保存</p>
                <p>✅ 最大${BackupSystem.config.maxBackups}世代を保持</p>
                <p style="margin-top: 12px; font-size: 14px; color: #666;">
                    💡 ヒント: 重要なデータは定期的に「エクスポート」機能でJSONファイルとして保存することをお勧めします
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('backup-content').innerHTML = html;
}

// データ保存時の自動バックアップ
const originalSaveData = saveData;
saveData = function() {
    originalSaveData.apply(this, arguments);
    
    if (BackupSystem.config.backupOnChange) {
        clearTimeout(window.saveDataBackupTimeout);
        window.saveDataBackupTimeout = setTimeout(() => {
            BackupSystem.createBackup('データ変更時');
        }, 1000);
    }
};

// スマホデバッグ用ログ表示機能
let debugMode = false;
let debugLogs = [];

function toggleDebugMode() {
    debugMode = !debugMode;
    if (debugMode) {
        showDebugPanel();
        console.log('🐛 デバッグモード ON');
    } else {
        hideDebugPanel();
        console.log('🐛 デバッグモード OFF');
    }
}

function addDebugLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    debugLogs.push(logEntry);
    
    // 最新100件のみ保持
    if (debugLogs.length > 100) {
        debugLogs.shift();
    }
    
    if (debugMode) {
        updateDebugPanel();
    }
    
    // コンソールにも出力
    console.log(`[${timestamp}] ${message}`);
}

function showDebugPanel() {
    let debugPanel = document.getElementById('debug-panel');
    if (!debugPanel) {
        debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-size: 10px;
            font-family: monospace;
            z-index: 10000;
            padding: 10px;
            border-radius: 5px;
            overflow-y: auto;
            border: 1px solid #333;
        `;
        
        const header = document.createElement('div');
        header.innerHTML = `
            <strong>🐛 デバッグログ</strong>
            <button onclick="clearDebugLogs()" style="float: right; font-size: 10px;">クリア</button>
            <button onclick="toggleDebugMode()" style="float: right; margin-right: 5px; font-size: 10px;">閉じる</button>
            <hr style="margin: 5px 0;">
        `;
        debugPanel.appendChild(header);
        
        const logContainer = document.createElement('div');
        logContainer.id = 'debug-logs';
        debugPanel.appendChild(logContainer);
        
        document.body.appendChild(debugPanel);
    }
    debugPanel.style.display = 'block';
    updateDebugPanel();
}

function hideDebugPanel() {
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
        debugPanel.style.display = 'none';
    }
}

function updateDebugPanel() {
    const logContainer = document.getElementById('debug-logs');
    if (logContainer) {
        logContainer.innerHTML = debugLogs.slice(-20).map(log => {
            const color = log.type === 'error' ? '#ff4444' : 
                         log.type === 'success' ? '#44ff44' : '#00ff00';
            return `<div style="color: ${color}; margin: 2px 0;">[${log.timestamp}] ${log.message}</div>`;
        }).join('');
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

function clearDebugLogs() {
    debugLogs = [];
    updateDebugPanel();
}

// LocalStorage情報取得
function getStorageInfo() {
    const info = {
        customers: customers.length,
        treatments: treatments.length,
        designs: designImages.length,
        storageUsed: 0,
        storageLimit: 0
    };
    
    try {
        // 使用容量概算
        const customersSize = JSON.stringify(customers).length;
        const treatmentsSize = JSON.stringify(treatments).length;
        const designsSize = JSON.stringify(designImages).length;
        info.storageUsed = Math.round((customersSize + treatmentsSize + designsSize) / 1024);
        
        // ブラウザの制限を推定（一般的に5-10MB）
        info.storageLimit = 5120; // 5MB in KB
    } catch (error) {
        console.error('ストレージ情報取得エラー:', error);
    }
    
    return info;
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    addDebugLog('🚀 アプリケーション初期化開始');
    
    loadData();
    addDebugLog('📂 データロード完了');
    
    setupEventListeners();
    addDebugLog('🎧 イベントリスナー設定完了');
    
    renderCustomerList();
    addDebugLog('👥 顧客リスト描画完了');
    
    updateAnalyticsMonth();
    addDebugLog('📊 分析データ更新完了');
    
    // ストレージ情報をログ出力
    const storageInfo = getStorageInfo();
    addDebugLog(`💽 ストレージ: 顧客${storageInfo.customers}人, 施術${storageInfo.treatments}件, 使用量${storageInfo.storageUsed}KB`);
    
    // バックアップシステム初期化
    setTimeout(() => {
        BackupSystem.init();
        addDebugLog('🔄 バックアップシステム初期化完了');
        
        // デバッグモード自動起動（開発時）
        if (window.location.search.includes('debug=1')) {
            toggleDebugMode();
        }
    }, 1000);
    
    addDebugLog('✅ 初期化完了', 'success');
});

// イベントリスナーの設定
function setupEventListeners() {
    // ナビゲーション
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchPage(this.dataset.page);
        });
    });
    
    // 顧客登録フォーム
    document.getElementById('new-customer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewCustomer();
    });
    
    // 施術記録フォーム
    document.getElementById('treatment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewTreatment();
    });
    
    // 検索
    document.getElementById('customer-search').addEventListener('input', function() {
        filterCustomers();
    });
    
    // ソート
    document.getElementById('sort-customers').addEventListener('change', function() {
        sortCustomers(this.value);
    });
    
    // デザイン写真アップロード
    document.getElementById('treatment-photos').addEventListener('change', function(e) {
        previewPhotos(e.target.files);
    });
    
    // ギャラリーフィルター
    document.getElementById('design-search').addEventListener('input', filterGallery);
    document.getElementById('season-filter').addEventListener('change', filterGallery);
    document.getElementById('color-filter').addEventListener('change', filterGallery);
}

// ページ切り替え
function switchPage(pageName) {
    // ナビゲーションの更新
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageName) {
            btn.classList.add('active');
        }
    });
    
    // ページの表示切り替え
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}-page`).classList.add('active');
    
    // ページごとの初期化処理
    if (pageName === 'analytics') {
        updateAnalytics();
    } else if (pageName === 'gallery') {
        renderGallery();
    } else if (pageName === 'treatments') {
        renderTreatmentList();
    }
}

// データのローカルストレージ保存・読み込み
function saveData() {
    localStorage.setItem('nail_customers', JSON.stringify(customers));
    localStorage.setItem('nail_treatments', JSON.stringify(treatments));
    localStorage.setItem('nail_designs', JSON.stringify(designImages));
}

// エラーハンドリング付きデータ保存
function saveDataWithErrorHandling() {
    try {
        // LocalStorage容量チェック
        const testKey = 'nail_storage_test';
        const testData = JSON.stringify({ test: 'data' });
        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
        
        // 実際のデータ保存
        localStorage.setItem('nail_customers', JSON.stringify(customers));
        localStorage.setItem('nail_treatments', JSON.stringify(treatments));
        localStorage.setItem('nail_designs', JSON.stringify(designImages));
        
        addDebugLog(`💾 データ保存成功: 顧客${customers.length}人, 施術${treatments.length}件`, 'success');
        return true;
    } catch (error) {
        addDebugLog(`❌ LocalStorage保存エラー: ${error.message}`, 'error');
        
        if (error.name === 'QuotaExceededError' || error.name === 'QUOTA_EXCEEDED_ERR') {
            addDebugLog('💽 ストレージ容量不足', 'error');
            alert('ストレージの容量が不足しています。古いデータの削除が必要です。');
        } else {
            addDebugLog(`🚫 ストレージアクセスエラー: ${error.message}`, 'error');
            alert('データの保存に失敗しました: ' + error.message);
        }
        return false;
    }
}

// FileReader を Promise でラップする関数
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// 施術データ保存の共通処理
function saveTreatmentData(treatment) {
    addDebugLog('💾 施術データ保存開始');
    
    try {
        // treatments配列に追加
        treatments.push(treatment);
        addDebugLog(`📊 施術記録追加: 全${treatments.length}件`);
        
        // LocalStorage保存（エラーハンドリング付き）
        const success = saveDataWithErrorHandling();
        
        if (success) {
            addDebugLog('✅ データ保存成功', 'success');
            
            // UI更新
            document.getElementById('treatment-form').reset();
            document.getElementById('photo-preview').innerHTML = '';
            
            closeModal('treatment-modal');
            renderTreatmentList();
            showNotification('施術記録を登録しました');
            
            // 手動バックアップ作成
            if (typeof BackupSystem !== 'undefined') {
                BackupSystem.createBackup('施術記録登録');
            }
            
            // カウント更新
            updateCounts();
        } else {
            addDebugLog('❌ データ保存失敗', 'error');
            alert('データの保存に失敗しました。ストレージの容量を確認してください。');
        }
    } catch (error) {
        addDebugLog(`❌ 施術記録保存エラー: ${error.message}`, 'error');
        alert('施術記録の保存中にエラーが発生しました: ' + error.message);
    }
}

function loadData() {
    const savedCustomers = localStorage.getItem('nail_customers');
    const savedTreatments = localStorage.getItem('nail_treatments');
    const savedDesigns = localStorage.getItem('nail_designs');
    
    if (savedCustomers) {
        customers = JSON.parse(savedCustomers);
    }
    if (savedTreatments) {
        treatments = JSON.parse(savedTreatments);
    }
    if (savedDesigns) {
        designImages = JSON.parse(savedDesigns);
    }
    
    // サンプルデータの追加（初回のみ）
    if (customers.length === 0) {
        addSampleData();
    }
}

// 顧客管理機能
function addNewCustomer() {
    addDebugLog('👤 顧客登録開始');
    
    // 必須フィールドチェック
    const name = document.getElementById('customer-name').value.trim();
    
    if (!name) {
        alert('顧客名は必須項目です');
        addDebugLog('❌ 顧客名が未入力', 'error');
        return;
    }
    
    const customer = {
        id: Date.now().toString(),
        name: name,
        kana: document.getElementById('customer-kana')?.value.trim() || '',
        phone: document.getElementById('customer-phone')?.value.trim() || '',
        email: document.getElementById('customer-email')?.value.trim() || '',
        birthday: document.getElementById('customer-birthday')?.value || '',
        address: document.getElementById('customer-address')?.value.trim() || '',
        allergies: document.getElementById('customer-allergies')?.value.trim() || '',
        notes: document.getElementById('customer-notes')?.value.trim() || '',
        createdAt: new Date().toISOString(),
        visitCount: 0
    };
    
    addDebugLog(`👤 顧客データ作成: ${customer.name}`);
    
    try {
        customers.push(customer);
        addDebugLog(`📊 顧客追加: 全${customers.length}人`);
        
        const success = saveDataWithErrorHandling();
        
        if (success) {
            addDebugLog('✅ 顧客データ保存成功', 'success');
            
            // フォームクリア
            document.getElementById('new-customer-form').reset();
            
            // 顧客一覧ページに遷移
            switchPage('customers');
            renderCustomerList();
            
            // 成功メッセージ
            showNotification('顧客を登録しました');
            
            // 手動バックアップ作成
            if (typeof BackupSystem !== 'undefined') {
                BackupSystem.createBackup('顧客登録');
            }
            
            // カウント更新
            updateCounts();
        } else {
            // 追加に失敗した場合はロールバック
            customers.pop();
            addDebugLog('❌ 顧客データ保存失敗、ロールバック', 'error');
        }
    } catch (error) {
        addDebugLog(`❌ 顧客登録エラー: ${error.message}`, 'error');
        alert('顧客登録中にエラーが発生しました: ' + error.message);
    }
}

function renderCustomerList() {
    const listContainer = document.getElementById('customer-list');
    listContainer.innerHTML = '';
    
    customers.forEach(customer => {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.onclick = () => showCustomerDetail(customer.id);
        
        const lastVisit = getLastVisit(customer.id);
        const visitCount = getVisitCount(customer.id);
        
        card.innerHTML = `
            <h3>${customer.name}${customer.kana ? ` (${customer.kana})` : ''}</h3>
            <div class="customer-info">
                <span>📱 ${customer.phone}</span>
                ${customer.email ? `<span>✉️ ${customer.email}</span>` : ''}
                <span>🎂 ${customer.birthday ? formatDate(customer.birthday) : '未登録'}</span>
                <span>📅 最終来店: ${lastVisit ? formatDate(lastVisit) : 'なし'}</span>
                <span>来店回数<span class="visit-count">${visitCount}回</span></span>
            </div>
        `;
        
        listContainer.appendChild(card);
    });
    
    // 施術記録の顧客選択オプションも更新
    updateCustomerSelect();
}

function showCustomerDetail(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    currentCustomerId = customerId;
    
    const modal = document.getElementById('customer-modal');
    document.getElementById('modal-customer-name').textContent = customer.name;
    
    const customerTreatments = treatments.filter(t => t.customerId === customerId);
    
    const detailHTML = `
        <div class="customer-detail-info">
            <h4>基本情報</h4>
            <p><strong>ふりがな:</strong> ${customer.kana || '未登録'}</p>
            <p><strong>電話番号:</strong> ${customer.phone}</p>
            <p><strong>メール:</strong> ${customer.email || '未登録'}</p>
            <p><strong>生年月日:</strong> ${customer.birthday ? formatDate(customer.birthday) : '未登録'}</p>
            <p><strong>住所:</strong> ${customer.address || '未登録'}</p>
            
            <h4>健康情報</h4>
            <p><strong>アレルギー・注意事項:</strong> ${customer.allergies || 'なし'}</p>
            <p><strong>メモ:</strong> ${customer.notes || 'なし'}</p>
            
            <h4>来店履歴</h4>
            <div class="visit-history">
                ${customerTreatments.length > 0 ? 
                    customerTreatments.map(t => `
                        <div class="visit-item">
                            <span>${formatDate(t.date)}</span>
                            <span>${t.menu}</span>
                            <span>¥${t.price.toLocaleString()}</span>
                        </div>
                    `).join('') : 
                    '<p>まだ来店履歴がありません</p>'
                }
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="editCustomer('${customerId}')">編集</button>
                <button class="btn btn-secondary" onclick="deleteCustomer('${customerId}')">削除</button>
            </div>
        </div>
    `;
    
    document.getElementById('customer-detail').innerHTML = detailHTML;
    modal.classList.add('active');
}

function deleteCustomer(customerId) {
    if (!confirm('この顧客を削除してもよろしいですか？\n関連する施術記録も削除されます。')) {
        return;
    }
    
    customers = customers.filter(c => c.id !== customerId);
    treatments = treatments.filter(t => t.customerId !== customerId);
    
    saveData();
    closeModal('customer-modal');
    renderCustomerList();
    showNotification('顧客を削除しました');
}

function editCustomer(customerId) {
    // 編集機能（簡易版）
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // 新規顧客フォームに値をセット
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-kana').value = customer.kana || '';
    document.getElementById('customer-phone').value = customer.phone;
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-birthday').value = customer.birthday || '';
    document.getElementById('customer-address').value = customer.address || '';
    document.getElementById('customer-allergies').value = customer.allergies || '';
    document.getElementById('customer-notes').value = customer.notes || '';
    
    // 顧客を削除して新規として再登録（簡易実装）
    customers = customers.filter(c => c.id !== customerId);
    saveData();
    
    closeModal('customer-modal');
    switchPage('new-customer');
}

// 施術記録機能
function openNewTreatment() {
    const modal = document.getElementById('treatment-modal');
    modal.classList.add('active');
    
    // 今日の日付をセット
    document.getElementById('treatment-date').value = new Date().toISOString().split('T')[0];
}

function addNewTreatment() {
    addDebugLog('📝 施術記録登録開始');
    
    // 必須フィールドチェック
    const customerId = document.getElementById('treatment-customer').value;
    const date = document.getElementById('treatment-date').value;
    const menu = document.getElementById('treatment-menu').value;
    const price = document.getElementById('treatment-price').value;
    
    if (!customerId || !date || !menu || !price) {
        alert('必須項目を入力してください');
        addDebugLog('❌ 必須項目チェック失敗', 'error');
        return;
    }
    
    const treatment = {
        id: Date.now().toString(),
        customerId: customerId,
        date: date,
        menu: menu,
        color: document.getElementById('treatment-color')?.value || '',
        parts: document.getElementById('treatment-parts')?.value || '',
        shape: document.getElementById('treatment-shape')?.value || '',
        length: document.getElementById('treatment-length')?.value || '',
        time: document.getElementById('treatment-time')?.value || '',
        price: parseInt(price) || 0,
        staff: document.getElementById('treatment-staff').value || '',
        tags: document.getElementById('treatment-tags').value.split(',').map(t => t.trim()).filter(t => t),
        nextProposal: document.getElementById('treatment-next')?.value || '',
        photos: [],
        createdAt: new Date().toISOString()
    };
    
    addDebugLog(`📋 施術データ作成: ${menu} (${price}円)`);
    
    // 写真の処理（非同期処理を await で制御）
    const photoFiles = document.getElementById('treatment-photos').files;
    
    if (photoFiles.length > 0) {
        addDebugLog(`📷 写真処理開始: ${photoFiles.length}枚`);
        
        const processPhotos = async () => {
            for (let i = 0; i < photoFiles.length; i++) {
                const file = photoFiles[i];
                try {
                    const imageData = await readFileAsDataURL(file);
                    treatment.photos.push(imageData);
                    
                    // デザインギャラリーにも追加
                    designImages.push({
                        id: Date.now().toString() + Math.random() + i,
                        image: imageData,
                        tags: treatment.tags,
                        season: getSeason(treatment.tags),
                        color: getColor(treatment.tags),
                        date: treatment.date,
                        customerId: treatment.customerId
                    });
                    
                    addDebugLog(`✅ 写真${i + 1}処理完了`, 'success');
                } catch (error) {
                    addDebugLog(`❌ 写真${i + 1}処理失敗: ${error.message}`, 'error');
                }
            }
            
            // 全ての写真処理完了後にデータ保存
            saveTreatmentData(treatment);
        };
        
        processPhotos();
    } else {
        // 写真がない場合は即座に保存
        addDebugLog('📷 写真なし、即座に保存');
        saveTreatmentData(treatment);
    }
}

function renderTreatmentList() {
    const listContainer = document.getElementById('treatment-list');
    listContainer.innerHTML = '';
    
    // 日付順にソート（新しい順）
    const sortedTreatments = [...treatments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTreatments.forEach(treatment => {
        const customer = customers.find(c => c.id === treatment.customerId);
        const date = new Date(treatment.date);
        
        const card = document.createElement('div');
        card.className = 'treatment-card';
        
        card.innerHTML = `
            <div class="treatment-date">
                <div class="day">${date.getDate()}</div>
                <div class="month">${date.getMonth() + 1}月</div>
            </div>
            <div class="treatment-details">
                <h4>${customer ? customer.name : '顧客不明'}</h4>
                <p>${treatment.menu}</p>
                <p>担当: ${treatment.staff || '未記録'}</p>
            </div>
            <div class="treatment-price">
                ¥${treatment.price.toLocaleString()}
            </div>
        `;
        
        listContainer.appendChild(card);
    });
}

// ギャラリー機能
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    
    designImages.forEach(design => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        item.innerHTML = `
            <img src="${design.image}" alt="ネイルデザイン">
            <div class="gallery-tags">
                ${design.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        
        grid.appendChild(item);
    });
}

function filterGallery() {
    const searchText = document.getElementById('design-search').value.toLowerCase();
    const season = document.getElementById('season-filter').value;
    const color = document.getElementById('color-filter').value;
    
    const filtered = designImages.filter(design => {
        const matchSearch = !searchText || design.tags.some(tag => tag.toLowerCase().includes(searchText));
        const matchSeason = !season || design.season === season;
        const matchColor = !color || design.color === color;
        
        return matchSearch && matchSeason && matchColor;
    });
    
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    
    filtered.forEach(design => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        item.innerHTML = `
            <img src="${design.image}" alt="ネイルデザイン">
            <div class="gallery-tags">
                ${design.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        
        grid.appendChild(item);
    });
}

// 分析機能
function updateAnalytics() {
    const monthInput = document.getElementById('analytics-month').value;
    let startDate, endDate;
    
    if (monthInput) {
        const [year, month] = monthInput.split('-');
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
    } else {
        // 今月のデータ
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // 該当期間の施術を抽出
    const monthlyTreatments = treatments.filter(t => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
    });
    
    // 月間売上
    const revenue = monthlyTreatments.reduce((sum, t) => sum + t.price, 0);
    document.getElementById('monthly-revenue').textContent = `¥${revenue.toLocaleString()}`;
    
    // 来店客数（ユニーク）
    const uniqueCustomers = new Set(monthlyTreatments.map(t => t.customerId));
    document.getElementById('monthly-customers').textContent = `${uniqueCustomers.size}人`;
    
    // リピート率（2回以上来店した顧客の割合）
    const customerVisits = {};
    monthlyTreatments.forEach(t => {
        customerVisits[t.customerId] = (customerVisits[t.customerId] || 0) + 1;
    });
    const repeatCustomers = Object.values(customerVisits).filter(count => count >= 2).length;
    const repeatRate = uniqueCustomers.size > 0 ? Math.round((repeatCustomers / uniqueCustomers.size) * 100) : 0;
    document.getElementById('repeat-rate').textContent = `${repeatRate}%`;
    
    // 平均単価
    const averagePrice = monthlyTreatments.length > 0 ? Math.round(revenue / monthlyTreatments.length) : 0;
    document.getElementById('average-price').textContent = `¥${averagePrice.toLocaleString()}`;
    
    // 人気デザインランキング
    updateDesignRanking();
}

function updateDesignRanking() {
    const tagCount = {};
    
    treatments.forEach(t => {
        t.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
    });
    
    const sortedTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const rankingList = document.getElementById('design-ranking');
    rankingList.innerHTML = sortedTags.map(([tag, count]) => 
        `<li>${tag} (${count}回)</li>`
    ).join('');
}

// ユーティリティ関数
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function getLastVisit(customerId) {
    const customerTreatments = treatments.filter(t => t.customerId === customerId);
    if (customerTreatments.length === 0) return null;
    
    return customerTreatments.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
}

function getVisitCount(customerId) {
    return treatments.filter(t => t.customerId === customerId).length;
}

function updateCustomerSelect() {
    const select = document.getElementById('treatment-customer');
    select.innerHTML = '<option value="">選択してください</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name;
        select.appendChild(option);
    });
}

function clearForm() {
    document.getElementById('new-customer-form').reset();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function filterCustomers() {
    const searchText = document.getElementById('customer-search').value.toLowerCase();
    const filtered = customers.filter(customer => {
        return customer.name.toLowerCase().includes(searchText) ||
               customer.phone.includes(searchText) ||
               (customer.kana && customer.kana.toLowerCase().includes(searchText));
    });
    
    renderFilteredCustomers(filtered);
}

function renderFilteredCustomers(filteredCustomers) {
    const listContainer = document.getElementById('customer-list');
    listContainer.innerHTML = '';
    
    filteredCustomers.forEach(customer => {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.onclick = () => showCustomerDetail(customer.id);
        
        const lastVisit = getLastVisit(customer.id);
        const visitCount = getVisitCount(customer.id);
        
        card.innerHTML = `
            <h3>${customer.name}${customer.kana ? ` (${customer.kana})` : ''}</h3>
            <div class="customer-info">
                <span>📱 ${customer.phone}</span>
                ${customer.email ? `<span>✉️ ${customer.email}</span>` : ''}
                <span>🎂 ${customer.birthday ? formatDate(customer.birthday) : '未登録'}</span>
                <span>📅 最終来店: ${lastVisit ? formatDate(lastVisit) : 'なし'}</span>
                <span>来店回数<span class="visit-count">${visitCount}回</span></span>
            </div>
        `;
        
        listContainer.appendChild(card);
    });
}

function sortCustomers(sortBy) {
    let sorted = [...customers];
    
    switch(sortBy) {
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
            break;
        case 'lastVisit':
            sorted.sort((a, b) => {
                const lastA = getLastVisit(a.id);
                const lastB = getLastVisit(b.id);
                if (!lastA) return 1;
                if (!lastB) return -1;
                return new Date(lastB) - new Date(lastA);
            });
            break;
        case 'visits':
            sorted.sort((a, b) => getVisitCount(b.id) - getVisitCount(a.id));
            break;
    }
    
    renderFilteredCustomers(sorted);
}

function previewPhotos(files) {
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = '';
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

function getSeason(tags) {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    const seasonKeywords = {
        spring: ['春', '桜', 'さくら', 'スプリング'],
        summer: ['夏', '海', 'サマー', 'ビーチ'],
        autumn: ['秋', '紅葉', 'オータム', 'ハロウィン'],
        winter: ['冬', '雪', 'ウィンター', 'クリスマス']
    };
    
    for (const season of seasons) {
        for (const tag of tags) {
            if (seasonKeywords[season].some(keyword => tag.includes(keyword))) {
                return season;
            }
        }
    }
    return '';
}

function getColor(tags) {
    const colors = ['pink', 'red', 'blue', 'white', 'black', 'beige'];
    const colorKeywords = {
        pink: ['ピンク', 'pink', 'ローズ'],
        red: ['レッド', 'red', '赤', 'レッド'],
        blue: ['ブルー', 'blue', '青', '水色'],
        white: ['ホワイト', 'white', '白'],
        black: ['ブラック', 'black', '黒'],
        beige: ['ベージュ', 'beige', 'ヌード']
    };
    
    for (const color of colors) {
        for (const tag of tags) {
            if (colorKeywords[color].some(keyword => tag.toLowerCase().includes(keyword))) {
                return color;
            }
        }
    }
    return '';
}

function updateAnalyticsMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('analytics-month').value = `${year}-${month}`;
}

function showNotification(message) {
    // 簡易通知（実装をより良くしたい場合はトースト通知などを追加）
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// サンプルデータの追加
function addSampleData() {
    // サンプル顧客データ
    const sampleCustomers = [
        {
            id: '1',
            name: '田中 花子',
            kana: 'たなか はなこ',
            phone: '090-1234-5678',
            email: 'hanako@example.com',
            birthday: '1990-05-15',
            address: '東京都渋谷区',
            allergies: '',
            notes: '爪が薄いので注意',
            createdAt: new Date('2024-01-15').toISOString(),
            visitCount: 3
        },
        {
            id: '2',
            name: '佐藤 美咲',
            kana: 'さとう みさき',
            phone: '080-9876-5432',
            email: 'misaki@example.com',
            birthday: '1985-11-20',
            address: '東京都新宿区',
            allergies: '金属アレルギー',
            notes: 'フレンチネイルが好み',
            createdAt: new Date('2024-02-01').toISOString(),
            visitCount: 2
        }
    ];
    
    // サンプル施術記録
    const sampleTreatments = [
        {
            id: 't1',
            customerId: '1',
            date: '2024-12-01',
            menu: 'ジェルネイル（オフ込み）',
            color: '#FFC0CB ピンク',
            parts: 'ストーン',
            shape: 'oval',
            length: 'medium',
            time: '90',
            price: 8000,
            staff: '山田',
            tags: ['ピンク', 'ストーン', '冬'],
            nextProposal: '次回は春らしい桜デザインはいかがですか',
            photos: [],
            createdAt: new Date('2024-12-01').toISOString()
        },
        {
            id: 't2',
            customerId: '2',
            date: '2024-12-15',
            menu: 'フレンチネイル',
            color: '#FFFFFF ホワイト',
            parts: '',
            shape: 'square',
            length: 'short',
            time: '60',
            price: 6000,
            staff: '田中',
            tags: ['フレンチ', 'ホワイト', 'シンプル'],
            nextProposal: '',
            photos: [],
            createdAt: new Date('2024-12-15').toISOString()
        }
    ];
    
    customers = sampleCustomers;
    treatments = sampleTreatments;
    saveData();
}

// CSSアニメーションの追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    
    .visit-item {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .modal-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        justify-content: center;
    }
    
    .customer-detail-info h4 {
        color: #667eea;
        margin: 15px 0 10px;
    }
    
    .customer-detail-info p {
        margin: 5px 0;
        color: #666;
    }
`;
document.head.appendChild(style);