feather.replace();

// =====================================
// 1. DATABASE & STATE SIMULASI
// =====================================
const databaseAkun = {
    'rt': { password: '123', role: 'rt', nama: 'Bapak RT 04' },
    'admin': { password: '123', role: 'admin', nama: 'Admin Kecamatan' },
    'super': { password: '123', role: 'superadmin', nama: 'Super Admin Sistem' }
};

// Kategori standar tugas RT
let kategoriModul = [
    'Pelayanan Administrasi (KTP/KK)', 
    'Pendataan Kependudukan', 
    'Keamanan & Ketertiban (Siskamling)', 
    'Fasilitator Sosial (Kerja Bakti)', 
    'Penghubung Informasi'
];

let dataLaporan = [
    { 
        id: 1, 
        tanggal: '2026-10-04', 
        kategori: 'Keamanan & Ketertiban (Siskamling)', 
        judul: 'Jadwal Ronda Minggu Pertama', 
        file: 'jadwal_ronda.pdf', 
        status: 'Data Valid',
        catatan: 'Terima kasih, data sudah dicatat di kecamatan.'
    },
    { 
        id: 2, 
        tanggal: '2026-10-05', 
        kategori: 'Pendataan Kependudukan', 
        judul: 'Warga Pendatang Baru Blok B', 
        file: 'ktp_pendatang.jpg', 
        status: 'Menunggu',
        catatan: ''
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

    if (databaseAkun[user] && databaseAkun[user].password === pass) {
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
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// =====================================
// 3. PENGATURAN DASHBOARD & MENU
// =====================================
function setupDashboard() {
    document.getElementById('userGreeting').innerText = 'Akses: ' + currentUser.nama;
    
    const roleIcon = document.getElementById('roleIcon');
    const roleTitle = document.getElementById('roleTitle');
    const menuContainer = document.getElementById('menuContainer');
    const kolomAksi = document.getElementById('kolomAksi');
    const judulTabel = document.getElementById('judulTabel');
    
    menuContainer.innerHTML = ''; 

    // PERAN: RT (Hanya bisa kirim dan lihat riwayat sendiri)
    if (currentUser.role === 'rt') {
        roleIcon.setAttribute('data-feather', 'user-check');
        roleTitle.innerText = 'Pengurus RT';
        judulTabel.innerText = 'Riwayat Laporan Saya';
        kolomAksi.classList.add('hidden'); // RT tidak verifikasi

        buatTombolMenu('upload', 'Buat Laporan Baru', 'edit');
        buatTombolMenu('tabel', 'Status Laporan', 'file-text');
        
        perbaruiDropdownKategori();
        bukaModul('upload');
    } 
    // PERAN: ADMIN KECAMATAN (Mengecek dan Verifikasi)
    else if (currentUser.role === 'admin') {
        roleIcon.setAttribute('data-feather', 'check-circle');
        roleTitle.innerText = 'Admin Kecamatan';
        judulTabel.innerText = 'Verifikasi Laporan RT Masuk';
        kolomAksi.classList.remove('hidden'); // Admin bisa verifikasi

        buatTombolMenu('tabel', 'Antrean Verifikasi', 'inbox');
        bukaModul('tabel');
    }
    // PERAN: SUPER ADMIN (Memantau semua & Tambah Modul)
    else if (currentUser.role === 'superadmin') {
        roleIcon.setAttribute('data-feather', 'server');
        roleTitle.innerText = 'Super Admin';
        judulTabel.innerText = 'Pantauan Semua Laporan RT';
        kolomAksi.classList.add('hidden'); // Super admin hanya mantau tabel, tidak verifikasi tugas kecamatan

        buatTombolMenu('tabel', 'Master Data Laporan', 'database');
        buatTombolMenu('superadmin', 'Pengaturan Modul', 'settings');
        bukaModul('tabel');
    }

    feather.replace(); 
    renderTabel(); 
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
    const semuaModul = ['upload', 'tabel', 'superadmin'];
    
    semuaModul.forEach(m => {
        let el = document.getElementById('modul-' + m);
        let btn = document.getElementById('btn-modul-' + m);
        if(el) el.classList.add('hidden');
        if(btn) btn.className = "modul-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-100";
    });

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
// 4. LOGIKA RT: UPLOAD & KATEGORI DINAMIS
// =====================================
function perbaruiDropdownKategori() {
    const dropdown = document.getElementById('inputKategori');
    if(dropdown) {
        dropdown.innerHTML = '<option value="">-- Pilih Kategori Laporan --</option>';
        kategoriModul.forEach(kat => {
            dropdown.innerHTML += `<option value="${kat}">${kat}</option>`;
        });
    }
}

function kirimLaporan(e) {
    e.preventDefault();
    const kategori = document.getElementById('inputKategori').value;
    const judul = document.getElementById('inputJudul').value;
    const fileInput = document.getElementById('inputDokumen');
    const namaFile = fileInput.files.length > 0 ? fileInput.files[0].name : 'Tidak_ada_file';

    const tgl = new Date().toISOString().split('T')[0];

    dataLaporan.unshift({
        id: Date.now(),
        tanggal: tgl,
        kategori: kategori,
        judul: judul,
        file: namaFile,
        status: 'Menunggu',
        catatan: ''
    });

    document.getElementById('inputJudul').value = '';
    document.getElementById('inputKategori').value = '';
    fileInput.value = '';
    
    alert("Laporan berhasil dikirim ke Kantor Kecamatan!");
    bukaModul('tabel'); 
    renderTabel();
}

// =====================================
// 5. LOGIKA RENDER TABEL & VERIFIKASI ADMIN
// =====================================
function renderTabel() {
    const tbody = document.getElementById('tbodyLaporan');
    tbody.innerHTML = '';

    dataLaporan.forEach(data => {
        let badgeStyle = data.status === 'Data Valid' ? 'bg-emerald-100 text-emerald-700' :
                         data.status === 'Tidak Lengkap' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';

        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50";

        let html = `
            <td class="py-3 px-3 text-slate-500 whitespace-nowrap">${data.tanggal}</td>
            <td class="py-3 px-3">
                <span class="block text-xs font-bold text-emerald-600 mb-0.5">${data.kategori}</span>
                <span class="font-medium text-slate-800">${data.judul}</span>
            </td>
            <td class="py-3 px-3">
                <button onclick="lihatBerkas('${data.file}')" class="inline-flex items-center gap-1 text-xs bg-white hover:bg-slate-100 px-2 py-1.5 rounded border border-slate-300 transition">
                    <i data-feather="download" class="w-3 h-3 text-slate-600"></i> ${data.file}
                </button>
            </td>
            <td class="py-3 px-3">
                <span class="px-2 py-1 rounded text-xs font-bold ${badgeStyle}">${data.status}</span>
                ${data.catatan ? `<p class="text-xs text-slate-500 mt-1 italic">"${data.catatan}"</p>` : ''}
            </td>
        `;

        // Tampilkan tombol Verifikasi HANYA jika perannya ADMIN
        if (currentUser.role === 'admin') {
            if (data.status === 'Menunggu') {
                html += `
                <td class="py-3 px-3 text-center">
                    <div class="flex flex-col gap-1">
                        <button onclick="verifikasiLaporan(${data.id}, 'Data Valid')" class="px-2 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs hover:bg-emerald-100 font-bold">Valid</button>
                        <button onclick="verifikasiLaporan(${data.id}, 'Tidak Lengkap')" class="px-2 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs hover:bg-rose-100 font-bold">Tolak</button>
                    </div>
                </td>`;
            } else {
                html += `<td class="py-3 px-3 text-center text-xs text-slate-400 font-medium">Telah Diproses</td>`;
            }
        }

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
    feather.replace();
}

function lihatBerkas(nama) {
    alert("Membuka file bukti: " + nama);
}

function verifikasiLaporan(id, statusBaru) {
    const index = dataLaporan.findIndex(d => d.id === id);
    if (index !== -1) {
        // Minta Admin memasukkan catatan/alasan
        let catatanAdmin = prompt(`Masukkan catatan untuk RT (Opsional).\nStatus baru: ${statusBaru}`);
        
        if (catatanAdmin !== null) { // Jika tidak di-cancel
            dataLaporan[index].status = statusBaru;
            dataLaporan[index].catatan = catatanAdmin;
            renderTabel(); 
        }
    }
}

// =====================================
// 6. LOGIKA SUPER ADMIN: TAMBAH KATEGORI
// =====================================
function tambahKategori(e) {
    e.preventDefault();
    const kategoriBaru = document.getElementById('inputKategoriBaru').value;
    
    // Tambahkan ke array memori
    kategoriModul.push(kategoriBaru);
    
    document.getElementById('inputKategoriBaru').value = '';
    alert(`Modul pelaporan "${kategoriBaru}" berhasil ditambahkan ke dalam sistem! RT sekarang dapat menggunakannya.`);
}
