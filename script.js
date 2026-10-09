/* ==================================================
   STATE GLOBAL
   ================================================== */
let gamesData = [];
let diamondsData = [];
let selectedGame = null;
let selectedDiamond = 12;
let selectedPrice = 35000;
let selectedFee = 0;
let selectedCategory = null;
/* ==================================================
   SETTINGS - NOMBOR WHATSAPP ANDA
   ================================================== */
const ADMIN_WHATSAPP = '601112565823';  // ⚠️ TUKAR KE NOMBOR ANDA!
// Format: 60 + nombor (tanpa + atau 0)
// Contoh Malaysia: 60123456789
// Contoh Indonesia: 628123456789

/* ==================================================
   LOAD DATA DARI games.json
   ================================================== */
async function loadData() {
    try {
        // 1. Load index games (senarai game je)
        const indexResponse = await fetch('data/games.json');
        if (!indexResponse.ok) throw new Error('data/games.json tak jumpa!');
        
        const indexData = await indexResponse.json();
        console.log('📂 Index games:', indexData);
        
        // 2. Load setiap game file
        const gamePromises = indexData.games.map(g => {
            console.log('📥 Loading:', 'data/' + g.file);
            return fetch('data/' + g.file)
                .then(r => {
                    if (!r.ok) throw new Error('File tak jumpa: ' + g.file);
                    return r.json();
                });
        });
        
        gamesData = await Promise.all(gamePromises);
        
        console.log('✅ Berjaya load', gamesData.length, 'game');
        console.log('📊 Data games:', gamesData);
        
        renderGames();
        
    } catch (error) {
        console.error('❌ Error load data:', error);
        document.getElementById('gameGrid').innerHTML = 
            '<p style="color:#ef4444; padding:20px;">Gagal load data: ' + error.message + '</p>';
    }
}

/* ==================================================
   RENDER GAME GRID (PAGE 1)
   ================================================== */
function renderGames() {
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = '';

    gamesData.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <img src="${game.img}" 
                 alt="${game.name}" 
                 class="game-img-real"
                 onerror="this.src='https://placehold.co/300x220/1e293b/64748b?text=${encodeURIComponent(game.name)}'">
            <div class="game-name">${game.name}</div>
            <div class="game-tag">${game.tag}</div>
        `;
        card.addEventListener('click', () => selectGame(game, card));
        grid.appendChild(card);
    });
}

/* ==================================================
   SELECT GAME
   ================================================== */
function selectGame(game, cardElement) {
    // Reset semua card
    document.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected'));
    
    // Highlight yang dipilih
    cardElement.classList.add('selected');
    
    // Simpan state
    selectedGame = game;
    
    // Enable next button (walaupun tak guna dah)
    document.getElementById('btnNext1').disabled = false;
    
    console.log('🎮 Game dipilih:', game.name);
    
    // ⭐ AUTO PERGI PAGE 2 SELEPAS 300ms (untuk user nampak highlight)
    setTimeout(() => {
        renderCategories(game);
        document.getElementById('page2Subtitle').textContent =
            'Sila pilih server untuk ' + game.name;
        goToPage(2);
    }, 300);
}

/* ==================================================
   INIT - JALAN BILA PAGE LOAD
   ================================================== */
loadData();
/* ==================================================
   RENDER KATEGORI (PAGE 2)
   ================================================== */
function renderCategories(game) {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = '';
    selectedCategory = null;

    if (!game.categories || game.categories.length === 0) {
        grid.innerHTML = '<p style="color:#8b9bb4;">Tiada kategori.</p>';
        return;
    }

    game.categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="cat-icon">${cat.icon}</div>
            <div class="cat-info">
                <h4>${cat.name}</h4>
                <p>${cat.tag}</p>
            </div>
        `;

        // Event listener DI DALAM forEach
        card.addEventListener('click', () => {
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedCategory = cat;

            // Auto pergi Page 3 selepas 300ms
            setTimeout(() => {
                document.getElementById('checkoutGameName').textContent = selectedGame.name;
                document.getElementById('checkoutCategoryName').textContent = cat.name;
                document.getElementById('checkoutGameIcon').textContent = selectedGame.icon;
                document.getElementById('page3Subtitle').textContent =
                    'Isi data untuk ' + selectedGame.name + ' - ' + cat.name;

                renderDiamonds();
                renderPayments();
                goToPage(3);
            }, 300);
        });

        grid.appendChild(card);
    });
}

/* ==================================================
   NAVIGASI PAGE
   ================================================== */
