import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCsQemf5eHXIe852eCdJUyLCWJg0dSRmic",
    authDomain: "pelanyan-desa.firebaseapp.com",
    databaseURL: "https://pelanyan-desa-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pelanyan-desa",
    storageBucket: "pelanyan-desa.firebasestorage.app",
    messagingSenderId: "591465838495",
    appId: "1:591465838495:web:23c89115c0bd01d8d0afaa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const databaseAkun = {
    'operator': { role: 'operator', nama: 'Operator Desa' },
    'super': { role: 'super', nama: 'Super Admin Pusat' }
};

let dataPermohonan = [];
let jenisLayananList = [];
let currentUser = null; 
let currentStatusOp = 'Semua';

document.addEventListener("DOMContentLoaded", () => {
    feather.replace();
    muatJenisLayanan();

    const formLogin = document.getElementById('formLogin');
    if(formLogin) {
        formLogin.addEventListener('submit', prosesLogin);
    }

    const formLaporanRT = document.getElementById('formLaporanRT');
    if(formLaporanRT) {
        formLaporanRT.addEventListener('submit', kirimFormulirRT);
    }

    const btnLogoutRT = document.getElementById('btnLogoutRT');
    if(btnLogoutRT) btnLogoutRT.addEventListener('click', prosesLogout);

    const btnLogoutOp = document.getElementById('btnLogoutOp');
    if(btnLogoutOp) btnLogoutOp.addEventListener('click', prosesLogout);

    const btnTambahLayanan = document.getElementById('btnTambahLayanan');
    if(btnTambahLayanan) btnTambahLayanan.addEventListener('click', tambahJenisLayanan);
});

onSnapshot(collection(db, "data_pelayanan"), (snapshot) => {
    dataPermohonan = [];
    snapshot.forEach((docSnap) => {
        dataPermohonan.push({ id: docSnap.id, ...docSnap.data() });
    });
    dataPermohonan.sort((a, b) => b.waktuSistem - a.waktuSistem);

    if (currentUser) {
        if (currentUser.role === 'rt') {
            renderTabelRT();
        } else {
            renderTabelOperator();
        }
    }
});

function muatJenisLayanan() {
    onSnapshot(doc(db, "pengaturan", "layanan_desa"), (docSnap) => {
        if (docSnap.exists() && docSnap.data().list) {
            jenisLayananList = docSnap.data().list;
        } else {
            jenisLayananList = [
                "Surat Pengantar SKCK",
                "Surat Keterangan Usaha",
                "Surat Keterangan Domisili"
            ];
            simpanJenisLayananKeDB();
        }
        updateDropdownLayananRT();
        if(currentUser && currentUser.role === 'super') {
            renderListLayananSuper();
        }
    });
}

async function simpanJenisLayananKeDB() {
    try {
        await setDoc(doc(db, "pengaturan", "layanan_desa"), { list: jenisLayananList });
    } catch (e) {
        console.error(e);
    }
}

function updateDropdownLayananRT() {
    const select = document.getElementById('rtInputLayanan');
    if (!select) return;
    let valSelected = select.value;
    select.innerHTML = '<option value="">Pilih Jenis Layanan...</option>';
    jenisLayananList.forEach(layanan => {
        select.innerHTML += `<option value="${layanan}">${layanan}</option>`;
    });
    select.value = valSelected;
}

function prosesLogin(event) {
    event.preventDefault();
    let user = document.getElementById('loginUsername').value.toLowerCase().trim();
    let pass = document.getElementById('loginPassword').value.trim();
    let errDiv = document.getElementById('loginError');

    if (user.startsWith('rt') && pass === '123') {
        let nomorRT = parseInt(user.replace('rt', ''));
        if (nomorRT >= 1 && nomorRT <= 19) {
            let rtFormat = nomorRT < 10 ? `RT 0${nomorRT}` : `RT ${nomorRT}`;
            currentUser = { role: 'rt', nama: `Ketua ${rtFormat}`, rt_id: rtFormat };
            errDiv.classList.add('hidden');
            bukaDashboard();
            return;
        }
    } 
    else if (databaseAkun[user] && pass === '123') {
        currentUser = databaseAkun[user];
        errDiv.classList.add('hidden');
        bukaDashboard();
        return;
    }

    errDiv.classList.remove('hidden');
}

function bukaDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    
    if (currentUser.role === 'rt') {
        document.getElementById('dashboardRT').classList.remove('hidden');
        document.getElementById('dashboardOperator').classList.add('hidden');
        document.getElementById('rtNamaHeader').innerText = currentUser.nama;
        updateDropdownLayananRT();
        renderTabelRT();
    } else {
        document.getElementById('dashboardOperator').classList.remove('hidden');
        document.getElementById('dashboardRT').classList.add('hidden');
        document.getElementById('opGreetingName').innerText = currentUser.nama;
        
        const panelSuper = document.getElementById('panelSuperAdmin');
        const sidebarTitle = document.getElementById('sidebarTitle');
        
        if (currentUser.role === 'super') {
            panelSuper.classList.remove('hidden');
            if(sidebarTitle) sidebarTitle.innerText = "Super Admin Pusat";
            renderListLayananSuper();
        } else {
            panelSuper.classList.add('hidden');
            if(sidebarTitle) sidebarTitle.innerText = "Operator Desa";
        }

        setupFilterRTDropdown();
        renderTabelOperator();
    }
    setTimeout(() => feather.replace(), 100);
}

function prosesLogout() {
    currentUser = null;
    document.getElementById('dashboardRT').classList.add('hidden');
    document.getElementById('dashboardOperator').classList.add('hidden');
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

async function tambahJenisLayanan() {
    let input = document.getElementById('inputLayananBaru');
    let namaLayanan = input.value.trim();
    if(!namaLayanan) {
        alert("Nama layanan tidak boleh kosong!");
        return;
    }
    if(jenisLayananList.includes(namaLayanan)) {
        alert("Jenis layanan tersebut sudah ada!");
        return;
    }
    jenisLayananList.push(namaLayanan);
    await simpanJenisLayananKeDB();
    input.value = '';
    renderListLayananSuper();
    alert("Jenis layanan berhasil ditambahkan!");
}

window.hapusJenisLayanan = async function(index) {
    if(jenisLayananList.length <= 1) {
        alert("Minimal harus ada 1 jenis layanan aktif.");
        return;
    }
    if(confirm(`Yakin ingin menghapus layanan "${jenisLayananList[index]}"?`)) {
        jenisLayananList.splice(index, 1);
        await simpanJenisLayananKeDB();
        renderListLayananSuper();
    }
}

function renderListLayananSuper() {
    const container = document.getElementById('daftarListLayanan');
    if(!container) return;
    container.innerHTML = '';
    jenisLayananList.forEach((layanan, index) => {
        let tag = document.createElement('div');
        tag.className = "bg-purple-100 border border-purple-300 text-purple-900 text-xs md:text-sm px-3 py-1.5 rounded-lg flex items-center gap-3 font-semibold shadow-sm";
        tag.innerHTML = `<span>📄 ${layanan}</span> <button onclick="hapusJenisLayanan(${index})" class="bg-rose-500 hover:bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs transition" title="Hapus">&times;</button>`;
        container.appendChild(tag);
    });
}

function kompresGambar(file, maxWidth = 800, quality = 0.6) {
    return new Promise((resolve) => {
        if (file.type === "application/pdf") {
            resolve(file);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            }
        }
    });
}

