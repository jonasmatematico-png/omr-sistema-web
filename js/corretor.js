async function carregarSelectsCorretor() {
    await carregarTurmasPermitidas('selTurmaCorretor');
    try {
        var rp = await sbFetch('GET', '/rest/v1/avaliacoes?select=id,nome,modo_correcao&order=id.desc');
        var provas = await rp.json();
        var selProva = document.getElementById('selProvaCorretor');
        if(selProva) {
            selProva.innerHTML = '<option value="">Selecione...</option>' + provas.map(function(p) {
                var tag = p.modo_correcao === 'aberta' ? ' (aberta)' : ' (objetiva)';
                return '<option value="' + p.id + '">' + p.nome + tag + '</option>';
            }).join('');
        }
    } catch(e) { console.error(e); }
}

async function carregarAlunosCorretor() {
    var turmaId = document.getElementById('selTurmaCorretor').value;
    var provaId = document.getElementById('selProvaCorretor').value;
    var selAluno = document.getElementById('selAlunoCorretor');
    if (!turmaId || !provaId) { selAluno.innerHTML = '<option value="">Selecione a turma e a prova primeiro...</option>'; return; }
    selAluno.innerHTML = '<option value="">Carregando...</option>';
    try {
        var r = await sbFetch('GET', '/rest/v1/alunos?id_turma=eq.' + turmaId + '&select=id,nome_completo,numero_chamada&order=numero_chamada.asc');
        var alunos = await r.json();
        selAluno.innerHTML = '<option value="">Selecione o aluno...</option>' + alunos.map(function(a) {
            return '<option value="' + a.id + '">' + (a.numero_chamada || '') + '. ' + (a.nome_completo || 'Sem nome') + '</option>';
        }).join('');
    } catch(e) { selAluno.innerHTML = '<option value="">Erro ao carregar</option>'; }
}

async function salvarCorrecaoManual(alunoId, provaId) {
    var questoesRadios = document.querySelectorAll('#areaCorretorManual input[type="radio"]');
    var respostas = {};
    questoesRadios.forEach(function(radio) {
        if (radio.checked) {
            var questaoId = parseInt(radio.name.replace('q', ''));
            respostas[questaoId] = radio.value;
        }
    });
    if (Object.keys(respostas).length === 0) { alert('⚠️ Marque pelo menos uma resposta antes de salvar!'); return; }
    try {
        await sbFetch('DELETE', '/rest/v1/respostas?id_aluno=eq.' + alunoId + '&id_avaliacao=eq.' + provaId);
        var linhas = Object.keys(respostas).map(function(questaoId) {
            var gabaritoQuestao = window.gabaritoAtual[questaoId] || null;
            var estaCorreta = (gabaritoQuestao && respostas[questaoId] === gabaritoQuestao);
            return { id_aluno: parseInt(alunoId), id_avaliacao: parseInt(provaId), id_questao: parseInt(questaoId), resposta_aluno: respostas[questaoId], correta: estaCorreta };
        });
        var r = await sbFetch('POST', '/rest/v1/respostas', linhas);
        if (r.ok) { alert('✅ Correção salva e auto-corrigida com sucesso!'); carregarRespostasAluno(); }
        else { var erro = await r.json(); alert('❌ Erro ao salvar: ' + (erro.message || 'Falha desconhecida')); }
    } catch(e) { alert('❌ Erro: ' + e.message); }
}

async function carregarRespostasAluno() {
    var alunoId = document.getElementById('selAlunoCorretor').value;
    var provaId = document.getElementById('selProvaCorretor').value;
    var area = document.getElementById('areaCorretorManual');
    if (!alunoId || !provaId) { area.innerHTML = '<p style="text-align: center; color: #999; font-style: italic;">Selecione o aluno e a prova.</p>'; return; }
    area.innerHTML = '<p style="text-align: center; color: #666;">⏳ Carregando questões...</p>';
    try {
        var rQuestoes = await sbFetch('GET', '/rest/v1/questoes?id_avaliacao=eq.' + provaId + '&select=id,numero,gabarito&order=numero.asc');
        var questoes = await rQuestoes.json();
        var rRespostas = await sbFetch('GET', '/rest/v1/respostas?id_aluno=eq.' + alunoId + '&id_avaliacao=eq.' + provaId + '&select=id_questao,resposta_aluno');
        var respostasSalvas = await rRespostas.json();
        window.gabaritoAtual = {};
        questoes.forEach(q => { if(q.gabarito) window.gabaritoAtual[q.id] = q.gabarito; });
        if (questoes.length === 0) { area.innerHTML = '<p style="text-align: center; color: #dc3545;">⚠️ Esta prova não tem questões objetivas registradas.</p>'; return; }
        var html = '<div style="background: #f8f9fa; padding: 16px; border-radius: 8px;"><h4 style="margin-bottom: 12px; color: #333;">Marque as respostas:</h4>';
        questoes.forEach(function(q) {
            var respSalva = respostasSalvas.find(function(r) { return String(r.id_questao) === String(q.id); });
            var respostaAtual = respSalva ? respSalva.resposta_aluno : '';
            html += '<div style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #eee;">';
            html += '<strong style="color: #008080;">Questão ' + q.numero + ':</strong><br><div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">';
            ['A', 'B', 'C', 'D', 'E'].forEach(function(letra) {
                var checked = respostaAtual === letra ? 'checked' : '';
                html += '<label style="display: flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 8px; background: #f0f0f0; border-radius: 4px;">';
                html += '<input type="radio" name="q' + q.id + '" value="' + letra + '" ' + checked + ' style="width:auto; accent-color:#28a745;"> ' + letra;
                html += '</label>';
            });
            html += '</div></div>';
        });
        html += '<button class="btn btn-primary" style="width: 100%; margin-top: 12px; padding: 12px;" onclick="salvarCorrecaoManual(' + alunoId + ', ' + provaId + ')">💾 SALVAR CORREÇÃO</button></div>';
        area.innerHTML = html;
    } catch(e) { area.innerHTML = '<p style="text-align: center; color: #dc3545;">❌ Erro: ' + e.message + '</p>'; }
}