function goToPage(pageNum) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page' + pageNum).classList.add('active');

    for (let i = 1; i <= 4; i++) {
        const circle = document.getElementById('step' + i + 'Circle');
        const label = document.getElementById('step' + i + 'Label');
        if (!circle) continue;
        
        circle.classList.remove('active', 'done');
        label.classList.remove('active');

        if (i < pageNum) circle.classList.add('done');
        else if (i === pageNum) {
            circle.classList.add('active');
            label.classList.add('active');
        }
    }

    for (let i = 1; i <= 3; i++) {
        const line = document.getElementById('line' + i);
        if (!line) continue;
        line.classList.remove('done');
        if (i < pageNum) line.classList.add('done');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
/* ==================================================
   EVENT LISTENERS
   ================================================== */
document.getElementById('btnNext1').addEventListener('click', () => {
    if (!selectedGame) return;
    renderCategories(selectedGame);
    document.getElementById('page2Subtitle').textContent =
        'Sila pilih server untuk ' + selectedGame.name;
    goToPage(2);
});

document.getElementById('btnBack2').addEventListener('click', () => {
    goToPage(1);
});
/* ==================================================
   RENDER DIAMONDS (PAGE 3)
   ================================================== */
function renderDiamonds() {
    const grid = document.getElementById('diamondGrid');
    if (!grid) return;

    grid.innerHTML = '';

    // DEBUG: check console
    console.log('🎯 selectedCategory:', selectedCategory);

    // Check kalau tak ada kategori atau diamonds
    if (!selectedCategory || !selectedCategory.diamonds || selectedCategory.diamonds.length === 0) {
        grid.innerHTML = '<p style="color:#ef4444; padding:10px;">Tiada pakej diamond untuk kategori ini.</p>';
        console.warn('⚠️ selectedCategory.diamonds tak wujud!');
        return;
    }

    const diamonds = selectedCategory.diamonds;
    const defaultIndex = 1; // default pilih yang ke-2 (biasanya HOT)

    selectedDiamond = diamonds[defaultIndex].amount;
    selectedPrice = diamonds[defaultIndex].price;

    diamonds.forEach((d, index) => {
        const item = document.createElement('div');
        item.className = 'diamond-item' + (index === defaultIndex ? ' selected' : '');
        
        let html = '';
        if (d.hot) html += '<div class="hot-badge">HOT</div>';
        html += '<div class="amount">' + d.amount + ' 💎</div>';
        html += '<div class="price">RM ' + d.price.toFixed(2) + '</div>';
        item.innerHTML = html;
        
        item.addEventListener('click', () => {
            document.querySelectorAll('.diamond-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedDiamond = d.amount;
            selectedPrice = d.price;
            updateSummary();
        });
        grid.appendChild(item);
    });

    console.log('✅ Diamond rendered:', diamonds.length, 'items');
    updateSummary();
}

/* ==================================================
   RENDER PAYMENTS
   ================================================== */
function renderPayments() {
    document.querySelectorAll('.payment-item').forEach(item => {
        // Skip payment yang disabled (maintenance)
        if (item.classList.contains('disabled')) {
            return;
        }
        
        item.addEventListener('click', () => {
            document.querySelectorAll('.payment-item').forEach(i => {
                i.classList.remove('selected');
                const check = i.querySelector('.fa-check-circle');
                if (check) check.style.display = 'none';
            });
            item.classList.add('selected');
            const check = item.querySelector('.fa-check-circle');
            if (check) check.style.display = 'block';
            selectedFee = parseInt(item.dataset.fee) || 0;
            updateSummary();
        });
    });
}
/* ==================================================
   UPDATE SUMMARY
   ================================================== */
function updateSummary() {
    const summaryDiamond = document.getElementById('summaryDiamond');
    const summaryFee = document.getElementById('summaryFee');
    const summaryPrice = document.getElementById('summaryPrice');

    if (!summaryDiamond) return;

    summaryDiamond.textContent = selectedDiamond + ' Diamonds';
    summaryFee.textContent = 'RM ' + selectedFee.toLocaleString('id-ID');
    summaryPrice.textContent = 'RM ' + (selectedPrice + selectedFee).toLocaleString('id-ID');
}

/* ==================================================
   NEXT PAGE 2 → PAGE 3 (CHECKOUT)
   ================================================== */
document.getElementById('btnNext2').addEventListener('click', () => {
    if (!selectedCategory) return;

    document.getElementById('checkoutGameName').textContent = selectedGame.name;
    document.getElementById('checkoutCategoryName').textContent = selectedCategory.name;
    document.getElementById('checkoutGameIcon').textContent = selectedGame.icon;
    document.getElementById('page3Subtitle').textContent =
        'Isi data untuk ' + selectedGame.name + ' - ' + selectedCategory.name;

    renderDiamonds();
    renderPayments();
    goToPage(3);
});

/* ==================================================
   BACK PAGE 3 → PAGE 2
   ================================================== */
document.getElementById('btnBack3')?.addEventListener('click', () => {
    goToPage(2);
});
/* ==================================================
   PURCHASE BUTTON (PAGE 3 → PAGE 4)
   ================================================== */
document.getElementById('purchaseBtn').addEventListener('click', () => {
    const userId = document.getElementById('inputUserId').value.trim();
    const serverId = document.getElementById('inputServerId').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    const whatsapp = document.getElementById('inputWhatsapp').value.trim();

    // Validate
    if (!userId || !serverId) {
        alert('⚠️ Sila isi User ID dan Server ID terlebih dahulu!');
        return;
    }

    if (!email || !whatsapp) {
        alert('⚠️ Sila isi Email dan No. WhatsApp!');
        return;
    }

    // Kira total
    const total = selectedPrice + selectedFee;

    // Cari payment method yang dipilih
    const selectedPayment = document.querySelector('.payment-item.selected');
    const paymentMethod = selectedPayment ? selectedPayment.dataset.method : 'QRIS';

    // Bina mesej WhatsApp guna array (TAK PAYAH BACKTICK!)
    const lines = [
        '🎮 *PESANAN BARU - SENZITH STORE*',
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        '📋 *DETAIL ORDER*',
        '━━━━━━━━━━━━━━━━━━━━',
        '🎯 Game: ' + selectedGame.name,
        '🌐 Kategori: ' + selectedCategory.name,
        '👤 User ID: ' + userId,
        '🔢 Server ID: ' + serverId,
        '💎 Diamond: ' + selectedDiamond + ' Diamonds',
        '💰 Harga: RM ' + selectedPrice.toLocaleString('id-ID'),
        '💳 Biaya Admin: RM ' + selectedFee.toLocaleString('id-ID'),
        '💵 *Total Bayar: RM ' + total.toLocaleString('id-ID') + '*',
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        '💳 *PAYMENT METHOD*',
        '━━━━━━━━━━━━━━━━━━━━',
        paymentMethod,
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        '📞 *CONTACT*',
        '━━━━━━━━━━━━━━━━━━━━',
        '📧 Email: ' + email,
        '📱 WhatsApp: ' + whatsapp,
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        'Mohon diproses ya. Terima kasih! 🙏'
    ];
    const message = lines.join('\n');

    // Encode untuk URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = 'https://wa.me/' + ADMIN_WHATSAPP + '?text=' + encodedMessage;

    // Bina receipt HTML (guna array + string concatenation)
    const receiptHTML = [
        '<div class="receipt-row"><span class="label">Game</span><span class="value">' + selectedGame.name + '</span></div>',
        '<div class="receipt-row"><span class="label">Kategori</span><span class="value">' + selectedCategory.name + '</span></div>',
        '<div class="receipt-row"><span class="label">User ID</span><span class="value">' + userId + ' (' + serverId + ')</span></div>',
        '<div class="receipt-row"><span class="label">Diamond</span><span class="value">' + selectedDiamond + ' 💎</span></div>',
        '<div class="receipt-row"><span class="label">Harga Diamond</span><span class="value">RM ' + selectedPrice.toLocaleString('id-ID') + '</span></div>',
        '<div class="receipt-row"><span class="label">Biaya Admin</span><span class="value">RM ' + selectedFee.toLocaleString('id-ID') + '</span></div>',
        '<div class="receipt-row"><span class="label">Payment</span><span class="value">' + paymentMethod + '</span></div>',
        '<div class="receipt-row" style="border-top: 2px solid #3b82f6; margin-top: 8px; padding-top: 12px;">',
        '<span class="label"><strong>Total Bayar</strong></span>',
        '<span class="value" style="color:#3b82f6; font-size: 1.1rem;"><strong>RM ' + total.toLocaleString('id-ID') + '</strong></span>',
        '</div>',
        '<div class="receipt-row"><span class="label">Email</span><span class="value">' + email + '</span></div>',
        '<div class="receipt-row"><span class="label">WhatsApp</span><span class="value">' + whatsapp + '</span></div>'
    ].join('');

    document.getElementById('receiptBox').innerHTML = receiptHTML;

    // Buka WhatsApp
        // Simpan order untuk admin panel
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.unshift({
        id: 'ORD-' + Date.now(),
        date: new Date().toLocaleString('ms-MY'),
        status: 'pending',
        game: selectedGame.name,
        category: selectedCategory.name,
        userId: userId,
        serverId: serverId,
        diamond: selectedDiamond,
        price: selectedPrice,
        total: total,
        email: email,
        whatsapp: whatsapp,
        payment: paymentMethod
    });
    localStorage.setItem('orders', JSON.stringify(orders));
    console.log('📦 Order disimpan:', orders[0]);

    window.open(whatsappURL, '_blank');

    // Pergi Page 4
    goToPage(4);
});

/* ==================================================
   NEW ORDER BUTTON (PAGE 4 → PAGE 1)
   ================================================== */
document.getElementById('btnNewOrder').addEventListener('click', () => {
    // Reset semua state
    selectedGame = null;
    selectedCategory = null;
    selectedDiamond = 12;
    selectedPrice = 35000;
    selectedFee = 0;

    // Reset game cards
    document.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('btnNext1').disabled = true;

    // Reset form inputs
    document.getElementById('inputUserId').value = '';
    document.getElementById('inputServerId').value = '';
    document.getElementById('inputEmail').value = '';
    document.getElementById('inputWhatsapp').value = '';

    // Balik ke Page 1
    goToPage(1);
});
/* ==================================================
   LOGO CLICK - BALIK KE PAGE 1
   ================================================== */
const logoHomeBtn = document.getElementById('logoHome');

if (logoHomeBtn) {
    logoHomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        console.log('🏠 Logo diklik!');
        
        // Reset state
        selectedGame = null;
        selectedCategory = null;
        selectedDiamond = 12;
        selectedPrice = 35000;
        selectedFee = 0;
        
        // Reset game cards
        document.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected'));
        
        // Reset form inputs
        ['inputUserId', 'inputServerId', 'inputEmail', 'inputWhatsapp'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        
        // Balik Page 1
        goToPage(1);
    });
    
    console.log('✅ Logo listener OK');
} else {
    console.warn('⚠️ #logoHome tak jumpa!');
}
/* ==================================================
   BANNER CAROUSEL
   ================================================== */
let banners = [];
let currentBannerIndex = 0;
let bannerInterval = null;

function loadBanners() {
    const saved = localStorage.getItem('banners');
    banners = saved ? JSON.parse(saved) : [];
    renderBanner();
    startAutoSwipe();
}

function renderBanner() {
    const track = document.getElementById('bannerTrack');
    const dots = document.getElementById('bannerDots');
    
    if (!track) return;
    
    if (banners.length === 0) {
        track.innerHTML = `
            <div class="banner-slide">
                <div class="banner-empty">
                    <i class="fas fa-image"></i>
                    <span>Tiada banner</span>
                </div>
            </div>
        `;
        dots.innerHTML = '';
        return;
    }
    
    // Render slides
    track.innerHTML = banners.map(banner => `
        <div class="banner-slide">
            <img src="${banner.image}" alt="${banner.title || 'Banner'}">
        </div>
    `).join('');
    
    // Render dots
    dots.innerHTML = banners.map((_, i) => `
        <div class="banner-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
    `).join('');
    
    // Dot click
    document.querySelectorAll('.banner-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            goToBanner(index);
        });
    });
    
    // Reset index
    currentBannerIndex = 0;
    updateBannerPosition();
}

