// ========================================================================
// 🧩 MÓDULO DE INCLUSÃO — FASES 1 + 2 (VERSÃO COMPLETA E UNIFICADA)
// Perfis NEE • IA (Groq/Gemini) • Co-Piloto editável • Adaptações salvas • PDF NEE
// ========================================================================

const API_INCLUSAO = 'https://omr-backend-laboratorio.onrender.com';

let perfisNEE = [];
let adaptacaoAtual = null;
let adaptacoesCache = [];
let mapaPerfisAdapt = {};
let _undoAdapt = null;
let _undoTimer = null;

// ------------------------------------------------------------------------
// Estilos do módulo (lista, scrollbar próprio, hover)
// ------------------------------------------------------------------------
(function injetarEstilosInclusao() {
    if (document.getElementById('estilos-inclusao')) return;
    const s = document.createElement('style');
    s.id = 'estilos-inclusao';
    s.textContent = `
        #listaAdaptacoesSalvas { max-height: 560px; overflow-y: auto; padding-right: 6px; margin-top: 12px; }
        #listaAdaptacoesSalvas::-webkit-scrollbar, .nee-scroll::-webkit-scrollbar { width: 10px; }
        #listaAdaptacoesSalvas::-webkit-scrollbar-track, .nee-scroll::-webkit-scrollbar-track { background: #f3e5f5; border-radius: 8px; }
        #listaAdaptacoesSalvas::-webkit-scrollbar-thumb, .nee-scroll::-webkit-scrollbar-thumb { background: linear-gradient(#6a1b9a, #008080); border-radius: 8px; }
        #listaAdaptacoesSalvas::-webkit-scrollbar-thumb:hover, .nee-scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(#4a148c, #00695c); }
        .adapt-item { border-left: 4px solid #6a1b9a; transition: transform .15s ease, box-shadow .15s ease; }
        .adapt-item:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(106,27,154,.15); }
        .adapt-badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; margin-left:6px; }
        .adapt-meta { font-size:12px; color:#666; margin-top:4px; line-height:1.5; }
        .adapt-acoes { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
        .nee-scroll { scrollbar-width: thin; scrollbar-color: #6a1b9a #f3e5f5; }
        #barraUndoAdaptacao { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); z-index:100000;
            background:#1f2430; color:#fff; padding:12px 16px; border-radius:12px; display:flex; gap:14px; align-items:center;
            box-shadow:0 10px 30px rgba(0,0,0,.35); font-family:Arial,sans-serif; font-size:14px; }
        #barraUndoAdaptacao button { background:#00bfa5; color:#062b26; border:none; padding:8px 14px; border-radius:8px; font-weight:700; cursor:pointer; }
        #barraUndoAdaptacao button:hover { background:#00e0c2; }
    `;
    document.head.appendChild(s);
})();

// ------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------
function badgeNEE(tipo) {
    const map = {
        'TEA': 'background:#e3f2fd; color:#1565c0;',
        'TDAH': 'background:#fff3e0; color:#e65100;',
        'TEA_TDAH': 'background:#f3e5f5; color:#6a1b9a;'
    };
    return `<span class="adapt-badge" style="${map[tipo] || 'background:#eee; color:#555;'}">${tipo === 'TEA_TDAH' ? 'TEA+TDAH' : (tipo || 'NEE')}</span>`;
}
function formatarDataAdapt(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function nl2br(t) { return String(t || '').replace(/\n/g, '<br>'); }
function perfilDeAdaptacao(reg) {
    return mapaPerfisAdapt[reg.perfil_nee_id] || { id: reg.perfil_nee_id, nome_aluno: 'Aluno (perfil removido)', tipo_nee: '', aluno_id: reg.aluno_id };
}

// ========================================================================
// 📋 PERFIS NEE
// ========================================================================
async function carregarPerfisNEE() {
    const lista = document.getElementById('listaPerfisNEE');
    if (!lista) return;
    lista.innerHTML = '<div class="loading">Carregando...</div>';
    const email = localStorage.getItem('sb_email');
    try {
        const r = await sbFetch('GET', `/rest/v1/perfis_nee?email_professor=eq.${email}&order=criado_em.desc`);
        if (!r.ok) { lista.innerHTML = '<p style="color:#dc3545;">Erro ao carregar perfis.</p>'; return; }
        const data = await r.json();
        perfisNEE = data;
        if (!data.length) { lista.innerHTML = '<p style="color:#888; text-align:center; padding:20px;">Nenhum perfil cadastrado ainda.</p>'; return; }
        lista.innerHTML = data.map(p => `
            <div class="prova-item adapt-item">
                <div class="prova-item-info">
                    <strong>${escaparHTML(p.nome_aluno)}</strong> ${badgeNEE(p.tipo_nee)}
                    <div class="adapt-meta">
                        Nível ${p.nivel_suporte} • +${p.tempo_adicional_minutos}min<br>
                        <strong>Preferências:</strong> ${escaparHTML((p.estrategias_preferenciais || []).join(', ') || 'Nenhuma')}<br>
                        <strong>Evitar:</strong> ${escaparHTML((p.estrategias_evitar || []).join(', ') || 'Nenhuma')}
                        ${p.observacoes_geral ? `<br><em>"${escaparHTML(p.observacoes_geral)}"</em>` : ''}
                    </div>
                </div>
                <div class="adapt-acoes">
                    <button class="btn btn-danger btn-sm" onclick="excluirPerfilNEE('${p.id}')">🗑️</button>
                </div>
            </div>`).join('');
    } catch (e) { lista.innerHTML = '<p style="color:#dc3545;">Falha de conexão.</p>'; }
}

async function excluirPerfilNEE(id) {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) return;
    try {
        const r = await sbFetch('DELETE', `/rest/v1/perfis_nee?id=eq.${id}`);
        if (!r.ok) { toast('❌ Erro ao excluir', 'error'); return; }
        toast('✅ Perfil excluído!', 'success');
        await carregarPerfisNEE();
    } catch (e) { toast('❌ Erro: ' + e.message, 'error'); }
}

