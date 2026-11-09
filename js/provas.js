// ========================================================================
// 📝 PROVAS ABERTAS
// ========================================================================
function novaQuestao() {
    return { enunciado: '', resposta: '', valor: '2', imagemUrl: null, file: null, descritor: '', habilidade: '' };
}

function novoForm() {
    editandoId = null;
    document.getElementById('nomeProva').value = '';
    document.getElementById('bimestre').value = '3';
    document.getElementById('disciplina').value = 'Matemática';
    document.getElementById('peso').value = '1';
    document.getElementById('bannerEdicao').classList.add('hidden');
    document.getElementById('btnSalvar').textContent = '💾 SALVAR PROVA ABERTA';
    questoes = [novaQuestao()];
    renderizarQuestoes();
}

function adicionarQuestao() { questoes.push(novaQuestao()); renderizarQuestoes(); }
function removerQuestao(i) { if (questoes.length > 1) { questoes.splice(i, 1); renderizarQuestoes(); } }
function atualizarQuestao(i, campo, valor) { questoes[i][campo] = valor; }
function anexarImagem(i, input) { if (input.files && input.files[0]) { questoes[i].file = input.files[0]; renderizarQuestoes(); } }
function removerImagem(i) { questoes[i].file = null; questoes[i].imagemUrl = null; renderizarQuestoes(); }
function cancelarEdicao() { novoForm(); }

function renderizarQuestoes() {
    document.getElementById('totalQuestoes').textContent = questoes.length;
    document.getElementById('questoesContainer').innerHTML = questoes.map(function (q, i) {
        var statusImg = '';
        if (q.file) statusImg = '📎 Novo anexo: ' + q.file.name;
        else if (q.imagemUrl) statusImg = '🖼️ Imagem anexada ✅ <a href="' + q.imagemUrl + '" target="_blank">ver</a> • <a href="#" onclick="removerImagem(' + i + ');return false;">remover</a>';
        else statusImg = 'Sem imagem (opcional)';
        return '<div class="questao-card">' +
            '<div class="questao-header"><div style="display:flex;align-items:center;gap:8px;"><div class="questao-num">' + (i + 1) + '</div><strong>Questão ' + (i + 1) + '</strong></div>' +
            '<button class="remove-btn" onclick="removerQuestao(' + i + ')">🗑️</button></div>' +
            '<div class="form-group"><label>Enunciado</label><textarea rows="3" onchange="atualizarQuestao(' + i + ', \'enunciado\', this.value)">' + escaparHTML(q.enunciado) + '</textarea></div>' +
            '<div class="form-group"><label>Resposta esperada / critério</label><textarea rows="3" onchange="atualizarQuestao(' + i + ', \'resposta\', this.value)">' + q.resposta + '</textarea></div>' +
            '<div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">' +
            '<div class="form-group" style="margin:0;"><label>Valor</label><input type="number" step="0.1" value="' + q.valor + '" onchange="atualizarQuestao(' + i + ', \'valor\', this.value)"></div>' +
            '<div class="form-group" style="margin:0;"><label>Descritor (SAEB)</label><input type="text" value="' + (q.descritor || '') + '" onchange="atualizarQuestao(' + i + ', \'descritor\', this.value)" placeholder="Ex: D25"></div>' +
            '<div class="form-group" style="margin:0;"><label>Habilidade (BNCC)</label><input type="text" value="' + (q.habilidade || '') + '" onchange="atualizarQuestao(' + i + ', \'habilidade\', this.value)" placeholder="Ex: EF05MA01"></div>' +
            '</div>' +
            '<div class="form-group"><label>🖼️ Imagem do enunciado</label><input type="file" accept="image/*" onchange="anexarImagem(' + i + ', this)"><div class="img-status">' + statusImg + '</div></div>' +
            '</div>';
    }).join('');
}

function abrirModalColar() { document.getElementById('modalColar').classList.add('active'); document.getElementById('textareaColar').value = ''; }

