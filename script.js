feather.replace();

// =====================================
// 1. DATABASE & STATE (MENDUKUNG 19 RT)
// =====================================
const databaseAkun = {
    'operator': { role: 'operator', nama: 'Operator Desa' },
    'super': { role: 'super', nama: 'Super Admin' }
};

// Data Awal Simulasi (Setiap data memiliki ID RT pengirimnya)
let dataPermohonan = [
    { id: 1, rt_id: 'RT 01', tanggal: '2026-10-05 09:55:59', tiket: 'ZG8938', nama: 'Bujang', wa: '082212345678', layanan: 'Surat Pengantar SKCK', keperluan: 'Melamar kerja', status: 'Menunggu' },
    { id: 2, rt_id: 'RT 02', tanggal: '2026-10-04 12:55:43', tiket: 'QK7474', nama: 'Ali Borkat', wa: '081387613351', layanan: 'Surat Keterangan Usaha', keperluan: 'Usaha warung sembako.', status: 'Diproses' },
    { id: 3, rt_id: 'RT 01', tanggal: '2026-10-02 10:22:15', tiket: 'OB8024', nama: 'Sumarno', wa: '082247179340', layanan: 'Surat Keterangan Domisili', keperluan: 'Pindah alamat.', status: 'Selesai' },
    { id: 4, rt_id: 'RT 15', tanggal: '2026-10-01 14:44:39', tiket: 'DK7782', nama: 'Rendra', wa: '085364685445', layanan: 'Keterangan Kelahiran', keperluan: 'Anak pertama lahir.', status: 'Menunggu' }
];

let currentUser = null; 
let currentStatusOp = 'Semua';

// =====================================
// 2. SISTEM LOGIN DINAMIS (BACA RT 1 - 19)
// =====================================
function prosesLogin(e) {
    e.preventDefault();
    let user = document.getElementById('loginUsername').value.toLowerCase().trim();
    let pass = document.getElementById('loginPassword').value;

    // Cek apakah yang login adalah RT (rt1, rt2 ... rt19)
    if (user.startsWith('rt') && pass === '123') {
        let nomorRT = parseInt(user.replace('rt', ''));
        if (nomorRT >= 1 && nomorRT <= 19) {
            // Format angka jadi 2 digit (RT 01, RT 02, dst)
            let rtFormat = nomorRT < 10 ? `RT 0${nomorRT}` : `RT ${nomorRT}`;
            currentUser = { role: 'rt', nama: `Ketua ${rtFormat}`, rt_id: rtFormat };
            masukSistem();
            return;
        }
    } 
    // Cek jika operator/super admin
    else if (databaseAkun[user] && pass === '123') {
        currentUser = databaseAkun[user];
        masukSistem();
        return;
    }

    document.getElementById('loginError').classList.remove('hidden');
}

function masukSistem() {
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginPage').style.display = 'none';
    
    // Tampilkan Dashboard yang sesuai dengan Role (Sangat Berbeda)
    if (currentUser.role === 'rt') {
        document.getElementById('dashboardRT').classList.remove('hidden');
        document.getElementById('rtNamaHeader').innerText = currentUser.nama;
        renderTabelRT(); // Hanya me-render data miliknya
    } else {
        document.getElementById('dashboardOperator').classList.remove('hidden');
        document.getElementById('opGreetingName').innerText = currentUser.nama;
        setupFilterRTDropdown();
        renderTabelOperator(); // Render semua data dengan filter
    }
    feather.replace();
}

