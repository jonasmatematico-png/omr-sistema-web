// ========================================================================
// 🧩 MÓDULO DE INCLUSÃO — FASES 3 e 4
// Memória com feedback • Colaboração AEE • Relatórios com gráficos
// Carregado DEPOIS de inclusao.js (estende e aprimora o módulo)
// ========================================================================

let incAdvColab = [];
let incAdvAdaptMap = {};
let incAdvPerfilMap = {};
let incAdvAba = 'recebidas';

// ------------------------------------------------------------------------
// Visual do módulo avançado
// ------------------------------------------------------------------------
(function injetarEstilosAvancados() {
    if (document.getElementById('estilos-inclusao-avancado')) return;
    const s = document.createElement('style');
    s.id = 'estilos-inclusao-avancado';
    s.textContent = `
        .inc-adv-hero { display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;
            background:linear-gradient(120deg,#4a148c,#6a1b9a 45%,#008080); background-size:200% 200%;
            animation:incHeroShift 12s ease infinite; color:#fff; border-radius:14px; padding:18px 22px; margin-bottom:18px;
            box-shadow:0 8px 28px rgba(74,20,140,.25); }
        .inc-adv-hero strong { font-size:16px; display:block; margin-bottom:4px; }
        .inc-adv-hero p { margin:0; font-size:13px; opacity:.92; max-width:640px; }
        .inc-adv-hero .btn { background:rgba(255,255,255,.16); color:#fff; border:1px solid rgba(255,255,255,.35); }
        .inc-adv-hero .btn:hover { background:rgba(255,255,255,.28); }
        @keyframes incHeroShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .inc-stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(165px,1fr)); gap:14px; margin-bottom:18px; }
        .inc-stat { position:relative; overflow:hidden; background:#fff; border-radius:14px; padding:16px 18px;
            border:1px solid #e6dcf0; box-shadow:0 4px 16px rgba(74,20,140,.08); transition:transform .15s ease, box-shadow .15s ease; }
        .inc-stat:hover { transform:translateY(-3px); box-shadow:0 10px 26px rgba(74,20,140,.16); }
        .inc-stat::before { content:''; position:absolute; inset:0 auto 0 0; width:5px; background:linear-gradient(#6a1b9a,#008080); }
        .inc-stat .num { font-size:30px; font-weight:800; color:#4a148c; line-height:1.1; }
        .inc-stat .lbl { font-size:12px; color:#666; margin-top:4px; font-weight:600; }
        .inc-stat .sub { font-size:11px; color:#008080; margin-top:6px; font-weight:700; }
        .inc-charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px; }
        @media (max-width:820px){ .inc-charts-grid{grid-template-columns:1fr;} }
        .inc-adv-list { max-height:520px; overflow-y:auto; padding-right:6px; margin-top:12px; }
        .inc-adv-list::-webkit-scrollbar { width:10px; }
        .inc-adv-list::-webkit-scrollbar-track { background:#f3e5f5; border-radius:8px; }
        .inc-adv-list::-webkit-scrollbar-thumb { background:linear-gradient(#6a1b9a,#008080); border-radius:8px; }
        .inc-adv-list::-webkit-scrollbar-thumb:hover { background:linear-gradient(#4a148c,#00695c); }
        .inc-adv-list { scrollbar-width:thin; scrollbar-color:#6a1b9a #f3e5f5; }
        .inc-item { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;
            background:#fff; border:1px solid #e6dcf0; border-left:4px solid #6a1b9a; border-radius:10px; padding:12px 14px; margin-bottom:10px;
            transition:transform .15s ease, box-shadow .15s ease; }
        .inc-item:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(106,27,154,.14); }
        .inc-item .titulo { font-weight:700; color:#333; }
        .inc-item .meta { font-size:12px; color:#666; margin-top:4px; line-height:1.5; }
        .inc-item .acoes { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
        .inc-badge { display:inline-block; padding:2px 8px; border-radius:5px; font-size:11px; font-weight:700; margin-left:6px; }
        .inc-badge.ok { background:#e8f5e9; color:#1b7f3b; }
        .inc-badge.parcial { background:#fff8e1; color:#8a5a00; }
        .inc-badge.nao { background:#ffebee; color:#c62828; }
        .inc-badge.pendente { background:#fff3e0; color:#e65100; }
        .inc-badge.aprovada { background:#e8f5e9; color:#1b7f3b; }
        .inc-rank-item { margin-bottom:14px; }
        .inc-rank-top { display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px; }
        .inc-rank-top strong { color:#4a148c; }
        .inc-rank-bar { height:12px; background:#f0e6f6; border-radius:8px; overflow:hidden; }
        .inc-rank-fill { height:100%; border-radius:8px; background:linear-gradient(90deg,#6a1b9a,#008080); transition:width .6s ease; }
        .inc-empty { text-align:center; color:#888; padding:28px 16px; font-size:14px; }
        .inc-feedback-opt { display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 14px; }
        .inc-feedback-opt label { flex:1; min-width:140px; border:2px solid #ddd; border-radius:10px; padding:12px; text-align:center; cursor:pointer; font-weight:700; transition:all .15s ease; }
        .inc-feedback-opt label:hover { border-color:#6a1b9a; background:#f3e5f5; }
        .inc-feedback-opt input { margin-right:6px; accent-color:#6a1b9a; }
        .inc-modal-box { background:#fff; border-radius:14px; padding:20px; }
        .inc-scrollbox { max-height:260px; overflow-y:auto; border:1px solid #e0d4ec; border-radius:8px; padding:12px; background:#faf7fc; white-space:pre-wrap; font-size:13px; }
        .inc-scrollbox::-webkit-scrollbar { width:8px; }
        .inc-scrollbox::-webkit-scrollbar-track { background:#f3e5f5; }
        .inc-scrollbox::-webkit-scrollbar-thumb { background:#6a1b9a; border-radius:6px; }
    `;
    document.head.appendChild(s);
})();

