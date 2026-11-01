// ========================================================================
// 🛠️ FUNÇÕES UTILITÁRIAS (OS SUPER-HERÓIS DO CÓDIGO)
// ========================================================================
async function sbFetch(method, path, body, prefer) {
    var opts = { method: method, headers: headersCom(prefer) };
    if (body !== undefined) opts.body = JSON.stringify(body);
    var r = await fetch(SUPABASE_URL + path, opts);
    if ((r.status === 401 || r.status === 403) && token) {
        var h2 = headersCom(prefer); delete h2['Authorization'];
        var opts2 = { method: method, headers: h2 };
        if (body !== undefined) opts2.body = JSON.stringify(body);
        r = await fetch(SUPABASE_URL + path, opts2);
    }
    return r;
}

function headersCom(prefer) {
    var h = { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' };
    if (prefer) h['Prefer'] = prefer;
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
}

function msgErro(j) { if (!j) return 'erro desconhecido'; return j.error_description || j.msg || j.message || JSON.stringify(j); }

function toast(msg, tipo) {
    tipo = tipo || 'info';
    var el = document.createElement('div');
    el.className = 'toast ' + tipo;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 4500);
}

function escaparHTML(texto) {
    if (!texto) return '';
    return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function fecharModal(id) { 
    var el = document.getElementById(id);
    if(el) el.classList.remove('active'); 
}