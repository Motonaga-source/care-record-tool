export async function onRequest(context) {
    const { request, env } = context;
    const { DB } = env;

    if (request.method === "GET") {
        try {
            const { results } = await DB.prepare(
                "SELECT * FROM phrases ORDER BY created_at DESC"
            ).all();
            return new Response(JSON.stringify(results), {
                headers: { "Content-Type": "application/json" }
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }

    // POST: 新規作成（単一または一括）
    if (request.method === "POST") {
        try {
            const data = await request.json();

            // 配列（現在のリストでD1を上書き）の場合
            if (Array.isArray(data)) {
                // トランザクション的に処理
                const statements = [
                    DB.prepare("DELETE FROM phrases") // 一旦全削除
                ];

                data.forEach(item => {
                    if (item.title && item.content) {
                        statements.push(
                            DB.prepare("INSERT INTO phrases (title, content) VALUES (?, ?)")
                                .bind(item.title, item.content)
                        );
                    }
                });

                await DB.batch(statements);
                return new Response(JSON.stringify({ success: true, count: data.length }), { status: 201 });
            }

            // 単一登録の場合
            const { title, content } = data;
            if (!title || !content) {
                return new Response("Missing title or content", { status: 400 });
            }
            await DB.prepare(
                "INSERT INTO phrases (title, content) VALUES (?, ?)"
            ).bind(title, content).run();
            return new Response(JSON.stringify({ success: true }), { status: 201 });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }

    if (request.method === "DELETE") {
        try {
            const url = new URL(request.url);
            const id = url.searchParams.get("id");
            if (!id) {
                return new Response("Missing id", { status: 400 });
            }
            await DB.prepare("DELETE FROM phrases WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true }));
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
}