// ------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------
function incAdvNomeEstrategia(k) {
    const map = {
        visual: 'Apoio visual', passo_a_passo: 'Passo a passo', tempo_extra: 'Tempo extra',
        texto_curto: 'Textos curtos', cores_destaque: 'Cores de destaque', exemplos_resolvidos: 'Exemplos resolvidos',
        fontes_maiores: 'Fontes maiores', espacamento: 'Maior espaçamento'
    };
    return map[k] || String(k || '').replace(/_/g, ' ');
}
function incAdvBadgeFeedback(f) {
    if (f === 'funcionou') return '<span class="inc-badge ok">✅ Funcionou</span>';
    if (f === 'parcial') return '<span class="inc-badge parcial">🟡 Parcial</span>';
    if (f === 'nao_funcionou') return '<span class="inc-badge nao">❌ Não funcionou</span>';
    return '<span class="inc-badge pendente">⏳ Sem feedback</span>';
}

// ========================================================================
// 🧠 FASE 3 — MEMÓRIA: a IA passa a considerar o que já funcionou
// ========================================================================
async function chamarIaAdaptacao(perfil, original, contexto) {
    let aprendizados = [];
    try {
        const r = await sbFetch('GET', `/rest/v1/aprendizados_sistema?tipo_nee=eq.${perfil.tipo_nee}&order=taxa_sucesso.desc&limit=8`);
        if (r.ok) aprendizados = await r.json();
    } catch (e) { /* memória é opcional, não bloqueia a geração */ }

    const perfilComMemoria = Object.assign({}, perfil);
    if (aprendizados.length) {
        const linhas = aprendizados
            .filter(a => Number(a.total_vezes_usada) > 0)
            .map(a => `- ${incAdvNomeEstrategia(a.estrategia)}: ${Math.round(Number(a.taxa_sucesso))}% de sucesso em ${a.total_vezes_usada} uso(s)`)
            .join('\n');
        if (linhas) {
            perfilComMemoria.observacoes_geral = (perfil.observacoes_geral || '') +
                '\n\nMEMÓRIA DO SISTEMA (priorize as estratégias com maior sucesso comprovado):\n' + linhas;
        }
    }

    const resp = await fetch(API_INCLUSAO + '/api/gerar_adaptacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil: perfilComMemoria, atividade_original: original, contexto, aprendizados })
    });
    const dados = await resp.json();
    if (!resp.ok || !dados.sucesso) throw new Error(dados.erro || 'Erro na IA');
    return dados;
}

