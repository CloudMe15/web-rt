// Inisialisasi Ikon Feather saat halaman pertama kali dimuat
feather.replace();

// ==========================================
// 1. STATE (Penyimpanan Data Sementara)
// ==========================================
let currentRole = 'warga';
let currentTab = 'administrasi';

let suratData = [
    { id: 1, nama: 'Budi Santoso', jenis: 'Pengantar SKCK', status: 'Diterima' },
    { id: 2, nama: 'Siti Rahma', jenis: 'Surat Domisili', status: 'Menunggu' }
];


// ==========================================
// 2. FUNGSI NAVIGASI (Pindah Tab)
// ==========================================
function setTab(tabName) {
    currentTab = tabName;
    
    // Daftar semua menu yang ada
    const tabs = ['administrasi', 'kependudukan', 'keamanan', 'sosial', 'informasi'];
    
    tabs.forEach(t => {
        // Sembunyikan semua konten terlebih dahulu
        document.getElementById('content-' + t).classList.add('hidden');
        
        // Kembalikan tombol menu ke warna aslinya (abu-abu/putih)
        let btn = document.getElementById('tab-' + t);
        btn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-100";
    });

    // Tampilkan konten yang sedang diklik
    document.getElementById('content-' + tabName).classList.remove('hidden');
    
    // Ubah warna tombol yang diklik menjadi hijau
    let activeBtn = document.getElementById('tab-' + tabName);
    activeBtn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-emerald-600 text-white shadow";
}


// ==========================================
// 3. FUNGSI PERAN (Beralih Warga <-> RT)
// ==========================================
function setRole(role) {
    currentRole = role;
    
    const btnWarga = document.getElementById('btnRoleWarga');
    const btnRT = document.getElementById('btnRoleRT');
    const roleDisplay = document.getElementById('roleDisplay');

    if (role === 'warga') {
        btnWarga.className = "px-3 py-1 text-sm font-semibold rounded-md transition bg-white text-emerald-800 shadow";
        btnRT.className = "px-3 py-1 text-sm font-semibold rounded-md transition text-white hover:bg-emerald-700";
        roleDisplay.innerHTML = `<i data-feather="user-check" class="text-emerald-600"></i> Warga Lingkungan`;
        
        // Tampilkan form pengajuan surat karena ini Warga
        document.getElementById('formPengajuanWarga').style.display = 'block';
    } else {
        btnRT.className = "px-3 py-1 text-sm font-semibold rounded-md transition bg-amber-400 text-slate-900 shadow";
        btnWarga.className = "px-3 py-1 text-sm font-semibold rounded-md transition text-white hover:bg-emerald-700";
        roleDisplay.innerHTML = `<i data-feather="shield" class="text-emerald-600"></i> Ketua RT (Admin)`;
        
        // Sembunyikan form pengajuan surat karena RT tidak mengajukan surat
        document.getElementById('formPengajuanWarga').style.display = 'none';
    }
    
    // Render ulang ikon dan tabel surat menyesuaikan hak akses
    feather.replace(); 
    renderSurat(); 
}


// ==========================================
// 4. FUNGSI MENAMPILKAN DATA SURAT
// ==========================================
function renderSurat() {
    const tbody = document.getElementById('tabelSurat');
    tbody.innerHTML = ''; // Kosongkan tabel sebelum diisi ulang
    
    // Menampilkan atau menyembunyikan tulisan "Aksi RT" di tabel paling atas
    const thAksi = document.querySelectorAll('.aksi-rt');
    thAksi.forEach(th => currentRole === 'rt' ? th.classList.remove('hidden') : th.classList.add('hidden'));

    suratData.forEach(surat => {
        // Tentukan warna status
        let badgeColor = surat.status === 'Diterima' ? 'bg-emerald-100 text-emerald-700' : 
                         surat.status === 'Ditolak' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
        
        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50";
        
        // Isi baris tabel
        let htmlContent = `
            <td class="py-3 px-3 font-medium text-slate-700">${surat.nama}</td>
            <td class="py-3 px-3">${surat.jenis}</td>
            <td class="py-3 px-3"><span class="px-2 py-1 rounded text-xs font-semibold ${badgeColor}">${surat.status}</span></td>
        `;

        // Jika login sebagai RT, tambahkan tombol aksi Terima/Tolak
        if (currentRole === 'rt') {
            if (surat.status === 'Menunggu') {
                htmlContent += `
                    <td class="py-3 px-3 text-center space-x-1">
                        <button onclick="updateStatus(${surat.id}, 'Diterima')" class="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-xs hover:bg-emerald-100 transition">Terima</button>
                        <button onclick="updateStatus(${surat.id}, 'Ditolak')" class="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded text-xs hover:bg-rose-100 transition">Tolak</button>
                    </td>`;
            } else {
                htmlContent += `<td class="py-3 px-3 text-center text-xs text-slate-400">Selesai</td>`;
            }
        }

        tr.innerHTML = htmlContent;
        tbody.appendChild(tr);
    });
}


// ==========================================
// 5. FUNGSI MENAMBAH SURAT (Oleh Warga)
// ==========================================
function ajukanSurat(e) {
    e.preventDefault(); // Mencegah halaman me-refresh sendiri saat form dikirim
    
    const nama = document.getElementById('inputNamaSurat').value;
    const jenis = document.getElementById('inputJenisSurat').value;
    
    // Masukkan data baru ke urutan paling atas
    suratData.unshift({
        id: Date.now(),
        nama: nama,
        jenis: jenis,
        status: 'Menunggu'
    });
    
    document.getElementById('inputNamaSurat').value = ''; // Kosongkan form setelah input
    renderSurat(); // Perbarui tampilan tabel
}


// ==========================================
// 6. FUNGSI UPDATE STATUS SURAT (Oleh RT)
// ==========================================
function updateStatus(id, newStatus) {
    // Cari urutan surat berdasarkan ID nya
    const index = suratData.findIndex(s => s.id === id);
    
    // Jika surat ditemukan, ubah statusnya dan perbarui tabel
    if (index !== -1) {
        suratData[index].status = newStatus;
        renderSurat();
    }
}

// Jalankan render awal saat website pertama kali dibuka
renderSurat();