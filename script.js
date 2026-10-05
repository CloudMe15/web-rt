// =====================================
// FITUR SUPER ADMIN: KELOLA LAYANAN
// =====================================
window.tambahJenisLayanan = async function() {
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
    alert("Jenis layanan baru berhasil ditambahkan secara real-time!");
}

window.hapusJenisLayanan = async function(index) {
    if(jenisLayananList.length <= 1) {
        alert("Minimal harus ada 1 jenis layanan aktif di sistem desa.");
        return;
    }
    if(confirm(`Yakin ingin menghapus jenis layanan "${jenisLayananList[index]}" dari daftar desa?`)) {
        jenisLayananList.splice(index, 1);
        await simpanJenisLayananKeDB();
        renderListLayananSuper();
        alert("Jenis layanan berhasil dihapus.");
    }
}

function renderListLayananSuper() {
    const container = document.getElementById('daftarListLayanan');
    if(!container) return;
    container.innerHTML = '';
    jenisLayananList.forEach((layanan, index) => {
        let tag = document.createElement('div');
        tag.className = "bg-purple-100 border border-purple-300 text-purple-900 text-xs md:text-sm px-3 py-1.5 rounded-lg flex items-center gap-3 font-semibold shadow-sm";
        tag.innerHTML = `
            <span>📄 ${layanan}</span> 
            <button onclick="hapusJenisLayanan(${index})" class="bg-rose-500 hover:bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs transition" title="Hapus Layanan">&times;</button>
        `;
        container.appendChild(tag);
    });
}
