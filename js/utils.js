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

// ========================================================================
// 🛠️ FUNÇÕES UTILITÁRIAS
// ========================================================================

async function buscarQuestoes(tipo, idAvaliacao) {
    var config = (tipo === 'aberta') ? COLUNAS.ABERTAS : COLUNAS.OBJETIVAS;
    var select = `id,numero,enunciado,valor,${config.descritor},${config.habilidade}`;
    if (tipo === 'aberta') select += ',resposta_esperada,imagem_url';
    else select += ',alternativa_a,alternativa_b,alternativa_c,alternativa_d,alternativa_e,gabarito';
    var path = `/rest/v1/${config.tabela}?id_avaliacao=eq.${idAvaliacao}&select=${select}&order=numero.asc`;
    var r = await sbFetch('GET', path);
    if (!r.ok) {
        console.error(`❌ Erro ao buscar questões (${tipo}): Status ${r.status}`, await r.text());
        return [];
    }
    return await r.json();
}

function prepararQuestaoParaSalvar(tipo, idAval, q, numero) {
    const base = {
        id_avaliacao: idAval,
        numero_questao: numero,
        enunciado: q.enunciado,
        valor: parseFloat(q.valor) || 1,
        imagem_url: q.imagemUrl || null, // 🆕 Inclui a URL ou base64
        descritor: q.descritor || null,
        habilidade: q.habilidade || null
    };
    
    if (tipo === 'aberta') {
        base.resposta_esperada = q.resposta || '';
    } else if (tipo === 'objetiva') {
        base.alternativa_a = q.alt_a || '';
        base.alternativa_b = q.alt_b || '';
        base.alternativa_c = q.alt_c || '';
        base.alternativa_d = q.alt_d || '';
        base.alternativa_e = q.alt_e || '';
        base.gabarito = q.gabarito || 'A';
    }
    
    return base;
}

async function uploadImagem(file) {
    var ext = (file.name.split('.').pop() || 'png').toLowerCase();
    var path = 'q_' + Date.now() + '_' + Math.floor(Math.random() * 10000) + '.' + ext;
    async function tentar(bearer) {
        return await fetch(SUPABASE_URL + '/storage/v1/object/enunciados/' + path, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + bearer, 'Content-Type': file.type || 'image/png', 'x-upsert': 'true' },
            body: file
        });
    }
    var r = await tentar(token || SUPABASE_KEY);
    if (!r.ok && token) { await refrescarSessao(); r = await tentar(token || SUPABASE_KEY); }
    if (!r.ok && token) { r = await tentar(SUPABASE_KEY); }
    if (!r.ok) throw new Error('Upload ' + r.status + ': ' + (await r.text()));
    return SUPABASE_URL + '/storage/v1/object/public/enunciados/' + path;
}

// ========================================================================
// 🏫 TURMAS PERMITIDAS
// ========================================================================
async function carregarTurmasPermitidas(selectId) {
       const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">⏳ Carregando turmas...</option>';
    
    try {
        // 1. Pega o email do usuário logado
        const emailLogado = (typeof userEmail !== 'undefined' && userEmail) ? userEmail.toLowerCase() : (localStorage.getItem('sb_email') || '').toLowerCase();
        
        if (!emailLogado) {
            select.innerHTML = '<option value="">⚠️ Usuário não identificado</option>';
            return;
        }

        // 2. USA A VARIÁVEL GLOBAL DO CONFIG.JS (QUE AGORA ESTÁ LIMPA E CORRETA!)
        const response = await fetch(`${API_BASE_URL}/api/turmas?email=${encodeURIComponent(emailLogado)}`);
        const resultado = await response.json();

        // 3. Limpa e preenche o select
        select.innerHTML = '<option value="">Selecione a turma...</option>';

        if (resultado.sucesso && resultado.turmas && resultado.turmas.length > 0) {
            resultado.turmas.forEach(t => {
                select.innerHTML += `<option value="${t.id}">${t.nome}</option>`;
            });
            console.log(`✅ Carregadas ${resultado.turmas.length} turmas para ${emailLogado}`);
        } else {
            select.innerHTML += '<option value="" disabled>⚠️ Nenhuma turma vinculada ao seu perfil</option>';
        }
    } catch (e) {
        console.error("Erro ao carregar turmas permitidas:", e);
        select.innerHTML = '<option value="">❌ Erro ao carregar</option>';
    }
}