// ------------------------------------------------------------------------
// Lista de adaptações salvas — agora com Feedback e envio para AEE
// ------------------------------------------------------------------------
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
        lista.innerHTML = '<div class="inc-empty">📭 Nenhuma adaptação salva ainda.<br><small>Gere uma acima, revise no co-piloto e clique em "Salvar Adaptação".</small></div>';
        return;
    }
    lista.innerHTML = itens.map(reg => {
        const p = perfilDeAdaptacao(reg);
        const a = reg.atividade_adaptada || {};
        const nq = (a.questoes || []).length;
        return `
        <div class="inc-item">
            <div>
                <span class="titulo">${escaparHTML(a.titulo || 'Adaptação sem título')}</span> ${badgeNEE(p.tipo_nee)} ${incAdvBadgeFeedback(reg.feedback_professor)}
                <div class="meta">👤 ${escaparHTML(p.nome_aluno)} • 📝 ${nq} questão(ões) • 🕒 ${formatarDataAdapt(reg.criado_em)}${a.tempo_sugerido_minutos ? ' • ⏰ ' + a.tempo_sugerido_minutos + ' min' : ''}${reg.taxa_acerto_aluno != null ? ' • 🎯 ' + Number(reg.taxa_acerto_aluno).toFixed(0) + '% acerto' : ''}</div>
            </div>
            <div class="acoes">
                <button class="btn btn-secondary btn-sm" onclick="abrirAdaptacaoSalva('${reg.id}')">👀 Abrir</button>
                <button class="btn btn-primary btn-sm" onclick="imprimirAdaptacaoSalva('${reg.id}','aluno')">📄 Aluno</button>
                <button class="btn btn-success btn-sm" onclick="imprimirAdaptacaoSalva('${reg.id}','professor')">📋 Professor</button>
                <button class="btn btn-warn btn-sm" onclick="abrirFeedbackAdaptacao('${reg.id}')">📝 Feedback</button>
                <button class="btn btn-secondary btn-sm" onclick="abrirEnvioAEE('${reg.id}')">🤝 AEE</button>
                <button class="btn btn-danger btn-sm" onclick="excluirAdaptacao('${reg.id}')">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

// ------------------------------------------------------------------------
// Registrar feedback (alimenta a memória do sistema)
// ------------------------------------------------------------------------
function abrirFeedbackAdaptacao(id) {
    const reg = adaptacoesCache.find(a => a.id === id);
    if (!reg) { toast('❌ Adaptação não encontrada.', 'error'); return; }
    const p = perfilDeAdaptacao(reg);
    const a = reg.atividade_adaptada || {};
    const antigo = document.getElementById('modalFeedbackInc');
    if (antigo) antigo.remove();
    const html = `
    <div id="modalFeedbackInc" class="modal active" style="z-index:10001;">
        <div class="modal-content" style="max-width:560px;">
            <div class="modal-header">
                <h3>📝 Feedback — ${escaparHTML(a.titulo || 'Adaptação')}</h3>
                <button class="btn btn-sm" onclick="fecharModal('modalFeedbackInc')">✕</button>
            </div>
            <div class="modal-body">
                <p style="font-size:13px;color:#666;">Aluno: <strong>${escaparHTML(p.nome_aluno)}</strong> (${p.tipo_nee}). Como esta adaptação funcionou na prática?</p>
                <div class="inc-feedback-opt">
                    <label style="border-color:#1b7f3b;"><input type="radio" name="incFeedback" value="funcionou" ${reg.feedback_professor === 'funcionou' ? 'checked' : ''}> ✅ Funcionou</label>
                    <label style="border-color:#f0b429;"><input type="radio" name="incFeedback" value="parcial" ${reg.feedback_professor === 'parcial' ? 'checked' : ''}> 🟡 Parcial</label>
                    <label style="border-color:#c62828;"><input type="radio" name="incFeedback" value="nao_funcionou" ${reg.feedback_professor === 'nao_funcionou' ? 'checked' : ''}> ❌ Não funcionou</label>
                </div>
                <div class="form-group">
                    <label>🎯 Taxa de acerto do aluno (%) — opcional</label>
                    <input type="number" id="incFeedbackAcerto" min="0" max="100" value="${reg.taxa_acerto_aluno != null ? reg.taxa_acerto_aluno : ''}" placeholder="Ex: 75">
                </div>
                <div class="form-group">
                    <label>💬 O que funcionou ou precisa melhorar?</label>
                    <textarea id="incFeedbackComentario" rows="3" placeholder="Ex: As imagens ajudaram muito; os passos ficaram longos demais.">${escaparHTML(reg.comentario_feedback || '')}</textarea>
                </div>
                <div style="background:#f3e5f5;border-radius:8px;padding:10px;font-size:12px;color:#4a148c;margin-bottom:14px;">
                    🧠 Ao salvar, o sistema aprende: as estratégias deste perfil entram na memória coletiva e serão priorizadas nas próximas adaptações de ${p.tipo_nee}.
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button class="btn btn-secondary" onclick="fecharModal('modalFeedbackInc')">Cancelar</button>
                    <button class="btn btn-success" onclick="salvarFeedbackAdaptacao('${reg.id}')">💾 Salvar Feedback</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function salvarFeedbackAdaptacao(id) {
    const reg = adaptacoesCache.find(a => a.id === id);
    if (!reg) return;
    const sel = document.querySelector('input[name="incFeedback"]:checked');
    if (!sel) { toast('❌ Escolha uma opção de feedback.', 'error'); return; }
    const feedback = sel.value;
    const acertoRaw = document.getElementById('incFeedbackAcerto').value;
    const acerto = acertoRaw === '' ? null : Math.max(0, Math.min(100, Number(acertoRaw)));
    const comentario = document.getElementById('incFeedbackComentario').value.trim();
    const p = perfilDeAdaptacao(reg);
    const payload = { feedback_professor: feedback, comentario_feedback: comentario, taxa_acerto_aluno: acerto };
    try {
        toast('💾 Salvando feedback...', 'info');
        const r = await sbFetch('PATCH', `/rest/v1/adaptacoes_geradas?id=eq.${id}`, payload);
        if (!r.ok) throw new Error((await r.json()).message || 'Erro ao salvar feedback');
        Object.assign(reg, payload);
        const score = feedback === 'funcionou' ? 100 : feedback === 'parcial' ? 50 : 0;
        await incAdvAtualizarMemoria(p.tipo_nee, p.estrategias_preferenciais || [], score);
        fecharModal('modalFeedbackInc');
        renderizarAdaptacoesSalvas();
        toast('✅ Feedback salvo! A memória do sistema foi atualizada.', 'success');
    } catch (e) { toast('❌ ' + e.message, 'error'); }
}

async function incAdvAtualizarMemoria(tipoNee, estrategias, score) {
    if (!tipoNee || !estrategias.length) return;
    for (const est of estrategias) {
        try {
            const r = await sbFetch('GET', `/rest/v1/aprendizados_sistema?tipo_nee=eq.${tipoNee}&estrategia=eq.${encodeURIComponent(est)}&select=*`);
            const existentes = r.ok ? await r.json() : [];
            if (existentes.length) {
                const old = existentes[0];
                const total = Number(old.total_vezes_usada || 0) + 1;
                const taxa = ((Number(old.taxa_sucesso || 0) * Number(old.total_vezes_usada || 0)) + score) / total;
                await sbFetch('PATCH', `/rest/v1/aprendizados_sistema?id=eq.${old.id}`, {
                    taxa_sucesso: Math.round(taxa * 100) / 100, total_vezes_usada: total, ultima_atualizacao: new Date().toISOString()
                });
            } else {
                await sbFetch('POST', '/rest/v1/aprendizados_sistema', {
                    tipo_nee: tipoNee, estrategia: est, taxa_sucesso: score, total_vezes_usada: 1, ultima_atualizacao: new Date().toISOString()
                });
            }
        } catch (e) { console.warn('Memória não atualizada para', est, e); }
    }
}

// ========================================================================
// 🤝 FASE 4 — COLABORAÇÃO AEE
// ========================================================================
function mudarAbaAEE(aba) {
    incAdvAba = aba;
    const r = document.getElementById('aeeRecebidas');
    const e = document.getElementById('aeeEnviadas');
    if (r) r.style.display = aba === 'recebidas' ? '' : 'none';
    if (e) e.style.display = aba === 'enviadas' ? '' : 'none';
    const tr = document.getElementById('tabAeeRecebidas');
    const te = document.getElementById('tabAeeEnviadas');
    if (tr) tr.classList.toggle('active', aba === 'recebidas');
    if (te) te.classList.toggle('active', aba === 'enviadas');
}

async function carregarColaboracoesAEE() {
    const email = (localStorage.getItem('sb_email') || '').toLowerCase();
    const boxR = document.getElementById('aeeRecebidas');
    const boxE = document.getElementById('aeeEnviadas');
    if (boxR) boxR.innerHTML = '<div class="inc-empty">⏳ Carregando colaborações...</div>';
    if (boxE) boxE.innerHTML = '';
    try {
        const [rc, ra, rp] = await Promise.all([
            sbFetch('GET', '/rest/v1/colaboracoes_aee?order=criado_em.desc'),
            sbFetch('GET', '/rest/v1/adaptacoes_geradas?select=id,atividade_adaptada,atividade_original,gerado_por,perfil_nee_id,criado_em'),
            sbFetch('GET', '/rest/v1/perfis_nee?select=id,nome_aluno,tipo_nee,estrategias_preferenciais')
        ]);
        incAdvColab = rc.ok ? await rc.json() : [];
        const adapt = ra.ok ? await ra.json() : [];
        const perfis = rp.ok ? await rp.json() : [];
        incAdvAdaptMap = {}; adapt.forEach(a => { incAdvAdaptMap[a.id] = a; });
        incAdvPerfilMap = {}; perfis.forEach(p => { incAdvPerfilMap[p.id] = p; });
        incAdvRenderAEE(email);
    } catch (e) { if (boxR) boxR.innerHTML = '<div class="inc-empty" style="color:#c62828;">❌ Erro ao carregar colaborações.</div>'; }
}

function incAdvRenderAEE(email) {
    const recebidas = incAdvColab.filter(c => (c.professor_aee_email || '').toLowerCase() === email);
    const enviadas = incAdvColab.filter(c => {
        const a = incAdvAdaptMap[c.adaptacao_id];
        return a && (a.gerado_por || '').toLowerCase() === email;
    });
    const renderItem = (c, modo) => {
        const a = incAdvAdaptMap[c.adaptacao_id] || {};
        const aa = a.atividade_adaptada || {};
        const p = incAdvPerfilMap[a.perfil_nee_id] || { nome_aluno: 'Aluno', tipo_nee: '' };
        const status = c.aprovado ? '<span class="inc-badge aprovada">✅ Aprovada</span>' : '<span class="inc-badge pendente">⏳ Pendente</span>';
        const quem = modo === 'recebidas' ? 'De: ' + escaparHTML(a.gerado_por || '') : 'Para: ' + escaparHTML(c.professor_aee_email || '');
        const btn = modo === 'recebidas'
            ? `<button class="btn btn-primary btn-sm" onclick="abrirRevisaoAEE('${c.id}')">✍️ Revisar</button>`
            : `<button class="btn btn-secondary btn-sm" onclick="abrirRevisaoAEE('${c.id}', true)">👁️ Ver</button>`;
        return `
        <div class="inc-item">
            <div>
                <span class="titulo">${escaparHTML(aa.titulo || 'Adaptação')}</span> ${badgeNEE(p.tipo_nee)} ${status}
                <div class="meta">👤 ${escaparHTML(p.nome_aluno)} • ${quem} • 🕒 ${formatarDataAdapt(c.criado_em)}<br>💬 ${escaparHTML(c.sugestoes || 'Sem mensagem')}</div>
            </div>
            <div class="acoes">${btn}</div>
        </div>`;
    };
    const boxR = document.getElementById('aeeRecebidas');
    const boxE = document.getElementById('aeeEnviadas');
    if (boxR) boxR.innerHTML = recebidas.length ? recebidas.map(c => renderItem(c, 'recebidas')).join('') : '<div class="inc-empty">📥 Nenhuma adaptação enviada para você revisar.<br><small>Quando um professor da sala regular enviar uma adaptação para o seu e-mail, ela aparecerá aqui.</small></div>';
    if (boxE) boxE.innerHTML = enviadas.length ? enviadas.map(c => renderItem(c, 'enviadas')).join('') : '<div class="inc-empty">📤 Você ainda não enviou adaptações para o AEE.<br><small>Use o botão "🤝 AEE" em uma adaptação salva.</small></div>';
    mudarAbaAEE(incAdvAba);
}

function abrirEnvioAEE(id) {
    const reg = adaptacoesCache.find(a => a.id === id);
    if (!reg) { toast('❌ Adaptação não encontrada.', 'error'); return; }
    const p = perfilDeAdaptacao(reg);
    const a = reg.atividade_adaptada || {};
    const antigo = document.getElementById('modalEnvioAEE');
    if (antigo) antigo.remove();
    const html = `
    <div id="modalEnvioAEE" class="modal active" style="z-index:10001;">
        <div class="modal-content" style="max-width:520px;">
            <div class="modal-header">
                <h3>🤝 Enviar para o AEE</h3>
                <button class="btn btn-sm" onclick="fecharModal('modalEnvioAEE')">✕</button>
            </div>
            <div class="modal-body">
                <p style="font-size:13px;color:#666;">Adaptação: <strong>${escaparHTML(a.titulo || 'Sem título')}</strong> • Aluno: <strong>${escaparHTML(p.nome_aluno)}</strong></p>
                <div class="form-group">
                    <label>📧 E-mail do professor de AEE</label>
                    <input type="email" id="incAeeEmail" placeholder="aee@escola.com">
                </div>
                <div class="form-group">
                    <label>💬 Mensagem / pedido de revisão</label>
                    <textarea id="incAeeMensagem" rows="3" placeholder="Ex: Pode revisar se os passos estão adequados para o Lucas?"></textarea>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button class="btn btn-secondary" onclick="fecharModal('modalEnvioAEE')">Cancelar</button>
                    <button class="btn btn-primary" onclick="enviarParaAEE('${reg.id}')">📤 Enviar</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function enviarParaAEE(id) {
    const email = document.getElementById('incAeeEmail').value.trim().toLowerCase();
    const msg = document.getElementById('incAeeMensagem').value.trim();
    if (!email || !email.includes('@')) { toast('❌ Informe um e-mail válido.', 'error'); return; }
    try {
        toast('📤 Enviando para o AEE...', 'info');
        const r = await sbFetch('POST', '/rest/v1/colaboracoes_aee', {
            adaptacao_id: id, professor_aee_email: email, sugestoes: msg, aprovado: false
        });
        if (!r.ok) throw new Error((await r.json()).message || 'Erro ao enviar');
        fecharModal('modalEnvioAEE');
        toast('✅ Adaptação enviada para o AEE!', 'success');
    } catch (e) { toast('❌ ' + e.message, 'error'); }
}

function abrirRevisaoAEE(colabId, somenteLeitura) {
    const c = incAdvColab.find(x => x.id === colabId);
    if (!c) return;
    const a = incAdvAdaptMap[c.adaptacao_id] || {};
    const aa = a.atividade_adaptada || {};
    const p = incAdvPerfilMap[a.perfil_nee_id] || { nome_aluno: 'Aluno', tipo_nee: '' };
    const orig = (a.atividade_original || {}).texto || '';
    const antigo = document.getElementById('modalRevisaoAEE');
    if (antigo) antigo.remove();
    const questoesHtml = (aa.questoes || []).map((q, i) => `
        <div style="background:#fff;border:1px solid #e0d4ec;border-radius:8px;padding:10px;margin-bottom:8px;">
            <strong style="color:#6a1b9a;">Questão ${q.numero || i + 1}</strong>
            <div style="font-size:13px;margin-top:4px;white-space:pre-wrap;">${escaparHTML(q.enunciado || '')}</div>
            ${(q.passos || []).length ? '<div style="font-size:12px;color:#008080;margin-top:4px;">📝 ' + escaparHTML(q.passos.join(' → ')) + '</div>' : ''}
        </div>`).join('');
    const controles = somenteLeitura ? '' : `
        <div class="form-group">
            <label>💬 Suas sugestões como AEE</label>
            <textarea id="incAeeSugestoes" rows="4" placeholder="Ex: Reduzir para 3 passos; trocar a imagem por algo mais concreto.">${escaparHTML(c.sugestoes || '')}</textarea>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-weight:700;color:#1b7f3b;margin-bottom:14px;">
            <input type="checkbox" id="incAeeAprovado" ${c.aprovado ? 'checked' : ''} style="accent-color:#1b7f3b;width:auto;"> ✅ Aprovar esta adaptação para uso em sala
        </label>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button class="btn btn-secondary" onclick="fecharModal('modalRevisaoAEE')">Fechar</button>
            <button class="btn btn-success" onclick="salvarRevisaoAEE('${c.id}')">💾 Salvar revisão</button>
        </div>`;
    const leituraInfo = somenteLeitura ? `
        <div style="background:#f3e5f5;border-radius:8px;padding:12px;font-size:13px;margin-bottom:12px;">
            <strong>Status:</strong> ${c.aprovado ? '✅ Aprovada pelo AEE' : '⏳ Aguardando revisão'}<br>
            <strong>Sugestões do AEE:</strong> ${escaparHTML(c.sugestoes || 'Nenhuma ainda')}
        </div>` : '';
    const html = `
    <div id="modalRevisaoAEE" class="modal active" style="z-index:10001;">
        <div class="modal-content" style="max-width:860px;max-height:90vh;overflow-y:auto;">
            <div class="modal-header">
                <h3>🤝 Revisão AEE — ${escaparHTML(aa.titulo || 'Adaptação')}</h3>
                <button class="btn btn-sm" onclick="fecharModal('modalRevisaoAEE')">✕</button>
            </div>
            <div class="modal-body">
                <p style="font-size:13px;color:#666;">Aluno: <strong>${escaparHTML(p.nome_aluno)}</strong> (${p.tipo_nee}) • Enviado por: ${escaparHTML(a.gerado_por || '')}</p>
                ${leituraInfo}
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px;">
                    <div>
                        <h4 style="color:#1565c0;margin:0 0 8px;">📄 Original</h4>
                        <div class="inc-scrollbox">${escaparHTML(orig)}</div>
                    </div>
                    <div>
                        <h4 style="color:#6a1b9a;margin:0 0 8px;">🧩 Adaptada</h4>
                        <div class="inc-scrollbox">${questoesHtml || 'Sem questões'}</div>
                    </div>
                </div>
                ${controles}
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function salvarRevisaoAEE(colabId) {
    const c = incAdvColab.find(x => x.id === colabId);
    if (!c) return;
    const sugestoes = document.getElementById('incAeeSugestoes').value.trim();
    const aprovado = document.getElementById('incAeeAprovado').checked;
    const email = localStorage.getItem('sb_email');
    try {
        toast('💾 Salvando revisão...', 'info');
        const r = await sbFetch('PATCH', `/rest/v1/colaboracoes_aee?id=eq.${colabId}`, {
            sugestoes, aprovado,
            ajustes_feitos: { revisado_por: email, revisado_em: new Date().toISOString() }
        });
        if (!r.ok) throw new Error((await r.json()).message || 'Erro ao salvar revisão');
        c.sugestoes = sugestoes; c.aprovado = aprovado;
        fecharModal('modalRevisaoAEE');
        incAdvRenderAEE(email);
        toast(aprovado ? '✅ Adaptação aprovada pelo AEE!' : '✅ Sugestões enviadas!', 'success');
    } catch (e) { toast('❌ ' + e.message, 'error'); }
}

// ========================================================================
// 📊 FASE 4 — RELATÓRIOS DE INCLUSÃO
// ========================================================================
async function carregarRelatoriosInclusao() {
    const grid = document.getElementById('incStatsGrid');
    if (grid) grid.innerHTML = '<div class="inc-empty">⏳ Calculando indicadores...</div>';
    try {
        const [rp, ra, rap, rc] = await Promise.all([
            sbFetch('GET', '/rest/v1/perfis_nee?select=id,nome_aluno,tipo_nee'),
            sbFetch('GET', '/rest/v1/adaptacoes_geradas?select=id,atividade_adaptada,perfil_nee_id,feedback_professor,taxa_acerto_aluno,criado_em&order=criado_em.desc'),
            sbFetch('GET', '/rest/v1/aprendizados_sistema?select=*&order=taxa_sucesso.desc'),
            sbFetch('GET', '/rest/v1/colaboracoes_aee?select=id,aprovado')
        ]);
        const perfis = rp.ok ? await rp.json() : [];
        const adapt = ra.ok ? await ra.json() : [];
        const aprend = rap.ok ? await rap.json() : [];
        const colab = rc.ok ? await rc.json() : [];
        const perfilMap = {}; perfis.forEach(p => { perfilMap[p.id] = p; });

        const porTipo = { TEA: 0, TDAH: 0, TEA_TDAH: 0 };
        perfis.forEach(p => { if (porTipo[p.tipo_nee] != null) porTipo[p.tipo_nee]++; });
        const fb = { funcionou: 0, parcial: 0, nao_funcionou: 0, sem: 0 };
        let somaAcerto = 0, nAcerto = 0;
        adapt.forEach(a => {
            if (a.feedback_professor && fb[a.feedback_professor] != null) fb[a.feedback_professor]++; else fb.sem++;
            if (a.taxa_acerto_aluno != null) { somaAcerto += Number(a.taxa_acerto_aluno); nAcerto++; }
        });
        const mediaAcerto = nAcerto ? (somaAcerto / nAcerto) : 0;
        const colabPend = colab.filter(c => !c.aprovado).length;
        const colabAprov = colab.filter(c => c.aprovado).length;

        if (grid) grid.innerHTML = `
            <div class="inc-stat"><div class="num">${perfis.length}</div><div class="lbl">🧩 Perfis NEE</div><div class="sub">${porTipo.TEA} TEA • ${porTipo.TDAH} TDAH • ${porTipo.TEA_TDAH} ambos</div></div>
            <div class="inc-stat"><div class="num">${adapt.length}</div><div class="lbl">📚 Adaptações geradas</div><div class="sub">${adapt.length - fb.sem} com feedback</div></div>
            <div class="inc-stat"><div class="num">${fb.funcionou}</div><div class="lbl">✅ Funcionaram</div><div class="sub">${fb.parcial} parciais • ${fb.nao_funcionou} não funcionaram</div></div>
            <div class="inc-stat"><div class="num">${mediaAcerto.toFixed(0)}%</div><div class="lbl">🎯 Acerto médio</div><div class="sub">${nAcerto} avaliação(ões) com taxa</div></div>
            <div class="inc-stat"><div class="num">${aprend.length}</div><div class="lbl">🧠 Estratégias aprendidas</div><div class="sub">memória coletiva ativa</div></div>
            <div class="inc-stat"><div class="num">${colabAprov}/${colab.length}</div><div class="lbl">🤝 Colaborações AEE</div><div class="sub">${colabPend} pendentes</div></div>`;

        incAdvRenderCharts(porTipo, fb);
        incAdvRenderEstrategias(aprend);
        incAdvRenderRecentes(adapt, perfilMap);
    } catch (e) { if (grid) grid.innerHTML = '<div class="inc-empty" style="color:#c62828;">❌ Erro ao calcular indicadores.</div>'; }
}

function incAdvRenderCharts(porTipo, fb) {
    if (!window.Chart) return;
    window._incCharts = window._incCharts || [];
    window._incCharts.forEach(ch => { try { ch.destroy(); } catch (e) {} });
    window._incCharts = [];
    const palette = ['#6a1b9a', '#008080', '#f0b429', '#1565c0', '#dc3545', '#1b7f3b'];
    const c1 = document.getElementById('chartNeTipos');
    if (c1) {
        window._incCharts.push(new Chart(c1, {
            type: 'doughnut',
            data: { labels: ['TEA', 'TDAH', 'TEA + TDAH'], datasets: [{ data: [porTipo.TEA, porTipo.TDAH, porTipo.TEA_TDAH], backgroundColor: palette.slice(0, 3), borderColor: '#fff', borderWidth: 3 }] },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#4a148c', font: { weight: '700' } } } }, cutout: '58%' }
        }));
    }
    const c2 = document.getElementById('chartFeedback');
    if (c2) {
        window._incCharts.push(new Chart(c2, {
            type: 'bar',
            data: { labels: ['✅ Funcionou', '🟡 Parcial', '❌ Não funcionou', '⏳ Sem feedback'], datasets: [{ data: [fb.funcionou, fb.parcial, fb.nao_funcionou, fb.sem], backgroundColor: ['#1b7f3b', '#f0b429', '#dc3545', '#9e9e9e'], borderRadius: 8 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0, color: '#666' }, grid: { color: '#eee' } }, x: { ticks: { color: '#4a148c', font: { weight: '700' } }, grid: { display: false } } } }
        }));
    }
}

function incAdvRenderEstrategias(aprend) {
    const box = document.getElementById('incEstrategiasRank');
    if (!box) return;
    if (!aprend.length) { box.innerHTML = '<div class="inc-empty">🧠 A memória ainda está vazia.<br><small>Registre feedback nas adaptações e o sistema começará a aprender quais estratégias funcionam mais.</small></div>'; return; }
    box.innerHTML = aprend.map(a => {
        const taxa = Math.max(0, Math.min(100, Number(a.taxa_sucesso || 0)));
        return `
        <div class="inc-rank-item">
            <div class="inc-rank-top">
                <span><strong>${escaparHTML(incAdvNomeEstrategia(a.estrategia))}</strong> <span class="inc-badge pendente" style="margin-left:6px;">${a.tipo_nee === 'TEA_TDAH' ? 'TEA+TDAH' : a.tipo_nee}</span></span>
                <span style="color:#008080;font-weight:700;">${taxa.toFixed(0)}% • ${a.total_vezes_usada} uso(s)</span>
            </div>
            <div class="inc-rank-bar"><div class="inc-rank-fill" style="width:${taxa}%"></div></div>
        </div>`;
    }).join('');
}

function incAdvRenderRecentes(adapt, perfilMap) {
    const box = document.getElementById('incRecentes');
    if (!box) return;
    if (!adapt.length) { box.innerHTML = '<div class="inc-empty">📭 Nenhuma adaptação registrada ainda.</div>'; return; }
    box.innerHTML = adapt.slice(0, 10).map(a => {
        const p = perfilMap[a.perfil_nee_id] || { nome_aluno: 'Aluno', tipo_nee: '' };
        const aa = a.atividade_adaptada || {};
        return `
        <div class="inc-item">
            <div>
                <span class="titulo">${escaparHTML(aa.titulo || 'Adaptação')}</span> ${badgeNEE(p.tipo_nee)} ${incAdvBadgeFeedback(a.feedback_professor)}
                <div class="meta">👤 ${escaparHTML(p.nome_aluno)} • 🕒 ${formatarDataAdapt(a.criado_em)}${a.taxa_acerto_aluno != null ? ' • 🎯 ' + Number(a.taxa_acerto_aluno).toFixed(0) + '% acerto' : ''}</div>
            </div>
        </div>`;
    }).join('');
}