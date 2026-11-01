function mudarAbaIA(aba) {
    var abas = ['abaGerar', 'abaIdentificar', 'abaPlanejar', 'abaExperts'];
    for (var i = 0; i < abas.length; i++) { var el = document.getElementById(abas[i]); if (el) el.classList.add('hidden'); }
    var botoes = ['tabGerar', 'tabIdentificar', 'tabPlanejar', 'tabExperts'];
    for (var i = 0; i < botoes.length; i++) { var btn = document.getElementById(botoes[i]); if (btn) btn.classList.remove('active'); }
    var abaAlvo = document.getElementById('aba' + aba.charAt(0).toUpperCase() + aba.slice(1));
    var botaoAlvo = document.getElementById('tab' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (abaAlvo) abaAlvo.classList.remove('hidden');
    if (botaoAlvo) botaoAlvo.classList.add('active');
}

function abrirModalIA() { 
    document.getElementById('modalIA').classList.add('active'); 
    mudarAbaIA('gerar'); 
    document.getElementById('iaResultadoGerar').innerHTML = ''; 
    document.getElementById('iaResultadoIdentificar').innerHTML = ''; 
    document.getElementById('iaResultadoPlanejar').innerHTML = ''; 
}

async function carregarMatrizIA() {
    var fonte = document.getElementById('iaFonte').value;
    var ano = document.getElementById('iaAno').value;
    var disciplina = document.getElementById('disciplina').value;
    var container = document.getElementById('iaListaHabilidades');
    container.innerHTML = '<p style="text-align:center; color:#666;">Carregando...</p>';
    try {
        var url = API_BASE_URL + '/api/matriz?fonte=' + fonte + '&ano=' + ano + '&disciplina=' + encodeURIComponent(disciplina);
        var r = await fetch(url);
        var j = await r.json();
        if (j.sucesso && j.itens) {
            matrizHabilidades = j.itens;
            if (matrizHabilidades.length === 0) container.innerHTML = '<p style="color:#666; text-align:center;">Nenhuma habilidade encontrada para esta seleção.</p>';
            else container.innerHTML = matrizHabilidades.map(function(item) { return '<label class="habilidade-item"><input type="checkbox" value="' + item.codigo + '"> <strong>' + item.codigo + '</strong>: ' + item.habilidade + '</label>'; }).join('');
        } else { container.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar matriz.</p>'; }
    } catch (e) { container.innerHTML = '<p style="color:red; text-align:center;">Falha na conexão com a API.</p>'; }
}

async function gerarQuestoesIA() {
    var checkboxes = document.querySelectorAll('#iaListaHabilidades input[type="checkbox"]:checked');
    var codigos = Array.from(checkboxes).map(function(cb) { return cb.value; });
    if (codigos.length === 0) { toast('Selecione pelo menos 1 habilidade!', 'error'); return; }
    var btn = document.getElementById('btnGerarIA');
    btn.textContent = '⏳ Gerando...'; btn.disabled = true;
    try {
        var payload = { codigos: codigos, fonte: document.getElementById('iaFonte').value, componente: document.getElementById('disciplina').value, ano: parseInt(document.getElementById('iaAno').value), quantidade: parseInt(document.getElementById('iaQtd').value), dificuldade: document.getElementById('iaDificuldade').value, contexto: document.getElementById('iaContexto').value, valor_padrao: 2.0, tipo: document.getElementById('iaTipoQuestao').value, num_alternativas: parseInt(document.getElementById('iaNumAlternativas').value) };
        var r = await fetch(API_BASE_URL + '/api/gerar_questoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        var j = await r.json();
        if (j.sucesso && j.questoes) {
            var html = '<h4 style="margin-bottom:8px;">Questões Geradas:</h4>';
            j.questoes.forEach(function(q, idx) {
                html += '<div class="ia-preview-card"><strong>' + q.codigo + '</strong> (Questão ' + (idx+1) + ')<br><p style="font-size:13px; margin: 6px 0;"><strong>Enunciado:</strong> ' + q.enunciado + '</p>';
                if (q.alternativas) {
                    html += '<div style="margin-left: 10px; font-size: 13px;">';
                    for (var letra in q.alternativas) { var cor = letra === q.gabarito ? 'color: green; font-weight: bold;' : 'color: #333;'; html += '<p style="margin: 2px 0; ' + cor + '"><strong>' + letra + ')</strong> ' + q.alternativas[letra] + '</p>'; }
                    html += '</div>';
                } else { html += '<p style="font-size:13px; margin: 6px 0;"><strong>Resposta Esperada:</strong> ' + q.resposta_esperada + '</p>'; }
                html += '<p style="font-size:13px; margin: 6px 0;"><strong>Valor:</strong> ' + q.valor + '</p><button class="btn btn-primary btn-sm" onclick="adicionarQuestaoGerada(' + idx + ')"> Adicionar à Prova</button></div>';
            });
            window.questoesGeradasTemp = j.questoes;
            document.getElementById('iaResultadoGerar').innerHTML = html;
            toast('Questões geradas com sucesso!', 'success');
        } else { toast('Erro: ' + (j.erro || 'Falha ao gerar'), 'error'); }
    } catch (e) { toast('Falha na conexão com a API: ' + e.message, 'error'); }
    finally { btn.textContent = '✨ GERAR QUESTÕES COM IA'; btn.disabled = false; }
}

function adicionarQuestaoGerada(idx) {
    if (!window.questoesGeradasTemp || !window.questoesGeradasTemp[idx]) return;
    var q = window.questoesGeradasTemp[idx];
    if (q.alternativas && q.gabarito) {
        var novaQuestaoObj = { enunciado: q.enunciado || '', alt_a: q.alternativas['A'] || '', alt_b: q.alternativas['B'] || '', alt_c: q.alternativas['C'] || '', alt_d: q.alternativas['D'] || '', alt_e: q.alternativas['E'] || '', gabarito: q.gabarito, valor: String(q.valor || 1), descritor: q.codigo || '' };
        questoesObj.push(novaQuestaoObj);
        renderizarQuestoesObj();
        toast('Questão OBJETIVA adicionada!', 'success');
        fecharModal('modalIA');
        navegarPara('view-objetivas', document.querySelectorAll('.menu-item')[1]);
    } else {
        var textoResposta = q.resposta_esperada || '';
        questoes.push({ enunciado: q.enunciado || '', resposta: textoResposta, valor: String(q.valor || 2), imagemUrl: null, file: null, descritor: q.codigo || '' });
        renderizarQuestoes();
        toast('Questão DISSERTATIVA adicionada!', 'success');
        fecharModal('modalIA');
        navegarPara('view-provas', document.querySelector('.menu-item'));
    }
}

async function identificarHabilidadeIA() {
    var texto = document.getElementById('iaTextoIdentificar').value.trim();
    if (texto.length < 10) { toast('Cole o texto completo da questão!', 'error'); return; }
    var btn = document.getElementById('btnIdentificarIA'); btn.textContent = '⏳ Identificando...'; btn.disabled = true;
    try {
        var payload = { texto: texto, fonte: document.getElementById('iaFonte').value, componente: document.getElementById('disciplina').value, ano: parseInt(document.getElementById('iaAno').value) };
        var r = await fetch(API_BASE_URL + '/api/identificar_habilidade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        var j = await r.json();
        if (j.sucesso && j.resultados) {
            var html = '<h4 style="margin-bottom:8px;">Habilidades Identificadas:</h4>';
            j.resultados.forEach(function(res) { html += '<div class="ia-preview-card"><strong>' + res.codigo + '</strong> - Aderência: <strong>' + res.aderencia + '%</strong><br><p style="font-size:13px; margin: 6px 0; font-style:italic;">' + res.justificativa + '</p></div>'; });
            document.getElementById('iaResultadoIdentificar').innerHTML = html;
        } else { toast('Erro: ' + (j.erro || 'Falha ao identificar'), 'error'); }
    } catch (e) { toast('Falha na conexão com a API: ' + e.message, 'error'); }
    finally { btn.textContent = '🔍 IDENTIFICAR HABILIDADE'; btn.disabled = false; }
}

async function gerarPlanoAula() {
    var tema = document.getElementById('iaTemaAula').value.trim();
    if (!tema) { toast('Digite o tema da aula!', 'error'); return; }
    var btn = document.getElementById('btnPlanejarIA'); btn.textContent = '⏳ Planejando...'; btn.disabled = true;
    document.getElementById('iaResultadoPlanejar').innerHTML = '<p style="text-align:center; color:#666; padding: 20px;">🤖 A IA está montando seu plano de aula...</p>';
    try {
        var r = await fetch(API_BASE_URL + '/api/gerar_plano_aula', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tema: tema, material: document.getElementById('iaMaterial').value, perfil_turma: document.getElementById('iaPerfilTurma').value, duracao: document.getElementById('iaDuracao').value }) });
        var j = await r.json();
        if (j.sucesso && j.plano) {
            var p = j.plano;
            var html = '<div style="background:#f3f0ff; padding:20px; border-radius:8px; border:1px solid #d6bfff;">';
            html += '<h4 style="color:#6f42c1; margin-bottom:8px;">🎯 Objetivos de Aprendizagem:</h4><ul style="margin-bottom:16px; padding-left:20px;">';
            (p.objetivos || []).forEach(o => html += '<li style="margin-bottom:4px;">' + o + '</li>');
            html += '</ul><h4 style="color:#6f42c1; margin-bottom:8px;">️ Passo a Passo da Aula:</h4>';
            (p.passo_a_passo || []).forEach((etapa, idx) => { html += '<div style="background:white; padding:12px; margin-bottom:10px; border-radius:6px; border-left:4px solid #6f42c1; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"><strong style="color:#4A148C;">' + (etapa.tempo || '') + ' - ' + (etapa.etapa || 'Etapa ' + (idx+1)) + '</strong><br><span style="font-size:14px; color:#333; margin-top:4px; display:block;">' + (etapa.acao || '') + '</span></div>'; });
            html += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:16px;"><div style="background:#FFF8E1; padding:12px; border-radius:6px; border-left:4px solid #FF6F00;"><h4 style="color:#E65100; margin:0 0 8px 0; font-size:14px;">📝 Avaliação:</h4><p style="font-size:13px; margin:0;">' + (p.avaliacao || '-') + '</p></div><div style="background:#E8F5E9; padding:12px; border-radius:6px; border-left:4px solid #2E7D32;"><h4 style="color:#2E7D32; margin:0 0 8px 0; font-size:14px;">🏠 Tarefa de Casa:</h4><p style="font-size:13px; margin:0;">' + (p.tarefa_casa || '-') + '</p></div></div>';
            html += '<p style="text-align: center; color: #999; font-size: 11px; margin-top: 16px; font-style: italic;">Gerado por IA</p></div>';
            document.getElementById('iaResultadoPlanejar').innerHTML = html;
            toast('Plano de aula gerado com sucesso!', 'success');
        } else { toast('Erro: ' + (j.erro || 'Falha ao gerar plano'), 'error'); }
    } catch(e) { toast('Erro de conexão com a IA: ' + e.message, 'error'); }
    finally { btn.textContent = '📚 GERAR PLANO DE AULA'; btn.disabled = false; }
}

function atualizarFormularioExpert() {
    const expert = document.getElementById('expertSelector').value;
    const label = document.getElementById('expertContextoLabel');
    const textarea = document.getElementById('expertContexto');
    const resultadoDiv = document.getElementById('expertResultado');
    resultadoDiv.innerHTML = '';
    textarea.value = '';
    if (expert === 'tutor_recuperacao') { label.innerText = 'Descreva os erros do aluno e o contexto:'; textarea.placeholder = 'Ex: Errou questões de fração (D25). Contexto: Gosta de videogames.'; }
    else if (expert === 'criador_provas') { label.innerText = 'Descreva o tema, ano e descritores desejados:'; textarea.placeholder = 'Ex: 6º ano, Matemática. Criar 3 questões de D23 e D25 sobre porcentagem.'; }
    else if (expert === 'analista_desempenho') { label.innerText = 'Cole os dados de desempenho da turma:'; textarea.placeholder = 'Ex: Média da turma 5.2. 60% erraram D25.'; }
    else if (expert === 'corretor_dissertativo') { label.innerText = 'Cole o enunciado, a resposta do aluno e o valor:'; textarea.placeholder = 'Enunciado: ...\nResposta do aluno: ...\nValor: 2.0'; }
}

async function executarExpertIA() {
    const expertType = document.getElementById('expertSelector').value;
    const contexto = document.getElementById('expertContexto').value;
    const idAluno = document.getElementById('expertIdAluno').value || null;
    const btn = document.getElementById('btnChamarExpert');
    const resultadoDiv = document.getElementById('expertResultado');
    if (!contexto.trim()) { alert('Por favor, preencha o contexto!'); return; }
    btn.innerHTML = '⏳ O Expert está analisando...'; btn.disabled = true;
    resultadoDiv.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">🤖 Processando...</div>';
    try {
        const response = await fetch(API_BASE_URL + '/api/chamar_expert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expert_type: expertType, contexto: contexto, id_aluno: idAluno ? parseInt(idAluno) : null, dados_especificos: {} }) });
        const data = await response.json();
        if (!data.sucesso) throw new Error(data.erro || 'Erro desconhecido na IA.');
        let html = '<div style="background:#f0f4ff; padding:16px; border-radius:8px; border-left:4px solid #667eea;"><h4 style="margin-top:0; color:#4A148C;">🎓 Resultado: ' + data.expert + '</h4>';
        const dados = data.dados;
        if (dados.resposta_documento) { html += '<div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0; margin-top: 16px;"><div style="white-space: pre-wrap; line-height: 1.8; font-size: 15px; color: #333;">' + dados.resposta_documento + '</div></div>'; }
        else if (dados.questoes && Array.isArray(dados.questoes)) { html += '<div style="margin-top: 16px;">'; dados.questoes.forEach((q, idx) => { html += '<div style="background: #f9f9f9; padding: 16px; margin-bottom: 16px; border-radius: 8px; border-left: 4px solid #667eea;"><h4 style="color: #333; margin-bottom: 12px;">Questão ' + (idx + 1) + ':</h4><p style="font-size: 15px; line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap;">' + q.enunciado + '</p>'; if (q.alternativas) { html += '<div style="margin-left: 20px; margin-bottom: 12px;">'; for (const [letra, texto] of Object.entries(q.alternativas)) { html += '<p style="margin: 6px 0; font-size: 14px;"><strong>' + letra.toUpperCase() + ')</strong> ' + texto + '</p>'; } html += '</div>'; } if (q.gabarito || q.explicacao) { html += '<details style="margin-top: 12px;"><summary style="cursor: pointer; color: #008080; font-weight: 600;">Ver Gabarito e Explicação</summary><div style="background: #e8f5e9; padding: 12px; border-radius: 6px; margin-top: 8px;">'; if (q.gabarito) html += '<p style="margin: 0 0 8px 0;"><strong>Resposta Correta:</strong> ' + q.gabarito.toUpperCase() + '</p>'; if (q.explicacao) html += '<p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">' + q.explicacao + '</p>'; html += '</div></details>'; } html += '</div>'; }); html += '</div>'; }
        else { for (const [key, value] of Object.entries(dados)) { if (typeof value === 'string' || typeof value === 'number') { html += '<div style="margin:16px 0; padding:16px; background:#ffffff; border-radius:8px; border-left:4px solid #667eea;"><strong style="color:#4A148C; font-size:16px; display:block; margin-bottom:8px;">' + key.replace(/_/g, ' ').toUpperCase() + '</strong><span style="white-space: pre-wrap; line-height: 1.6; color:#333; font-size:14px;">' + value + '</span></div>'; } } }
        html += '<p style="text-align:right; font-size:11px; color:#999; margin-top:12px;">Gerado por ' + data.modelo + '</p></div>';
        resultadoDiv.innerHTML = html;
    } catch(e) { console.error("Erro no Expert:", e); resultadoDiv.innerHTML = '<div style="padding:20px; background:#ffe6e6; border-radius:8px; color:#dc3545; text-align:center;">❌ Erro: ' + e.message + '</div>'; }
    finally { btn.innerHTML = '🚀 ACIONAR EXPERT'; btn.disabled = false; }
}

// ========================================================================
// 🤖 IA E EXPERTS
// ========================================================================
function toggleAlternativas() {
    var tipo = document.getElementById('iaTipoQuestao').value;
    var grupo = document.getElementById('grupoNumAlternativas');
    if (grupo) grupo.style.display = (tipo === 'objetiva') ? 'block' : 'none';
}