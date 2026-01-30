document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('titleInput');
    const contentInput = document.getElementById('contentInput');
    const addBtn = document.getElementById('addBtn');
    const listContainer = document.getElementById('listContainer');
    const searchInput = document.getElementById('searchInput');
    const toast = document.getElementById('toast');

    let phrases = [];

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // D1から定型文を取得
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

    // クリップボードにコピー
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

    // リストを表示
    function renderPhrases(filter = '') {
        listContainer.innerHTML = '';

        const filteredPhrases = phrases.filter(p =>
            p.title.toLowerCase().includes(filter.toLowerCase()) ||
            p.content.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredPhrases.length === 0) {
            listContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary); background: var(--card-bg); border-radius: 2rem; border: 1px dashed var(--card-border);">リストが空か、一致するものがありません</div>';
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
                if (confirm('この定型文をD1から完全に削除しますか？')) {
                    try {
                        const response = await fetch(`/api/phrases?id=${phrase.id}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            showToast('D1から削除しました 🗑️');
                            fetchPhrases(); // リストを再取得
                        }
                    } catch (error) {
                        showToast('削除に失敗しました ❌');
                    }
                }
            });

            listContainer.appendChild(card);
        });
    }

    // D1に登録して即反映
    addBtn.addEventListener('click', async () => {
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
                titleInput.value = '';
                contentInput.value = '';
                showToast('D1に登録しました！ 🚀');
                fetchPhrases(); // リストを再取得
            } else {
                throw new Error('登録に失敗しました');
            }
        } catch (error) {
            console.error('Add error:', error);
            showToast('登録に失敗しました ❌');
        }
    });

    // 検索フィルタ
    searchInput.addEventListener('input', (e) => {
        renderPhrases(e.target.value);
    });

    // 初期データ取得
    fetchPhrases();
});

// アニメーション用CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
