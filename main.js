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

            // 通常モードの表示
            const renderNormalMode = () => {
                card.innerHTML = `
                    <div class="phrase-header">
                        <span class="phrase-title">${phrase.title}</span>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-icon btn-edit" title="編集">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-icon btn-delete" title="削除">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    </div>
                    <div class="phrase-content">${phrase.content}</div>
                    <div class="phrase-actions">
                        <button class="btn btn-primary" style="width: 100%;">Click to Copy</button>
                    </div>
                `;

                // 編集ボタン
                card.querySelector('.btn-edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    renderEditMode();
                });

                // 削除ボタン
                card.querySelector('.btn-delete').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('この定型文をD1から完全に削除しますか？')) {
                        try {
                            const response = await fetch(`/api/phrases?id=${phrase.id}`, {
                                method: 'DELETE'
                            });
                            if (response.ok) {
                                showToast('D1から削除しました 🗑️');
                                fetchPhrases();
                            }
                        } catch (error) {
                            showToast('削除に失敗しました ❌');
                        }
                    }
                });

                // コピー機能
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.btn-delete') || e.target.closest('.btn-edit')) return;
                    copyToClipboard(phrase.content);
                    card.style.transform = 'scale(0.98)';
                    setTimeout(() => card.style.transform = '', 100);
                });
            };

            // 編集モードの表示
            const renderEditMode = () => {
                card.innerHTML = `
                    <div class="phrase-header">
                        <input type="text" class="edit-title" value="${phrase.title}" style="width: 100%; margin-right: 0.5rem; background: rgba(0,0,0,0.3);">
                    </div>
                    <textarea class="edit-content" style="width: 100%; margin: 1rem 0; min-height: 100px; background: rgba(0,0,0,0.3);">${phrase.content}</textarea>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary btn-save-edit" style="flex: 1;">保存</button>
                        <button class="btn btn-cancel-edit" style="flex: 1; background: rgba(255,255,255,0.1); color: white;">キャンセル</button>
                    </div>
                `;

                const saveBtn = card.querySelector('.btn-save-edit');
                const cancelBtn = card.querySelector('.btn-cancel-edit');

                saveBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newTitle = card.querySelector('.edit-title').value.trim();
                    const newContent = card.querySelector('.edit-content').value.trim();

                    if (!newTitle || !newContent) {
                        showToast('タイトルと本文を入力してください ⚠️');
                        return;
                    }

                    try {
                        const response = await fetch('/api/phrases', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: phrase.id, title: newTitle, content: newContent })
                        });
                        if (response.ok) {
                            showToast('D1を更新しました！ ✏️');
                            fetchPhrases();
                        }
                    } catch (error) {
                        showToast('更新に失敗しました ❌');
                    }
                });

                cancelBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    renderNormalMode();
                });
            };

            renderNormalMode();
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