function goToBanner(index) {
    currentBannerIndex = index;
    updateBannerPosition();
    resetAutoSwipe();
}

function updateBannerPosition() {
    const track = document.getElementById('bannerTrack');
    if (!track) return;
    
    track.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
    
    // Update dots
    document.querySelectorAll('.banner-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentBannerIndex);
    });
}

function nextBanner() {
    if (banners.length === 0) return;
    currentBannerIndex = (currentBannerIndex + 1) % banners.length;
    updateBannerPosition();
}

function prevBanner() {
    if (banners.length === 0) return;
    currentBannerIndex = (currentBannerIndex - 1 + banners.length) % banners.length;
    updateBannerPosition();
}

function startAutoSwipe() {
    if (bannerInterval) clearInterval(bannerInterval);
    if (banners.length <= 1) return;
    
    bannerInterval = setInterval(nextBanner, 4000); // 4 saat
}

function resetAutoSwipe() {
    if (bannerInterval) clearInterval(bannerInterval);
    startAutoSwipe();
}

// Event listeners untuk nav buttons
document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('bannerPrev');
    const nextBtn = document.getElementById('bannerNext');
    
    if (prevBtn) prevBtn.addEventListener('click', () => { prevBanner(); resetAutoSwipe(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextBanner(); resetAutoSwipe(); });
    
    loadBanners();
});