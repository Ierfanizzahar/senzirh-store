/* ==================================================
   ADMIN PANEL - SENZITH STORE
   ================================================== */

// STATE
let allGames = [];
let editingGameId = null;

// ==================================================
// INIT
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadGamesData();
    loadOrders();
    loadSettings();
    initModals();
    initOrderFilters();   // ← Tambah ni
});

// ==================================================
// TABS
// ==================================================
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });
}

// ==================================================
// LOAD GAMES
// ==================================================
async function loadGamesData() {
    try {
        // Check cache dulu
        const cached = localStorage.getItem('admin_games');
        if (cached) {
            allGames = JSON.parse(cached);
            renderGamesList();
            return;
        }
        
        // Load dari file JSON
        const indexRes = await fetch('data/games.json');
        const indexData = await indexRes.json();
        
        const promises = indexData.games.map(g => 
            fetch('data/' + g.file).then(r => r.json())
        );
        
        allGames = await Promise.all(promises);
        localStorage.setItem('admin_games', JSON.stringify(allGames));
        renderGamesList();
        
    } catch (error) {
        console.error('Error load games:', error);
        document.getElementById('gamesList').innerHTML = 
            '<p style="color:#ef4444;">Gagal load games. Check Console.</p>';
    }
}

// ==================================================
// RENDER GAMES
// ==================================================
function renderGamesList() {
    const list = document.getElementById('gamesList');
    
    if (allGames.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-gamepad"></i><p>Tiada game lagi.</p></div>';
        return;
    }
    
    list.innerHTML = allGames.map(game => `
        <div class="game-item">
            <img src="${game.img}" alt="${game.name}" 
                 onerror="this.src='https://placehold.co/70x70/1e293b/64748b?text=?'">
            <div class="game-item-info">
                <h4>${game.name}</h4>
                <p>${game.tag}</p>
                <div class="cat-count">
                    ${game.categories.map(cat => 
                        `<span class="cat-tag" onclick="editCategory('${game.id}', '${cat.name.replace(/'/g, "\\'")}')">
                            ${cat.icon} ${cat.name}
                        </span>`
                    ).join('')}
                </div>
            </div>
            <div class="game-item-actions">
                <button class="btn-icon btn-edit" onclick="editGame('${game.id}')" title="Edit Game">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteGame('${game.id}')" title="Padam">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}
// ==================================================
// MODAL
// ==================================================
function initModals() {
        // Category modal
    document.getElementById('btnCloseCategoryModal').addEventListener('click', closeCategoryModal);
    document.getElementById('btnCancelCategoryModal').addEventListener('click', closeCategoryModal);
    document.getElementById('categoryModal').addEventListener('click', (e) => {
        if (e.target.id === 'categoryModal') closeCategoryModal();
    });
    document.getElementById('btnSaveCategory').addEventListener('click', saveCategory);
    document.getElementById('btnAddDiamond').addEventListener('click', () => {
        addDiamondRow({ amount: 0, price: 0, hot: false });
    });
    document.getElementById('btnAddGame').addEventListener('click', () => {
        editingGameId = null;
        document.getElementById('modalTitle').textContent = 'Tambah Game Baru';
        document.getElementById('gameName').value = '';
        document.getElementById('gameTag').value = '';
        document.getElementById('gameImg').value = '';
        document.getElementById('gameIcon').value = '';
        document.getElementById('gameModal').classList.add('active');
    });

    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancelModal').addEventListener('click', closeModal);
    
    document.getElementById('gameModal').addEventListener('click', (e) => {
        if (e.target.id === 'gameModal') closeModal();
    });

    document.getElementById('btnSaveGame').addEventListener('click', saveGame);
}

function closeModal() {
    document.getElementById('gameModal').classList.remove('active');
    
    // Buang container kategori yang temporary
    const catContainer = document.getElementById('categoriesInModal');
    if (catContainer) catContainer.remove();
    
    editingGameId = null;
}
// ==================================================
// SAVE GAME
// ==================================================
function saveGame() {
    const name = document.getElementById('gameName').value.trim();
    const tag = document.getElementById('gameTag').value.trim();
    const img = document.getElementById('gameImg').value.trim();
    const icon = document.getElementById('gameIcon').value.trim() || '🎮';
    
    if (!name || !tag || !img) {
        alert('⚠️ Sila isi Nama, Kategori, dan URL Gambar!');
        return;
    }
    
    if (editingGameId) {
        // Edit game sedia ada
        const game = allGames.find(g => g.id === editingGameId);
        if (game) {
            game.name = name;
            game.tag = tag;
            game.img = img;
            game.icon = icon;
        }
    } else {
        // Tambah game baru
        const newId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        if (allGames.find(g => g.id === newId)) {
            alert('⚠️ Game dengan nama ni dah wujud!');
            return;
        }
        
        allGames.push({
            id: newId,
            name: name,
            tag: tag,
            img: img,
            icon: icon,
            categories: [
                {
                    name: name + ' Malaysia',
                    icon: '🇲🇾',
                    tag: 'Malaysia',
                    diamonds: [
                        { amount: 5, price: 1.50, hot: false },
                        { amount: 12, price: 3.50, hot: true },
                        { amount: 19, price: 5.50, hot: false }
                    ]
                }
            ]
        });
    }
    
    localStorage.setItem('admin_games', JSON.stringify(allGames));
    renderGamesList();
    closeModal();
    alert('✅ Game berjaya disimpan!');
}

// ==================================================
// EDIT GAME
// ==================================================
window.editGame = function(id) {
    const game = allGames.find(g => g.id === id);
    if (!game) return;
    
    editingGameId = id;
    document.getElementById('modalTitle').textContent = 'Edit: ' + game.name;
    document.getElementById('gameName').value = game.name;
    document.getElementById('gameTag').value = game.tag;
    document.getElementById('gameImg').value = game.img;
    document.getElementById('gameIcon').value = game.icon;
    
    // Render senarai kategori dalam modal
    renderCategoryListInModal(game);
    
    document.getElementById('gameModal').classList.add('active');
};

function renderCategoryListInModal(game) {
    // Cari atau buat container untuk kategori
    let catContainer = document.getElementById('categoriesInModal');
    
    if (!catContainer) {
        // Buat container kalau belum ada
        catContainer = document.createElement('div');
        catContainer.id = 'categoriesInModal';
        catContainer.style.marginTop = '20px';
        catContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="font-size: 0.95rem;">Kategori (Server)</h4>
                <button type="button" class="btn-primary" id="btnAddCategoryInModal" style="padding: 6px 14px; font-size: 0.75rem;">
                    <i class="fas fa-plus"></i> Tambah
                </button>
            </div>
            <div id="categoryListContainer"></div>
        `;
        document.querySelector('#gameModal .modal-body').appendChild(catContainer);
        
        // Attach listener untuk butang tambah
        document.getElementById('btnAddCategoryInModal').addEventListener('click', () => {
            addNewCategoryInModal();
        });
    }
    
    // Render senarai kategori
    const listContainer = document.getElementById('categoryListContainer');
    listContainer.innerHTML = '';
    
    if (!game.categories || game.categories.length === 0) {
        listContainer.innerHTML = '<p style="color:#64748b; font-size:0.8rem; padding:10px;">Tiada kategori. Klik "Tambah" untuk mula.</p>';
        return;
    }
    
    game.categories.forEach((cat, index) => {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0b0e14;
            padding: 10px 14px;
            border-radius: 10px;
            margin-bottom: 8px;
            border: 1px solid #2d3748;
        `;
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2rem;">${cat.icon || '🌍'}</span>
                <div>
                    <div style="font-size: 0.85rem; font-weight: 600;">${cat.name}</div>
                    <div style="font-size: 0.7rem; color: #64748b;">${cat.tag} · ${cat.diamonds.length} diamond</div>
                </div>
            </div>
            <div style="display: flex; gap: 6px;">
                <button type="button" onclick="editCategoryFromModal(${index})" style="background:#1e40af; color:white; border:none; width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:0.75rem;">
                    <i class="fas fa-pen"></i>
                </button>
                <button type="button" onclick="deleteCategoryFromModal(${index})" style="background:#7f1d1d; color:white; border:none; width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:0.75rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

// Tambah kategori baru dalam modal
function addNewCategoryInModal() {
    const game = allGames.find(g => g.id === editingGameId);
    if (!game) return;
    
    // Tambah kategori kosong
    const newCat = {
        name: 'Kategori Baru',
        icon: '🌍',
        tag: 'Server Baru',
        diamonds: [
            { amount: 5, price: 1.00, hot: false },
            { amount: 12, price: 2.50, hot: true }
        ]
    };
    
    game.categories.push(newCat);
    localStorage.setItem('admin_games', JSON.stringify(allGames));
    renderCategoryListInModal(game);
    
    // Terus buka modal edit untuk kategori baru
    setTimeout(() => {
        editCategory(editingGameId, newCat.name);
    }, 100);
}

// Edit kategori dari modal
window.editCategoryFromModal = function(index) {
    const game = allGames.find(g => g.id === editingGameId);
    if (!game) return;
    
    const cat = game.categories[index];
    if (!cat) return;
    
    // Tutup modal game dulu
    document.getElementById('gameModal').classList.remove('active');
    
    // Buka modal kategori
    setTimeout(() => {
        editCategory(editingGameId, cat.name);
    }, 200);
};

// Padam kategori dari modal
window.deleteCategoryFromModal = function(index) {
    const game = allGames.find(g => g.id === editingGameId);
    if (!game) return;
    
    const cat = game.categories[index];
    if (!cat) return;
    
    if (!confirm('Padam kategori "' + cat.name + '"?')) return;
    
    game.categories.splice(index, 1);
    localStorage.setItem('admin_games', JSON.stringify(allGames));
    renderCategoryListInModal(game);
};

// ==================================================
// DELETE GAME
// ==================================================
window.deleteGame = function(id) {
    const game = allGames.find(g => g.id === id);
    if (!game) return;
    
    if (!confirm('⚠️ Padam game "' + game.name + '"?\n\nNi tak boleh undo.')) return;
    
    allGames = allGames.filter(g => g.id !== id);
    localStorage.setItem('admin_games', JSON.stringify(allGames));
    renderGamesList();
    alert('✅ Game berjaya dipadam!');
};

// ==================================================
// ORDERS
// ==================================================
let currentOrderFilter = 'all';

function loadOrders() {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Filter ikut status
    if (currentOrderFilter !== 'all') {
        orders = orders.filter(o => (o.status || 'pending') === currentOrderFilter);
    }
    
    const list = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        const messages = {
            'all': 'Tiada pesanan lagi.',
            'pending': 'Tiada pesanan pending.',
            'complete': 'Tiada pesanan complete.',
            'error': 'Tiada pesanan error.'
        };
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <p>${messages[currentOrderFilter]}</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = orders.map((order, i) => {
        const status = order.status || 'pending';
        const statusText = {
            'pending': '⏳ Pending',
            'complete': '✅ Complete',
            'error': '❌ Error'
        }[status];
        
        return `
            <div class="order-item status-${status}">
                <div class="order-header">
                    <span class="order-id">#${order.id || 'ORD-' + (i + 1)}</span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="order-status status-${status}">${statusText}</span>
                        <span class="order-date">${order.date || 'N/A'}</span>
                    </div>
                </div>
                <div class="order-body">
                    <div><span>Game:</span> <strong>${order.game}</strong></div>
                    <div><span>Kategori:</span> <strong>${order.category}</strong></div>
                    <div><span>User ID:</span> <strong>${order.userId}</strong></div>
                    <div><span>Diamond:</span> <strong>${order.diamond} 💎</strong></div>
                    <div><span>Total:</span> <strong>RM ${order.total.toFixed(2)}</strong></div>
                    <div><span>Email:</span> <strong>${order.email}</strong></div>
                    <div><span>WhatsApp:</span> <strong>${order.whatsapp}</strong></div>
                    <div><span>Payment:</span> <strong>${order.payment}</strong></div>
                </div>
                <div class="order-actions">
                    <button class="btn-order-action btn-complete" onclick="updateOrderStatus('${order.id}', 'complete')">
                        <i class="fas fa-check"></i> Complete
                    </button>
                    <button class="btn-order-action btn-error" onclick="updateOrderStatus('${order.id}', 'error')">
                        <i class="fas fa-times"></i> Error
                    </button>
                    <button class="btn-order-action btn-delete-order" onclick="deleteOrder('${order.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/* ==================================================
   UPDATE ORDER STATUS
   ================================================== */
window.updateOrderStatus = function(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    order.status = newStatus;
    localStorage.setItem('orders', JSON.stringify(orders));
    
    const statusLabels = {
        'pending': 'Pending',
        'complete': 'Complete',
        'error': 'Error'
    };
    
    console.log('📝 Order', orderId, 'ditukar ke:', statusLabels[newStatus]);
    loadOrders();
};

/* ==================================================
   DELETE ORDER
   ================================================== */
window.deleteOrder = function(orderId) {
    if (!confirm('⚠️ Padam order ' + orderId + '?\n\nTak boleh undo.')) return;
    
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    console.log('🗑️ Order dipadam:', orderId);
    loadOrders();
};

/* ==================================================
   FILTER BUTTONS
   ================================================== */
function initOrderFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrderFilter = btn.dataset.filter;
            loadOrders();
        });
    });
}