async function kirimFormulirRT(e) {
    e.preventDefault();
    const btnKirim = document.getElementById('btnKirim');
    
    const d = new Date();
    const tgl = d.toISOString().split('T')[0];
    const jam = d.toTimeString().split(' ')[0];
    const tiket = 'TK' + Math.floor(Math.random() * 9000 + 1000);

    const fileInput = document.getElementById('rtInputBerkas');
    const file = fileInput.files[0];

    if (!file) {
        alert("Silakan pilih berkas terlebih dahulu.");
        return;
    }

    btnKirim.innerText = "Mengompres & Mengunggah...";
    btnKirim.disabled = true;
    btnKirim.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        let fileBase64 = "";
        if (file.type === "application/pdf") {
            if (file.size > 700000) {
                throw new Error("Ukuran file PDF terlalu besar (Maksimal 500 KB).");
            }
            fileBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target.result);
                reader.readAsDataURL(file);
            });
        } else {
            fileBase64 = await kompresGambar(file, 800, 0.6);
        }

        await addDoc(collection(db, "data_pelayanan"), {
            rt_id: currentUser.rt_id,
            tanggal: `${tgl} ${jam}`,
            tiket: tiket,
            nama: document.getElementById('rtInputNama').value,
            wa: document.getElementById('rtInputWA').value,
            layanan: document.getElementById('rtInputLayanan').value,
            keperluan: document.getElementById('rtInputKeperluan').value,
            namaFile: file.name,
            fileData: fileBase64,
            status: 'Menunggu',
            waktuSistem: Date.now()
        });

        document.getElementById('rtInputNama').value = '';
        document.getElementById('rtInputWA').value = '';
        document.getElementById('rtInputLayanan').value = '';
        document.getElementById('rtInputKeperluan').value = '';
        fileInput.value = '';
        
        alert(`Sukses! Data & Berkas berhasil dikirim.\nNomor Tiket: ${tiket}`);
    } catch (error) {
        alert("Gagal memproses berkas: " + error.message);
    }

    btnKirim.innerText = "Kirim Data & Berkas ke Desa";
    btnKirim.disabled = false;
    btnKirim.classList.remove('opacity-50', 'cursor-not-allowed');
}

