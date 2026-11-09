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
                '<button class="btn btn-secondary" style="padding: 14px;" onclick="imprimirProvaNativa()">🖨️ IMPRIMIR / SALVAR PDF (NATIVO)</button>' +
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
// 📄 GERADOR DE PDF DA PROVA (ALUNO E PROFESSOR) - VERSÃO PROFISSIONAL
// ========================================================================

// 🏫 CONFIGURAÇÃO DA ESCOLA (ALTERE AQUI COM O NOME DA SUA ESCOLA)
const NOME_ESCOLA = "EMEB PROFESSORA ESTHER VIANNA BOLOGNA";
const SECRETARIA = "SECRETARIA MUNICIPAL DA EDUCAÇÃO DE BATATAIS";

// Função auxiliar: Pega os dados da prova atual (VERSÃO CORRIGIDA PARA .questao-card)
function pegarDadosProvaAtual() {
    const nomeProva = document.getElementById('nomeProva').value || 'Prova Sem Nome';
    const bimestre = document.getElementById('bimestre').value;
    const disciplina = document.getElementById('disciplina').value || 'Matemática';
    const peso = document.getElementById('peso').value || '1';
    
    const questoesContainer = document.getElementById('questoesContainer');
    
    // ✅ SELETOR CORRETO ENCONTRADO NO LOG:
    const questoesDivs = questoesContainer.querySelectorAll('.questao-card');
    
    if (questoesDivs.length === 0) {
        toast('❌ Nenhuma questão encontrada na tela.', 'error');
        return { nome: nomeProva, bimestre: bimestre, disciplina: disciplina, peso: peso, questoes: [] };
    }
    
    const questoes = [];
    questoesDivs.forEach((div, index) => {
        // 1. Pega o enunciado (geralmente o primeiro textarea do card)
        const textareas = div.querySelectorAll('textarea');
        let enunciado = '';
        let resposta = '';
        
        if (textareas.length >= 1) {
            enunciado = textareas[0].value || '';
        }
        
        // 2. Pega a resposta/gabarito (geralmente o segundo textarea ou input de texto)
        if (textareas.length >= 2) {
            resposta = textareas[1].value || '';
        } else {
            // Tenta achar um input de texto que possa ser o gabarito
            const inputResposta = div.querySelector('input[type="text"]');
            if (inputResposta) resposta = inputResposta.value || '';
        }
        
        // 3. Pega o valor da questão (input number)
        let valor = '1';
        const inputValor = div.querySelector('input[type="number"]');
        if (inputValor) {
            valor = inputValor.value || '1';
        }
        
        questoes.push({
            numero: index + 1,
            enunciado: enunciado,
            resposta: resposta,
            valor: valor
        });
    });
    
    console.log(`✅ Sucesso! ${questoes.length} questões encontradas e processadas.`);
    console.log("📦 Exemplo da primeira questão:", questoes[0]);
    
    return {
        nome: nomeProva,
        bimestre: bimestre,
        disciplina: disciplina,
        peso: peso,
        questoes: questoes
    };
}

