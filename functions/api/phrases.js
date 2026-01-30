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

    if (request.method === "POST") {
        try {
            const { title, content } = await request.json();
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
