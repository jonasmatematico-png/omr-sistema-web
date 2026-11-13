// ========================================================================
// 🧩 MÓDULO DE INCLUSÃO - ARQUIVO COMPLETO E UNIFICADO (VERSÃO FINAL)
// Perfis NEE + Aluno cadastrado + IA (Gemini) + Modo Co-Piloto
// ========================================================================

let perfisNEE = [];
let adaptacaoAtual = null;

// ========================================================================
// 📋 LISTAGEM E EXCLUSÃO DE PERFIS
// ========================================================================

async function carregarPerfisNEE() {
    const lista = document.getElementById('listaPerfisNEE');
    if (!lista) return;

    lista.innerHTML = '<div class="loading">Carregando...</div>';
    const emailProfessor = localStorage.getItem('sb_email');

    try {
        const r = await sbFetch('GET', `/rest/v1/perfis_nee?email_professor=eq.${emailProfessor}&order=criado_em.desc`);
        if (!r.ok) {
            lista.innerHTML = '<p style="color:#dc3545;">Erro ao carregar perfis.</p>';
            return;
        }
        const data = await r.json();
        perfisNEE = data;

        if (data.length === 0) {
            lista.innerHTML = '<p style="color:#888; text-align:center; padding:20px;">Nenhum perfil cadastrado ainda.</p>';
            return;
        }

        lista.innerHTML = data.map(perfil => {
            const tipoBadge = {
                'TEA': '<span style="background:#e3f2fd; color:#1565c0; padding:2px 8px; border-radius:4px; font-size:12px;">TEA</span>',
                'TDAH': '<span style="background:#fff3e0; color:#e65100; padding:2px 8px; border-radius:4px; font-size:12px;">TDAH</span>',
                'TEA_TDAH': '<span style="background:#f3e5f5; color:#6a1b9a; padding:2px 8px; border-radius:4px; font-size:12px;">TEA+TDAH</span>'
            }[perfil.tipo_nee] || perfil.tipo_nee;

            const estrategiasPref = (perfil.estrategias_preferenciais || []).join(', ') || 'Nenhuma';
            const estrategiasEvitar = (perfil.estrategias_evitar || []).join(', ') || 'Nenhuma';

            return `
                <div class="prova-item" style="border-left: 4px solid #6a1b9a; margin-bottom: 10px;">
                    <div class="prova-item-info">
                        <strong>${perfil.nome_aluno}</strong> ${tipoBadge}
                        <div class="prova-item-meta" style="font-size: 13px; margin-top: 4px;">
                            Nível ${perfil.nivel_suporte} • +${perfil.tempo_adicional_minutos}min<br>
                            <small><strong>Preferências:</strong> ${estrategiasPref}</small><br>
                            <small><strong>Evitar:</strong> ${estrategiasEvitar}</small>
                            ${perfil.observacoes_geral ? `<br><small style="color:#666;"><em>"${perfil.observacoes_geral}"</em></small>` : ''}
                        </div>
                    </div>
                    <div style="display:flex; gap:6px; align-items: center;">
                        <button class="btn btn-danger btn-sm" onclick="excluirPerfilNEE('${perfil.id}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        lista.innerHTML = '<p style="color:#dc3545;">Falha de conexão.</p>';
    }
}

async function excluirPerfilNEE(id) {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) return;
    try {
        const r = await sbFetch('DELETE', `/rest/v1/perfis_nee?id=eq.${id}`);
        if (!r.ok) { toast('❌ Erro ao excluir', 'error'); return; }
        toast('✅ Perfil excluído!', 'success');
        await carregarPerfisNEE();
    } catch (e) {
        toast('❌ Erro: ' + e.message, 'error');
    }
}

// ========================================================================
// 🏫 TURMA → ALUNO (CADASTRO DE PERFIL VINCULADO AO ALUNO REAL)
// ========================================================================

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
            (a.numero_chamada || '') + '. ' + (a.nome_completo || 'Sem nome') + '</option>').join('');
    } catch (e) {
        sel.innerHTML = '<option value="">Erro ao carregar alunos</option>';
    }
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
        // Evita perfil duplicado para o mesmo aluno
        const rCheck = await sbFetch('GET', '/rest/v1/perfis_nee?aluno_id=eq.' + alunoId + '&select=id');
        if (rCheck.ok) {
            const existentes = await rCheck.json();
            if (existentes.length > 0) {
                toast('⚠️ Este aluno já tem um perfil. Exclua o antigo antes de criar outro.', 'error');
                return;
            }
        }

        toast('💾 Salvando perfil...', 'info');
        const r = await sbFetch('POST', '/rest/v1/perfis_nee', dadosPerfil);
        if (!r.ok) {
            const erro = await r.json();
            toast('❌ Erro ao salvar: ' + (erro.message || 'Erro desconhecido'), 'error');
            return;
        }
        toast('✅ Perfil de ' + nomeAluno + ' salvo!', 'success');

        document.getElementById('selTurmaNEE').value = '';
        selAluno.innerHTML = '<option value="">Selecione a turma primeiro...</option>';
        document.getElementById('observacoesNEE').value = '';
        document.querySelectorAll('.estrategia-pref, .estrategia-evitar').forEach(cb => cb.checked = false);
        await carregarPerfisNEE();
    } catch (e) {
        toast('❌ Falha ao salvar: ' + e.message, 'error');
    }
}

// ========================================================================
// 🎯 TELA "GERAR ATIVIDADE ADAPTADA"
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
        if (!perfis.length) {
            sel.innerHTML = '<option value="">Nenhum perfil — cadastre primeiro em 🧩 Perfis de Alunos</option>';
            return;
        }
        sel.innerHTML = '<option value="">Selecione o aluno...</option>' +
            perfis.map(p => `<option value="${p.id}">${p.nome_aluno} (${p.tipo_nee} - Nível ${p.nivel_suporte})</option>`).join('');
    } catch (e) {
        sel.innerHTML = '<option value="">Erro ao carregar perfis</option>';
    }
}

async function gerarAdaptacaoIA() {
    const perfilId = document.getElementById('selPerfilAdaptacao').value;
    const original = document.getElementById('adaptOriginal').value.trim();
    if (!perfilId) return toast('❌ Selecione o aluno!', 'error');
    if (!original) return toast('❌ Cole a atividade original!', 'error');

    const perfil = (perfisNEE || []).find(p => p.id === perfilId);
    if (!perfil) return toast('❌ Perfil não encontrado. Reabra a tela.', 'error');

    const contexto = {
        disciplina: document.getElementById('adaptDisciplina').value.trim(),
        ano: document.getElementById('adaptAno').value.trim(),
        tema: document.getElementById('adaptTema').value.trim(),
        habilidade: document.getElementById('adaptHabilidade').value.trim()
    };

    toast('🤖 Gerando adaptação com IA... pode levar até 1 minuto.', 'info');
    try {
        const resp = await fetch('https://omr-backend-laboratorio.onrender.com/api/gerar_adaptacao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ perfil: perfil, atividade_original: original, contexto: contexto })
        });
        const dados = await resp.json();
        if (!resp.ok || !dados.sucesso) throw new Error(dados.erro || 'Erro na IA');

        adaptacaoAtual = { perfil: perfil, original: original, contexto: contexto, adaptacao: dados.adaptacao, prompt: dados.prompt_usado || '' };
        toast('✅ Adaptação gerada! Revise no modo co-piloto.', 'success');
        abrirModoCopiloto();
    } catch (e) {
        toast('❌ ' + e.message, 'error');
    }
}

// ========================================================================
// 👀 MODO CO-PILOTO (ORIGINAL × ADAPTADA, EDITÁVEL)
// ========================================================================

function abrirModoCopiloto() {
    if (!adaptacaoAtual) return;
    const a = adaptacaoAtual.adaptacao || {};
    const questoes = a.questoes || [];
    const antigo = document.getElementById('modalCoPiloto');
    if (antigo) antigo.remove();

    const modalHTML = `
    <div id="modalCoPiloto" class="modal active" style="z-index:10000;">
        <div class="modal-content" style="max-width:95%; width:95%; max-height:90vh; overflow-y:auto;">
            <div class="modal-header">
                <h3>🎯 Co-Piloto — ${adaptacaoAtual.perfil.nome_aluno} (${adaptacaoAtual.perfil.tipo_nee})</h3>
                <button class="btn btn-sm" onclick="fecharModal('modalCoPiloto')">✕</button>
            </div>
            <div class="modal-body">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    <div>
                        <h4 style="color:#1565c0;">📄 Atividade Original</h4>
                        <div style="border:2px solid #1565c0; padding:15px; border-radius:8px; background:#f5f5f5; white-space:pre-wrap; max-height:450px; overflow-y:auto;">${escaparHTML(adaptacaoAtual.original)}</div>
                    </div>
                    <div>
                        <h4 style="color:#6a1b9a;">🧩 Adaptada pela IA (edite à vontade)</h4>
                        <div style="border:2px solid #6a1b9a; padding:15px; border-radius:8px; background:#f3e5f5; max-height:450px; overflow-y:auto;">
                            <label style="font-weight:bold;">Título</label>
                            <input id="adaptTitulo" value="${escaparHTML(a.titulo || '')}" style="width:100%; margin-bottom:10px;">
                            <label style="font-weight:bold;">Instruções gerais</label>
                            <textarea id="adaptInstrucoes" rows="2" style="width:100%; margin-bottom:10px;">${escaparHTML(a.instrucoes_gerais || '')}</textarea>
                            ${a.exemplo_resolvido ? `<div style="background:#fff; padding:8px; border-radius:4px; margin-bottom:10px;"><strong>💡 Exemplo resolvido:</strong><br>${escaparHTML(a.exemplo_resolvido.enunciado || '')}<br><strong>Resposta:</strong> ${escaparHTML(a.exemplo_resolvido.resposta || '')}</div>` : ''}
                            ${questoes.map((q, i) => `
                            <div style="background:#fff; padding:10px; border-radius:4px; margin-bottom:10px;">
                                <strong>Questão ${q.numero || (i + 1)}</strong>
                                <textarea id="enunciadoAdaptado${i}" rows="4" style="width:100%; margin-top:5px;">${escaparHTML(q.enunciado || '')}</textarea>
                                ${(q.passos && q.passos.length) ? `<small>📝 Passos: ${escaparHTML(q.passos.join(' → '))}</small><br>` : ''}
                                ${(q.alternativas && q.alternativas.length) ? `<small>${escaparHTML(q.alternativas.join(' | '))}</small><br>` : ''}
                                ${q.imagem_sugerida ? `<small style="color:#666;">🖼️ Imagem sugerida: ${escaparHTML(q.imagem_sugerida)}</small>` : ''}
                            </div>`).join('')}
                            ${a.tempo_sugerido_minutos ? `<small>⏰ Tempo sugerido: ${a.tempo_sugerido_minutos} min</small>` : ''}
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px; justify-content:flex-end;">
                    <button class="btn btn-secondary" onclick="fecharModal('modalCoPiloto')">Cancelar</button>
                    <button class="btn btn-warn" onclick="regenerarAdaptacao()">🔄 Gerar Novamente</button>
                    <button class="btn btn-success" onclick="salvarAdaptacao()">💾 Salvar Adaptação</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function salvarAdaptacao() {
    if (!adaptacaoAtual) return;
    const a = adaptacaoAtual.adaptacao;
    a.titulo = document.getElementById('adaptTitulo').value;
    a.instrucoes_gerais = document.getElementById('adaptInstrucoes').value;
    (a.questoes || []).forEach((q, i) => {
        const el = document.getElementById('enunciadoAdaptado' + i);
        if (el) q.enunciado = el.value;
    });

    const dados = {
        aluno_id: adaptacaoAtual.perfil.aluno_id || null,
        perfil_nee_id: adaptacaoAtual.perfil.id,
        atividade_original: { texto: adaptacaoAtual.original, contexto: adaptacaoAtual.contexto },
        atividade_adaptada: a,
        prompt_usado: adaptacaoAtual.prompt,
        gerado_por: localStorage.getItem('sb_email')
    };
    try {
        toast('💾 Salvando adaptação...', 'info');
        const r = await sbFetch('POST', '/rest/v1/adaptacoes_geradas', dados);
        if (!r.ok) throw new Error((await r.json()).message || 'Erro ao salvar');
        toast('✅ Adaptação salva com sucesso!', 'success');
        fecharModal('modalCoPiloto');
    } catch (e) {
        toast('❌ ' + e.message, 'error');
    }
}

function regenerarAdaptacao() {
    fecharModal('modalCoPiloto');
    gerarAdaptacaoIA();
}