// Função auxiliar: Monta o cabeçalho da VERSÃO DO ALUNO
function montarCabecalhoAluno(dadosProva) {
    const emailProfessor = localStorage.getItem('sb_email') || '____________________';
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    
    return `
    <div style="font-family: 'Times New Roman', serif; padding: 20px; color: #000;">
        <!-- CABEÇALHO INSTITUCIONAL -->
        <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 16px; letter-spacing: 1px;">${SECRETARIA}</h2>
            <h3 style="margin: 5px 0; font-size: 15px; font-weight: bold;">${NOME_ESCOLA}</h3>
            <p style="margin: 8px 0 0 0; font-size: 14px;">
                <strong>AVALIAÇÃO ${dadosProva.bimestre}º BIMESTRE - ${dadosProva.nome.toUpperCase()}</strong>
            </p>
        </div>
        
        <!-- DADOS IDENTIFICADORES -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
            <tr>
                <td style="padding: 6px; border: 1px solid #000; width: 60%;">
                    <strong>Professor(a):</strong> ${emailProfessor}
                </td>
                <td style="padding: 6px; border: 1px solid #000; width: 40%;">
                    <strong>Disciplina:</strong> ${dadosProva.disciplina}
                </td>
            </tr>
            <tr>
                <td style="padding: 6px; border: 1px solid #000;">
                    <strong>Nome Completo do Aluno(a):</strong> _________________________________________________
                </td>
                <td style="padding: 6px; border: 1px solid #000;">
                    <strong>Ano/Turma:</strong> _________
                </td>
            </tr>
            <tr>
                <td style="padding: 6px; border: 1px solid #000;">
                    <strong>Nº de Chamada:</strong> _________
                </td>
                <td style="padding: 6px; border: 1px solid #000;">
                    <strong>Data:</strong> ___/___/______
                </td>
            </tr>
        </table>
        
        <!-- INSTRUÇÕES -->
        <div style="background: #f9f9f9; border: 1px solid #ccc; padding: 8px; margin-bottom: 15px; font-size: 12px;">
            <strong>📌 INSTRUÇÕES:</strong>
            <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                <li>Leia atentamente cada questão antes de responder.</li>
                <li>Responda com letra legível e caneta azul ou preta.</li>
                <li>Não use corretivo. Em caso de erro, risque e refaça.</li>
                <li>Valor total da prova: <strong>${dadosProva.questoes.reduce((acc, q) => acc + parseFloat(q.valor || 0), 0).toFixed(1)} pontos</strong></li>
            </ul>
        </div>
        
        <p style="text-align: center; font-style: italic; margin-bottom: 20px; font-size: 13px;">
            "O sucesso é a soma de pequenos esforços repetidos dia após dia."
        </p>
    `;
}

// Função auxiliar: Monta o cabeçalho do GABARITO DO PROFESSOR
function montarCabecalhoProfessor(dadosProva) {
    const emailProfessor = localStorage.getItem('sb_email') || '____________________';
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    
    return `
    <div style="font-family: 'Times New Roman', serif; padding: 20px; color: #000;">
        <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 16px;">${SECRETARIA}</h2>
            <h3 style="margin: 5px 0; font-size: 15px;">${NOME_ESCOLA}</h3>
            <p style="margin: 8px 0 0 0; font-size: 15px;">
                <strong>📋 GABARITO OFICIAL - ${dadosProva.nome.toUpperCase()}</strong>
            </p>
            <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">
                Documento de uso exclusivo do professor | Emitido em: ${dataHoje}
            </p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; background: #f0f0f0;">
            <tr>
                <td style="padding: 6px; border: 1px solid #000;"><strong>Professor(a):</strong> ${emailProfessor}</td>
                <td style="padding: 6px; border: 1px solid #000;"><strong>Disciplina:</strong> ${dadosProva.disciplina}</td>
            </tr>
            <tr>
                <td style="padding: 6px; border: 1px solid #000;"><strong>Bimestre:</strong> ${dadosProva.bimestre}º</td>
                <td style="padding: 6px; border: 1px solid #000;"><strong>Valor Total:</strong> ${dadosProva.questoes.reduce((acc, q) => acc + parseFloat(q.valor || 0), 0).toFixed(1)} pontos</td>
            </tr>
        </table>
    `;
}

// Função auxiliar: Monta as questões
function montarQuestoes(dadosProva, modo) {
    let html = '';
    
    dadosProva.questoes.forEach(q => {
        html += `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px; display: flex; justify-content: space-between;">
                <span>Questão ${q.numero}</span>
                <span style="font-size: 12px;">(Valor: ${q.valor} pts)</span>
            </div>
            <div style="margin-bottom: 10px; padding: 10px; background: #fafafa; border-left: 3px solid #008080; font-size: 13px; line-height: 1.5;">
                ${q.enunciado.replace(/\n/g, '<br>')}
            </div>
        `;
        
        if (modo === 'professor') {
            html += `
            <div style="padding: 10px; background: #e8f5e9; border: 1px dashed #28a745; border-radius: 4px;">
                <strong style="color: #28a745;">✅ RESPOSTA ESPERADA:</strong><br>
                <span style="color: #1b5e20; font-size: 13px;">${q.resposta || '<em>(Sem resposta cadastrada)</em>'}</span>
            </div>
            `;
        } else {
            // Versão do aluno: decide entre caixa ou linhas baseado no tamanho da questão
            const ehDissertativaLonga = q.enunciado.length > 200 || q.enunciado.toLowerCase().includes('dissertativ') || q.enunciado.toLowerCase().includes('justifique') || q.enunciado.toLowerCase().includes('explique');
            
            if (ehDissertativaLonga) {
                html += `
                <div style="border: 1px solid #000; min-height: 140px; padding: 10px; background: #fff;">
                    <em style="color: #999; font-size: 11px;">Resposta:</em>
                </div>
                `;
            } else {
                html += `
                <div style="margin-top: 8px;">
                    <div style="border-bottom: 1px solid #000; height: 28px;"></div>
                    <div style="border-bottom: 1px solid #000; height: 28px;"></div>
                    <div style="border-bottom: 1px solid #000; height: 28px;"></div>
                    <div style="border-bottom: 1px solid #000; height: 28px;"></div>
                    <div style="border-bottom: 1px solid #000; height: 28px;"></div>
                </div>
                `;
            }
        }
        
        html += `</div>`;
    });
    
    return html;
}