async function carregarAlunosNEE() {
    const turmaId = document.getElementById('selTurmaNEE').value;
    const sel = document.getElementById('selAlunoNEE');
    if (!turmaId) { sel.innerHTML = '<option value="">Selecione a turma primeiro...</option>'; return; }
    sel.innerHTML = '<option value="">Carregando alunos...</option>';
    try {
        const r = await sbFetch('GET', '/rest/v1/alunos?id_turma=eq.' + turmaId + '&select=id,nome_completo,numero_chamada&order=numero_chamada.asc');
        const alunos = await r.json();
        if (!alunos.length) { sel.innerHTML = '<option value="">Nenhum aluno nesta turma</option>'; return; }
        sel.innerHTML = '<option value="">Selecione o aluno...</option>' + alunos.map(a =>
            '<option value="' + a.id + '" data-nome="' + escaparHTML(a.nome_completo || 'Sem nome') + '">' +
            (a.numero_chamada || '') + '. ' + escaparHTML(a.nome_completo || 'Sem nome') + '</option>').join('');
    } catch (e) { sel.innerHTML = '<option value="">Erro ao carregar alunos</option>'; }
}

async function salvarPerfilNEE() {
    const selAluno = document.getElementById('selAlunoNEE');
    const alunoId = selAluno ? selAluno.value : '';
    if (!alunoId) { toast('❌ Selecione a turma e o aluno cadastrado!', 'error'); return; }
    const opt = selAluno.selectedOptions[0];
    const nomeAluno = opt.dataset.nome || opt.textContent;
    const dadosPerfil = {
        aluno_id: parseInt(alunoId),
        nome_aluno: nomeAluno,
        email_professor: localStorage.getItem('sb_email'),
        tipo_nee: document.getElementById('tipoNEE').value,
        nivel_suporte: parseInt(document.getElementById('nivelSuporte').value),
        estrategias_preferenciais: Array.from(document.querySelectorAll('.estrategia-pref:checked')).map(cb => cb.value),
        estrategias_evitar: Array.from(document.querySelectorAll('.estrategia-evitar:checked')).map(cb => cb.value),
        tempo_adicional_minutos: parseInt(document.getElementById('tempoAdicional').value) || 0,
        observacoes_geral: document.getElementById('observacoesNEE').value.trim()
    };
    try {
        const rCheck = await sbFetch('GET', '/rest/v1/perfis_nee?aluno_id=eq.' + alunoId + '&select=id');
        if (rCheck.ok) {
            const ex = await rCheck.json();
            if (ex.length) { toast('⚠️ Este aluno já tem um perfil. Exclua o antigo antes de criar outro.', 'error'); return; }
        }
        toast('💾 Salvando perfil...', 'info');
        const r = await sbFetch('POST', '/rest/v1/perfis_nee', dadosPerfil);
        if (!r.ok) { const erro = await r.json(); toast('❌ Erro ao salvar: ' + (erro.message || 'Erro desconhecido'), 'error'); return; }
        toast('✅ Perfil de ' + nomeAluno + ' salvo!', 'success');
        document.getElementById('selTurmaNEE').value = '';
        selAluno.innerHTML = '<option value="">Selecione a turma primeiro...</option>';
        document.getElementById('observacoesNEE').value = '';
        document.querySelectorAll('.estrategia-pref, .estrategia-evitar').forEach(cb => cb.checked = false);
        await carregarPerfisNEE();
    } catch (e) { toast('❌ Falha ao salvar: ' + e.message, 'error'); }
}

// ========================================================================
// 🎯 GERAÇÃO COM IA
// ========================================================================
async function carregarPerfisParaSelect() {
    const sel = document.getElementById('selPerfilAdaptacao');
    if (!sel) return;
    sel.innerHTML = '<option value="">Carregando perfis...</option>';
    try {
        const email = localStorage.getItem('sb_email');
        const r = await sbFetch('GET', `/rest/v1/perfis_nee?email_professor=eq.${email}&order=nome_aluno.asc`);
        const perfis = r.ok ? await r.json() : [];
        perfisNEE = perfis;
        sel.innerHTML = perfis.length
            ? '<option value="">Selecione o aluno...</option>' + perfis.map(p => `<option value="${p.id}">${escaparHTML(p.nome_aluno)} (${p.tipo_nee} - Nível ${p.nivel_suporte})</option>`).join('')
            : '<option value="">Nenhum perfil — cadastre primeiro em 🧩 Perfis de Alunos</option>';
    } catch (e) { sel.innerHTML = '<option value="">Erro ao carregar perfis</option>'; }
    await carregarAdaptacoesSalvas();
}

