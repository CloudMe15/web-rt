feather.replace();

// =====================================
// 1. DATABASE & STATE SIMULASI
// =====================================
const databaseAkun = {
    'warga': { role: 'warga', nama: 'Warga Masyarakat' },
    'rt': { role: 'rt', nama: 'Bapak Ketua RT' },
    'operator': { role: 'operator', nama: 'Operator Desa' }
};

// Data Dummy (Simulasi format Google Sheets)
let dataPermohonan = [
    {
        id: 1,
        timestamp: '2026-10-05 09:00',
        nik: '1234567890123456',
        nama: 'Ahmad Yani',
        wa: '081234567890',
        rt: 'RT 01',
        layanan: 'Surat Pengantar SKCK',
        keperluan: 'Melamar kerja',
        catatanRT: '',
        file: 'ktp_kk.jpg',
        status: 'Menunggu', // Menunggu, Diproses, Selesai
        catatanKendala: ''
    },
    {
        id: 2,
        timestamp: '2026-10-04 14:30',
        nik: '9876543210987654',
        nama: 'Siti Aminah',
        wa: '089876543210',
        rt: 'RT 02',
        layanan: 'Surat Keterangan Usaha',
        keperluan: 'Pinjaman bank',
        catatanRT: 'Valid: Usaha warung sembako aktif di lingkungan.',
        file: 'berkas_siti.pdf',
        status: 'Diproses',
        catatanKendala: 'Menunggu tanda tangan Kades'
    }
];

let currentUser = null; 

