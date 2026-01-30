document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('titleInput');
    const contentInput = document.getElementById('contentInput');
    const addBtn = document.getElementById('addBtn');
    const toggleBulkBtn = document.getElementById('toggleBulkBtn');
    const singleInputFields = document.getElementById('singleInputFields');
    const bulkInputFields = document.getElementById('bulkInputFields');
    const bulkRowsContainer = document.getElementById('bulkRowsContainer');
    const addBulkRowBtn = document.getElementById('addBulkRowBtn');
    const listContainer = document.getElementById('listContainer');
    const searchInput = document.getElementById('searchInput');
    const toast = document.getElementById('toast');

    let isBulkMode = false;
    let phrases = [];

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    async function fetchPhrases() {
        try {
            const response = await fetch('/api/phrases');
            if (response.ok) {
                phrases = await response.json();
                renderPhrases(searchInput.value);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showToast('データの取得に失敗しました ❌');
        }
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('クリップボードにコピーしました！ ✨');
        } catch (err) {
            console.error('Failed to copy: ', err);
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast('コピーしました！ ✨');
            } catch (err) {
                showToast('コピーに失敗しました ❌');
            }
            document.body.removeChild(textArea);
        }
    }

    function renderPhrases(filter = '') {
        listContainer.innerHTML = '';

        const filteredPhrases = phrases.filter(p =>
            p.title.toLowerCase().includes(filter.toLowerCase()) ||
            p.content.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredPhrases.length === 0) {
            listContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary); background: var(--card-bg); border-radius: 2rem; border: 1px dashed var(--card-border);">一致する定型文が見つかりません</div>';
            return;
        }

        filteredPhrases.forEach((phrase, index) => {
            const card = document.createElement('div');
            card.className = 'phrase-card';
            card.style.animation = `fadeIn 0.5s ease backwards ${index * 0.05}s`;
            card.innerHTML = `
                <div class="phrase-header">
                    <span class="phrase-title">${phrase.title}</span>
                    <button class="btn-icon btn-delete" title="削除">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
                <div class="phrase-content">${phrase.content}</div>
                <div class="phrase-actions">
                    <button class="btn btn-primary" style="width: 100%;">Click to Copy</button>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-delete')) return;
                copyToClipboard(phrase.content);
                card.style.transform = 'scale(0.98)';
                setTimeout(() => card.style.transform = '', 100);
            });

            const deleteBtn = card.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('この定型文を削除してもよろしいですか？')) {
                    try {
                        const response = await fetch(`/api/phrases?id=${phrase.id}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            fetchPhrases();
                            showToast('削除しました 🗑️');
                        }
                    } catch (error) {
                        showToast('削除に失敗しました ❌');
                    }
                }
            });

            listContainer.appendChild(card);
        });
    }

    function createBulkRow() {
        const row = document.createElement('div');
        row.className = 'bulk-row';
        row.style.background = 'rgba(0,0,0,0.2)';
        row.style.padding = '1rem';
        row.style.borderRadius = '1rem';
        row.style.border = '1px solid var(--card-border)';
        row.style.position = 'relative';
        row.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <input type="text" class="bulk-title" placeholder="タイトル (例: 会議連絡)" style="background: rgba(0,0,0,0.3);">
                <textarea class="bulk-content" placeholder="定型文を入力してください..." style="background: rgba(0,0,0,0.3); min-height: 80px;"></textarea>
            </div>
            <button class="remove-bulk-row" style="position: absolute; top: -10px; right: -10px; background: var(--danger); color: white; border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">✕</button>
        `;

        row.querySelector('.remove-bulk-row').addEventListener('click', () => {
            row.remove();
            if (bulkRowsContainer.children.length === 0) createBulkRow();
        });

        bulkRowsContainer.appendChild(row);
    }

    toggleBulkBtn.addEventListener('click', () => {
        isBulkMode = !isBulkMode;
        if (isBulkMode) {
            singleInputFields.style.display = 'none';
            bulkInputFields.style.display = 'block';
            toggleBulkBtn.textContent = '通常登録に戻す';
            addBtn.textContent = 'D1へ一括保存';
            if (bulkRowsContainer.children.length === 0) {
                createBulkRow();
                createBulkRow();
                createBulkRow(); // 最初に3つくらい出しておく
            }
        } else {
            singleInputFields.style.display = 'block';
            bulkInputFields.style.display = 'none';
            toggleBulkBtn.textContent = '一括モード切替';
            addBtn.textContent = '定型文を登録';
        }
    });

    addBulkRowBtn.addEventListener('click', (e) => {
        e.preventDefault();
        createBulkRow();
    });

    addBtn.addEventListener('click', async () => {
        if (isBulkMode) {
            const rows = bulkRowsContainer.querySelectorAll('.bulk-row');
            const data = [];

            rows.forEach(row => {
                const title = row.querySelector('.bulk-title').value.trim();
                const content = row.querySelector('.bulk-content').value.trim();
                if (title && content) {
                    data.push({ title, content });
                }
            });

            if (data.length === 0) {
                showToast('タイトルと本文を入力してください ⚠️');
                return;
            }

            try {
                const response = await fetch('/api/phrases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    fetchPhrases();
                    bulkRowsContainer.innerHTML = '';
                    createBulkRow();
                    createBulkRow();
                    createBulkRow();
                    showToast(`${data.length}件をD1に保存しました！ 🚀`);
                } else {
                    throw new Error('保存に失敗しました');
                }
            } catch (error) {
                showToast(`エラー: ${error.message} ❌`);
            }
            return;
        }

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            showToast('タイトルと本文を入力してください ⚠️');
            return;
        }

        try {
            const response = await fetch('/api/phrases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });

            if (response.ok) {
                fetchPhrases();
                titleInput.value = '';
                contentInput.value = '';
                showToast('新しく登録しました！ 🚀');
            }
        } catch (error) {
            showToast('登録に失敗しました ❌');
        }
    });

    searchInput.addEventListener('input', (e) => {
        renderPhrases(e.target.value);
    });

    fetchPhrases();
});

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
