let stocks = JSON.parse(localStorage.getItem('idx_stocks')) || [];
let currentFilter = 'ALL';
let myChart = null; // Variable global untuk menyimpan instance chart

// Initialize Date
document.getElementById('current-date').innerText = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

const stockForm = document.getElementById('stock-form');
stockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newStock = {
        id: Date.now(),
        code: document.getElementById('code').value.toUpperCase(),
        buyDate: document.getElementById('buyDate').value,
        buyPrice: parseFloat(document.getElementById('buyPrice').value),
        lot: parseInt(document.getElementById('lot').value),
        sellPrice: parseFloat(document.getElementById('sellPrice').value) || null,
        status: document.getElementById('sellPrice').value ? 'SOLD' : 'HOLD'
    };

    stocks.push(newStock);
    saveData();
    renderAll();
    stockForm.reset();
});

function saveData() {
    localStorage.setItem('idx_stocks', JSON.stringify(stocks));
}

function deleteStock(id) {
    stocks = stocks.filter(s => s.id !== id);
    saveData();
    renderAll();
}

function filterStocks(type) {
    currentFilter = type;
    renderAll();
}

// Search functionality
document.getElementById('search').addEventListener('input', (e) => {
    renderAll(e.target.value.toUpperCase());
});

function calculatePL(stock) {
    const totalBuy = stock.buyPrice * stock.lot * 100;
    if (stock.status === 'SOLD' && stock.sellPrice) {
        const totalSell = stock.sellPrice * stock.lot * 100;
        return totalSell - totalBuy;
    }
    return 0; 
}

function formatIDR(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
}

// FUNGSI UNTUK MERENDER CHART
function renderChart(invested, pl) {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    
    if (myChart) {
        myChart.destroy();
    }

    // Jika tidak ada data, tampilkan chart kosong agar tidak error
    const chartData = (invested === 0 && pl === 0) ? [1, 0] : [invested, Math.abs(pl)];
    const chartColors = (invested === 0 && pl === 0) ? ['#1e293b', '#334155'] : ['#334155', pl >= 0 ? '#10b981' : '#f43f5e'];

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Modal', 'Profit/Loss'],
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            },
            cutout: '75%'
        }
    });
}

function renderAll(searchKeyword = '') {
    const list = document.getElementById('stock-list');
    list.innerHTML = '';

    let filtered = stocks;
    if (currentFilter !== 'ALL') filtered = stocks.filter(s => s.status === currentFilter);
    if (searchKeyword) filtered = filtered.filter(s => s.code.includes(searchKeyword));

    let totalInvested = 0;
    let totalPL = 0;
    let holdCount = 0;

    filtered.forEach(stock => {
        const pl = calculatePL(stock);
        totalInvested += (stock.buyPrice * stock.lot * 100);
        totalPL += pl;
        if (stock.status === 'HOLD') holdCount++;

        const plClass = pl > 0 ? 'text-emerald-400' : (pl < 0 ? 'text-red-400' : 'text-slate-400');
        const statusClass = stock.status === 'HOLD' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400';

        list.innerHTML += `
            <tr class="border-b border-slate-700/50">
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-200">${stock.code}</div>
                    <div class="text-[10px] text-slate-500">${stock.buyDate}</div>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="text-xs">B: ${formatIDR(stock.buyPrice)}</div>
                    <div class="text-xs text-slate-500">${stock.sellPrice ? 'S: ' + formatIDR(stock.sellPrice) : '-'}</div>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold ${statusClass}">${stock.status}</span>
                </td>
                <td class="px-6 py-4 text-right font-mono ${plClass}">
                    ${pl !== 0 ? (pl > 0 ? '+' : '') + formatIDR(pl) : 'Rp 0'}
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="deleteStock(${stock.id})" class="text-slate-500 hover:text-red-500 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    // Update Dashboard Stats
    document.getElementById('total-invest').innerText = formatIDR(totalInvested);
    document.getElementById('total-pl').innerText = formatIDR(totalPL);
    document.getElementById('total-pl').className = `text-2xl font-bold ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
    document.getElementById('hold-count').innerText = holdCount;
    document.getElementById('total-trx').innerText = stocks.length;
    
    // PANGGIL CHART DISINI
    renderChart(totalInvested, totalPL);
    
    lucide.createIcons();
}

// Initial Run
renderAll();