// =====================================
// 2. SISTEM LOGIN
// =====================================
function prosesLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUsername').value;
    const pass = document.getElementById('loginPassword').value;

    // Login statis simulasi (password bebas asalkan '123')
    if (databaseAkun[user] && pass === '123') {
        currentUser = databaseAkun[user];
        document.getElementById('loginError').classList.add('hidden');
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardPage').style.display = 'block';
        
        setupDashboard(); 
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function prosesLogout() {
    currentUser = null;
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
}

// =====================================
// 3. PENGATURAN DASHBOARD & MENU
// =====================================
function setupDashboard() {
    document.getElementById('userGreeting').innerText = currentUser.nama;
    
    const roleIcon = document.getElementById('roleIcon');
    const roleTitle = document.getElementById('roleTitle');
    const menuContainer = document.getElementById('menuContainer');
    
    menuContainer.innerHTML = ''; 

    if (currentUser.role === 'warga' || currentUser.role === 'rt') {
        roleIcon.setAttribute('data-feather', currentUser.role === 'rt' ? 'award' : 'user');
        roleTitle.innerText = currentUser.role === 'rt' ? 'Ketua RT (Garda Depan)' : 'Warga Pemohon';
        
        // Form tambahan khusus RT
        const panelRT = document.getElementById('panelCatatanRT');
        if(currentUser.role === 'rt') {
            panelRT.classList.remove('hidden');
        } else {
            panelRT.classList.add('hidden');
        }

        buatTombolMenu('formulir', 'Formulir Layanan', 'edit-3');
        buatTombolMenu('status-warga', 'Cek Status', 'clock');
        bukaModul('formulir');
    } 
    else if (currentUser.role === 'operator') {
        roleIcon.setAttribute('data-feather', 'laptop');
        roleTitle.innerText = 'Operator Desa';

        buatTombolMenu('monitoring', 'Dashboard Google Sheets', 'sidebar');
        bukaModul('monitoring');
    }

    feather.replace(); 
    renderTabelData(); 
}

function buatTombolMenu(idModul, teks, ikon) {
    const btn = document.createElement('button');
    btn.onclick = () => bukaModul(idModul);
    btn.className = "modul-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-100";
    btn.id = 'btn-modul-' + idModul;
    btn.innerHTML = `<i data-feather="${ikon}" class="w-4 h-4"></i> ${teks}`;
    document.getElementById('menuContainer').appendChild(btn);
}

function bukaModul(idModul) {
    const semuaModul = ['formulir', 'monitoring', 'status-warga'];
    
    semuaModul.forEach(m => {
        let el = document.getElementById('modul-' + m);
        let btn = document.getElementById('btn-modul-' + m);
        if(el) el.classList.add('hidden');
        if(btn) btn.className = "modul-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-100";
    });

    let activeEl = document.getElementById('modul-' + idModul);
    let activeBtn = document.getElementById('btn-modul-' + idModul);
    
    if(activeEl) activeEl.classList.remove('hidden');
    if(activeBtn) activeBtn.className = "modul-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition bg-emerald-600 text-white shadow";
}

// =====================================
// 4. LOGIKA PENGISIAN FORM (Warga / RT)
// =====================================
function kirimFormulir(e) {
    e.preventDefault();
    
    const d = new Date();
    const timestampStr = d.toISOString().split('T')[0] + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');

    let catatanTambahan = '';
    if(currentUser.role === 'rt') {
        catatanTambahan = document.getElementById('inputCatatanRT').value;
    }

    dataPermohonan.push({
        id: Date.now(),
        timestamp: timestampStr,
        nik: document.getElementById('inputNIK').value,
        nama: document.getElementById('inputNama').value,
        wa: document.getElementById('inputWA').value,
        rt: document.getElementById('inputRT').value,
        layanan: document.getElementById('inputLayanan').value,
        keperluan: document.getElementById('inputKeperluan').value,
        catatanRT: catatanTambahan,
        file: document.getElementById('inputBerkas').files[0].name,
        status: 'Menunggu',
        catatanKendala: ''
    });

    e.target.reset(); // Kosongkan form
    alert("Formulir berhasil dikirim ke Operator Desa!");
    bukaModul('status-warga'); 
    renderTabelData();
}

// =====================================
// 5. RENDER TABEL (Operator & Warga)
// =====================================
function getStatusWarna(status) {
    if (status === 'Menunggu') return 'bg-red-500 text-white'; // Merah
    if (status === 'Diproses') return 'bg-yellow-400 text-slate-800'; // Kuning
    if (status === 'Selesai') return 'bg-green-500 text-white'; // Hijau
    return '';
}

function renderTabelData() {
    // Render Tabel Warga/RT
    const tbodyWarga = document.getElementById('tabelStatusWarga');
    if(tbodyWarga) tbodyWarga.innerHTML = '';

    // Render Tabel Operator (Gaya Google Sheets)
    const tbodyOp = document.getElementById('tabelOperator');
    if(tbodyOp) tbodyOp.innerHTML = '';

    // Sort: terbaru di atas
    let sortedData = [...dataPermohonan].reverse();

    sortedData.forEach(data => {
        // --- 1. BARIS UNTUK TABEL WARGA/RT ---
        if (currentUser.role === 'warga' || currentUser.role === 'rt') {
            let trWarga = document.createElement('tr');
            trWarga.className = "hover:bg-slate-50";
            trWarga.innerHTML = `
                <td class="py-3 px-3 text-xs text-slate-500">${data.timestamp}</td>
                <td class="py-3 px-3 font-semibold text-slate-700">${data.nama}</td>
                <td class="py-3 px-3 text-sm">${data.layanan}</td>
                <td class="py-3 px-3">
                    <span class="px-2 py-1 rounded text-xs font-bold ${getStatusWarna(data.status)}">${data.status}</span>
                </td>
                <td class="py-3 px-3 text-xs text-rose-600 font-medium">${data.catatanKendala || '-'}</td>
            `;
            if(tbodyWarga) tbodyWarga.appendChild(trWarga);
        }
        
        // --- 2. BARIS UNTUK TABEL OPERATOR ---
        if (currentUser.role === 'operator') {
            let trOp = document.createElement('tr');
            // Warna baris diwarnai tipis sesuai status
            let rowColor = data.status === 'Menunggu' ? 'bg-red-50' : data.status === 'Diproses' ? 'bg-yellow-50' : 'bg-green-50';
            trOp.className = `${rowColor} border-b border-slate-200`;

            trOp.innerHTML = `
                <td class="py-2 px-3 border-r border-slate-200 text-xs text-slate-500 whitespace-nowrap">${data.timestamp}</td>
                <td class="py-2 px-3 border-r border-slate-200 font-semibold text-slate-700">
                    ${data.nama} <br> <span class="text-xs text-slate-400 font-normal">NIK: ${data.nik}</span>
                </td>
                <td class="py-2 px-3 border-r border-slate-200 text-xs">${data.wa}</td>
                <td class="py-2 px-3 border-r border-slate-200 text-xs">${data.rt}</td>
                <td class="py-2 px-3 border-r border-slate-200 text-xs">
                    ${data.layanan} <br>
                    <a href="#" class="text-blue-600 hover:underline">Lihat Berkas (${data.file})</a>
                    ${data.catatanRT ? `<br><span class="text-rose-600 italic">Catatan RT: ${data.catatanRT}</span>` : ''}
                </td>
                <td class="py-2 px-3 border-r border-slate-200 text-center">
                    <span class="px-2 py-1 rounded text-xs font-bold shadow-sm ${getStatusWarna(data.status)} cursor-pointer" onclick="ubahStatus(${data.id})">
                        ${data.status} &#9662;
                    </span>
                </td>
                <td class="py-2 px-3 border-r border-slate-200 text-xs font-medium text-rose-700 cursor-pointer" onclick="tambahKendala(${data.id})">
                    ${data.catatanKendala || '<span class="text-slate-400 italic">Klik tambah kendala...</span>'}
                </td>
                <td class="py-2 px-3 text-center">
                    <button onclick="kirimWA(${data.id})" class="inline-flex items-center gap-1 px-2 py-1.5 bg-green-100 text-green-700 border border-green-300 rounded text-xs font-bold hover:bg-green-200 transition">
                        <i data-feather="message-circle" class="w-3 h-3"></i> Kirim WA
                    </button>
                </td>
            `;
            if(tbodyOp) tbodyOp.appendChild(trOp);
        }
    });

    feather.replace();
}

// =====================================
// 6. FUNGSI OPERATOR DESA
// =====================================
function ubahStatus(id) {
    const index = dataPermohonan.findIndex(d => d.id === id);
    if (index !== -1) {
        let current = dataPermohonan[index].status;
        // Siklus perubahan status: Menunggu -> Diproses -> Selesai -> Menunggu
        if (current === 'Menunggu') dataPermohonan[index].status = 'Diproses';
        else if (current === 'Diproses') dataPermohonan[index].status = 'Selesai';
        else dataPermohonan[index].status = 'Menunggu';
        renderTabelData();
    }
}

function tambahKendala(id) {
    const index = dataPermohonan.findIndex(d => d.id === id);
    if (index !== -1) {
        let kendala = prompt("Masukkan Catatan Kendala (misal: Foto KK buram):", dataPermohonan[index].catatanKendala);
        if (kendala !== null) {
            dataPermohonan[index].catatanKendala = kendala;
            renderTabelData();
        }
    }
}

function kirimWA(id) {
    const data = dataPermohonan.find(d => d.id === id);
    if (!data) return;

    let pesan = "";
    
    // Format sesuai blueprint "Templat Pesan Notifikasi WhatsApp Operator"
    if (data.status === 'Selesai') {
        pesan = `Assalamu'alaikum Wr. Wb. / Selamat Siang,\nYth. Bapak/Ibu *${data.nama}*,\n\nPermohonan pengurusan *${data.layanan}* Anda di Kantor Desa Lubuk Sitarak telah SELESAI diproses.\n\nSilakan datang ke Kantor Desa Lubuk Sitarak pada jam kerja (Senin-Jumat, 08.00-15.00 WIB) untuk pengambilan berkas fisik dengan membawa identitas diri (KTP asli).\n\nTerima kasih.`;
    } 
    else if (data.catatanKendala !== '') {
        pesan = `Assalamu'alaikum Wr. Wb. / Selamat Siang,\nYth. Bapak/Ibu *${data.nama}*,\n\nSehubungan dengan permohonan *${data.layanan}* Anda, terdapat berkas yang perlu diperbaiki/dilengkapi:\nKendala: *${data.catatanKendala}*\n\nMohon kirimkan ulang berkas tersebut melalui balasan WhatsApp ini agar dokumen dapat segera kami proses.\n\nTerima kasih.`;
    } 
    else {
        alert("Pilih status 'Selesai' atau tambahkan 'Catatan Kendala' terlebih dahulu sebelum mengirim WA konfirmasi.");
        return;
    }

    // Format nomor HP ke format internasional (ubah 08 menjadi 628)
    let noWA = data.wa;
    if(noWA.startsWith('0')) {
        noWA = '62' + noWA.substring(1);
    }

    const urlWA = `https://wa.me/${noWA}?text=${encodeURIComponent(pesan)}`;
    window.open(urlWA, '_blank');
}