async function chamarIaAdaptacao(perfil, original, contexto) {
    const resp = await fetch(API_INCLUSAO + '/api/gerar_adaptacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil, atividade_original: original, contexto })
    });
    const dados = await resp.json();
    if (!resp.ok || !dados.sucesso) throw new Error(dados.erro || 'Erro na IA');
    return dados;
}

async function gerarAdaptacaoIA() {
    const perfilId = document.getElementById('selPerfilAdaptacao').value;
    const original = document.getElementById('adaptOriginal').value.trim();
    if (!perfilId) { toast('❌ Selecione o aluno!', 'error'); return; }
    if (!original) { toast('❌ Cole a atividade original!', 'error'); return; }
    const perfil = (perfisNEE || []).find(p => p.id === perfilId);
    if (!perfil) { toast('❌ Perfil não encontrado. Reabra a tela.', 'error'); return; }
    const contexto = {
        disciplina: document.getElementById('adaptDisciplina').value.trim(),
        ano: document.getElementById('adaptAno').value.trim(),
        tema: document.getElementById('adaptTema').value.trim(),
        habilidade: document.getElementById('adaptHabilidade').value.trim()
    };
    toast('🤖 Gerando adaptação com IA... pode levar até 1 minuto.', 'info');
    try {
        const dados = await chamarIaAdaptacao(perfil, original, contexto);
        adaptacaoAtual = { id: null, perfil, original, contexto, adaptacao: dados.adaptacao, prompt: dados.prompt_usado || '' };
        toast('✅ Adaptação gerada! Revise no modo co-piloto.', 'success');
        abrirModoCopiloto();
    } catch (e) { toast('❌ ' + e.message, 'error'); }
}

