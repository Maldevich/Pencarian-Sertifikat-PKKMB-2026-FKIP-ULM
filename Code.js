/*
 * Konfigurasi untuk GitHub Pages.
 *
 * 1. Aktifkan Google Sheets API di Google Cloud Console.
 * 2. Buat API key, lalu batasi dengan HTTP referrer, misalnya:
 *    https://NAMA-AKUN.github.io/*
 * 3. Masukkan API key tersebut di bawah ini.
 * 4. Pastikan spreadsheet dibagikan sebagai "Siapa saja yang memiliki link: Viewer".
 *
 * Catatan: API key di aplikasi web memang dapat terlihat di browser. Pembatasan
 * referrer dan pembatasan hanya untuk Google Sheets API wajib diterapkan.
 */
const CONFIG = {
  spreadsheetId: '1npt8_6xfCa0flczF8RxuMt4-fx5HgtW2o-BSON7kcfI',
  range: 'Cari Sertifikat!A2:E',
  apiKey: 'GANTI_DENGAN_GOOGLE_SHEETS_API_KEY',
};

const RESULT_HEADINGS = ['Nama', 'NIM', 'Program Studi', 'Angkatan', 'Link Sertifikat'];

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value == null ? '' : String(value);
  return node.innerHTML;
}

function certificateCell(value) {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url)) return escapeHtml(value);
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Lihat sertifikat ↗</a>`;
}

function setSearchButton(isLoading) {
  const button = document.getElementById('search-button');
  button.disabled = isLoading;
  button.innerHTML = isLoading ? 'Memuat…' : 'Cari data <span aria-hidden="true">→</span>';
}

function showMessage(message, className = 'message') {
  document.getElementById('search-results').innerHTML = `<div class="${className}">${message}</div>`;
}

async function getCertificateRows() {
  if (CONFIG.apiKey === 'GANTI_DENGAN_GOOGLE_SHEETS_API_KEY') throw new Error('API_KEY_MISSING');

  const endpoint = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${encodeURIComponent(CONFIG.range)}`
  );
  endpoint.searchParams.set('key', CONFIG.apiKey);

  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`SHEETS_API_${response.status}`);

  const payload = await response.json();
  return payload.values || [];
}

function createTable(dataArray) {
  if (!dataArray.length) {
    showMessage('Data tidak ditemukan. Apabila ada permasalahan, silakan hubungi Bidang Kemahasiswaan dan Alumni FKIP ULM.');
    return;
  }

  const header = RESULT_HEADINGS.map((item) => `<th scope="col">${item}</th>`).join('');
  const rows = dataArray.map((row) => {
    const cells = RESULT_HEADINGS.map((_, index) => {
      const value = row[index] || '';
      return `<td>${index === 4 ? certificateCell(value) : escapeHtml(value)}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  document.getElementById('search-results').innerHTML =
    `<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const searchText = form.searchtext.value.trim();
  if (!searchText) return;

  showMessage('<div class="loading"><span class="spinner"></span>Mencari data Anda…</div>', 'empty-state');
  setSearchButton(true);

  try {
    const rows = await getCertificateRows();
    const matches = rows.filter((row) => row.some((cell) => String(cell).trim() === searchText));
    createTable(matches);
    form.reset();
  } catch (error) {
    console.error(error);
    showMessage(error.message === 'API_KEY_MISSING'
      ? 'Situs belum dikonfigurasi. Masukkan Google Sheets API key pada berkas Code.js.'
      : 'Terjadi kendala saat mengambil data. Silakan coba kembali.');
  } finally {
    setSearchButton(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-form').addEventListener('submit', handleFormSubmit);
});