function prosesLogout() {
    currentUser = null;
    document.getElementById('dashboardRT').classList.add('hidden');
    document.getElementById('dashboardOperator').classList.add('hidden');
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// =====================================
// 3. LOGIKA KHUSUS DASHBOARD RT
// =====================================
function kirimFormulirRT(e) {
    e.preventDefault();
    const d = new Date();
    const tgl = d.toISOString().split('T')[0];
    const jam = d.toTimeString().split(' ')[0];
    const tiket = 'TK' + Math.floor(Math.random() * 9000 + 1000);

    dataPermohonan.push({
        id: Date.now(),
        rt_id: currentUser.rt_id, // Kunci: Label data dengan ID RT pembuatnya
        tanggal: `${tgl} ${jam}`,
        tiket: tiket,
        nama: document.getElementById('rtInputNama').value,
        wa: document.getElementById('rtInputWA').value,
        layanan: document.getElementById('rtInputLayanan').value,
        keperluan: document.getElementById('rtInputKeperluan').value,
        status: 'Menunggu'
    });

    e.target.reset();
    alert(`Sukses! Laporan Anda telah dikirim ke Operator Desa.\nNomor Tiket: ${tiket}`);
    renderTabelRT();
}

function renderTabelRT() {
    const tbody = document.getElementById('tabelDataRT');
    tbody.innerHTML = '';
    
    // FILTER: Hanya ambil data permohonan yang ID RT-nya sama dengan yang sedang login!
    let dataMilikRT = dataPermohonan.filter(d => d.rt_id === currentUser.rt_id).reverse();

    dataMilikRT.forEach(data => {
        let statusStyle = data.status === 'Selesai' ? 'text-green-600' : (data.status === 'Dibatalkan' ? 'text-red-600' : 'text-orange-500');
        
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-3 px-3 text-xs font-mono">${data.tiket}</td>
            <td class="py-3 px-3 font-semibold text-slate-700">${data.nama}</td>
            <td class="py-3 px-3 text-xs">${data.layanan}</td>
            <td class="py-3 px-3 font-bold ${statusStyle}">${data.status}</td>
        `;
        tbody.appendChild(tr);
    });

    if(dataMilikRT.length === 0) tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-slate-500 italic">Belum ada laporan dari lingkungan Anda.</td></tr>`;
}

// =====================================
// 4. LOGIKA KHUSUS DASHBOARD OPERATOR
// =====================================
function setupFilterRTDropdown() {
    const dropdown = document.getElementById('opFilterRT');
    dropdown.innerHTML = '<option value="Semua">Semua RT (1-19)</option>';
    // Buat opsi RT 01 sampai RT 19
    for (let i = 1; i <= 19; i++) {
        let rtStr = i < 10 ? `RT 0${i}` : `RT ${i}`;
        dropdown.innerHTML += `<option value="${rtStr}">${rtStr}</option>`;
    }
}

function filterOpStatus(status) {
    currentStatusOp = status;
    
    // Ubah Judul Tabel
    document.getElementById('judulTabelOp').innerText = status === 'Semua' ? 'Semua Data Layanan' : `Data Layanan: ${status}`;

    // Styling Menu Aktif Sidebar Operator
    document.querySelectorAll('.op-menu').forEach(el => {
        el.classList.remove('bg-[#1e282c]', 'border-[#3c8dbc]', 'text-white');
        el.classList.add('border-transparent', 'text-slate-400');
    });
    let activeMenu = document.getElementById('menu-' + status);
    if(activeMenu) {
        activeMenu.classList.remove('border-transparent', 'text-slate-400');
        activeMenu.classList.add('bg-[#1e282c]', 'border-[#3c8dbc]', 'text-white');
    }

    renderTabelOperator();
}

function renderTabelOperator() {
    // 1. Ambil nilai filter
    const filterRT = document.getElementById('opFilterRT').value; // 'Semua' atau 'RT 01', dll.
    
    // 2. Lakukan penyaringan bertingkat (Filter RT -> Filter Status)
    let filteredData = dataPermohonan;

    // Filter berdasarkan RT (Jika Operator memilih RT tertentu)
    if (filterRT !== 'Semua') {
        filteredData = filteredData.filter(d => d.rt_id === filterRT);
    }

    // Update Angka Kartu (Berdasarkan RT yang dipilih!)
    let masuk = 0, proses = 0, selesai = 0, batal = 0;
    filteredData.forEach(d => {
        if(d.status === 'Menunggu') masuk++;
        if(d.status === 'Diproses') proses++;
        if(d.status === 'Selesai') selesai++;
        if(d.status === 'Dibatalkan') batal++;
    });
    document.getElementById('countMasuk').innerText = masuk;
    document.getElementById('countProses').innerText = proses;
    document.getElementById('countSelesai').innerText = selesai;
    document.getElementById('countBatal').innerText = batal;

    // Filter berdasarkan Status Menu Sidebar
    if (currentStatusOp !== 'Semua') {
        filteredData = filteredData.filter(d => d.status === currentStatusOp);
    }
    
    filteredData.sort((a,b) => b.id - a.id); // Teratas yang terbaru

    // 3. Render Baris HTML
    const tbody = document.getElementById('tabelDataOperator');
    tbody.innerHTML = '';

    filteredData.forEach(data => {
        let statusColor = "text-slate-600";
        if(data.status === 'Menunggu') statusColor = "text-[#00c0ef] font-bold";
        if(data.status === 'Diproses') statusColor = "text-[#f39c12] font-bold";
        if(data.status === 'Selesai') statusColor = "text-[#00a65a] font-bold";
        if(data.status === 'Dibatalkan') statusColor = "text-[#dd4b39] font-bold";

        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 text-slate-700";
        tr.innerHTML = `
            <td class="py-3 pr-2 align-top"><span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">${data.rt_id}</span></td>
            <td class="py-3 pr-2 align-top text-xs">${data.tanggal.split(' ')[0]}<br><span class="font-mono font-bold">${data.tiket}</span></td>
            <td class="py-3 pr-2 align-top text-xs"><span class="font-bold text-sm">${data.nama}</span><br>${data.wa}</td>
            <td class="py-3 pr-2 align-top text-xs"><span class="font-bold">${data.layanan}</span><br><span class="text-slate-500">${data.keperluan}</span></td>
            <td class="py-3 pr-2 align-top ${statusColor} text-xs">${data.status}</td>
            <td class="py-3 align-top text-center">
                <select onchange="ubahStatusDariOperator(${data.id}, this.value)" class="text-xs border border-slate-300 rounded p-1 focus:outline-none cursor-pointer">
                    <option value="Menunggu" ${data.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option>
                    <option value="Diproses" ${data.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
                    <option value="Selesai" ${data.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                    <option value="Dibatalkan" ${data.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if(filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-500 text-sm italic">Tidak ada data ditemukan.</td></tr>`;
    }
}

function ubahStatusDariOperator(id, newStatus) {
    const index = dataPermohonan.findIndex(d => d.id === id);
    if (index !== -1) {
        dataPermohonan[index].status = newStatus;
        renderTabelOperator(); 
    }
}