// ========================================================================
// 👀 MODO CO-PILOTO (edição completa)
// ========================================================================
function abrirModoCopiloto() {
    if (!adaptacaoAtual) return;
    const a = adaptacaoAtual.adaptacao || {};
    const questoes = a.questoes || [];
    const antigo = document.getElementById('modalCoPiloto');
    if (antigo) antigo.remove();
    const editando = !!adaptacaoAtual.id;

    const modalHTML = `
    <div id="modalCoPiloto" class="modal active" style="z-index:10000;">
        <div class="modal-content" style="max-width:95%; width:95%; max-height:90vh; overflow-y:auto;">
            <div class="modal-header">
                <h3>🎯 Co-Piloto — ${escaparHTML(adaptacaoAtual.perfil.nome_aluno)} (${adaptacaoAtual.perfil.tipo_nee}) ${editando ? '• ✏️ editando salva' : '• ✨ nova'}</h3>
                <button class="btn btn-sm" onclick="fecharModal('modalCoPiloto')">✕</button>
            </div>
            <div class="modal-body">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    <div>
                        <h4 style="color:#1565c0;">📄 Atividade Original</h4>
                        <div class="nee-scroll" style="border:2px solid #1565c0; padding:15px; border-radius:8px; background:#f5f5f5; white-space:pre-wrap; max-height:500px; overflow-y:auto;">${escaparHTML(adaptacaoAtual.original)}</div>
                    </div>
                    <div>
                        <h4 style="color:#6a1b9a;">🧩 Adaptada pela IA (edite à vontade)</h4>
                        <div class="nee-scroll" style="border:2px solid #6a1b9a; padding:15px; border-radius:8px; background:#f3e5f5; max-height:500px; overflow-y:auto;">
                            <label style="font-weight:bold;">Título</label>
                            <input id="adaptTitulo" value="${escaparHTML(a.titulo || '')}" style="width:100%; margin-bottom:10px;">
                            <label style="font-weight:bold;">Instruções gerais</label>
                            <textarea id="adaptInstrucoes" rows="2" style="width:100%; margin-bottom:10px;">${escaparHTML(a.instrucoes_gerais || '')}</textarea>
                            <label style="font-weight:bold;">⏰ Tempo sugerido (min)</label>
                            <input type="number" id="adaptTempo" value="${a.tempo_sugerido_minutos || 30}" style="width:120px; margin-bottom:10px;">
                            <div style="background:#fff; padding:10px; border-radius:6px; margin-bottom:12px; border:1px dashed #f0b429;">
                                <strong>💡 Exemplo resolvido</strong>
                                <textarea id="adaptExemploEnun" rows="2" style="width:100%; margin-top:6px;" placeholder="Enunciado do exemplo">${escaparHTML((a.exemplo_resolvido && a.exemplo_resolvido.enunciado) || '')}</textarea>
                                <textarea id="adaptExemploResp" rows="2" style="width:100%; margin-top:6px;" placeholder="Resposta do exemplo">${escaparHTML((a.exemplo_resolvido && a.exemplo_resolvido.resposta) || '')}</textarea>
                            </div>
                            ${questoes.map((q, i) => `
                            <div style="background:#fff; padding:12px; border-radius:6px; margin-bottom:12px; border:1px solid #e1bee7;">
                                <strong style="color:#6a1b9a;">Questão ${q.numero || (i + 1)}</strong>
                                <textarea id="adaptEnun${i}" rows="4" style="width:100%; margin-top:6px;">${escaparHTML(q.enunciado || '')}</textarea>
                                <label style="font-size:12px; font-weight:bold; margin-top:6px; display:block;">📝 Passos (um por linha)</label>
                                <textarea id="adaptPassos${i}" rows="2" style="width:100%;">${escaparHTML((q.passos || []).join('\n'))}</textarea>
                                <label style="font-size:12px; font-weight:bold; margin-top:6px; display:block;">🔤 Alternativas (uma por linha, ex: "A) ...")</label>
                                <textarea id="adaptAlts${i}" rows="3" style="width:100%;">${escaparHTML((q.alternativas || []).join('\n'))}</textarea>
                                <div style="display:flex; gap:10px; margin-top:6px; flex-wrap:wrap;">
                                    <div>
                                        <label style="font-size:12px; font-weight:bold;">✅ Resposta</label><br>
                                        <select id="adaptResp${i}">
                                            ${['', 'A', 'B', 'C', 'D', 'E'].map(l => `<option value="${l}" ${q.resposta_correta === l ? 'selected' : ''}>${l || '—'}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div style="flex:1; min-width:200px;">
                                        <label style="font-size:12px; font-weight:bold;">🖼️ Imagem sugerida</label>
                                        <input id="adaptImg${i}" value="${escaparHTML(q.imagem_sugerida || '')}" style="width:100%;">
                                    </div>
                                </div>
                                <label style="font-size:12px; font-weight:bold; margin-top:6px; display:block;">💡 Dica visual</label>
                                <input id="adaptDica${i}" value="${escaparHTML(q.dica_visual || '')}" style="width:100%;">
                            </div>`).join('')}
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px; justify-content:flex-end; flex-wrap:wrap;">
                    <button class="btn btn-secondary" onclick="fecharModal('modalCoPiloto')">Cancelar</button>
                    <button class="btn btn-warn" onclick="regenerarAdaptacao()">🔄 Gerar Novamente</button>
                    <button class="btn btn-primary" onclick="imprimirAdaptacaoAtual('aluno')">📄 PDF Aluno</button>
                    <button class="btn btn-primary" onclick="imprimirAdaptacaoAtual('professor')">📋 PDF Professor</button>
                    <button class="btn btn-success" onclick="salvarAdaptacao()">${editando ? '💾 Atualizar' : '💾 Salvar Adaptação'}</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function coletarEdicoesCopiloto() {
    if (!adaptacaoAtual) return null;
    const a = adaptacaoAtual.adaptacao;
    const g = id => document.getElementById(id);
    if (g('adaptTitulo')) a.titulo = g('adaptTitulo').value;
    if (g('adaptInstrucoes')) a.instrucoes_gerais = g('adaptInstrucoes').value;
    if (g('adaptTempo')) a.tempo_sugerido_minutos = parseInt(g('adaptTempo').value) || 30;
    a.exemplo_resolvido = {
        enunciado: g('adaptExemploEnun') ? g('adaptExemploEnun').value : '',
        resposta: g('adaptExemploResp') ? g('adaptExemploResp').value : ''
    };
    (a.questoes || []).forEach((q, i) => {
        if (g('adaptEnun' + i)) q.enunciado = g('adaptEnun' + i).value;
        if (g('adaptPassos' + i)) q.passos = g('adaptPassos' + i).value.split('\n').map(s => s.trim()).filter(Boolean);
        if (g('adaptAlts' + i)) q.alternativas = g('adaptAlts' + i).value.split('\n').map(s => s.trim()).filter(Boolean);
        if (g('adaptResp' + i)) q.resposta_correta = g('adaptResp' + i).value;
        if (g('adaptImg' + i)) q.imagem_sugerida = g('adaptImg' + i).value;
        if (g('adaptDica' + i)) q.dica_visual = g('adaptDica' + i).value;
    });
    return a;
}

async function salvarAdaptacao() {
    if (!adaptacaoAtual) return;
    const a = coletarEdicoesCopiloto();
    const payloadBase = {
        aluno_id: adaptacaoAtual.perfil.aluno_id || null,
        perfil_nee_id: adaptacaoAtual.perfil.id,
        atividade_original: { texto: adaptacaoAtual.original, contexto: adaptacaoAtual.contexto },
        atividade_adaptada: a,
        prompt_usado: adaptacaoAtual.prompt,
        gerado_por: localStorage.getItem('sb_email')
    };
    try {
        toast('💾 Salvando adaptação...', 'info');
        if (adaptacaoAtual.id) {
            const r = await sbFetch('PATCH', '/rest/v1/adaptacoes_geradas?id=eq.' + adaptacaoAtual.id, { atividade_adaptada: a });
            if (!r.ok) throw new Error((await r.json()).message || 'Erro ao atualizar');
            const reg = adaptacoesCache.find(x => x.id === adaptacaoAtual.id);
            if (reg) reg.atividade_adaptada = a;
            toast('✅ Adaptação atualizada!', 'success');
        } else {
            const r = await sbFetch('POST', '/rest/v1/adaptacoes_geradas', payloadBase, 'return=representation');
            if (!r.ok) throw new Error((await r.json()).message || 'Erro ao salvar');
            const novo = await r.json();
            if (novo && novo[0]) { adaptacaoAtual.id = novo[0].id; adaptacoesCache.unshift(novo[0]); }
            toast('✅ Adaptação salva!', 'success');
        }
        fecharModal('modalCoPiloto');
        renderizarAdaptacoesSalvas();
    } catch (e) { toast('❌ ' + e.message, 'error'); }
}

async function regenerarAdaptacao() {
    if (!adaptacaoAtual) return;
    fecharModal('modalCoPiloto');
    toast('🔄 Gerando nova versão com IA...', 'info');
    try {
        const dados = await chamarIaAdaptacao(adaptacaoAtual.perfil, adaptacaoAtual.original, adaptacaoAtual.contexto);
        adaptacaoAtual.adaptacao = dados.adaptacao;
        adaptacaoAtual.prompt = dados.prompt_usado || '';
        abrirModoCopiloto();
        toast('✅ Nova versão gerada!', 'success');
    } catch (e) { toast('❌ ' + e.message, 'error'); abrirModoCopiloto(); }
}

// ========================================================================
// 📚 ADAPTAÇÕES SALVAS (busca, filtro, ordem, abrir, PDF, excluir com desfazer)
// ========================================================================
async function carregarAdaptacoesSalvas() {
    const lista = document.getElementById('listaAdaptacoesSalvas');
    if (!lista) return;
    lista.innerHTML = '<div class="loading">Carregando adaptações...</div>';
    try {
        const email = localStorage.getItem('sb_email');
        const r = await sbFetch('GET', `/rest/v1/adaptacoes_geradas?gerado_por=eq.${email}&order=criado_em.desc`);
        if (!r.ok) throw new Error('Erro ao buscar adaptações');
        adaptacoesCache = await r.json();
        const rp = await sbFetch('GET', '/rest/v1/perfis_nee?select=id,nome_aluno,tipo_nee,aluno_id');
        const perfis = rp.ok ? await rp.json() : [];
        mapaPerfisAdapt = {};
        perfis.forEach(p => { mapaPerfisAdapt[p.id] = p; });
        renderizarAdaptacoesSalvas();
    } catch (e) { lista.innerHTML = '<p style="color:#dc3545;">Erro ao carregar adaptações. ' + escaparHTML(e.message) + '</p>'; }
}

function renderizarAdaptacoesSalvas() {
    const lista = document.getElementById('listaAdaptacoesSalvas');
    if (!lista) return;
    const busca = ((document.getElementById('buscaAdaptacao') || {}).value || '').toLowerCase().trim();
    const tipo = ((document.getElementById('filtroTipoAdapt') || {}).value || '');
    const ordem = ((document.getElementById('ordemAdaptacao') || {}).value || 'recentes');
    let itens = adaptacoesCache.slice();
    itens = itens.filter(reg => {
        const p = perfilDeAdaptacao(reg);
        const titulo = (reg.atividade_adaptada && reg.atividade_adaptada.titulo) || '';
        return (!busca || p.nome_aluno.toLowerCase().includes(busca) || titulo.toLowerCase().includes(busca)) && (!tipo || p.tipo_nee === tipo);
    });
    itens.sort((x, y) => {
        if (ordem === 'antigas') return new Date(x.criado_em) - new Date(y.criado_em);
        if (ordem === 'aluno') return perfilDeAdaptacao(x).nome_aluno.localeCompare(perfilDeAdaptacao(y).nome_aluno, 'pt-BR');
        return new Date(y.criado_em) - new Date(x.criado_em);
    });
    const cont = document.getElementById('contadorAdaptacoes');
    if (cont) cont.textContent = itens.length;
    if (!itens.length) {
        lista.innerHTML = '<div style="text-align:center; padding:30px; color:#888;">📭 Nenhuma adaptação salva ainda.<br><small>Gere uma acima, revise no co-piloto e clique em "Salvar Adaptação".</small></div>';
        return;
    }
    lista.innerHTML = itens.map(reg => {
        const p = perfilDeAdaptacao(reg);
        const a = reg.atividade_adaptada || {};
        const nq = (a.questoes || []).length;
        return `
        <div class="prova-item adapt-item">
            <div class="prova-item-info">
                <strong>${escaparHTML(a.titulo || 'Adaptação sem título')}</strong> ${badgeNEE(p.tipo_nee)}
                <div class="adapt-meta">
                    👤 ${escaparHTML(p.nome_aluno)} • 📝 ${nq} questão(ões) • 🕒 ${formatarDataAdapt(reg.criado_em)}
                    ${a.tempo_sugerido_minutos ? ` • ⏰ ${a.tempo_sugerido_minutos} min` : ''}
                </div>
            </div>
            <div class="adapt-acoes">
                <button class="btn btn-secondary btn-sm" onclick="abrirAdaptacaoSalva('${reg.id}')" title="Revisar/editar">👀 Abrir</button>
                <button class="btn btn-primary btn-sm" onclick="imprimirAdaptacaoSalva('${reg.id}','aluno')" title="PDF do aluno">📄 Aluno</button>
                <button class="btn btn-success btn-sm" onclick="imprimirAdaptacaoSalva('${reg.id}','professor')" title="PDF do professor">📋 Professor</button>
                <button class="btn btn-danger btn-sm" onclick="excluirAdaptacao('${reg.id}')" title="Excluir">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

function abrirAdaptacaoSalva(id) {
    const reg = adaptacoesCache.find(a => a.id === id);
    if (!reg) { toast('❌ Adaptação não encontrada.', 'error'); return; }
    const orig = reg.atividade_original || {};
    adaptacaoAtual = {
        id: reg.id,
        perfil: perfilDeAdaptacao(reg),
        original: orig.texto || '',
        contexto: orig.contexto || {},
        adaptacao: reg.atividade_adaptada || {},
        prompt: reg.prompt_usado || ''
    };
    abrirModoCopiloto();
}

async function excluirAdaptacao(id) {
    const reg = adaptacoesCache.find(a => a.id === id);
    if (!reg) return;
    adaptacoesCache = adaptacoesCache.filter(a => a.id !== id);
    renderizarAdaptacoesSalvas();
    try {
        const r = await sbFetch('DELETE', `/rest/v1/adaptacoes_geradas?id=eq.${id}`);
        if (!r.ok) throw new Error((await r.json()).message || 'Erro ao excluir');
        mostrarUndoAdaptacao(reg);
    } catch (e) {
        adaptacoesCache.unshift(reg);
        renderizarAdaptacoesSalvas();
        toast('❌ Não foi possível excluir: ' + e.message, 'error');
    }
}

function mostrarUndoAdaptacao(reg) {
    removerBarraUndo();
    _undoAdapt = reg;
    const bar = document.createElement('div');
    bar.id = 'barraUndoAdaptacao';
    bar.innerHTML = `<span>🗑️ Adaptação excluída.</span><button onclick="desfazerExclusaoAdaptacao()">↩️ Desfazer (8s)</button>`;
    document.body.appendChild(bar);
    _undoTimer = setTimeout(removerBarraUndo, 8000);
}
function removerBarraUndo() {
    if (_undoTimer) { clearTimeout(_undoTimer); _undoTimer = null; }
    const b = document.getElementById('barraUndoAdaptacao');
    if (b) b.remove();
    _undoAdapt = null;
}
async function desfazerExclusaoAdaptacao() {
    const reg = _undoAdapt;
    removerBarraUndo();
    if (!reg) return;
    try {
        const r = await sbFetch('POST', '/rest/v1/adaptacoes_geradas', reg);
        if (!r.ok) throw new Error((await r.json()).message || 'Erro ao restaurar');
        adaptacoesCache.unshift(reg);
        renderizarAdaptacoesSalvas();
        toast('✅ Adaptação restaurada!', 'success');
    } catch (e) { toast('❌ Erro ao restaurar: ' + e.message, 'error'); }
}

// ========================================================================
// 📄 PDF ADAPTADO NEE (fonte 14pt, passos, exemplo, espaço para figura)
// ========================================================================
function montarHTMLAdaptacaoNEE(a, perfil, contexto, modo) {
    const questoes = a.questoes || [];
    const n = questoes.length;
    const tempo = a.tempo_sugerido_minutos || 30;
    const prof = modo === 'professor';
    let h = '<div class="nee-folha">';
    h += `<div class="nee-cabecalho">
        <div class="nee-selo">${prof ? '📋 VERSÃO DO PROFESSOR — GABARITO' : '🧩 ATIVIDADE ADAPTADA'}</div>
        <h1>${escaparHTML(a.titulo || 'Atividade Adaptada')}</h1>
        <div class="nee-meta">
            <span><strong>Aluno(a):</strong> ${escaparHTML(perfil.nome_aluno || '')}</span>
            <span><strong>Disciplina:</strong> ${escaparHTML(contexto.disciplina || '')}</span>
            <span><strong>Data:</strong> ${prof ? new Date().toLocaleDateString('pt-BR') : '____/____/______'}</span>
        </div>
        ${contexto.tema ? `<div class="nee-tema">Tema: ${escaparHTML(contexto.tema)}${contexto.habilidade ? ' • ' + escaparHTML(contexto.habilidade) : ''}</div>` : ''}
    </div>`;
    h += `<div class="nee-previsibilidade">📌 Esta atividade tem <strong>${n} ${n === 1 ? 'questão' : 'questões'}</strong>. Faça uma de cada vez, com calma. ⏰ Tempo sugerido: <strong>${tempo} minutos</strong>.</div>`;
    if (a.instrucoes_gerais) h += `<div class="nee-instrucoes"><strong>Instruções:</strong><br>${nl2br(escaparHTML(a.instrucoes_gerais))}</div>`;
    if (a.exemplo_resolvido && (a.exemplo_resolvido.enunciado || a.exemplo_resolvido.resposta)) {
        h += `<div class="nee-exemplo">
            <div class="nee-exemplo-titulo">💡 EXEMPLO RESOLVIDO — veja antes de começar</div>
            <div>${nl2br(escaparHTML(a.exemplo_resolvido.enunciado || ''))}</div>
            <div class="nee-exemplo-resp"><strong>Resposta:</strong> ${nl2br(escaparHTML(a.exemplo_resolvido.resposta || ''))}</div>
        </div>`;
    }
    questoes.forEach((q, i) => {
        const num = q.numero || (i + 1);
        h += `<div class="nee-questao">
            <div class="nee-q-topo">
                <span class="nee-q-num">${num}</span><span class="nee-q-label">QUESTÃO ${num}</span>
                ${prof && q.resposta_correta ? `<span class="nee-gabarito">✅ Resposta: ${escaparHTML(q.resposta_correta)}</span>` : ''}
            </div>
            <div class="nee-enunciado">${nl2br(escaparHTML(q.enunciado || ''))}</div>`;
        if (q.imagem_sugerida) {
            h += prof
                ? `<div class="nee-img-sugestao">🖼️ <strong>Imagem sugerida:</strong> ${escaparHTML(q.imagem_sugerida)}</div>`
                : `<div class="nee-img-espaco"><div class="nee-img-icone">🖼️</div><div class="nee-img-desc">${escaparHTML(q.imagem_sugerida)}</div><div class="nee-img-nota">(Espaço para a figura — o professor irá inserir)</div></div>`;
        }
        if (q.passos && q.passos.length) {
            h += `<div class="nee-passos"><strong>Passo a passo:</strong><ol>${q.passos.map(p => `<li>${nl2br(escaparHTML(p))}</li>`).join('')}</ol></div>`;
        }
        if (q.alternativas && q.alternativas.length) {
            h += `<div class="nee-alternativas">${q.alternativas.map((alt, j) => {
                const m = String(alt).match(/^\s*([A-Ea-e])\s*\)/);
                const letra = m ? m[1].toUpperCase() : String.fromCharCode(65 + j);
                const correta = prof && q.resposta_correta && String(q.resposta_correta).toUpperCase() === letra;
                const textoAlt = String(alt).replace(/^\s*[A-Ea-e]\s*\)\s*/, '');
                return `<div class="nee-alt${correta ? ' correta' : ''}"><span class="nee-alt-letra">${letra}</span><span class="nee-alt-texto">${nl2br(escaparHTML(textoAlt))}</span>${correta ? '<span class="nee-alt-check">✅</span>' : ''}</div>`;
            }).join('')}</div>`;
            if (!prof) h += '<div class="nee-marque">✏️ Circule a alternativa correta.</div>';
        } else if (!prof) {
            h += '<div class="nee-resposta-aluno"><div class="nee-resposta-label">✍️ Minha resposta:</div><div class="nee-linhas"></div></div>';
        }
        if (q.dica_visual) h += `<div class="nee-dica">💡 <strong>Dica:</strong> ${nl2br(escaparHTML(q.dica_visual))}</div>`;
        h += '</div>';
    });
    if (prof && a.estrategias_aplicadas && a.estrategias_aplicadas.length) {
        h += `<div class="nee-estrategias"><strong>🧩 Estratégias aplicadas nesta adaptação:</strong><ul>${a.estrategias_aplicadas.map(e => `<li>${escaparHTML(e)}</li>`).join('')}</ul></div>`;
    }
    h += `<div class="nee-rodape">Módulo de Inclusão • OMR Sistema 2.0 • Adaptada para ${escaparHTML(perfil.tipo_nee || 'NEE')}${prof ? ' • Uso do professor' : ''}</div>`;
    h += '</div>';
    return h;
}

const CSS_IMPRESSAO_NEE = `
@media screen {
    #container-impressao-nee { position:fixed; inset:0; background:#eef1f4; z-index:99999; overflow-y:auto; padding:28px 16px; box-sizing:border-box; }
    #container-impressao-nee::before { content:'🧩 Atividade adaptada pronta — abrindo impressão...'; display:block; max-width:820px; margin:0 auto 16px; text-align:center; padding:12px; background:linear-gradient(135deg,#6a1b9a,#008080); color:#fff; font-weight:700; border-radius:10px; font-family:Arial,sans-serif; }
    #container-impressao-nee .nee-folha { max-width:820px; margin:0 auto; background:#fff; padding:34px 38px; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,.18); }
}
@media print {
    body > *:not(#container-impressao-nee) { display:none !important; }
    #container-impressao-nee { position:static !important; background:#fff !important; padding:0 !important; overflow:visible !important; }
    #container-impressao-nee::before { display:none !important; }
    #container-impressao-nee .nee-folha { max-width:none; margin:0; padding:0; border-radius:0; box-shadow:none; }
    @page { size:A4; margin:15mm; }
    .nee-questao, .nee-exemplo { page-break-inside:avoid; break-inside:avoid; }
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
}
#container-impressao-nee { font-family:Arial, Verdana, sans-serif; color:#111; font-size:14pt; line-height:1.6; }
#container-impressao-nee h1 { font-size:20pt; margin:6px 0; color:#4a148c; }
#container-impressao-nee .nee-cabecalho { border-bottom:3px solid #6a1b9a; padding-bottom:12px; margin-bottom:16px; }
#container-impressao-nee .nee-selo { display:inline-block; background:#6a1b9a; color:#fff; font-size:11pt; font-weight:700; padding:4px 12px; border-radius:6px; letter-spacing:.5px; }
#container-impressao-nee .nee-meta { display:flex; flex-wrap:wrap; gap:8px 24px; font-size:12pt; margin-top:8px; }
#container-impressao-nee .nee-tema { font-size:12pt; color:#444; margin-top:6px; }
#container-impressao-nee .nee-previsibilidade { background:#e3f2fd; border:2px solid #1565c0; border-radius:10px; padding:12px 16px; margin-bottom:14px; font-size:13pt; }
#container-impressao-nee .nee-instrucoes { background:#f5f5f5; border-left:5px solid #008080; padding:10px 14px; margin-bottom:16px; font-size:13pt; }
#container-impressao-nee .nee-exemplo { background:#fff8e1; border:2px solid #f0b429; border-radius:10px; padding:14px 16px; margin-bottom:20px; }
#container-impressao-nee .nee-exemplo-titulo { font-weight:700; color:#8a5a00; margin-bottom:8px; font-size:13pt; }
#container-impressao-nee .nee-exemplo-resp { margin-top:8px; color:#1b7f3b; }
#container-impressao-nee .nee-questao { border:2px solid #444; border-radius:10px; padding:16px 18px; margin-bottom:20px; background:#fff; }
#container-impressao-nee .nee-q-topo { display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
#container-impressao-nee .nee-q-num { width:34px; height:34px; border-radius:50%; background:#6a1b9a; color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; font-size:16pt; flex-shrink:0; }
#container-impressao-nee .nee-q-label { font-weight:700; font-size:13pt; color:#4a148c; letter-spacing:.5px; }
#container-impressao-nee .nee-gabarito { margin-left:auto; background:#e8f5e9; color:#1b7f3b; font-weight:700; padding:4px 10px; border-radius:6px; font-size:12pt; }
#container-impressao-nee .nee-enunciado { margin-bottom:12px; }
#container-impressao-nee .nee-img-espaco { border:2px dashed #999; border-radius:10px; padding:18px; text-align:center; margin:12px 0; background:#fafafa; }
#container-impressao-nee .nee-img-icone { font-size:26pt; }
#container-impressao-nee .nee-img-desc { font-size:12pt; color:#333; margin-top:6px; }
#container-impressao-nee .nee-img-nota { font-size:10pt; color:#777; margin-top:4px; font-style:italic; }
#container-impressao-nee .nee-img-sugestao { background:#f3e5f5; border-left:5px solid #6a1b9a; padding:8px 12px; margin:10px 0; font-size:12pt; }
#container-impressao-nee .nee-passos { background:#e0f2f1; border-radius:8px; padding:10px 14px; margin:12px 0; font-size:13pt; }
#container-impressao-nee .nee-passos ol { margin:6px 0 0 22px; }
#container-impressao-nee .nee-passos li { margin-bottom:6px; }
#container-impressao-nee .nee-alternativas { margin:12px 0; }
#container-impressao-nee .nee-alt { display:flex; align-items:flex-start; gap:12px; padding:8px 10px; margin-bottom:8px; border:1px solid #bbb; border-radius:8px; font-size:13pt; }
#container-impressao-nee .nee-alt.correta { border-color:#1b7f3b; background:#e8f5e9; }
#container-impressao-nee .nee-alt-letra { width:30px; height:30px; border:2px solid #6a1b9a; border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:700; color:#6a1b9a; flex-shrink:0; }
#container-impressao-nee .nee-alt.correta .nee-alt-letra { border-color:#1b7f3b; color:#1b7f3b; }
#container-impressao-nee .nee-alt-texto { flex:1; }
#container-impressao-nee .nee-alt-check { color:#1b7f3b; font-weight:700; }
#container-impressao-nee .nee-marque { font-size:12pt; color:#555; font-style:italic; margin-top:6px; }
#container-impressao-nee .nee-resposta-aluno { margin-top:14px; }
#container-impressao-nee .nee-resposta-label { font-weight:700; font-size:12pt; margin-bottom:6px; color:#4a148c; }
#container-impressao-nee .nee-linhas { height:120px; border:1px solid #999; border-radius:8px; background-image:repeating-linear-gradient(to bottom, transparent 0, transparent 31px, #ccc 32px); }
#container-impressao-nee .nee-dica { background:#fffde7; border-left:5px solid #f0b429; padding:8px 12px; margin-top:12px; font-size:12pt; }
#container-impressao-nee .nee-estrategias { background:#f3e5f5; border:2px solid #6a1b9a; border-radius:10px; padding:12px 16px; margin-top:10px; font-size:12pt; }
#container-impressao-nee .nee-rodape { margin-top:24px; padding-top:10px; border-top:1px solid #ccc; font-size:10pt; color:#777; text-align:center; }
`;

function executarImpressaoNEE(html) {
    ['container-impressao-nee', 'style-impressao-nee'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
    const c = document.createElement('div');
    c.id = 'container-impressao-nee';
    c.innerHTML = html;
    const s = document.createElement('style');
    s.id = 'style-impressao-nee';
    s.textContent = CSS_IMPRESSAO_NEE;
    document.head.appendChild(s);
    document.body.appendChild(c);
    setTimeout(() => { window.print(); setTimeout(() => { c.remove(); s.remove(); }, 1200); }, 700);
}

function imprimirAdaptacaoSalva(id, modo) {
    const reg = adaptacoesCache.find(a => a.id === id);
    if (!reg) { toast('❌ Adaptação não encontrada.', 'error'); return; }
    executarImpressaoNEE(montarHTMLAdaptacaoNEE(reg.atividade_adaptada || {}, perfilDeAdaptacao(reg), (reg.atividade_original || {}).contexto || {}, modo));
}

function imprimirAdaptacaoAtual(modo) {
    if (!adaptacaoAtual) return;
    const a = coletarEdicoesCopiloto();
    executarImpressaoNEE(montarHTMLAdaptacaoNEE(a, adaptacaoAtual.perfil, adaptacaoAtual.contexto, modo));
}