function colarDoWord() {
    var texto = document.getElementById('textareaColar').value;
    if (!texto.trim()) { toast('Cole o texto primeiro', 'error'); return; }
    var novas = [];
    // ✅ CORREÇÃO: Uso correto de \n para quebra de linha
    texto.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l; }).forEach(function (linha) {
        var m = linha.match(/^(\d+)\s*[).\-]\s*(.*)/);
        if (m) {
            var partes = (m[2] || '').split('|').map(function (p) { return p.trim(); });
            var q = novaQuestao();
            q.enunciado = partes[0] || '';
            q.resposta = partes[1] || '';
            q.valor = partes[2] ? String(parseFloat(partes[2].replace(',', '.')) || 2) : '2';
            novas.push(q);
        } else if (novas.length > 0) { 
            novas[novas.length - 1].enunciado += '\n' + linha; 
        }
    });
    if (novas.length === 0) { toast('Use o formato "1) enunciado | critério | valor"', 'error'); return; }
    questoes = novas;
    renderizarQuestoes();
    fecharModal('modalColar');
    toast(novas.length + ' questão(ões) importada(s)!', 'success');
}

async function salvarProva() {
    var nome = document.getElementById('nomeProva').value.trim();
    var bimestre = parseInt(document.getElementById('bimestre').value);
    var peso = parseFloat(document.getElementById('peso').value) || 1;
    var disciplina = document.getElementById('disciplina').value;
    if (!nome) { toast('Dê um nome para a prova!', 'error'); return; }
    if (questoes.length === 0) { toast('Adicione ao menos uma questão!', 'error'); return; }
    for (var i = 0; i < questoes.length; i++) {
        if (!questoes[i].enunciado || questoes[i].enunciado.trim() === '') {
            toast('Questão ' + (i + 1) + ' sem enunciado!', 'error'); return;
        }
    }
    try {
        for (var k = 0; k < questoes.length; k++) {
            if (questoes[k].file) {
                toast('Enviando imagem da questão ' + (k + 1) + '...', 'info');
                questoes[k].imagemUrl = await uploadImagem(questoes[k].file);
                questoes[k].file = null;
            }
        }
        var idAval;
        if (editandoId) {
            var ru = await sbFetch('PATCH', '/rest/v1/avaliacoes?id=eq.' + editandoId, {
                nome: nome, bimestre: bimestre, peso_media: peso, numero_questoes: questoes.length, disciplina: disciplina
            });
            if (!ru.ok) { toast('Erro ao atualizar: ' + msgErro(await ru.json()), 'error'); return; }
            await sbFetch('DELETE', '/rest/v1/' + COLUNAS.ABERTAS.tabela + '?id_avaliacao=eq.' + editandoId);
            idAval = editandoId;
        } else {
            var r1 = await sbFetch('POST', '/rest/v1/avaliacoes', {
                nome: nome, data_prova: new Date().toISOString().split('T')[0], numero_questoes: questoes.length,
                bimestre: bimestre, peso_media: peso, disciplina: disciplina, modo_correcao: 'aberta', tipo: 'Prova Aberta'
            }, 'return=representation');
            if (!r1.ok) { toast('Erro ao criar prova: ' + msgErro(await r1.json()), 'error'); return; }
            idAval = (await r1.json())[0].id;
        }
        var linhas = questoes.map(function (q, idx) { return prepararQuestaoParaSalvar('aberta', idAval, q, idx + 1); });
        var r2 = await sbFetch('POST', '/rest/v1/' + COLUNAS.ABERTAS.tabela, linhas);
        if (!r2.ok) { toast('Erro ao salvar questões: ' + msgErro(await r2.json()), 'error'); return; }
        toast('✅ Prova salva com ' + questoes.length + ' questão(ões)!', 'success');
        novoForm();
        carregarProvas();
    } catch (e) { toast('Falha: ' + e.message, 'error'); }
}