// ==================================================
// CLEAR ORDERS
// ==================================================
document.getElementById('btnClearOrders').addEventListener('click', () => {
    if (!confirm('⚠️ Padam SEMUA pesanan? Tak boleh undo.')) return;
    if (!confirm('Confirm sekali lagi — pasti nak padam SEMUA?')) return;
    localStorage.removeItem('orders');
    loadOrders();
    alert('✅ Semua pesanan telah dipadam.');
});

// ==================================================
// SETTINGS
// ==================================================
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    document.getElementById('settingStoreName').value = settings.storeName || 'Senzith Store';
    document.getElementById('settingWhatsApp').value = settings.whatsapp || '60123456789';
    document.getElementById('settingEmail').value = settings.email || '';
}

document.getElementById('btnSaveSettings').addEventListener('click', () => {
    const settings = {
        storeName: document.getElementById('settingStoreName').value.trim(),
        whatsapp: document.getElementById('settingWhatsApp').value.trim(),
        email: document.getElementById('settingEmail').value.trim()
    };
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    alert('✅ Settings berjaya disimpan!');
});

// ==================================================
// INIT BUTTONS
// ==================================================
function initButtons() {
    // Dah handle dalam initModals()
}/* ==================================================
   CATEGORY EDITOR
   ================================================== */
