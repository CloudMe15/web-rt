
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";


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
        document.getElementById('dashboardOperator').classList.remove('hidden');
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
// FUNGSI BANTU: AUTO-COMPRESS GAMBAR
// =====================================
function kompresGambar(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        // Jika file berupa PDF, tidak perlu dikompres dengan canvas
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

                // Ubah ke format Base64 terkompresi
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            }
        }
    });
}

// =====================================
// LOGIKA RT (KIRIM DATA & AUTO COMPRESS)
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
            // Cek ukuran PDF mentah
            if (file.size > 700000) {
                throw new Error("Ukuran file PDF terlalu besar (Maksimal 500 KB).");
            }
            // Ubah PDF ke Base64 langsung
            fileBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target.result);
                reader.readAsDataURL(file);
            });
        } else {
            // Otomatis kompres gambar agar ukurannya dijamin aman di bawah 500 KB
            fileBase64 = await kompresGambar(file, 800, 0.6);
        }

        // Kirim data ke Firebase Firestore
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
        
        alert(`Sukses! Data & Berkas berhasil dikompres otomatis dan dikirim.\nNomor Tiket: ${tiket}`);
    } catch (error) {
        alert("Gagal memproses berkas: " + error.message);
    }

    btnKirim.innerText = "Kirim Data & Berkas ke Desa";
    btnKirim.disabled = false;
    btnKirim.classList.remove('opacity-50', 'cursor-not-allowed');
}

function renderTabelRT() {
    const tbody = document.getElementById('tabelDataRT');
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

// =====================================
// LOGIKA OPERATOR
// =====================================
function setupFilterRTDropdown() {
