// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- PENGATURAN GAME ---
    const ROWS = 5;
    const COLS = 6;
    const SYMBOLS = [
        { icon: "💎", payout: 5 }, // Blue Gem
        { icon: "🟢", payout: 8 }, // Green Gem
        { icon: "🟡", payout: 10 }, // Yellow Gem
        { icon: "🟣", payout: 12 }, // Purple Gem
        { icon: "🔴", payout: 15 }, // Red Gem
        { icon: "👑", payout: 50 }  // Crown
    ];
    const MIN_WIN_COUNT = 8;
    const MULTIPLIERS = [2, 3, 4, 5, 8, 10, 15, 20, 50, 100];
    const MULTIPLIER_CHANCE = 0.25; // 25% chance for a multiplier to appear

    // --- STATE GAME ---
    let balance = 1000;
    let betAmount = 10;
    let isSpinning = false;
    let isAutoSpinning = false;
    let autoSpinInterval;

    // --- Referensi Elemen DOM ---
    const grid = document.getElementById('slot-grid');
    const spinButton = document.getElementById('spin-button');
    const balanceAmountEl = document.getElementById('balance-amount');
    const betAmountEl = document.getElementById('bet-amount');
    const totalWinEl = document.getElementById('total-win');
    const multiplierDisplay = document.getElementById('multiplier-display');
    const autoSpinToggle = document.getElementById('auto-spin-toggle');

    // --- FUNGSI INTI GAME ---

    function updateDisplay() {
        balanceAmountEl.textContent = balance;
        betAmountEl.textContent = betAmount;
    }

    function getRandomSymbol() {
        return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function spin() {
        if (isSpinning || balance < betAmount) {
            if (balance < betAmount) {
                stopAutoSpin();
                alert("Saldo tidak cukup!");
            }
            return;
        }
        
        isSpinning = true;
        spinButton.disabled = true;
        balance -= betAmount;
        totalWinEl.textContent = "0";
        updateDisplay();

        // Reset grid
        const cells = Array.from(grid.children);
        for (const cell of cells) {
            cell.textContent = getRandomSymbol().icon;
            cell.classList.remove('win-animation');
        }

        await sleep(200);
        await checkForWinsAndTumble(0); // Start with 0 initial win

        isSpinning = false;
        spinButton.disabled = false;
        
        if (balance < betAmount) {
            stopAutoSpin();
        }
    }

    async function checkForWinsAndTumble(currentSpinWin) {
        const cells = Array.from(grid.children);
        const symbolCounts = {};
        
        cells.forEach(cell => {
            const symbol = cell.textContent;
            symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
        });

        const winningSymbolsData = [];
        for (const symbol of Object.keys(symbolCounts)) {
            if (symbolCounts[symbol] >= MIN_WIN_COUNT) {
                const symbolConfig = SYMBOLS.find(s => s.icon === symbol);
                if (symbolConfig) {
                    winningSymbolsData.push({ icon: symbol, payout: symbolConfig.payout, count: symbolCounts[symbol] });
                }
            }
        }

        if (winningSymbolsData.length > 0) {
            let winThisTumble = 0;
            winningSymbolsData.forEach(win => {
                winThisTumble += win.payout * (win.count / MIN_WIN_COUNT);
            });
            
            currentSpinWin += winThisTumble;

            // Animasikan kemenangan
            const winningIcons = winningSymbolsData.map(w => w.icon);
            cells.forEach(cell => {
                if (winningIcons.includes(cell.textContent)) {
                    cell.classList.add('win-animation');
                }
            });

            await sleep(1500);
            cells.forEach(cell => cell.classList.remove('win-animation'));
            
            await applyTumble(winningIcons);
            
            // Lanjutkan rekursi dengan total kemenangan saat ini
            await checkForWinsAndTumble(currentSpinWin);
        } else {
            // Tumble selesai, hitung total kemenangan
            if (currentSpinWin > 0) {
                let finalWin = Math.floor(currentSpinWin);
                
                // Cek multiplier
                if (Math.random() < MULTIPLIER_CHANCE) {
                    const multiplier = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
                    multiplierDisplay.textContent = `x${multiplier}`;
                    multiplierDisplay.classList.add('visible');
                    finalWin *= multiplier;
                    await sleep(1500);
                    multiplierDisplay.classList.remove('visible');
                }

                balance += finalWin;
                totalWinEl.textContent = finalWin;
                updateDisplay();
            }
        }
    }

    async function applyTumble(winningIcons) {
        // Logika Tumble (sama seperti sebelumnya, tapi diadaptasi)
        const cells = Array.from(grid.children);
        
        cells.forEach(cell => {
            if (winningIcons.includes(cell.textContent)) {
                cell.textContent = '';
            }
        });

        for (let c = 0; c < COLS; c++) {
            let emptySlots = 0;
            for (let r = ROWS - 1; r >= 0; r--) {
                const index = r * COLS + c;
                if (cells[index].textContent === '') {
                    emptySlots++;
                } else if (emptySlots > 0) {
                    cells[index + emptySlots * COLS].textContent = cells[index].textContent;
                    cells[index].textContent = '';
                }
            }
            for (let i = 0; i < emptySlots; i++) {
                const cell = cells[i * COLS + c];
                cell.textContent = getRandomSymbol().icon;
                cell.classList.add('fall-animation');
            }
        }
        
        await sleep(500);
        cells.forEach(cell => cell.classList.remove('fall-animation'));
    }

    function startAutoSpin() {
        isAutoSpinning = true;
        autoSpinToggle.checked = true;
        spin(); // Mulai langsung
        autoSpinInterval = setInterval(spin, 3000); // Spin setiap 3 detik
    }

    function stopAutoSpin() {
        isAutoSpinning = false;
        autoSpinToggle.checked = false;
        clearInterval(autoSpinInterval);
    }

    function toggleAutoSpin() {
        if (autoSpinToggle.checked && !isAutoSpinning) {
            startAutoSpin();
        } else {
            stopAutoSpin();
        }
    }

    // --- Inisialisasi Game ---
    function initialize() {
        for (let i = 0; i < ROWS * COLS; i++) {
            const cell = document.createElement('div');
            cell.classList.add('slot-cell');
            cell.textContent = getRandomSymbol().icon;
            grid.appendChild(cell);
        }
        updateDisplay();
        spinButton.addEventListener('click', spin);
        autoSpinToggle.addEventListener('change', toggleAutoSpin);
    }

    initialize();
});