let editingCategoryData = null; // { gameId, originalName }

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
    editingCategoryData = null;
}

window.editCategory = function(gameId, categoryName) {
    const game = allGames.find(g => g.id === gameId);
    if (!game) return;
    
    const cat = game.categories.find(c => c.name === categoryName);
    if (!cat) return;
    
    editingCategoryData = { gameId, originalName: categoryName };
    
    document.getElementById('categoryModalTitle').textContent = 'Edit: ' + cat.name;
    document.getElementById('categoryName').value = cat.name;
    document.getElementById('categoryIcon').value = cat.icon;
    document.getElementById('categoryTag').value = cat.tag;
    
    // Render diamond rows
    const editor = document.getElementById('diamondEditor');
    editor.innerHTML = '';
    cat.diamonds.forEach(d => addDiamondRow(d));
    
    document.getElementById('categoryModal').classList.add('active');
};

function addDiamondRow(d) {
    const editor = document.getElementById('diamondEditor');
    const row = document.createElement('div');
    row.className = 'diamond-row';
    row.innerHTML = `
        <input type="number" placeholder="Amount (💎)" value="${d.amount || 0}" class="d-amount">
        <input type="number" step="0.01" placeholder="Price (RM)" value="${d.price || 0}" class="d-price">
        <label class="hot-checkbox">
            <input type="checkbox" class="d-hot" ${d.hot ? 'checked' : ''}> HOT
        </label>
        <button class="btn-remove-diamond" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    editor.appendChild(row);
}

function saveCategory() {
    if (!editingCategoryData) return;
    
    const game = allGames.find(g => g.id === editingCategoryData.gameId);
    if (!game) return;
    
    const cat = game.categories.find(c => c.name === editingCategoryData.originalName);
    if (!cat) return;
    
    // Update category info
    const newName = document.getElementById('categoryName').value.trim();
    const newIcon = document.getElementById('categoryIcon').value.trim() || '🌍';
    const newTag = document.getElementById('categoryTag').value.trim();
    
    if (!newName || !newTag) {
        alert('⚠️ Sila isi Nama Kategori dan Tag!');
        return;
    }
    
    // Kumpul diamonds dari editor
    const diamonds = [];
    document.querySelectorAll('.diamond-row').forEach(row => {
        const amount = parseInt(row.querySelector('.d-amount').value);
        const price = parseFloat(row.querySelector('.d-price').value);
        const hot = row.querySelector('.d-hot').checked;
        
        if (amount > 0 && price > 0) {
            diamonds.push({ amount, price, hot });
        }
    });
    
    if (diamonds.length === 0) {
        alert('⚠️ Kena ada sekurang-kurangnya 1 pakej diamond!');
        return;
    }
    
    // Update
    cat.name = newName;
    cat.icon = newIcon;
    cat.tag = newTag;
    cat.diamonds = diamonds;
    
    // Save
    localStorage.setItem('admin_games', JSON.stringify(allGames));
    renderGamesList();
    closeCategoryModal();
    alert('✅ Kategori berjaya disimpan!');
}

/* ==================================================
   EXPORT JSON
   ================================================== */
window.exportJSON = function() {
    console.log('📤 Export JSON dimulakan...');
    
    if (!allGames || allGames.length === 0) {
        alert('⚠️ Tiada game untuk export!');
        return;
    }
    
    // 1. Download index games.json (dulu)
    const indexData = {
        games: allGames.map(g => ({ id: g.id, file: 'games/' + g.id + '.json' }))
    };
    downloadJSON(indexData, 'games.json');
    
    // 2. Download setiap game file dengan DELAY 500ms
    allGames.forEach((game, i) => {
        setTimeout(() => {
            downloadJSON(game, game.id + '.json');
        }, (i + 1) * 400);
    });
    
    // 3. Alert bila semua siap
    const totalDelay = (allGames.length + 1) * 400 + 500;
    setTimeout(() => {
        alert('✅ Export selesai!\n\n' + (allGames.length + 1) + ' file telah dimuat turun.');
    }, totalDelay);
}
function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Downloaded:', filename);
}
/* ==================================================
   BANNERS MANAGEMENT
   ================================================== */
let allBanners = [];
let currentBannerImage = null;

function loadBanners() {
    allBanners = JSON.parse(localStorage.getItem('banners') || '[]');
    renderBannersList();
}

function renderBannersList() {
    const list = document.getElementById('bannersList');
    if (!list) return;
    
    if (allBanners.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-image"></i>
                <p>Tiada banner lagi. Klik "Tambah Banner" untuk mula.</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = allBanners.map((banner, i) => `
        <div class="banner-item">
            <img src="${banner.image}" alt="${banner.title || 'Banner'}">
            <div class="banner-item-info">
                <h4>${banner.title || 'Banner ' + (i + 1)}</h4>
                <div class="banner-item-actions">
                    <button class="btn-banner-delete" onclick="deleteBanner(${i})">
                        <i class="fas fa-trash"></i> Padam
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function initBannerModal() {
    const modal = document.getElementById('bannerModal');
    const addBtn = document.getElementById('btnAddBanner');
    const closeBtn = document.getElementById('btnCloseBannerModal');
    const cancelBtn = document.getElementById('btnCancelBannerModal');
    const saveBtn = document.getElementById('btnSaveBanner');
    const fileInput = document.getElementById('bannerFile');
    
    if (!modal) return;
    
    addBtn.addEventListener('click', () => {
        currentBannerImage = null;
        fileInput.value = '';
        document.getElementById('bannerTitle').value = '';
        document.getElementById('bannerPreview').innerHTML = 'Belum ada gambar';
        modal.classList.add('active');
    });
    
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'bannerModal') modal.classList.remove('active');
    });
    
    // Preview gambar
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            currentBannerImage = event.target.result;
            document.getElementById('bannerPreview').innerHTML = 
                `<img src="${currentBannerImage}" style="width:100%; height:100%; object-fit:cover;">`;
        };
        reader.readAsDataURL(file);
    });
    
    // Save
    saveBtn.addEventListener('click', () => {
        if (!currentBannerImage) {
            alert('⚠️ Sila upload gambar dahulu!');
            return;
        }
        
        const title = document.getElementById('bannerTitle').value.trim();
        
        allBanners.push({
            image: currentBannerImage,
            title: title,
            date: new Date().toLocaleString('ms-MY')
        });
        
        localStorage.setItem('banners', JSON.stringify(allBanners));
        renderBannersList();
        modal.classList.remove('active');
        alert('✅ Banner berjaya ditambah!');
    });
}

window.deleteBanner = function(index) {
    if (!confirm('Padam banner ini?')) return;
    allBanners.splice(index, 1);
    localStorage.setItem('banners', JSON.stringify(allBanners));
    renderBannersList();
};

// Panggil masa page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadBanners();
        initBannerModal();
    }, 100);
});