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

function updateDropdownLayananRT
