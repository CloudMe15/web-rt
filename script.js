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

// Inisialisasi otomatis saat web dibuka
document.addEventListener("DOMContentLoaded", () => {
    feather.replace();
    muatJenisLayanan();
});

// Listener Real-Time Firestore
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
        console.error("Gagal simpan layanan: ", e);
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

// FUNGSI UTAMA LOGIN (DIPASTIKAN BERJALAN GLOBAL)
window.prosesLogin = function(event) {
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

window.prosesLogout = function() {
    currentUser = null;
    document.getElementById('dashboardRT').classList.add('hidden');
    document.getElementById('dashboardOperator').classList.add('hidden');
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// Super Admin: Tamb
