// ========================================================================
// 📊 DIAGNÓSTICO
// ========================================================================
function mudarAbaDiagnostico(aba) {
    document.getElementById('abaDiagTurma').classList.add('hidden');
    document.getElementById('abaDiagAluno').classList.add('hidden');
    document.getElementById('tabDiagTurma').classList.remove('active');
    document.getElementById('tabDiagAluno').classList.remove('active');
    if (aba === 'turma') {
        document.getElementById('abaDiagTurma').classList.remove('hidden');
        document.getElementById('tabDiagTurma').classList.add('active');
    } else {
        document.getElementById('abaDiagAluno').classList.remove('hidden');
        document.getElementById('tabDiagAluno').classList.add('active');
    }
}

async function carregarTurmasDiagnostico() {
    await carregarTurmasPermitidas('selTurmaDiagnostico');
    await carregarTurmasPermitidas('selTurmaDiagAluno');
}

async function carregarProvasPorTurma() {
    var selTurma = document.getElementById('selTurmaDiagnostico');
    var selProva = document.getElementById('selProvaDiagnostico');
    var idTurma = selTurma.value;
    selProva.innerHTML = '<option value="">Carregando provas...</option>';
    selProva.disabled = true;
    if (!idTurma) { selProva.innerHTML = '<option value="">Selecione a turma primeiro</option>'; return; }
    try {
        var r = await sbFetch('GET', '/rest/v1/avaliacoes?select=id,nome&order=id.desc');
        if (!r.ok) r = await sbFetch('GET', '/rest/v1/avaliacoes?select=id,nome');
        var provas = await r.json();
        var html = '<option value="">Selecione a prova...</option>';
        provas.forEach(function(p) { html += '<option value="' + p.id + '">' + p.nome + '</option>'; });
        selProva.innerHTML = html;
        selProva.disabled = false;
    } catch(e) { selProva.innerHTML = '<option value="">Erro ao carregar</option>'; }
}

async function carregarAlunosDiagAluno() {
    var turmaId = document.getElementById('selTurmaDiagAluno').value;
    var selAluno = document.getElementById('selAlunoDiagAluno');
    if (!turmaId) { selAluno.innerHTML = '<option value="">Selecione a turma primeiro</option>'; return; }
    selAluno.innerHTML = '<option value="">Carregando...</option>';
    try {
        var r = await sbFetch('GET', '/rest/v1/alunos?id_turma=eq.' + turmaId + '&select=id,nome_completo,numero_chamada&order=numero_chamada.asc');
        var alunos = await r.json();
        selAluno.innerHTML = '<option value="">Selecione o aluno...</option>' + alunos.map(function(a) {
            return '<option value="' + a.id + '">' + (a.numero_chamada || '') + '. ' + (a.nome_completo || 'Sem nome') + '</option>';
        }).join('');
    } catch(e) { selAluno.innerHTML = '<option value="">Erro ao carregar</option>'; }
}

async function carregarProvasAluno() {
    var selProva = document.getElementById('selProvaDiagAluno');
    var idAluno = document.getElementById('selAlunoDiagAluno').value;
    selProva.innerHTML = '<option value="">Carregando provas...</option>';
    selProva.disabled = true;
    if (!idAluno) { selProva.innerHTML = '<option value="">Selecione o aluno primeiro</option>'; return; }
    try {
        var r = await sbFetch('GET', '/rest/v1/avaliacoes?select=id,nome,numero_questoes&order=id.desc');
        var provas = await r.json();
        var html = '<option value="">Selecione a prova...</option>';
        provas.forEach(function(p) { html += '<option value="' + p.id + '">' + p.nome + '</option>'; });
        selProva.innerHTML = html;
        selProva.disabled = false;
    } catch(e) { selProva.innerHTML = '<option value="">Erro ao carregar</option>'; }
}

