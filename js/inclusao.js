// ========================================================================
// 🧩 MÓDULO DE INCLUSÃO - GESTÃO DE PERFIS NEE E ADAPTAÇÕES
// ========================================================================

// Variáveis globais
let perfisNEE = [];

// ========================================================================
// 📋 CADASTRO DE PERFIS NEE
// ========================================================================

async function salvarPerfilNEE() {
    const nomeAluno = document.getElementById('nomeAlunoNEE').value.trim();
    const tipoNEE = document.getElementById('tipoNEE').value;
    const nivelSuporte = parseInt(document.getElementById('nivelSuporte').value);
    const tempoAdicional = parseInt(document.getElementById('tempoAdicional').value);
    
    if (!nomeAluno) {
        toast('❌ Informe o nome do aluno!', 'error');
        return;
    }
    
    // Coleta estratégias preferenciais
    const estrategiasPref = Array.from(document.querySelectorAll('.estrategia-pref:checked'))
        .map(cb => cb.value);
    
    // Coleta estratégias a evitar
    const estrategiasEvitar = Array.from(document.querySelectorAll('.estrategia-evitar:checked'))
        .map(cb => cb.value);
    
    const observacoes = document.getElementById('observacoesNEE').value.trim();
    const emailProfessor = localStorage.getItem('sb_email');
    
    const dadosPerfil = {
        nome_aluno: nomeAluno,
        email_professor: emailProfessor,
        tipo_nee: tipoNEE,
        nivel_suporte: nivelSuporte,
        estrategias_preferenciais: estrategiasPref,
        estrategias_evitar: estrategiasEvitar,
        tempo_adicional_minutos: tempoAdicional,
        observacoes_geral: observacoes
    };
    
    try {
        const r = await sbFetch('POST', '/rest/v1/perfis_nee', dadosPerfil);
        
        if (!r.ok) {
            const erro = await r.json();
            toast('❌ Erro ao salvar: ' + (erro.message || 'Erro desconhecido'), 'error');
            return;
        }
        
        toast('✅ Perfil salvo com sucesso!', 'success');
        
        // Limpa formulário
        document.getElementById('nomeAlunoNEE').value = '';
        document.getElementById('observacoesNEE').value = '';
        document.querySelectorAll('.estrategia-pref, .estrategia-evitar').forEach(cb => cb.checked = false);
        
        // Recarrega lista
        carregarPerfisNEE();
        
    } catch (e) {
        toast('❌ Falha ao salvar: ' + e.message, 'error');
    }
}

async function carregarPerfisNEE() {
    const lista = document.getElementById('listaPerfisNEE');
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
                'TEA': '<span style="background:#e3f2fd; color:#1565c0; padding:2px 8px; border-radius:4px;">TEA</span>',
                'TDAH': '<span style="background:#fff3e0; color:#e65100; padding:2px 8px; border-radius:4px;">TDAH</span>',
                'TEA_TDAH': '<span style="background:#f3e5f5; color:#6a1b9a; padding:2px 8px; border-radius:4px;">TEA+TDAH</span>'
            }[perfil.tipo_nee];
            
            const estrategiasPref = (perfil.estrategias_preferenciais || []).join(', ') || 'Nenhuma';
            const estrategiasEvitar = (perfil.estrategias_evitar || []).join(', ') || 'Nenhuma';
            
            return `
                <div class="prova-item" style="border-left: 4px solid #6a1b9a;">
                    <div class="prova-item-info">
                        <strong>${perfil.nome_aluno}</strong> ${tipoBadge}
                        <div class="prova-item-meta">
                            Nível ${perfil.nivel_suporte} • +${perfil.tempo_adicional_minutos}min<br>
                            <small><strong>Preferências:</strong> ${estrategiasPref}</small><br>
                            <small><strong>Evitar:</strong> ${estrategiasEvitar}</small>
                            ${perfil.observacoes_geral ? `<br><small><em>${perfil.observacoes_geral}</em></small>` : ''}
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
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
    if (!confirm('Excluir este perfil?')) return;
    
    try {
        const r = await sbFetch('DELETE', `/rest/v1/perfis_nee?id=eq.${id}`);
        
        if (!r.ok) {
            toast('❌ Erro ao excluir', 'error');
            return;
        }
        
        toast('✅ Perfil excluído!', 'success');
        carregarPerfisNEE();
        
    } catch (e) {
        toast('❌ Erro: ' + e.message, 'error');
    }
}

// ========================================================================
// 🎯 GERAR ATIVIDADE ADAPTADA (MODO CO-PILOTO)
// ========================================================================

async function gerarAtividadeAdaptada(planejamentoId) {
    // Busca perfis disponíveis
    const emailProfessor = localStorage.getItem('sb_email');
    const r = await sbFetch('GET', `/rest/v1/perfis_nee?email_professor=eq.${emailProfessor}`);
    
    if (!r.ok) {
        toast('❌ Erro ao carregar perfis', 'error');
        return;
    }
    
    const perfis = await r.json();
    
    if (perfis.length === 0) {
        toast('❌ Cadastre um perfil de aluno primeiro!', 'error');
        navegarPara('view-inclusao-perfis', document.querySelector('[data-modulo="inclusao_perfis"]'));
        return;
    }
    
    // Modal de seleção de aluno
    const modalHTML = `
        <div id="modalSelecionarAluno" class="modal active">
            <div class="modal-content" style="max-width: 500px;">
                <h3>🎯 Selecionar Aluno para Adaptação</h3>
                <div class="form-group">
                    <label>Qual aluno receberá a atividade adaptada?</label>
                    <select id="selectAlunoAdaptacao" style="width: 100%;">
                        ${perfis.map(p => `<option value="${p.id}">${p.nome_aluno} (${p.tipo_nee} - Nível ${p.nivel_suporte})</option>`).join('')}
                    </select>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" onclick="fecharModal('modalSelecionarAluno')">Cancelar</button>
                    <button class="btn btn-primary" onclick="iniciarAdaptacao(${planejamentoId})">🚀 Gerar Adaptação</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function iniciarAdaptacao(planejamentoId) {
    const perfilId = document.getElementById('selectAlunoAdaptacao').value;
    fecharModal('modalSelecionarAluno');
    
    toast('🤖 Gerando atividade adaptada com IA...', 'info');
    
    // Busca planejamento
    const rPlan = await sbFetch('GET', `/rest/v1/planejamentos?id=eq.${planejamentoId}&select=*`);
    const planejamento = (await rPlan.json())[0];
    
    // Busca questões do planejamento
    const rQuest = await sbFetch('GET', `/rest/v1/questoes?planejamento_id=eq.${planejamentoId}&order=numero.asc`);
    const questoes = await rQuest.json();
    
    // Busca perfil do aluno
    const rPerfil = await sbFetch('GET', `/rest/v1/perfis_nee?id=eq.${perfilId}`);
    const perfil = (await rPerfil.json())[0];
    
    // Chama API de adaptação
    try {
        const response = await fetch('https://omr-backend-laboratorio.onrender.com/api/gerar-adaptacao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                planejamento: planejamento,
                questoes: questoes,
                perfil_aluno: perfil
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro na API de adaptação');
        }
        
        const resultado = await response.json();
        
        // Abre modo co-piloto
        abrirModoCopiloto(planejamentoId, perfilId, questoes, resultado.atividade_adaptada, resultado.prompt_usado);
        
    } catch (e) {
        toast('❌ Erro ao gerar adaptação: ' + e.message, 'error');
    }
}