// ========================================================================
// 📄 GERADOR DE PDF DA PROVA (VERSÃO CORRIGIDA CONTRA TELA EM BRANCO)
// ========================================================================

// 🏫 CONFIGURAÇÃO DA ESCOLA (Certifique-se de que isso está no topo do arquivo)
const NOME_ESCOLA_PDF = "ESCOLA ESTADUAL"; 
const SECRETARIA_PDF = "SECRETARIA DE ESTADO DA EDUCAÇÃO";

// ========================================================================
// 📄 GERADOR DE PDF DA PROVA (VERSÃO FINAL E CORRIGIDA)
// ========================================================================

async function gerarPDF(modo) {
    const dadosProva = pegarDadosProvaAtual();
    
    if (dadosProva.questoes.length === 0) {
        toast('❌ Adicione pelo menos uma questão antes de gerar o PDF!', 'error');
        return;
    }
    
    // Monta o HTML completo
    let htmlCompleto = '';
    if (modo === 'aluno') {
        htmlCompleto = montarCabecalhoAluno(dadosProva) + montarQuestoes(dadosProva, 'aluno');
    } else {
        htmlCompleto = montarCabecalhoProfessor(dadosProva) + montarQuestoes(dadosProva, 'professor');
    }
    htmlCompleto += `</div>`; // Fecha a div principal
    
    // 1. CRIA O OVERLAY VISÍVEL
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(255, 255, 255, 0.95)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'flex-start';
    overlay.style.overflowY = 'auto';
    overlay.style.paddingTop = '20px';
    
    const loadingText = document.createElement('h3');
    loadingText.innerText = '⏳ Processando PDF, por favor aguarde...';
    loadingText.style.marginBottom = '20px';
    loadingText.style.color = '#008080';
    
    // 2. ELEMENTO REAL (COM DIMENSÕES EM PIXELS PARA O HTML2CANVAS)
    const elementoTemp = document.createElement('div');
    elementoTemp.id = 'temp-pdf-gerador';
    elementoTemp.style.width = '794px'; // Largura A4 em pixels (96 DPI)
    elementoTemp.style.background = '#ffffff';
    elementoTemp.style.padding = '40px';
    elementoTemp.style.color = '#000000';
    elementoTemp.style.fontFamily = 'Times New Roman, serif';
    elementoTemp.style.boxShadow = '0 0 20px rgba(0,0,0,0.2)';
    elementoTemp.innerHTML = htmlCompleto;
    
    overlay.appendChild(loadingText);
    overlay.appendChild(elementoTemp);
    document.body.appendChild(overlay);

    // Aguarda renderização
    await new Promise(resolve => setTimeout(resolve, 800));

    // 3. CONFIGURAÇÕES QUE PREVINEM A TELA EM BRANCO
    const opcoes = {
        margin: 0,
        filename: `${dadosProva.nome.replace(/\s+/g, '_')}_${modo === 'aluno' ? 'ALUNO' : 'GABARITO_PROFESSOR'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
            scale: 1, // 🚨 CRUCIAL: Scale 1 evita estouro de memória
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 794,
            windowHeight: elementoTemp.scrollHeight,
            // ✅ CORREÇÃO DA SETINHA AQUI:
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById('temp-pdf-gerador');
                if (clonedElement) {
                    clonedElement.style.width = '794px';
                    clonedElement.style.position = 'relative';
                }
            }
        },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    try {
        await html2pdf().set(opcoes).from(elementoTemp).save();
        toast(`✅ PDF gerado com sucesso!`, 'success');
    } catch (e) {
        console.error('❌ Erro ao gerar PDF:', e);
        toast('❌ Erro ao gerar PDF.', 'error');
    } finally {
        document.body.removeChild(overlay);
    }
}

// Funções públicas chamadas pelos botões
function gerarPDFProvaAluno() {
    gerarPDF('aluno');
}

function gerarPDFProvaProfessor() {
    gerarPDF('professor');
}

// ========================================================================
// 📄 GERADOR DE PDF DA PROVA OBJETIVA (ALUNO E PROFESSOR)
// ========================================================================

// Função: Pega os dados da prova objetiva atual
function pegarDadosProvaObjetivaAtual() {
    const nomeProva = document.getElementById('nomeProvaObj').value || 'Prova Sem Nome';
    const bimestre = document.getElementById('bimestreObj').value;
    const disciplina = document.getElementById('disciplinaObj').value || 'Matemática';
    const peso = document.getElementById('pesoObj').value || '1';
    const qtdAlternativas = parseInt(document.getElementById('qtdAlternativasObj').value) || 4;
    
    const questoesContainer = document.getElementById('questoesObjContainer');
    const questoesDivs = questoesContainer.querySelectorAll('.questao-item-obj, [class*="questao"]');
    
    const questoes = [];
    questoesDivs.forEach((div, index) => {
        // Tenta pegar o enunciado (vários seletores possíveis)
        let enunciado = '';
        const elEnunciado = div.querySelector('.enunciado-questao-obj, textarea, [name*="enunciado"]');
        if (elEnunciado) enunciado = elEnunciado.value || '';
        
        // Tenta pegar a resposta correta (gabarito)
        let respostaCorreta = '';
        const elResposta = div.querySelector('.gabarito-questao-obj, select[name*="gabarito"], input[name*="correta"]:checked, [name*="correta"]');
        if (elResposta) {
            respostaCorreta = elResposta.value || '';
        }
        
        // Tenta pegar as alternativas
        const alternativas = [];
        const letras = ['A', 'B', 'C', 'D', 'E'];
        for (let i = 0; i < qtdAlternativas; i++) {
            const elAlt = div.querySelector(`[name*="alt${letras[i]}"], [data-alt="${letras[i]}"]`);
            alternativas.push(elAlt ? (elAlt.value || '') : '');
        }
        
        questoes.push({
            numero: index + 1,
            enunciado: enunciado,
            respostaCorreta: respostaCorreta.toUpperCase(),
            alternativas: alternativas,
            valor: (10 / questoesDivs.length).toFixed(1) // Divide 10 pontos igualmente
        });
    });
    
    return {
        nome: nomeProva,
        bimestre: bimestre,
        disciplina: disciplina,
        peso: peso,
        qtdAlternativas: qtdAlternativas,
        questoes: questoes
    };
}

// Função: Monta o cabeçalho da prova objetiva (aluno)
function montarCabecalhoObjetivoAluno(dadosProva) {
    const emailProfessor = localStorage.getItem('sb_email') || '____________________';
    
    return `
    <div style="font-family: 'Times New Roman', serif; padding: 20px; color: #000;">
        <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 16px; letter-spacing: 1px;">${SECRETARIA}</h2>
            <h3 style="margin: 5px 0; font-size: 15px; font-weight: bold;">${NOME_ESCOLA}</h3>
            <p style="margin: 8px 0 0 0; font-size: 14px;">
                <strong>AVALIAÇÃO OBJETIVA ${dadosProva.bimestre}º BIMESTRE - ${dadosProva.nome.toUpperCase()}</strong>
            </p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
            <tr>
                <td style="padding: 6px; border: 1px solid #000; width: 60%;"><strong>Professor(a):</strong> ${emailProfessor}</td>
                <td style="padding: 6px; border: 1px solid #000; width: 40%;"><strong>Disciplina:</strong> ${dadosProva.disciplina}</td>
            </tr>
            <tr>
                <td style="padding: 6px; border: 1px solid #000;"><strong>Nome Completo do Aluno(a):</strong> _________________________________________________</td>
                <td style="padding: 6px; border: 1px solid #000;"><strong>Ano/Turma:</strong> _________</td>
            </tr>
            <tr>
                <td style="padding: 6px; border: 1px solid #000;"><strong>Nº de Chamada:</strong> _________</td>
                <td style="padding: 6px; border: 1px solid #000;"><strong>Data:</strong> ___/___/______</td>
            </tr>
        </table>
        
        <div style="background: #f9f9f9; border: 1px solid #ccc; padding: 8px; margin-bottom: 15px; font-size: 12px;">
            <strong>📌 INSTRUÇÕES:</strong>
            <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                <li>Cada questão tem apenas <strong>UMA</strong> resposta correta.</li>
                <li>Marque a alternativa correta no CARTÃO DE RESPOSTAS (se houver) ou circule a letra.</li>
                <li>Use caneta azul ou preta.</li>
                <li>Valor total: <strong>${dadosProva.questoes.reduce((acc, q) => acc + parseFloat(q.valor || 0), 0).toFixed(1)} pontos</strong></li>
            </ul>
        </div>
    `;
}

// Função: Monta as questões objetivas
function montarQuestoesObjetivas(dadosProva, modo) {
    const letras = ['A', 'B', 'C', 'D', 'E'];
    let html = '';
    
    dadosProva.questoes.forEach(q => {
        html += `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px; display: flex; justify-content: space-between;">
                <span>Questão ${q.numero}</span>
                <span style="font-size: 12px;">(Valor: ${q.valor} pts)</span>
            </div>
            <div style="margin-bottom: 10px; padding: 10px; background: #fafafa; border-left: 3px solid #008080; font-size: 13px; line-height: 1.5;">
                ${q.enunciado.replace(/\n/g, '<br>')}
            </div>
            <div style="padding-left: 10px;">
        `;
        
        // Monta as alternativas
        q.alternativas.forEach((alt, i) => {
            const letra = letras[i];
            const ehCorreta = modo === 'professor' && q.respostaCorreta === letra;
            const estilo = ehCorreta 
                ? 'background: #e8f5e9; border: 2px solid #28a745; font-weight: bold;' 
                : 'background: #fff; border: 1px solid #ddd;';
            
            html += `
                <div style="padding: 6px 10px; margin-bottom: 5px; border-radius: 4px; ${estilo} font-size: 13px;">
                    <strong>${letra})</strong> ${alt || '(alternativa não cadastrada)'}
                    ${ehCorreta ? ' <span style="color: #28a745; float: right;">✅ CORRETA</span>' : ''}
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    return html;
}

