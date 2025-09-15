// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- PENGATURAN GAME ---
    const ROWS = 5;
    const COLS = 6;
    const SYMBOLS = ["💎", "🟢", "🟡", "🟣", "🔴", "👑"];
    const MIN_WIN_COUNT = 8;

    // --- Referensi Elemen DOM ---
    const grid = document.getElementById('slot-grid');
    const spinButton = document.getElementById('spin-button');
    const messageArea = document.querySelector('#message-area p');

    let isSpinning = false;

    // --- FUNGSI INTI GAME ---

    /** Membuat dan mengisi grid awal */
    function initializeGrid() {
        grid.innerHTML = ''; // Kosongkan grid
        for (let i = 0; i < ROWS * COLS; i++) {
            const cell = document.createElement('div');
            cell.classList.add('slot-cell');
            cell.textContent = getRandomSymbol();
            grid.appendChild(cell);
        }
    }

    /** Mendapatkan simbol acak */
    function getRandomSymbol() {
        return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    }

    /** Fungsi utility untuk jeda (delay) */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /** Fungsi utama untuk memulai putaran */
    async function spin() {
        if (isSpinning) return;
        isSpinning = true;
        spinButton.disabled = true;
        messageArea.textContent = "Berputar...";

        // Isi ulang grid dengan simbol baru dengan animasi
        const cells = Array.from(grid.children);
        for(const cell of cells) {
            cell.textContent = getRandomSymbol();
            cell.classList.remove('win-animation');
        }
        
        await sleep(500); // Jeda singkat setelah spin awal
        await checkForWinsAndTumble();

        isSpinning = false;
        spinButton.disabled = false;
    }

    /** Memeriksa kemenangan dan memicu Tumble */
    async function checkForWinsAndTumble() {
        const cells = Array.from(grid.children);
        const symbolCounts = {};
        
        // Hitung semua simbol di grid
        cells.forEach(cell => {
            const symbol = cell.textContent;
            symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
        });

        // Cari simbol yang menang
        const winningSymbols = Object.keys(symbolCounts).filter(symbol => symbolCounts[symbol] >= MIN_WIN_COUNT);

        if (winningSymbols.length > 0) {
            let winMessage = "";
            winningSymbols.forEach(s => winMessage += `Menang dengan ${symbolCounts[s]}x ${s}! `);
            messageArea.textContent = winMessage;
            
            // Tandai simbol yang menang dengan animasi
            cells.forEach(cell => {
                if (winningSymbols.includes(cell.textContent)) {
                    cell.classList.add('win-animation');
                }
            });

            await sleep(1500); // Waktu untuk melihat kemenangan

            // Hapus class animasi
            cells.forEach(cell => cell.classList.remove('win-animation'));
            
            await applyTumble(winningSymbols);
            
            // Cek lagi setelah tumble
            await checkForWinsAndTumble();
        } else {
            if (isSpinning) { // Hanya tampilkan jika ini adalah hasil akhir
                 messageArea.textContent = "Tidak ada kemenangan. Coba lagi!";
            }
        }
    }

    /** Menerapkan mekanisme Tumble/runtuhan */
    async function applyTumble(winningSymbols) {
        const cells = Array.from(grid.children);
        
        // 1. Ubah simbol yang menang menjadi 'kosong'
        cells.forEach(cell => {
            if (winningSymbols.includes(cell.textContent)) {
                cell.textContent = '';
            }
        });

        // 2. Lakukan Tumble per kolom
        for (let c = 0; c < COLS; c++) {
            let emptySlots = 0;
            // Dari bawah ke atas
            for (let r = ROWS - 1; r >= 0; r--) {
                const index = r * COLS + c;
                const cell = cells[index];
                if (cell.textContent === '') {
                    emptySlots++;
                } else if (emptySlots > 0) {
                    // Pindahkan simbol ke bawah
                    const targetIndex = (r + emptySlots) * COLS + c;
                    cells[targetIndex].textContent = cell.textContent;
                    cell.textContent = '';
                }
            }

            // 3. Isi slot kosong di atas dengan simbol baru
            for (let i = 0; i < emptySlots; i++) {
                const index = i * COLS + c;
                cells[index].textContent = getRandomSymbol();
                cells[index].classList.add('fall-animation');
            }
        }
        
        await sleep(500); // Waktu untuk animasi jatuh
        cells.forEach(cell => cell.classList.remove('fall-animation'));
    }

    // --- Event Listeners ---
    spinButton.addEventListener('click', spin);

    // --- Inisialisasi Game ---
    initializeGrid();
});