function renderTabelRT() {
    const tbody = document.getElementById('tabelDataRT');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    let dataMilikRT = dataPermohonan.filter(d => d.rt_id === currentUser.rt_id);

    dataMilikRT.forEach(data => {
        let statusStyle = data.status === 'Selesai' ? 'text-green-600' : (data.status === 'Dibatalkan' ? 'text-red-600' : 'text-orange-500');
        
        let waClean = data.wa.replace(/[^0-9]/g, '');
        if (waClean.startsWith('0')) {
            waClean = '62' + waClean.substring(1);
        }

        let pesanWA = `Halo Bpk/Ibu ${data.nama}, permohonan layanan *${data.layanan}* Anda di lingkungan ${data.rt_id} telah dikirim ke Kantor Desa.\n\nNomor Tiket Anda: *${data.tiket}*\nStatus: *${data.status}*\n\nSimpan pesan ini sebagai bukti pengajuan sah. Terima kasih.`;
        let linkWA = `https://wa.me/${waClean}?text=${encodeURIComponent(pesanWA)}`;

        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-3 px-3 text-xs font-mono align-top">${data.tiket}</td>
            <td class="py-3 px-3 font-semibold text-slate-700 align-top">${data.nama}</td>
            <td class="py-3 px-3 text-xs align-top">
                ${data.layanan}
                <div class="mt-1 text-blue-500 flex items-center gap-1"><i data-feather="paperclip" class="w-3 h-3"></i> ${data.namaFile}</div>
            </td>
            <td class="py-3 px-3 font-bold ${statusStyle} align-top">
                ${data.status}
                <div class="mt-2">
                    <a href="${linkWA}" target="_blank" class="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded text-[11px] font-bold shadow-sm transition">
                        <i data-feather="message-circle" class="w-3 h-3"></i> Kirim WA ke Warga
                    </a>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if(dataMilikRT.length === 0) tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-slate-500 italic">Belum ada laporan dari lingkungan Anda.</td></tr>`;
    feather.replace();
}

function setupFilterRTDropdown() {
    const dropdown = document.getElementById('opFilterRT');
    if(!dropdown) return;
    dropdown.innerHTML = '<option value="Semua">Semua RT (1-19)</option>';
    for (let i = 1; i <= 19; i++) {
        let rtStr = i < 10 ? `RT 0${i}` : `RT ${i}`;
        dropdown.innerHTML += `<option value="${rtStr}">${rtStr}</option>`;
    }
}

window.filterOpStatus = function(status) {
    currentStatusOp = status;
    let judul = document.getElementById('judulTabelOp');
    if(judul) judul.innerText = status === 'Semua' ? 'Semua Data Layanan' : `Data Layanan: ${status}`;
    
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

window.renderTabelOperator = function() {
    const filterRTEl = document.getElementById('opFilterRT');
    const filterRT = filterRTEl ? filterRTEl.value : 'Semua'; 
    let filteredData = dataPermohonan;

    if (filterRT !== 'Semua') {
        filteredData = filteredData.filter(d => d.rt_id === filterRT);
    }

    let masuk = 0, proses = 0, selesai = 0, batal = 0;
    filteredData.forEach(d => {
        if(d.status === 'Menunggu') masuk++;
        if(d.status === 'Diproses') proses++;
        if(d.status === 'Selesai') selesai++;
        if(d.status === 'Dibatalkan') batal++;
    });
    
    if(document.getElementById('countMasuk')) document.getElementById('countMasuk').innerText = masuk;
    if(document.getElementById('countProses')) document.getElementById('countProses').innerText = proses;
    if(document.getElementById('countSelesai')) document.getElementById('countSelesai').innerText = selesai;
    if(document.getElementById('countBatal')) document.getElementById('countBatal').innerText = batal;

    if (currentStatusOp !== 'Semua') {
        filteredData = filteredData.filter(d => d.status === currentStatusOp);
    }

    const tbody = document.getElementById('tabelDataOperator');
    if(!tbody) return;
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
            <td class="py-3 pr-2 align-top text-xs">
                <span class="font-bold">${data.layanan}</span><br>
                <span class="text-slate-500">${data.keperluan}</span>
                <div class="mt-2">
                    <button onclick="lihatBerkas('${data.id}')" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium">
                        <i data-feather="external-link" class="w-3 h-3"></i> Cek Berkas Lampiran
                    </button>
                </div>
            </td>
            <td class="py-3 pr-2 align-top ${statusColor} text-xs">${data.status}</td>
            <td class="py-3 align-top text-center">
                <div class="flex items-center justify-center gap-2">
                    <select onchange="ubahStatusDariOperator('${data.id}', this.value)" class="text-xs border border-slate-300 rounded p-1 focus:outline-none cursor-pointer">
                        <option value="Menunggu" ${data.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option>
                        <option value="Diproses" ${data.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
                        <option value="Selesai" ${data.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                        <option value="Dibatalkan" ${data.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
                    </select>
                    <button onclick="hapusLaporanOperator('${data.id}')" class="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded text-xs transition" title="Hapus">
                        <i data-feather="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if(filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-500 text-sm italic">Tidak ada data ditemukan.</td></tr>`;
    }
    feather.replace();
}

window.lihatBerkas = function(id) {
    const data = dataPermohonan.find(d => d.id === id);
    if(data && data.fileData) {
        let newWindow = window.open();
        if(!newWindow) {
            alert("Browser memblokir Pop-up! Izinkan pop-up.");
            return;
        }
        if (data.fileData.startsWith("data:image")) {
            newWindow.document.write(`<body style="margin:0; background:#222; display:flex; justify-content:center; align-items:center; height:100vh;"><img src="${data.fileData}" style="max-width:100%; max-height:100vh; object-fit:contain;" /></body>`);
        } else {
            newWindow.document.write(`<body style="margin:0;"><iframe src="${data.fileData}" frameborder="0" style="border:0; width:100vw; height:100vh;" allowfullscreen></iframe></body>`);
        }
    } else {
        alert("Berkas tidak ditemukan.");
    }
}

window.ubahStatusDariOperator = async function(id, newStatus) {
    try {
        await updateDoc(doc(db, "data_pelayanan", id), { status: newStatus });
    } catch (error) {
        alert("Gagal memperbarui status: " + error.message);
    }
}

window.hapusLaporanOperator = async function(id) {
    if(confirm("Yakin ingin menghapus permanen laporan ini?")) {
        try {
            await deleteDoc(doc(db, "data_pelayanan", id));
            alert("Laporan berhasil dihapus.");
        } catch (error) {
            alert("Gagal menghapus: " + error.message);
        }
    }
}