async function carregarProvas() {
    var lista = document.getElementById('provasLista');
    lista.innerHTML = '<div class="loading">Carregando...</div>';
    try {
        var r = await sbFetch('GET', '/rest/v1/avaliacoes?modo_correcao=eq.aberta&select=id,nome,bimestre,numero_questoes,data_prova,tipo&order=id.desc');
        if (!r.ok) { lista.innerHTML = '<p style="color:#dc3545;text-align:center;padding:20px;">Erro ao carregar provas.</p>'; return; }
        var data = await r.json();
        if (!data || data.length === 0) { lista.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">Nenhuma prova cadastrada ainda.</p>'; return; }
        lista.innerHTML = data.map(function (p) {
            var tipoDisplay = p.tipo ? ` • <span style="color:#008080; font-weight:bold;">${p.tipo}</span>` : '';
            return '<div class="prova-item"><div class="prova-item-info"><strong>' + p.nome + '</strong><div class="prova-item-meta">' + p.numero_questoes + ' questões • ' + p.bimestre + 'º bimestre • ' + p.data_prova + tipoDisplay + '</div></div>' +
                '<div style="display:flex;gap:6px;"><button class="btn btn-primary btn-sm" onclick="mostrarQR(' + p.id + ', \'' + String(p.nome).replace(/'/g, '') + '\')">🔲</button>' +
                '<button class="btn btn-warn btn-sm" onclick="editarProva(' + p.id + ')">✏️</button><button class="btn btn-danger btn-sm" onclick="excluirProva(' + p.id + ')">🗑️</button></div></div>';
        }).join('');
    } catch (e) { lista.innerHTML = '<p style="color:#dc3545;text-align:center;padding:20px;">Falha de conexão.</p>'; }
}

async function editarProva(id) {
    try {
        var r1 = await sbFetch('GET', '/rest/v1/avaliacoes?id=eq.' + id + '&select=*');
        var a = (await r1.json())[0];
        var qs = await buscarQuestoes('aberta', id);
        document.getElementById('nomeProva').value = a.nome || '';
        document.getElementById('bimestre').value = String(a.bimestre || '3');
        document.getElementById('peso').value = String(a.peso_media || '1');
        document.getElementById('disciplina').value = a.disciplina || 'Matemática';
        questoes = qs.map(function (q) {
            return {
                enunciado: q.enunciado || '', resposta: q.resposta_esperada || '', valor: String(q.valor || '2'),
                imagemUrl: q.imagem_url || null, file: null, descritor: q[COLUNAS.ABERTAS.descritor] || '', habilidade: q[COLUNAS.ABERTAS.habilidade] || ''
            };
        });
        if (questoes.length === 0) questoes = [novaQuestao()];
        editandoId = id;
        document.getElementById('bannerEdicao').classList.remove('hidden');
        document.getElementById('bannerTexto').textContent = '✏️ Editando: ' + a.nome;
        document.getElementById('btnSalvar').textContent = '💾 SALVAR ALTERAÇÕES';
        renderizarQuestoes();
        navegarPara('view-provas', document.querySelector('.menu-item'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { toast('Erro ao carregar prova: ' + e.message, 'error'); }
}

async function excluirProva(id) {
    if (!confirm('Excluir esta prova? Todas as questões serão apagadas.')) return;
    try {
        await sbFetch('DELETE', '/rest/v1/' + COLUNAS.ABERTAS.tabela + '?id_avaliacao=eq.' + id);
        await sbFetch('DELETE', '/rest/v1/avaliacoes?id=eq.' + id);
        toast('Prova excluída!', 'success');
        carregarProvas();
    } catch (e) { toast('Erro: ' + e.message, 'error'); }
}

// ========================================================================
// 📝 PROVAS OBJETIVAS
// ========================================================================
function novaQuestaoObj() {
    return { enunciado: '', alt_a: '', alt_b: '', alt_c: '', alt_d: '', alt_e: '', gabarito: 'A', valor: '1', descritor: '', habilidade: '' };
}

function novoFormObj() {
    editandoIdObj = null;
    document.getElementById('nomeProvaObj').value = '';
    document.getElementById('bimestreObj').value = '3';
    document.getElementById('disciplinaObj').value = 'Matemática';
    document.getElementById('pesoObj').value = '1';
    document.getElementById('qtdAlternativasObj').value = '4';
    document.getElementById('bannerEdicaoObj').classList.add('hidden');
    document.getElementById('btnSalvarObj').textContent = '💾 SALVAR PROVA OBJETIVA';
    questoesObj = [novaQuestaoObj()];
    renderizarQuestoesObj();
}

function adicionarQuestaoObj() { questoesObj.push(novaQuestaoObj()); renderizarQuestoesObj(); }
function removerQuestaoObj(i) { if (questoesObj.length > 1) { questoesObj.splice(i, 1); renderizarQuestoesObj(); } }
function atualizarQuestaoObj(i, campo, valor) { questoesObj[i][campo] = valor; }
function cancelarEdicaoObj() { novoFormObj(); }

function renderizarQuestoesObj() {
    var qtdAlt = parseInt(document.getElementById('qtdAlternativasObj').value) || 4;
    document.getElementById('totalQuestoesObj').textContent = questoesObj.length;
    document.getElementById('questoesObjContainer').innerHTML = questoesObj.map(function (q, i) {
        var html = '<div class="questao-card" style="border-left: 4px solid #6f42c1;">';
        html += '<div class="questao-header"><div style="display:flex;align-items:center;gap:8px;"><div class="questao-num" style="background:#6f42c1;">' + (i + 1) + '</div><strong>Questão ' + (i + 1) + '</strong></div>';
        html += '<button class="remove-btn" onclick="removerQuestaoObj(' + i + ')">🗑️</button></div>';
        html += '<div class="form-group"><label>Enunciado da Questão</label><textarea rows="3" onchange="atualizarQuestaoObj(' + i + ', \'enunciado\', this.value)">' + escaparHTML(q.enunciado) + '</textarea></div>';
        var letras = ['A', 'B', 'C', 'D', 'E'];
        for(var j=0; j < qtdAlt; j++) {
            var letra = letras[j];
            var campo = 'alt_' + letra.toLowerCase();
            var checked = q.gabarito === letra ? 'checked' : '';
            html += '<div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">';
            html += '<input type="radio" name="gab_' + i + '" value="' + letra + '" ' + checked + ' onchange="atualizarQuestaoObj(' + i + ', \'gabarito\', \'' + letra + '\')" style="width:auto; accent-color:#28a745;">';
            html += '<strong style="color:#6f42c1; width:20px;">' + letra + ')</strong>';
            html += '<input type="text" placeholder="Alternativa ' + letra + '" value="' + (q[campo] || '') + '" onchange="atualizarQuestaoObj(' + i + ', \'' + campo + '\', this.value)" style="flex:1;">';
            html += '</div>';
        }
        html += '<div class="form-row" style="grid-template-columns: 1fr 1fr 1fr; margin-top:12px;">';
        html += '<div class="form-group" style="margin:0;"><label>Valor</label><input type="number" step="0.1" value="' + q.valor + '" onchange="atualizarQuestaoObj(' + i + ', \'valor\', this.value)"></div>';
        html += '<div class="form-group" style="margin:0;"><label>Descritor (SAEB)</label><input type="text" value="' + (q.descritor || '') + '" onchange="atualizarQuestaoObj(' + i + ', \'descritor\', this.value)" placeholder="Ex: D25"></div>';
        html += '<div class="form-group" style="margin:0;"><label>Habilidade (BNCC)</label><input type="text" value="' + (q.habilidade || '') + '" onchange="atualizarQuestaoObj(' + i + ', \'habilidade\', this.value)" placeholder="Ex: EF05MA01"></div>';
        html += '</div></div>';
        return html;
    }).join('');
}

async function salvarProvaObjetiva() {
    var nome = document.getElementById('nomeProvaObj').value.trim();
    var bimestre = parseInt(document.getElementById('bimestreObj').value);
    var peso = parseFloat(document.getElementById('pesoObj').value) || 1;
    var disciplina = document.getElementById('disciplinaObj').value;
    if (!nome) { toast('Dê um nome para a prova!', 'error'); return; }
    if (questoesObj.length === 0) { toast('Adicione ao menos uma questão!', 'error'); return; }
    for (var i = 0; i < questoesObj.length; i++) {
        if (!questoesObj[i].enunciado || questoesObj[i].enunciado.trim() === '') {
            toast('Questão ' + (i + 1) + ' sem enunciado!', 'error'); return;
        }
    }
    try {
        var idAval;
        if (editandoIdObj) {
            await sbFetch('PATCH', '/rest/v1/avaliacoes?id=eq.' + editandoIdObj, {
                nome: nome, bimestre: bimestre, peso_media: peso, numero_questoes: questoesObj.length, disciplina: disciplina
            });
            await sbFetch('DELETE', '/rest/v1/' + COLUNAS.OBJETIVAS.tabela + '?id_avaliacao=eq.' + editandoIdObj);
            idAval = editandoIdObj;
        } else {
            var r1 = await sbFetch('POST', '/rest/v1/avaliacoes', {
                nome: nome, data_prova: new Date().toISOString().split('T')[0], numero_questoes: questoesObj.length,
                bimestre: bimestre, peso_media: peso, disciplina: disciplina, modo_correcao: 'objetiva', tipo: 'Prova Objetiva'
            }, 'return=representation');
            if (!r1.ok) { toast('Erro ao criar prova: ' + msgErro(await r1.json()), 'error'); return; }
            idAval = (await r1.json())[0].id;
        }
        var linhas = questoesObj.map(function (q, idx) { return prepararQuestaoParaSalvar('objetiva', idAval, q, idx + 1); });
        var r2 = await sbFetch('POST', '/rest/v1/' + COLUNAS.OBJETIVAS.tabela, linhas);
        if (!r2.ok) { toast('Erro ao salvar questões: ' + msgErro(await r2.json()), 'error'); return; }
        toast('✅ Prova Objetiva salva com sucesso!', 'success');
        novoFormObj();
        carregarProvasObj();
    } catch (e) { toast('Falha: ' + e.message, 'error'); }
}

async function carregarProvasObj() {
    var lista = document.getElementById('provasObjLista');
    lista.innerHTML = '<div class="loading">Carregando...</div>';
    try {
        var r = await sbFetch('GET', '/rest/v1/avaliacoes?modo_correcao=eq.objetiva&select=id,nome,bimestre,numero_questoes,data_prova,tipo&order=id.desc');
        if (!r.ok) { lista.innerHTML = '<p style="color:#dc3545;text-align:center;padding:20px;">Erro ao carregar.</p>'; return; }
        var data = await r.json();
        if (!data || data.length === 0) { lista.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">Nenhuma prova objetiva cadastrada.</p>'; return; }
        lista.innerHTML = data.map(function (p) {
            var tipoDisplay = p.tipo ? ` • <span style="color:#6f42c1; font-weight:bold;">${p.tipo}</span>` : '';
            return '<div class="prova-item"><div class="prova-item-info"><strong>' + p.nome + '</strong><div class="prova-item-meta">' + p.numero_questoes + ' questões • ' + p.bimestre + 'º bimestre' + tipoDisplay + '</div></div>' +
                '<div style="display:flex;gap:6px;">' +
                '<button class="btn btn-primary btn-sm" onclick="imprimirGabaritoObj(' + p.id + ')">🖨️ Gabarito</button>' +
                '<button class="btn btn-warn btn-sm" onclick="editarProvaObj(' + p.id + ')">✏️ Editar</button>' +
                '<button class="btn btn-danger btn-sm" onclick="excluirProvaObj(' + p.id + ')">🗑️</button>' +
                '</div></div>';
        }).join('');
    } catch (e) { lista.innerHTML = '<p style="color:#dc3545;text-align:center;padding:20px;">Falha de conexão.</p>'; }
}

async function editarProvaObj(id) {
    try {
        var r1 = await sbFetch('GET', '/rest/v1/avaliacoes?id=eq.' + id + '&select=*');
        var a = (await r1.json())[0];
        var qs = await buscarQuestoes('objetiva', id);
        document.getElementById('nomeProvaObj').value = a.nome || '';
        document.getElementById('bimestreObj').value = String(a.bimestre || '3');
        document.getElementById('pesoObj').value = String(a.peso_media || '1');
        document.getElementById('disciplinaObj').value = a.disciplina || 'Matemática';
        questoesObj = qs.map(function (q) {
            return {
                enunciado: q.enunciado || '', alt_a: q.alternativa_a || '', alt_b: q.alternativa_b || '', alt_c: q.alternativa_c || '',
                alt_d: q.alternativa_d || '', alt_e: q.alternativa_e || '', gabarito: q.gabarito || 'A', valor: String(q.valor || '1'),
                descritor: q[COLUNAS.OBJETIVAS.descritor] || '', habilidade: q[COLUNAS.OBJETIVAS.habilidade] || ''
            };
        });
        if (questoesObj.length === 0) questoesObj = [novaQuestaoObj()];
        editandoIdObj = id;
        document.getElementById('bannerEdicaoObj').classList.remove('hidden');
        document.getElementById('bannerTextoObj').textContent = '✏️ Editando: ' + a.nome;
        document.getElementById('btnSalvarObj').textContent = '💾 SALVAR ALTERAÇÕES';
        renderizarQuestoesObj();
        navegarPara('view-objetivas', document.querySelectorAll('.menu-item')[1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { toast('Erro ao carregar: ' + e.message, 'error'); }
}

async function excluirProvaObj(id) {
    if (!confirm('Excluir esta prova objetiva?')) return;
    try {
        await sbFetch('DELETE', '/rest/v1/' + COLUNAS.OBJETIVAS.tabela + '?id_avaliacao=eq.' + id);
        await sbFetch('DELETE', '/rest/v1/avaliacoes?id=eq.' + id);
        toast('Prova excluída!', 'success');
        carregarProvasObj();
    } catch (e) { toast('Erro: ' + e.message, 'error'); }
}

function imprimirGabaritoObj(id) {
    window.open('correcao-objetiva.html?prova=' + id, '_blank');
}

// ========================================================================
// 📄 SISTEMA DE IMPRESSÃO UNIFICADO E BLINDADO (FINAL)
// ========================================================================

// 🏫 CONFIGURAÇÃO DA ESCOLA
const NOME_ESCOLA_PDF = "EMEB PROFESSORA ESTHER VIANNA BOLOGNA";
const SECRETARIA_PDF = "SECRETARIA MUNICIPAL DA EDUCAÇÃO DE BATATAIS";

// 1. Função que LIMPA qualquer resquício de impressão anterior
function limparAmbienteDeImpressao() {
    ['container-impressao', 'container-impressao-obj', 'style-impressao', 'style-impressao-obj'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
}

// 2. Função Mestra que executa a impressão
function executarImpressaoUnificada(htmlContent, containerId, styleId) {
    limparAmbienteDeImpressao();
    
    const container = document.createElement('div');
    container.id = containerId;
    container.innerHTML = htmlContent;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        @media screen {
            #${containerId} {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: white; z-index: 99999; overflow-y: auto; padding: 20px;
                box-sizing: border-box; font-family: 'Times New Roman', serif;
            }
            #${containerId}::before {
                content: '⏳ Preparando impressão... Use Ctrl+P e escolha "Salvar como PDF". Feche esta visualização depois.';
                display: block; text-align: center; padding: 15px; background: #008080;
                color: white; font-weight: bold; margin-bottom: 20px; border-radius: 8px; font-family: sans-serif;
            }
        }
        @media print {
            body > *:not(#${containerId}) { display: none !important; }
            #${containerId} {
                position: static !important; width: 100% !important; height: auto !important;
                overflow: visible !important; padding: 0 !important; background: white !important;
            }
            #${containerId}::before { display: none !important; }
            @page { size: A4; margin: 15mm; }
            .questao-print-item, .questao-card, table, tr {
                page-break-inside: avoid !important; break-inside: avoid !important;
            }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(container);
    
    setTimeout(() => {
        window.print();
        setTimeout(() => limparAmbienteDeImpressao(), 1000);
    }, 500);
}

// ========================================================================
// 📝 FUNÇÕES DA PROVA DISSERTATIVA (ABERTA)
// ========================================================================

function gerarPDFProvaAluno() {
    const dados = pegarDadosProvaAtual();
    if (dados.questoes.length === 0) return toast('❌ Adicione pelo menos uma questão!', 'error');
    const html = montarCabecalhoAluno(dados) + montarQuestoes(dados, 'aluno') + '</div>';
    executarImpressaoUnificada(html, 'container-impressao', 'style-impressao');
}

function gerarPDFProvaProfessor() {
    const dados = pegarDadosProvaAtual();
    if (dados.questoes.length === 0) return toast('❌ Adicione pelo menos uma questão!', 'error');
    const html = montarCabecalhoProfessor(dados) + montarQuestoes(dados, 'professor') + '</div>';
    executarImpressaoUnificada(html, 'container-impressao', 'style-impressao');
}

// ========================================================================
// ✅ FUNÇÕES DA PROVA OBJETIVA (LEITURA CIRÚRGICA DO HTML)
// ========================================================================

function pegarDadosProvaObjetivaAtual() {
    const nomeProva = document.getElementById('nomeProvaObj')?.value || 'Prova Sem Nome';
    const bimestre = document.getElementById('bimestreObj')?.value || '1';
    const disciplina = document.getElementById('disciplinaObj')?.value || 'Matemática';
    const qtdAlternativas = parseInt(document.getElementById('qtdAlternativasObj')?.value) || 4;
    
    const container = document.getElementById('questoesObjContainer');
    if (!container) return { questoes: [] };
    
    // Pega APENAS os cards diretos do container (evita duplicação)
    const questoesDivs = container.querySelectorAll(':scope > .questao-card');
    const questoes = [];
    
    questoesDivs.forEach((div, index) => {
        // 1. Enunciado (primeiro textarea)
        const enunciadoEl = div.querySelector('textarea');
        const enunciado = enunciadoEl ? enunciadoEl.value : '';
        
        // 2. Gabarito (radio button checado)
        const gabaritoEl = div.querySelector('input[type="radio"]:checked');
        const respostaCorreta = gabaritoEl ? gabaritoEl.value : 'A';
        
        // 3. Valor
        const valorEl = div.querySelector('input[type="number"]');
        const valor = valorEl ? (valorEl.value || '1') : '1';
        
        // 4. Alternativas: Busca EXATA pelo placeholder gerado no renderizarQuestoesObj
        const alternativas = [];
        const letras = ['A', 'B', 'C', 'D', 'E'];
        for (let i = 0; i < qtdAlternativas; i++) {
            const letra = letras[i];
            const altEl = div.querySelector(`input[type="text"][placeholder="Alternativa ${letra}"]`);
            alternativas.push(altEl ? altEl.value : '');
        }
        
        questoes.push({
            numero: index + 1,
            enunciado: enunciado,
            respostaCorreta: respostaCorreta.toUpperCase(),
            alternativas: alternativas,
            valor: valor
        });
    });
    
    console.log("📦 Dados da Prova Objetiva extraídos com sucesso:", questoes);
    return { nome: nomeProva, bimestre: bimestre, disciplina: disciplina, questoes: questoes };
}

function imprimirProvaObjetivaAluno() {
    const dados = pegarDadosProvaObjetivaAtual();
    if (dados.questoes.length === 0) return toast('❌ Adicione pelo menos uma questão objetiva!', 'error');
    const html = montarCabecalhoObjetivoAluno(dados) + montarQuestoesObjetivas(dados, 'aluno') + '</div>';
    executarImpressaoUnificada(html, 'container-impressao-obj', 'style-impressao-obj');
}

function imprimirProvaObjetivaProfessor() {
    const dados = pegarDadosProvaObjetivaAtual();
    if (dados.questoes.length === 0) return toast('❌ Adicione pelo menos uma questão objetiva!', 'error');
    
    const email = localStorage.getItem('sb_email') || '____________________';
    let html = `
    <div style="font-family: 'Times New Roman', serif; padding: 20px; color: #000;">
        <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 16px;">${SECRETARIA_PDF}</h2>
            <h3 style="margin: 5px 0; font-size: 15px;">${NOME_ESCOLA_PDF}</h3>
            <p style="margin: 8px 0 0 0; font-size: 15px;"><strong>📋 GABARITO OFICIAL - ${dados.nome.toUpperCase()}</strong></p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; background: #f0f0f0;">
            <tr><td style="padding: 6px; border: 1px solid #000;"><strong>Professor(a):</strong> ${email}</td><td style="padding: 6px; border: 1px solid #000;"><strong>Disciplina:</strong> ${dados.disciplina}</td></tr>
        </table>
    ` + montarQuestoesObjetivas(dados, 'professor') + '</div>';
    
    executarImpressaoUnificada(html, 'container-impressao-obj', 'style-impressao-obj');
}