function abrirModoCopiloto(planejamentoId, perfilId, questoesOriginais, questoesAdaptadas, promptUsado) {
    const modalHTML = `
        <div id="modalCoPiloto" class="modal active" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 95%; width: 95%; max-height: 90vh; overflow-y: auto;">
                <h3>🎯 Modo Co-Piloto: Revisar Atividade Adaptada</h3>
                <p style="color: #666; font-size: 14px;">Revise as adaptações sugeridas pela IA. Você pode editar cada questão antes de salvar.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <!-- Coluna Original -->
                    <div>
                        <h4 style="color: #1565c0;">📄 Atividade Original</h4>
                        <div id="colunaOriginal" style="border: 2px solid #1565c0; padding: 15px; border-radius: 8px; background: #f5f5f5;">
                            ${questoesOriginais.map((q, i) => `
                                <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px;">
                                    <strong>Questão ${q.numero}:</strong><br>
                                    ${q.enunciado}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Coluna Adaptada -->
                    <div>
                        <h4 style="color: #6a1b9a;">🧩 Atividade Adaptada (IA)</h4>
                        <div id="colunaAdaptada" style="border: 2px solid #6a1b9a; padding: 15px; border-radius: 8px; background: #f3e5f5;">
                            ${questoesAdaptadas.map((q, i) => `
                                <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px;">
                                    <strong>Questão ${q.numero}:</strong><br>
                                    <textarea id="enunciadoAdaptado${i}" rows="4" style="width: 100%; margin-top: 5px;">${q.enunciado}</textarea>
                                    ${q.imagem_sugerida ? `<small style="color: #666;">🖼️ Imagem sugerida: ${q.imagem_sugerida}</small>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="fecharModal('modalCoPiloto')">Cancelar</button>
                    <button class="btn btn-warning" onclick="regenerarAdaptacao(${planejamentoId}, ${perfilId})">🔄 Gerar Novamente</button>
                    <button class="btn btn-success" onclick="salvarAdaptacao(${planejamentoId}, ${perfilId})">💾 Salvar Adaptação</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function salvarAdaptacao(planejamentoId, perfilId) {
    toast('💾 Salvando adaptação...', 'info');
    
    // Coleta questões adaptadas editadas
    const questoesAdaptadas = [];
    let i = 0;
    while (document.getElementById(`enunciadoAdaptado${i}`)) {
        questoesAdaptadas.push({
            numero: i + 1,
            enunciado: document.getElementById(`enunciadoAdaptado${i}`).value
        });
        i++;
    }
    
    const dadosAdaptacao = {
        planejamento_id: planejamentoId,
        perfil_nee_id: perfilId,
        atividade_original: JSON.stringify(perfisNEE), // Placeholder
        atividade_adaptada: JSON.stringify(questoesAdaptadas),
        gerado_por: localStorage.getItem('sb_email')
    };
    
    try {
        const r = await sbFetch('POST', '/rest/v1/adaptacoes_geradas', dadosAdaptacao);
        
        if (!r.ok) {
            throw new Error('Erro ao salvar');
        }
        
        toast('✅ Adaptação salva com sucesso!', 'success');
        fecharModal('modalCoPiloto');
        
    } catch (e) {
        toast('❌ Erro ao salvar: ' + e.message, 'error');
    }
}

function regenerarAdaptacao(planejamentoId, perfilId) {
    fecharModal('modalCoPiloto');
    iniciarAdaptacao(planejamentoId, perfilId);
}

// ========================================================================
// 🔄 INICIALIZAÇÃO
// ========================================================================

// Carrega perfis quando a view é aberta
document.addEventListener('DOMContentLoaded', () => {
    // Observer para detectar mudança de view
    const observer = new MutationObserver(() => {
        const viewPerfis = document.getElementById('view-inclusao-perfis');
        if (viewPerfis && viewPerfis.classList.contains('active')) {
            carregarPerfisNEE();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
});