async function carregarDiagnosticoTurma() {
    var selTurma = document.getElementById('selTurmaDiagnostico');
    var selProva = document.getElementById('selProvaDiagnostico');
    if (!selTurma || !selProva) return;
    var idTurma = selTurma.value;
    var idProva = selProva.value;
    var area = document.getElementById('areaDiagnosticoTurma');
    if (!area) return;
    if (!idTurma || !idProva) { area.innerHTML = '<p style="text-align: center; color: #999; font-style: italic;">Selecione a turma e a prova.</p>'; return; }
    area.innerHTML = '<p style="text-align: center; color: #666;">⏳ Analisando dados...</p>';
    try {
        var rAlunos = await sbFetch('GET', '/rest/v1/alunos?id_turma=eq.' + idTurma + '&select=id,nome_completo,numero_chamada');
        var alunos = await rAlunos.json();
        if (!alunos || alunos.length === 0) { area.innerHTML = '<p style="text-align:center; color:#856404; background:#fff3cd; padding:20px; border-radius:8px;">⚠️ Nenhum aluno encontrado nesta turma.</p>'; return; }
        var idsAlunos = alunos.map(function(a) { return a.id; }).join(',');
        var questoes = await buscarQuestoes('objetiva', idProva);
        if (questoes.length === 0) questoes = await buscarQuestoes('aberta', idProva);
        if (questoes.length === 0) { area.innerHTML = '<p style="text-align: center; color: #dc3545;">⚠️ Esta prova não possui questões registradas.</p>'; return; }
        var rRespostas = await sbFetch('GET', '/rest/v1/respostas?id_avaliacao=eq.' + idProva + '&id_aluno=in.(' + idsAlunos + ')&select=id_questao,correta,id_aluno');
        var respostas = await rRespostas.json();
        if (!Array.isArray(respostas) || respostas.length === 0) { area.innerHTML = '<p style="text-align: center; color: #dc3545;">⚠️ Nenhum aluno desta turma corrigiu esta prova ainda.</p>'; return; }
        var tipoEscolhido = document.getElementById('tipoAnaliseTurma') ? document.getElementById('tipoAnaliseTurma').value : 'descritor';
        var tituloEixo = tipoEscolhido === 'habilidade' ? 'Habilidade (BNCC)' : 'Descritor (SAEB)';
        var notaMaximaProva = 0;
        questoes.forEach(function(q) { notaMaximaProva += (parseFloat(q.valor) || 1); });
        var notasAlunos = {};
        respostas.forEach(function(r) {
            var alunoId = r.id_aluno;
            if (!notasAlunos[alunoId]) notasAlunos[alunoId] = 0;
            var questaoEncontrada = questoes.find(function(q) { return String(q.id) === String(r.id_questao); });
            if (questaoEncontrada && (r.correta === true || r.correta === 'true' || r.correta === 1)) {
                notasAlunos[alunoId] += parseFloat(questaoEncontrada.valor) || 1;
            }
        });
        var somaNotas = 0, alunosComNota = 0;
        Object.keys(notasAlunos).forEach(function(alunoId) { somaNotas += notasAlunos[alunoId]; alunosComNota++; });
        var mediaTurma = alunosComNota > 0 ? (somaNotas / alunosComNota).toFixed(1) : '0.0';
        var mapaAgrupado = {};
        questoes.forEach(function(q) {
            var desc = q[COLUNAS.ABERTAS.descritor] || q[COLUNAS.OBJETIVAS.descritor] || '';
            var hab = q[COLUNAS.ABERTAS.habilidade] || q[COLUNAS.OBJETIVAS.habilidade] || '';
            var chave = (tipoEscolhido === 'habilidade') ? (hab || desc) : (desc || hab);
            chave = chave ? chave.trim() : 'Não classificado';
            if (!mapaAgrupado[chave]) mapaAgrupado[chave] = { total: 0, acertos: 0 };
        });
        respostas.forEach(function(r) {
            var questaoEncontrada = questoes.find(function(q) { return String(q.id) === String(r.id_questao); });
            if (questaoEncontrada) {
                var desc = questaoEncontrada[COLUNAS.ABERTAS.descritor] || questaoEncontrada[COLUNAS.OBJETIVAS.descritor] || '';
                var hab = questaoEncontrada[COLUNAS.ABERTAS.habilidade] || questaoEncontrada[COLUNAS.OBJETIVAS.habilidade] || '';
                var chave = (tipoEscolhido === 'habilidade') ? (hab || desc) : (desc || hab);
                chave = chave ? chave.trim() : 'Não classificado';
                if (!mapaAgrupado[chave]) mapaAgrupado[chave] = { total: 0, acertos: 0 };
                mapaAgrupado[chave].total++;
                if (r.correta === true || r.correta === 'true' || r.correta === 1) mapaAgrupado[chave].acertos++;
            }
        });
        var resultados = Object.keys(mapaAgrupado).map(function(chave) {
            var dados = mapaAgrupado[chave];
            var percentual = dados.total > 0 ? (dados.acertos / dados.total * 100) : 0;
            return { chave: chave, total: dados.total, acertos: dados.acertos, percentual: percentual.toFixed(1) };
        }).sort(function(a, b) { return a.percentual - b.percentual; });
        var html = '<div style="background: #e3f2fd; border-left: 5px solid #2196F3; padding: 16px; border-radius: 6px; margin-bottom: 20px;">';
        html += '<h3 style="color: #1565C0; margin: 0 0 8px 0;">📊 Média da Turma: ' + mediaTurma + ' / ' + notaMaximaProva.toFixed(1) + ' pontos</h3>';
        html += '<p style="margin: 0; font-size: 13px; color: #555;">Alunos avaliados: <b>' + alunosComNota + '</b> de <b>' + alunos.length + '</b></p></div>';
        html += '<h4 style="margin-bottom: 12px; color: #333; text-align:center;">Desempenho por ' + tituloEixo + '</h4>';
        html += '<div style="position: relative; height: 350px; width: 100%; max-width: 900px; margin: 0 auto;"><canvas id="chartDiagnostico"></canvas></div>';
        area.innerHTML = html;
        window.itensRuinsAtual = resultados.filter(r => parseFloat(r.percentual) < 50);
        window.tipoAnaliseAtual = tipoEscolhido;
        setTimeout(function() {
            var ctx = document.getElementById('chartDiagnostico');
            if (!ctx) return;
            var chartCtx = ctx.getContext('2d');
            var labels = resultados.map(function(r) { return r.chave; });
            var dataValues = resultados.map(function(r) { return parseFloat(r.percentual); });
            var backgroundColors = dataValues.map(function(val) {
                if (val < 50) return 'rgba(220, 53, 69, 0.8)';
                if (val < 70) return 'rgba(255, 193, 7, 0.8)';
                return 'rgba(40, 167, 69, 0.8)';
            });
            new Chart(chartCtx, {
                type: 'bar',
                data: { labels: labels, datasets: [{ label: '% de Acerto', data: dataValues, backgroundColor: backgroundColors, borderWidth: 1, borderRadius: 6 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: function(value) { return value + "%"; } } } }, plugins: { legend: { display: false } } }
            });
        }, 100);
    } catch(e) {
        console.error("Erro no diagnóstico:", e);
        if (area) area.innerHTML = '<div style="padding:20px; background:#ffe6e6; border-radius:8px; text-align:center; color:#dc3545;"><strong>❌ Erro Técnico:</strong><br>' + e.message + '</div>';
    }
}

