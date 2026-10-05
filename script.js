feather.replace();

// =====================================
// 1. DATABASE SIMULASI
// =====================================
const databaseAkun = {
    'rt': { password: '123', role: 'rt', nama: 'Bapak Ketua RT' },
    'admin': { password: '123', role: 'admin', nama: 'Admin Verifikator' },
    'super': { password: '123', role: 'superadmin', nama: 'Super Admin Pusat' }
};

let dataUploadRT = [
    { id: 1, tanggal: '2026-10-05', judul: 'Foto Kegiatan Posyandu', file: 'posyandu.jpg', status: 'Menunggu' },
    { id: 2, tanggal: '2026-10-04', judul: 'Laporan Kas Warga', file: 'laporan_kas.pdf', status: 'Benar' }
];

let currentUser = null; // Menyimpan status siapa yang sedang login
let daftarModul = ['upload', 'verifikasi', 'superadmin'];

// =====================================
// 2. SISTEM LOGIN & LOGOUT
// =====================================
function prosesLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUsername').value;
    const pass = document.getElementById('loginPassword').value;

    if (databaseAkun[user] && databaseAkun[user].password === pass) {
        // Login Sukses
        currentUser = databaseAkun[user];
        document.getElementById('loginError').classList.add('hidden');
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardPage').style.display = 'block';
        
        setupDashboard(); // Atur tampilan sesuai peran
    } else {
        // Login Gagal
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function prosesLogout() {
    currentUser = null;
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// =====================================
// 3. PENGATURAN DASHBOARD SESUAI PERAN
// =====================================
function setupDashboard() {
    document.getElementById('userGreeting').innerText = 'Halo, ' + currentUser.nama;
    
    const roleIcon = document.getElementById('roleIcon');
    const roleTitle = document.getElementById('roleTitle');
    const menuContainer = document.getElementById('menuContainer');
    
    menuContainer.innerHTML = ''; // Kosongkan menu sebelumnya

    // A. JIKA LOGIN SEBAGAI RT
    if (currentUser.role === 'rt') {
        roleIcon.setAttribute('data-feather', 'camera');
        roleTitle.innerText = 'Ketua RT';
        buatTombolMenu('upload', 'Upload Data', 'upload-cloud');
        buatTombolMenu('verifikasi', 'Riwayat Data Saya', 'file-text');
        bukaModul('upload');
    } 
    // B. JIKA LOGIN SEBAGAI ADMIN VERIFIKATOR
    else if (currentUser.role === 'admin') {
        roleIcon.setAttribute('data-feather', 'check-circle');
        roleTitle.innerText = 'Admin Verifikasi';
        buatTombolMenu('verifikasi', 'Verifikasi Data RT', 'check-square');
        bukaModul('verifikasi');
    }
    // C. JIKA LOGIN SEBAGAI SUPER ADMIN
    else if (currentUser.role === 'superadmin') {
        roleIcon.setAttribute('data-feather', 'server');
        roleTitle.innerText = 'Super Admin';
        buatTombolMenu('verifikasi', 'Pantau Semua Data', 'eye');
        buatTombolMenu('superadmin', 'Pengaturan Sistem', 'settings');
        bukaModul('verifikasi');
    }

    feather.replace(); // Refresh icon
    renderTabelData(); // Muat data tabel
}

function buatTombolMenu(idModul, teks, ikon) {
    const btn = document.createElement('button');
    btn.onclick = () => bukaModul(idModul);
    btn.className = "modul-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-100";
    btn.id = 'btn-modul-' + idModul;
    btn.innerHTML = `<i data-feather="${ikon}" class="w-4 h-4"></i> ${teks}`;
    document.getElementById('menuContainer').appendChild(btn);
}

// =====================================
// 4. NAVIGASI ANTAR MODUL
// =====================================
function bukaModul(idModul) {
    // Sembunyikan semua modul
    daftarModul.forEach(m => {
        let el = document.getElementById('modul-' + m);
        let btn = document.getElementById('btn-modul-' + m);
        if(el) el.classList.add('hidden');
        if(btn) btn.className = "modul-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-100";
    });

    // Tampilkan modul yang dipilih
    let activeEl = document.getElementById('modul-' + idModul);
    let activeBtn = document.getElementById('btn-modul-' + idModul);
    
    if(activeEl) activeEl.classList.remove('hidden');
    if(activeBtn) {
        if(idModul === 'superadmin') {
            activeBtn.className = "modul-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition bg-slate-800 text-white shadow";
        } else {
            activeBtn.className = "modul-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition bg-emerald-600 text-white shadow";
        }
    }
}

// =====================================
// 5. FITUR: RT UPLOAD DATA
// =====================================
function uploadDataRT(e) {
    e.preventDefault();
    const judul = document.getElementById('inputJudul').value;
    const fileInput = document.getElementById('inputFoto');
    const namaFile = fileInput.files.length > 0 ? fileInput.files[0].name : 'Tidak_ada_file';

    const tanggalHariIni = new Date().toISOString().split('T')[0];

    dataUploadRT.unshift({
        id: Date.now(),
        tanggal: tanggalHariIni,
        judul: judul,
        file: namaFile,
        status: 'Menunggu'
    });

    document.getElementById('inputJudul').value = '';
    fileInput.value = '';
    
    alert("Data berhasil dikirim ke Admin untuk diverifikasi!");
    bukaModul('verifikasi'); // Langsung pindah ke tab riwayat
    renderTabelData();
}

// =====================================
// 6. FITUR: ADMIN VERIFIKASI DATA
// =====================================
function renderTabelData() {
    const tbody = document.getElementById('tabelDataRT');
    tbody.innerHTML = '';

    // Kolom aksi hanya muncul jika yang login adalah ADMIN
    const kolomAksi = document.getElementById('kolomAksi');
    if (currentUser.role === 'admin') {
        kolomAksi.classList.remove('hidden');
    } else {
        kolomAksi.classList.add('hidden');
    }

    dataUploadRT.forEach(data => {
        let badgeStyle = data.status === 'Benar' ? 'bg-emerald-100 text-emerald-700' :
                         data.status === 'Tidak Lengkap' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';

        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50";

        let isiHtml = `
            <td class="py-3 px-3 text-slate-500">${data.tanggal}</td>
            <td class="py-3 px-3 font-semibold text-slate-700">${data.judul}</td>
            <td class="py-3 px-3">
                <span class="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    <i data-feather="image" class="w-3 h-3"></i> ${data.file}
                </span>
            </td>
            <td class="py-3 px-3">
                <span class="px-2 py-1 rounded text-xs font-bold ${badgeStyle}">${data.status}</span>
            </td>
        `;

        // Tampilkan tombol Terima/Tolak hanya untuk ADMIN
        if (currentUser.role === 'admin') {
            if (data.status === 'Menunggu') {
                isiHtml += `
                <td class="py-3 px-3 text-center space-x-1">
                    <button onclick="ubahStatusData(${data.id}, 'Benar')" class="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs hover:bg-emerald-100">Data Benar</button>
                    <button onclick="ubahStatusData(${data.id}, 'Tidak Lengkap')" class="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs hover:bg-rose-100">Tidak Lengkap</button>
                </td>`;
            } else {
                isiHtml += `<td class="py-3 px-3 text-center text-xs text-slate-400">Sudah Dicek</td>`;
            }
        }

        tr.innerHTML = isiHtml;
        tbody.appendChild(tr);
    });
    feather.replace();
}

function ubahStatusData(id, statusBaru) {
    const index = dataUploadRT.findIndex(d => d.id === id);
    if (index !== -1) {
        dataUploadRT[index].status = statusBaru;
        renderTabelData(); // Refresh tabel
    }
}

// =====================================
// 7. FITUR: SUPER ADMIN TAMBAH MODUL
// =====================================
function tambahModulBaru(e) {
    e.preventDefault();
    const namaModul = document.getElementById('inputNamaModul').value;
    const idModulBaru = 'modul-' + Date.now();
    
    // Daftarkan modul ke memori
    daftarModul.push(idModulBaru);

    // Tambahkan tombol di menu samping
    buatTombolMenu(idModulBaru, namaModul, 'box');

    // Buat area konten (kosong)
    const mainContent = document.getElementById('mainContent');
    const divBaru = document.createElement('div');
    divBaru.id = `modul-${idModulBaru}`;
    divBaru.className = "hidden space-y-6 animasi-muncul";
    divBaru.innerHTML = `
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold mb-4">${namaModul}</h3>
            <p class="text-sm text-slate-500">Ini adalah fitur baru yang ditambahkan oleh Super Admin.</p>
        </div>
    `;
    mainContent.appendChild(divBaru);

    document.getElementById('inputNamaModul').value = '';
    alert(`Sukses! Fitur "${namaModul}" berhasil ditambahkan.`);
    feather.replace();
}
