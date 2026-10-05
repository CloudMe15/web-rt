// Mengimpor library Firebase Firestore secara Modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Konfigurasi Firebase dari akun Anda
const firebaseConfig = {
    apiKey: "AIzaSyCsQemf5eHXIe852eCdJUyLCWJg0dSRmic",
    authDomain: "pelanyan-desa.firebaseapp.com",
    databaseURL: "https://pelanyan-desa-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pelanyan-desa",
    storageBucket: "pelanyan-desa.firebasestorage.app",
    messagingSenderId: "591465838495",
    appId: "1:591465838495:web:23c89115c0bd01d8d0afaa"
};

// Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inisialisasi Icon
feather.replace();

const databaseAkun = {
    'operator': { role: 'operator', nama: 'Operator Desa' },
    'super': { role: 'super', nama: 'Super Admin' }
};

let dataPermohonan = [];
let currentUser = null; 
let currentStatusOp = 'Semua';

// =====================================
// LISTENER REAL-TIME FIREBASE
// =====================================
onSnapshot(collection(db, "data_pelayanan"), (snapshot) => {
    dataPermohonan = [];
    snapshot.forEach((doc) => {
        dataPermohonan.push({ id: doc.id, ...doc.data() });
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

// =====================================
// LOGIKA LOGIN
// =====================================
window.prosesLogin = function(e) {
    e.preventDefault();
    let user = document.getElementById('loginUsername').value.toLowerCase().trim();
    let pass = document.getElementById('loginPassword').value;

    if (user.startsWith('rt') && pass === '123') {
        let nomorRT = parseInt(user.replace('rt', ''));
        if (nomorRT >= 1 && nomorRT <= 19) {
            let rtFormat = nomorRT < 10 ? `RT 0${nomorRT}` : `RT ${nomorRT}`;
            currentUser = { role: 'rt', nama: `Ketua ${rtFormat}`, rt_id: rtFormat };
            masukSistem();
            return;
        }
    } 
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
    
    if (currentUser.role === 'rt') {
        document.getElementById('dashboardRT').classList.remove('hidden');
        document.getElementById('rtNamaHeader').innerText = currentUser.nama;
        renderTabelRT();
    } else {
        document.getElementById('dashboardOperator').classList.min?.('hidden') || document.getElementById('dashboardOperator').classList.remove('hidden');
        document.getElementById('opGreetingName').innerText = currentUser.nama;
        setupFilterRTDropdown();
        renderTabelOperator();
    }
    feather.replace();
}

window.prosesLogout = function() {
    currentUser = null;
    document.getElementById('dashboardRT').classList.add('hidden');
    document.getElementById('dashboardOperator').classList.add('hidden');
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// =====================================
// LOGIKA RT (KIRIM DATA & UPLOAD)
// =====================================
window.kirimFormulirRT = async function(e) {
    e.preventDefault();
    const btnKirim = document.getElementById('btnKirim');
    
    const d = new Date();
    const tgl = d.toISOString().split('T')[0];
    const jam = d.toTimeString().split(' ')[0];
    const tiket = 'TK' + Math.floor(Math.random() * 9000 + 1000);

    const fileInput = document.getElementById('rtInputBerkas');
    const file = fileInput.files[0];

    if (file && file.size > 500000) {
        alert("Maaf, ukuran file terlalu besar! Maksimal 500 KB.\nSilakan kecilkan ukuran foto Anda terlebih dahulu.");
        return;
    }

    btnKirim.innerText = "Mengunggah ke Server...";
    btnKirim.disabled = true;
    btnKirim.classList.add('opacity-50', 'cursor-not-allowed');

    const reader = new FileReader();
    reader.onload = async function(eResult) {
        const fileBase64 = eResult.target.result;

        try {
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
            
            alert(`Sukses! Data telah tersimpan permanen di Server Desa.\nNomor Tiket: ${tiket}`);
        } catch (error) {
            alert("Gagal terhubung ke database. Error: " + error.message);
        }

        btnKirim.innerText = "Kirim Data & Berkas ke Desa";
        btnKirim.disabled = false;
        btnKirim.classList.remove('opacity-50', 'cursor-not-allowed');
    };
    
    if(file) reader.readAsDataURL(file); 
}

function renderTabelRT() {
    const tbody = document.getElementById('tabelDataRT');
    tbody.innerHTML = '';
    
    let dataMilikRT = dataPermohonan.filter(d => d.rt_id === currentUser.rt_id);

    dataMilikRT.forEach(data => {
        let statusStyle = data.status === 'Selesai' ? 'text-green-600' : (data.status === 'Dibatalkan' ? 'text-red-600' : 'text-orange-500');
        
        // Membersihkan format nomor HP untuk tautan WhatsApp (mengubah 08... menjadi 628...)
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

// =====================================
// LOGIKA OPERATOR
// =====================================
function setupFilterRTDropdown() {
    const dropdown = document.getElementById('opFilterRT');
    dropdown.innerHTML = '<option value="Semua">Semua RT (1-19)</option>';
    for (let i = 1; i <= 19; i++) {
        let rtStr = i < 10 ? `RT 0${i}` : `RT ${i}`;
        dropdown.innerHTML += `<option value="${rtStr}">${rtStr}</option>`;
    }
}

window.filterOpStatus = function(status) {
    currentStatusOp = status;
    document.getElementById('judulTabelOp').innerText = status === 'Semua' ? 'Semua Data Layanan' : `Data Layanan: ${status}`;
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
    const filterRT = document.getElementById('opFilterRT').value; 
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
    document.getElementById('countMasuk').innerText = masuk;
    document.getElementById('countProses').innerText = proses;
    document.getElementById('countSelesai').innerText = selesai;
    document.getElementById('countBatal').innerText = batal;

    if (currentStatusOp !== 'Semua') {
        filteredData = filteredData.filter(d => d.status === currentStatusOp);
    }

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
                <select onchange="ubahStatusDariOperator('${data.id}', this.value)" class="text-xs border border-slate-300 rounded p-1 focus:outline-none cursor-pointer">
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
    feather.replace();
}

window.lihatBerkas = function(id) {
    const data = dataPermohonan.find(d => d.id === id);
    if(data && data.fileData) {
        let newWindow = window.open();
        if(!newWindow) {
            alert("Browser Anda memblokir Pop-up! Izinkan pop-up untuk melihat berkas.");
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
        await updateDoc(doc(db, "data_pelayanan", id), {
            status: newStatus
        });
    } catch (error) {
        alert("Gagal memperbarui status: " + error.message);
    }
}