async function carregarDiagnosticoAluno() {
    var selAluno = document.getElementById('selAlunoDiagAluno');
    var selProva = document.getElementById('selProvaDiagAluno');
    if (!selAluno || !selProva) return;
    var idAluno = selAluno.value;
    var idProva = selProva.value;
    var area = document.getElementById('areaGraficoDiagnosticoAluno');
    if (!area) return;
    if (!idAluno || !idProva) { area.innerHTML = '<p style="text-align: center; color: #999; font-style: italic;">Selecione o aluno e a prova.</p>'; return; }
    area.innerHTML = '<p style="text-align: center; color: #666;">⏳ Analisando desempenho do aluno...</p>';
    try {
        var rAluno = await sbFetch('GET', '/rest/v1/alunos?id=eq.' + idAluno + '&select=nome_completo,numero_chamada');
        var alunoData = (await rAluno.json())[0];
        var nomeAluno = alunoData ? (alunoData.numero_chamada + '. ' + alunoData.nome_completo) : 'Aluno';
        var questoes = await buscarQuestoes('objetiva', idProva);
        if (questoes.length === 0) questoes = await buscarQuestoes('aberta', idProva);
        if (questoes.length === 0) { area.innerHTML = '<p style="text-align: center; color: #dc3545;">⚠️ Esta prova não possui questões registradas.</p>'; return; }
        var rRespostas = await sbFetch('GET', '/rest/v1/respostas?id_avaliacao=eq.' + idProva + '&id_aluno=eq.' + idAluno + '&select=id_questao,correta,resposta_aluno');
        var respostas = await rRespostas.json();
        if (!Array.isArray(respostas) || respostas.length === 0) { area.innerHTML = '<p style="text-align: center; color: #dc3545;">⚠️ Este aluno ainda não corrigiu esta prova.</p>'; return; }
        var tipoEscolhido = document.getElementById('tipoAnaliseAluno') ? document.getElementById('tipoAnaliseAluno').value : 'descritor';
        var tituloEixo = tipoEscolhido === 'habilidade' ? 'Habilidade (BNCC)' : 'Descritor (SAEB)';
        var notaMaxima = 0, notaAluno = 0;
        questoes.forEach(q => { notaMaxima += (parseFloat(q.valor) || 1); });
        respostas.forEach(r => {
            var questao = questoes.find(q => q.id == r.id_questao);
            if (questao && (r.correta === true || r.correta === 'true' || r.correta === 1)) notaAluno += parseFloat(questao.valor) || 1;
        });
        var mapaAgrupado = {};
        questoes.forEach(function(q) {
            var desc = q[COLUNAS.ABERTAS.descritor] || q[COLUNAS.OBJETIVAS.descritor] || '';
            var hab = q[COLUNAS.ABERTAS.habilidade] || q[COLUNAS.OBJETIVAS.habilidade] || '';
            var chave = (tipoEscolhido === 'habilidade') ? (hab || desc) : (desc || hab);
            chave = chave ? chave.trim() : 'Não classificado';
            if (!mapaAgrupado[chave]) mapaAgrupado[chave] = { total: 0, acertos: 0 };
            mapaAgrupado[chave].total++;
        });
        respostas.forEach(function(r) {
            var questaoEncontrada = questoes.find(function(q) { return String(q.id) === String(r.id_questao); });
            if (questaoEncontrada) {
                var desc = questaoEncontrada[COLUNAS.ABERTAS.descritor] || questaoEncontrada[COLUNAS.OBJETIVAS.descritor] || '';
                var hab = questaoEncontrada[COLUNAS.ABERTAS.habilidade] || questaoEncontrada[COLUNAS.OBJETIVAS.habilidade] || '';
                var chave = (tipoEscolhido === 'habilidade') ? (hab || desc) : (desc || hab);
                chave = chave ? chave.trim() : 'Não classificado';
                if (r.correta === true || r.correta === 'true' || r.correta === 1) {
                    if (mapaAgrupado[chave]) mapaAgrupado[chave].acertos++;
                }
            }
        });
        var resultados = Object.keys(mapaAgrupado).map(function(chave) {
            var dados = mapaAgrupado[chave];
            var percentual = dados.total > 0 ? (dados.acertos / dados.total * 100) : 0;
            return { chave: chave, total: dados.total, acertos: dados.acertos, percentual: percentual.toFixed(1) };
        }).sort(function(a, b) { return a.percentual - b.percentual; });
        var html = '<div style="background: #e8f5e9; border-left: 5px solid #4CAF50; padding: 16px; border-radius: 6px; margin-bottom: 20px;">';
        html += '<h3 style="color: #2E7D32; margin: 0 0 8px 0;">Nota de ' + nomeAluno + ': ' + notaAluno.toFixed(1) + ' / ' + notaMaxima.toFixed(1) + '</h3>';
        html += '<p style="margin: 0; font-size: 13px; color: #555;">Total de questões avaliadas: <b>' + respostas.length + '</b></p></div>';
        html += '<h4 style="margin-bottom: 12px; color: #333; text-align:center;">📈 Desempenho Individual por ' + tituloEixo + '</h4>';
        html += '<div style="position: relative; height: 350px; width: 100%; max-width: 900px; margin: 0 auto;"><canvas id="chartDiagnosticoAluno"></canvas></div>';
        area.innerHTML = html;
        setTimeout(function() {
            var ctx = document.getElementById('chartDiagnosticoAluno');
            if (!ctx) return;
            var chartCtx = ctx.getContext('2d');
            var labels = resultados.map(function(r) { return r.chave; });
            var dataValues = resultados.map(function(r) { return parseFloat(r.percentual); });
            new Chart(chartCtx, {
                type: 'radar',
                data: { labels: labels, datasets: [{ label: '% de Acerto', data: dataValues, backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgb(54, 162, 235)', pointBackgroundColor: dataValues.map(v => v < 50 ? '#dc3545' : (v < 70 ? '#ffc107' : '#28a745')), pointBorderColor: '#fff' }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { r: { suggestedMin: 0, suggestedMax: 100, ticks: { callback: function(value) { return value + "%"; } } } }, plugins: { legend: { display: false } } }
            });
        }, 100);
    } catch(e) {
        console.error("Erro no diagnóstico do aluno:", e);
        if (area) area.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px; background: #ffe6e6; border-radius: 8px;">❌ <strong>Erro:</strong> ' + e.message + '</p>';
    }
}

async function processarTriagem() {
    const idAvaliacao = document.getElementById('selectAvaliacao').value;
    const idTurma = document.getElementById('selectTurma').value;
    if (!idAvaliacao) { alert('⚠️ Por favor, selecione uma prova!'); return; }
    const areaTriagem = document.getElementById('areaTriagem');
    const listaPiores = document.getElementById('listaPiores');
    const listaMelhores = document.getElementById('listaMelhores');
    areaTriagem.style.display = 'block';
    listaPiores.innerHTML = '<p style="text-align:center; color:#666;">⏳ Processando...</p>';
    listaMelhores.innerHTML = '<p style="text-align:center; color:#666;">⏳ Processando...</p>';
    try {
        const response = await fetch(API_BASE_URL + '/api/classificar_prova/' + idAvaliacao, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_turma: idTurma || null })
        });
        const data = await response.json();
        if (!data.sucesso) throw new Error(data.erro);
        const alunos = data.alunos;
        const piores = alunos.filter(a => a.nivel_saeb === 'Abaixo do Básico' || a.nivel_saeb === 'Básico').sort((a, b) => a.nota_final - b.nota_final);
        const melhores = alunos.filter(a => a.nivel_saeb === 'Adequado' || a.nivel_saeb === 'Avançado').sort((a, b) => b.nota_final - a.nota_final);
        if (piores.length === 0) listaPiores.innerHTML = '<p>Nenhum aluno nesta faixa.</p>';
        else {
            listaPiores.innerHTML = piores.map(aluno => '<div style="background: white; padding: 10px; margin-bottom: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><div><div style="font-weight: bold; color: #333;">' + aluno.nome + '</div><div style="font-size: 12px; color: #666;">Nota: <strong>' + aluno.nota_final + '</strong> | Nível: <span style="color: #dc3545; font-weight: bold;">' + aluno.nivel_saeb + '</span></div></div></div>').join('');
        }
        if (melhores.length === 0) listaMelhores.innerHTML = '<p>Nenhum aluno nesta faixa.</p>';
        else {
            listaMelhores.innerHTML = melhores.map(aluno => '<div style="background: white; padding: 10px; margin-bottom: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><div><div style="font-weight: bold; color: #333;">' + aluno.nome + '</div><div style="font-size: 12px; color: #666;">Nota: <strong>' + aluno.nota_final + '</strong> | Nível: <span style="color: #28a745; font-weight: bold;">' + aluno.nivel_saeb + '</span></div></div></div>').join('');
        }
    } catch (e) {
        console.error(e);
        areaTriagem.innerHTML = '<p style="color: red; text-align: center;">❌ Erro: ' + e.message + '</p>';
    }
}