// Função: Gera o PDF da prova objetiva
async function gerarPDFObjetivo(modo) {
    const dadosProva = pegarDadosProvaObjetivaAtual();
    
    if (dadosProva.questoes.length === 0) {
        toast('❌ Adicione pelo menos uma questão antes de gerar o PDF!', 'error');
        return;
    }
    
    let htmlCompleto = '';
    
    if (modo === 'aluno') {
        htmlCompleto = montarCabecalhoObjetivoAluno(dadosProva) + montarQuestoesObjetivas(dadosProva, 'aluno');
    } else {
        // Cabeçalho do professor (reutiliza o da dissertativa com ajustes)
        const emailProfessor = localStorage.getItem('sb_email') || '____________________';
        const dataHoje = new Date().toLocaleDateString('pt-BR');
        
        htmlCompleto = `
        <div style="font-family: 'Times New Roman', serif; padding: 20px; color: #000;">
            <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 15px;">
                <h2 style="margin: 0; font-size: 16px;">${SECRETARIA}</h2>
                <h3 style="margin: 5px 0; font-size: 15px;">${NOME_ESCOLA}</h3>
                <p style="margin: 8px 0 0 0; font-size: 15px;"><strong>📋 GABARITO OFICIAL - ${dadosProva.nome.toUpperCase()}</strong></p>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">Documento de uso exclusivo do professor | Emitido em: ${dataHoje}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; background: #f0f0f0;">
                <tr>
                    <td style="padding: 6px; border: 1px solid #000;"><strong>Professor(a):</strong> ${emailProfessor}</td>
                    <td style="padding: 6px; border: 1px solid #000;"><strong>Disciplina:</strong> ${dadosProva.disciplina}</td>
                </tr>
                <tr>
                    <td style="padding: 6px; border: 1px solid #000;"><strong>Bimestre:</strong> ${dadosProva.bimestre}º</td>
                    <td style="padding: 6px; border: 1px solid #000;"><strong>Valor Total:</strong> ${dadosProva.questoes.reduce((acc, q) => acc + parseFloat(q.valor || 0), 0).toFixed(1)} pontos</td>
                </tr>
            </table>
            
            <!-- TABELA RESUMO DO GABARITO -->
            <div style="margin-bottom: 20px; padding: 10px; background: #e3f2fd; border: 1px solid #1976d2; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #1565c0;">📊 RESUMO DAS RESPOSTAS</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <tr style="background: #bbdefb;">
                        ${dadosProva.questoes.map(q => `<td style="padding: 4px; border: 1px solid #1976d2; text-align: center; font-weight: bold;">${q.numero}</td>`).join('')}
                    </tr>
                    <tr>
                        ${dadosProva.questoes.map(q => `<td style="padding: 4px; border: 1px solid #1976d2; text-align: center; font-weight: bold; color: #28a745;">${q.respostaCorreta || '-'}</td>`).join('')}
                    </tr>
                </table>
            </div>
        `;
        htmlCompleto += montarQuestoesObjetivas(dadosProva, 'professor');
    }
    
    htmlCompleto += `</div>`;
    
    const elementoTemp = document.createElement('div');
    elementoTemp.style.position = 'fixed';
    elementoTemp.style.left = '-9999px';
    elementoTemp.style.top = '0';
    elementoTemp.style.width = '210mm';
    elementoTemp.style.background = '#fff';
    elementoTemp.innerHTML = htmlCompleto;
    document.body.appendChild(elementoTemp);
    
    const opcoes = {
        margin: [10, 10, 10, 10],
        filename: `${dadosProva.nome.replace(/\s+/g, '_')}_OBJETIVA_${modo === 'aluno' ? 'ALUNO' : 'GABARITO'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };
    
    try {
        toast('⏳ Gerando PDF...', 'info');
        await html2pdf().set(opcoes).from(elementoTemp).save();
        toast(`✅ PDF ${modo === 'aluno' ? 'do Aluno' : 'Gabarito'} gerado!`, 'success');
    } catch (e) {
        console.error('Erro ao gerar PDF:', e);
        toast('❌ Erro ao gerar PDF: ' + e.message, 'error');
    } finally {
        document.body.removeChild(elementoTemp);
    }
}

// Funções públicas para os botões
function gerarPDFProvaObjetivaAluno() {
    gerarPDFObjetivo('aluno');
}

function gerarPDFProvaObjetivaProfessor() {
    gerarPDFObjetivo('professor');
}

// ========================================================================
// 🖨️ IMPRESSÃO NATIVA DO NAVEGADOR (100% FUNCIONAL COM PAGINAÇÃO)
// ========================================================================

function imprimirProvaNativa() {
    const dadosProva = pegarDadosProvaAtual();
    if (dadosProva.questoes.length === 0) {
        toast('❌ Adicione pelo menos uma questão!', 'error');
        return;
    }
    
    const htmlCompleto = montarCabecalhoAluno(dadosProva) + montarQuestoes(dadosProva, 'aluno') + '</div>';
    
    // Cria uma nova janela para impressão
    const novaJanela = window.open('', '_blank', 'width=800,height=600');
    
    if (!novaJanela) {
        toast('❌ Pop-up bloqueado! Permita pop-ups para este site.', 'error');
        return;
    }
    
    // CSS de impressão profissional com paginação correta
    const cssImpressao = `
        <style>
            @page {
                size: A4;
                margin: 15mm;
            }
            
            * {
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Times New Roman', serif;
                padding: 0;
                margin: 0;
                color: #000;
                line-height: 1.6;
            }
            
            /* Evita cortar elementos entre páginas */
            div {
                page-break-inside: avoid;
            }
            
            /* Força quebra de página antes de cada questão (opcional) */
            .questao-item {
                page-break-before: auto;
                page-break-inside: avoid;
            }
            
            /* Garante que tabelas não sejam cortadas */
            table {
                page-break-inside: avoid;
            }
            
            /* Remove sombras e efeitos na impressão */
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                div {
                    page-break-inside: avoid;
                }
            }
        </style>
    `;
    
    novaJanela.document.write(`
        <html>
        <head>
            <title>${dadosProva.nome} - Prova</title>
            ${cssImpressao}
        </head>
        <body>
            ${htmlCompleto}
        </body>
        </html>
    `);
    
    novaJanela.document.close();
    
    // Aguarda carregar e imprime
    novaJanela.onload = function() {
        novaJanela.focus();
        setTimeout(() => {
            novaJanela.print();
            // Não fecha a janela automaticamente para o usuário poder salvar como PDF
        }, 500);
    };
}