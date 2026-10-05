feather.replace();

let currentRole = 'warga';
let currentTab = 'administrasi';

// Data surat sekarang memiliki kolom dokumen
let suratData = [
    { id: 1, nama: 'Budi Santoso', jenis: 'Pengantar SKCK', dokumen: 'KTP_Budi.jpg', status: 'Diterima' },
    { id: 2, nama: 'Siti Rahma', jenis: 'Surat Domisili', dokumen: 'Berkas_Pindah.pdf', status: 'Menunggu' }
];

let daftarModul = ['administrasi', 'kependudukan', 'superadmin'];

// FUNGSI NAVIGASI
function setTab(tabName) {
    currentTab = tabName;
    
    daftarModul.forEach(t => {
        let contentEl = document.getElementById('content-' + t);
        let btnEl = document.getElementById('tab-' + t);
        
        if(contentEl) contentEl.classList.add('hidden');
        if(btnEl) {
            if (t === 'superadmin') {
                btnEl.className = "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-100";
            } else {
                btnEl.className = "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-100";
            }
        }
    });

    let activeContent = document.getElementById('content-' + tabName);
    let activeBtn = document.getElementById('tab-' + tabName);
    
    if(activeContent) activeContent.classList.remove('hidden');
    if(activeBtn) {
        if (tabName === 'superadmin') {
            activeBtn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-slate-800 text-white shadow";
        } else {
            activeBtn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-emerald-600 text-white shadow";
        }
    }
}

// FUNGSI PERUBAHAN PERAN (WARGA / RT / SUPER ADMIN)
function setRole(role) {
    currentRole = role;
    
    const btnWarga = document.getElementById('btnRoleWarga');
    const btnRT = document.getElementById('btnRoleRT');
    const btnSuper = document.getElementById('btnRoleSuper');
    const roleDisplay = document.getElementById('roleDisplay');
    const tabSuper = document.getElementById('tab-superadmin');

    // Reset warna tombol
    btnWarga.className = "px-3 py-1 text-sm font-semibold rounded-md transition text-white hover:bg-emerald-700";
    btnRT.className = "px-3 py-1 text-sm font-semibold rounded-md transition text-white hover:bg-emerald-700";
    btnSuper.className = "px-3 py-1 text-sm font-semibold rounded-md transition text-white hover:bg-emerald-700";
    tabSuper.classList.add('hidden');

    if (role === 'warga') {
        btnWarga.classList.add('bg-white', 'text-emerald-800', 'shadow');
        btnWarga.classList.remove('text-white');
        roleDisplay.innerHTML = `<i data-feather="user-check" class="text-emerald-600"></i> Warga Lingkungan`;
        document.getElementById('formPengajuanWarga').style.display = 'block';
        if(currentTab === 'superadmin') setTab('administrasi');
        
    } else if (role === 'rt') {
        btnRT.classList.add('bg-amber-400', 'text-slate-900', 'shadow');
        btnRT.classList.remove('text-white');
        roleDisplay.innerHTML = `<i data-feather="shield" class="text-emerald-600"></i> Ketua RT (Admin)`;
        document.getElementById('formPengajuanWarga').style.display = 'none';
        if(currentTab === 'superadmin') setTab('administrasi');

    } else if (role === 'superadmin') {
        btnSuper.classList.add('bg-slate-900', 'text-emerald-400', 'shadow');
        btnSuper.classList.remove('text-white');
        roleDisplay.innerHTML = `<i data-feather="terminal" class="text-slate-800"></i> Super Admin`;
        document.getElementById('formPengajuanWarga').style.display = 'none';
        tabSuper.classList.remove('hidden'); // Munculkan menu modul sistem
        tabSuper.classList.add('flex');
    }
    
    feather.replace(); 
    renderSurat(); 
}

// FUNGSI RENDER TABEL & DOKUMEN
function renderSurat() {
    const tbody = document.getElementById('tabelSurat');
    tbody.innerHTML = ''; 
    
    const thAksi = document.querySelectorAll('.aksi-rt');
    // Kolom aksi muncul jika role adalah RT atau Super Admin
    thAksi.forEach(th => (currentRole === 'rt' || currentRole === 'superadmin') ? th.classList.remove('hidden') : th.classList.add('hidden'));

    suratData.forEach(surat => {
        let badgeColor = surat.status === 'Diterima' ? 'bg-emerald-100 text-emerald-700' : 
                         surat.status === 'Ditolak' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
        
        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50";
        
        let htmlContent = `
            <td class="py-3 px-3 font-medium text-slate-700">${surat.nama}</td>
            <td class="py-3 px-3">${surat.jenis}</td>
            <td class="py-3 px-3">
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                    <i data-feather="paperclip" class="w-3 h-3"></i> ${surat.dokumen}
                </span>
            </td>
            <td class="py-3 px-3"><span class="px-2 py-1 rounded text-xs font-semibold ${badgeColor}">${surat.status}</span></td>
        `;

        if (currentRole === 'rt' || currentRole === 'superadmin') {
            if (surat.status === 'Menunggu') {
                htmlContent += `
                    <td class="py-3 px-3 text-center space-x-1">
                        <button onclick="lihatDokumen('${surat.dokumen}')" class="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs hover:bg-blue-100 transition">Cek Berkas</button>
                        <button onclick="updateStatus(${surat.id}, 'Diterima')" class="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-xs hover:bg-emerald-100 transition">Terima</button>
                        <button onclick="updateStatus(${surat.id}, 'Ditolak')" class="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded text-xs hover:bg-rose-100 transition">Tolak</button>
                    </td>`;
            } else {
                htmlContent += `
                    <td class="py-3 px-3 text-center space-x-1">
                        <button onclick="lihatDokumen('${surat.dokumen}')" class="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs hover:bg-blue-100 transition">Cek Berkas</button>
                    </td>`;
            }
        }

        tr.innerHTML = htmlContent;
        tbody.appendChild(tr);
    });
    feather.replace();
}

// FUNGSI CEK DOKUMEN (Admin / RT)
function lihatDokumen(namaFile) {
    alert("Membuka dokumen: " + namaFile + "\n\n(Catatan: Karena ini simulasi tanpa database, dokumen tidak benar-benar terbuka, namun logika sistem sudah siap untuk dikembangkan).");
}

// FUNGSI UPLOAD SURAT (Warga)
function ajukanSurat(e) {
    e.preventDefault(); 
    
    const nama = document.getElementById('inputNamaSurat').value;
    const jenis = document.getElementById('inputJenisSurat').value;
    const fileInput = document.getElementById('inputDokumen');
    
    // Mengambil nama file yang diupload (simulasi)
    let namaFile = fileInput.files.length > 0 ? fileInput.files[0].name : 'Tanpa_Dokumen.pdf';
    
    suratData.unshift({
        id: Date.now(),
        nama: nama,
        jenis: jenis,
        dokumen: namaFile,
        status: 'Menunggu'
    });
    
    document.getElementById('inputNamaSurat').value = ''; 
    fileInput.value = '';
    renderSurat(); 
}

function updateStatus(id, newStatus) {
    const index = suratData.findIndex(s => s.id === id);
    if (index !== -1) {
        suratData[index].status = newStatus;
        renderSurat();
    }
}

// FUNGSI SUPER ADMIN: TAMBAH MODUL DINAMIS
function tambahModulBaru(e) {
    e.preventDefault();
    const namaModul = document.getElementById('inputNamaModul').value;
    const idModul = 'modul-' + Date.now(); // Buat ID unik
    
    // 1. Tambahkan ID ke daftar modul
    daftarModul.push(idModul);
    
    // 2. Buat tombol di sidebar
    const sidebar = document.getElementById('sidebarMenu');
    const btnBaru = document.createElement('button');
    btnBaru.id = `tab-${idModul}`;
    btnBaru.onclick = () => setTab(idModul);
    btnBaru.className = "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 mt-1";
    btnBaru.innerHTML = `<i data-feather="box"></i> ${namaModul}`;
    sidebar.appendChild(btnBaru);
    
    // 3. Buat konten kosong untuk modul baru
    const mainContent = document.getElementById('mainContent');
    const divBaru = document.createElement('div');
    divBaru.id = `content-${idModul}`;
    divBaru.className = "hidden space-y-6 animasi-muncul";
    divBaru.innerHTML = `
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold mb-4">${namaModul}</h3>
            <p class="text-sm text-slate-500">Ini adalah halaman modul baru yang ditambahkan oleh Super Admin. Anda bisa menambahkan fitur kustom di sini nantinya.</p>
        </div>
    `;
    mainContent.appendChild(divBaru);
    
    alert(`Modul "${namaModul}" berhasil ditambahkan ke menu!`);
    document.getElementById('inputNamaModul').value = '';
    feather.replace();
}

renderSurat();
// Set warna awal untuk tab aktif
setTab('administrasi');
