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
    
    // 🆕 Carregar dados do planejamento ao abrir o modal
    if (typeof carregarTurmasPlanejamento === 'function') carregarTurmasPlanejamento();
    if (typeof carregarHabilidadesPlanejamento === 'function') carregarHabilidadesPlanejamento();
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

// ========================================================================
// 📋 PLANEJAR AULA - CARREGAR TURMAS E HABILIDADES
// ========================================================================

// Carrega as turmas no select do planejamento
async function carregarTurmasPlanejamento() {
    const select = document.getElementById('iaTurmaPlanejamento');
    if (!select) return;
    
    try {
        const r = await sbFetch('GET', '/rest/v1/turmas?select=id,nome&order=nome.asc');
        const turmas = await r.json();
        select.innerHTML = '<option value="">Selecione a turma...</option>';
        turmas.forEach(t => {
            select.innerHTML += `<option value="${t.id}">${t.nome}</option>`;
        });
    } catch (e) {
        console.error('Erro ao carregar turmas:', e);
    }
}

// Carrega habilidades e descritores do banco no multi-select
// ========================================================================
// 📚 CARREGAR HABILIDADES DA MATRIZ CURRICULAR (VERSÃO BLINDADA)
// ========================================================================
async function carregarHabilidadesPlanejamento() {
    const lista = document.getElementById('listaHabilidadesPlanejamento');
    if (!lista) return;
    
    // 1. Mostra indicador de carregamento
    lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">⏳ Carregando habilidades da matriz...</p>';
    
    try {
        // 2. Usa o cliente Supabase DIRETAMENTE (muito mais seguro que sbFetch)
        const { data, error } = await supabase
            .from('matriz_curricular')
            .select('id, fonte, componente, ano, codigo, tema, habilidade, objetos_de_conhecimento')
            .order('codigo', { ascending: true });
            
        // 3. Trata erros do Supabase
        if (error) {
            throw new Error(error.message);
        }
        
        // 4. Verifica se veio dados
        if (!data || data.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px;">⚠️ Nenhuma habilidade encontrada na tabela "matriz_curricular"</p>';
            return;
        }
        
        // 5. Guarda no window para uso global (busca e filtros)
        // Nota: Mapeamos 'habilidade' para 'descricao' para manter compatibilidade com o resto do seu código
        window._habilidadesPlanejamento = data.map(item => ({
            id: item.id,
            fonte: item.fonte || 'BNCC',
            componente: item.componente || '',
            ano: item.ano || '',
            codigo: item.codigo || '',
            tema: item.tema || '',
            descricao: item.habilidade || '', 
            objetos: item.objetos_de_conhecimento || ''
        }));
        
        // 6. Renderiza a lista na tela
        if (typeof renderizarListaHabilidades === 'function') {
            renderizarListaHabilidades(window._habilidadesPlanejamento);
        }
        
        // 7. Atualiza os selects de filtro (componente e ano)
        if (typeof atualizarFiltrosMatriz === 'function') {
            atualizarFiltrosMatriz();
        }
        
        console.log(`✅ Sucesso! ${window._habilidadesPlanejamento.length} habilidades carregadas.`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar matriz curricular:', e);
        lista.innerHTML = `<p style="text-align: center; color: #dc3545; padding: 20px;">❌ Erro ao carregar: ${e.message}<br><small>Verifique se a tabela "matriz_curricular" existe e tem dados.</small></p>`;
    }
}

// Atualiza os selects de filtro com base nos dados carregados
function atualizarFiltrosMatriz() {
    const selectComponente = document.getElementById('filtroComponente');
    const selectAno = document.getElementById('filtroAno');
    
    if (!selectComponente || !selectAno) return;
    
    // Pega componentes únicos
    const componentes = [...new Set(window._habilidadesPlanejamento.map(h => h.componente).filter(c => c))];
    selectComponente.innerHTML = '<option value="">Todos os componentes</option>';
    componentes.forEach(c => {
        selectComponente.innerHTML += `<option value="${c}">${c}</option>`;
    });
    
    // Pega anos únicos
    const anos = [...new Set(window._habilidadesPlanejamento.map(h => h.ano).filter(a => a))].sort((a, b) => a - b);
    selectAno.innerHTML = '<option value="">Todos os anos</option>';
    anos.forEach(a => {
        selectAno.innerHTML += `<option value="${a}">${a}º Ano</option>`;
    });
}

// Renderiza a lista de habilidades com checkboxes
function renderizarListaHabilidades(lista) {
    const container = document.getElementById('listaHabilidadesPlanejamento');
    if (!container) return;
    
    if (lista.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma habilidade encontrada com esses filtros</p>';
        return;
    }
    
    container.innerHTML = '';
    lista.forEach(item => {
        const div = document.createElement('div');
        div.className = 'habilidade-checkbox-item';
        
        // Cor de fundo baseada na fonte
        const corFonte = item.fonte === 'SAEB' ? '#fef3c7' : 
                         item.fonte === 'Currículo Paulista' ? '#dcfce7' : '#e0e7ff';
        const corTexto = item.fonte === 'SAEB' ? '#92400e' : 
                         item.fonte === 'Currículo Paulista' ? '#166534' : '#4f46e5';
        
        div.innerHTML = `
            <input type="checkbox" value="${item.codigo}" data-codigo="${item.codigo}" data-fonte="${item.fonte}" onchange="atualizarContadorHabilidades()">
            <span class="codigo">${item.codigo}</span>
            <span class="descricao">${item.descricao || 'Sem descrição'}</span>
            <span style="font-size: 11px; color: ${corTexto}; background: ${corFonte}; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">${item.fonte}</span>
        `;
        container.appendChild(div);
    });
}

// Filtra habilidades conforme digita na busca + filtros de componente/ano
function filtrarHabilidadesPlanejamento() {
    const termo = (document.getElementById('buscaHabilidade')?.value || '').toLowerCase();
    const componenteFiltro = document.getElementById('filtroComponente')?.value || '';
    const anoFiltro = document.getElementById('filtroAno')?.value || '';
    
    const todas = window._habilidadesPlanejamento || [];
    const filtradas = todas.filter(item => {
        const matchTermo = !termo || 
            item.codigo.toLowerCase().includes(termo) || 
            (item.descricao && item.descricao.toLowerCase().includes(termo)) ||
            (item.tema && item.tema.toLowerCase().includes(termo)) ||
            (item.objetos && item.objetos.toLowerCase().includes(termo));
        const matchComponente = !componenteFiltro || item.componente === componenteFiltro;
        const matchAno = !anoFiltro || String(item.ano) === String(anoFiltro);
        return matchTermo && matchComponente && matchAno;
    });
    
    renderizarListaHabilidades(filtradas);
}

// Seleciona todas as habilidades visíveis
function selecionarTodasHabilidades() {
    document.querySelectorAll('#listaHabilidadesPlanejamento input[type="checkbox"]').forEach(cb => cb.checked = true);
    atualizarContadorHabilidades();
}

// Limpa seleção
function limparHabilidadesSelecionadas() {
    document.querySelectorAll('#listaHabilidadesPlanejamento input[type="checkbox"]').forEach(cb => cb.checked = false);
    atualizarContadorHabilidades();
}

// Atualiza contador
function atualizarContadorHabilidades() {
    const total = document.querySelectorAll('#listaHabilidadesPlanejamento input[type="checkbox"]:checked').length;
    const contador = document.getElementById('contadorHabilidades');
    if (contador) contador.textContent = `${total} selecionada${total !== 1 ? 's' : ''}`;
}

// Pega as habilidades selecionadas
function getHabilidadesSelecionadas() {
    const selecionadas = [];
    document.querySelectorAll('#listaHabilidadesPlanejamento input[type="checkbox"]:checked').forEach(cb => {
        const codigo = cb.dataset.codigo || cb.value;
        const fonte = cb.dataset.fonte || 'BNCC';
        // Busca a habilidade completa no array
        const completa = (window._habilidadesPlanejamento || []).find(h => h.codigo === codigo);
        selecionadas.push({
            codigo: codigo,
            fonte: fonte,
            descricao: completa?.descricao || '',
            tema: completa?.tema || '',
            objetos: completa?.objetos || ''
        });
    });
    return selecionadas;
}

// Renderiza a lista de habilidades com checkboxes
function renderizarListaHabilidades(lista) {
    const container = document.getElementById('listaHabilidadesPlanejamento');
    if (!container) return;
    
    if (lista.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma habilidade encontrada</p>';
        return;
    }
    
    container.innerHTML = '';
    lista.forEach(item => {
        const div = document.createElement('div');
        div.className = 'habilidade-checkbox-item';
        div.innerHTML = `
            <input type="checkbox" value="${item.codigo}" data-tipo="${item.tipo}" onchange="atualizarContadorHabilidades()">
            <span class="codigo">${item.codigo}</span>
            <span class="descricao">${item.descricao || 'Sem descrição'}</span>
            <span style="font-size: 11px; color: #6b7280; background: ${item.tipo === 'BNCC' ? '#e0e7ff' : '#fef3c7'}; padding: 2px 6px; border-radius: 4px;">${item.tipo}</span>
        `;
        container.appendChild(div);
    });
}

// Filtra habilidades conforme digita na busca
function filtrarHabilidadesPlanejamento() {
    const termo = document.getElementById('buscaHabilidade').value.toLowerCase();
    const todas = [...(window._habilidadesPlanejamento || []), ...(window._descritoresPlanejamento || [])];
    const filtradas = todas.filter(item => 
        item.codigo.toLowerCase().includes(termo) || 
        (item.descricao && item.descricao.toLowerCase().includes(termo))
    );
    renderizarListaHabilidades(filtradas);
}

// Seleciona todas as habilidades visíveis
function selecionarTodasHabilidades() {
    document.querySelectorAll('#listaHabilidadesPlanejamento input[type="checkbox"]').forEach(cb => cb.checked = true);
    atualizarContadorHabilidades();
}

// Limpa seleção
function limparHabilidadesSelecionadas() {
    document.querySelectorAll('#listaHabilidadesPlanejamento input[type="checkbox"]').forEach(cb => cb.checked = false);
    atualizarContadorHabilidades();
}

// Atualiza contador
function atualizarContadorHabilidades() {
    const total = document.querySelectorAll('#listaHabilidadesPlanejamento input[type="checkbox"]:checked').length;
    const contador = document.getElementById('contadorHabilidades');
    if (contador) contador.textContent = `${total} selecionada${total !== 1 ? 's' : ''}`;
}

// Pega as habilidades selecionadas
function getHabilidadesSelecionadas() {
    const selecionadas = [];
    document.querySelectorAll('#listaHabilidadesPlanejamento input[type="checkbox"]:checked').forEach(cb => {
        selecionadas.push({
            codigo: cb.value,
            tipo: cb.dataset.tipo
        });
    });
    return selecionadas;
}

// ========================================================================
// 🤖 GERAR PLANO DE AULA (VERSÃO APRIMORADA)
// ========================================================================

async function gerarPlanoAula() {
    const tema = document.getElementById('iaTemaAula').value.trim();
    if (!tema) {
        alert('⚠️ Informe o tema da aula!');
        return;
    }
    
    const habilidadesSelecionadas = getHabilidadesSelecionadas();
    if (habilidadesSelecionadas.length === 0) {
        if (!confirm('⚠️ Nenhuma habilidade selecionada. Deseja continuar mesmo assim?')) return;
    }
    
    // Coleta todos os dados do formulário
    const dados = {
        escola: document.getElementById('iaEscola').value.trim(),
        disciplina: document.getElementById('iaDisciplina').value,
        anoSerie: document.getElementById('iaAnoSerie').value,
        turmaId: document.getElementById('iaTurmaPlanejamento').value,
        turmaNome: document.getElementById('iaTurmaPlanejamento').options[document.getElementById('iaTurmaPlanejamento').selectedIndex]?.text || '',
        bimestre: document.getElementById('iaBimestre').value,
        duracao: document.getElementById('iaDuracao').value,
        tema: tema,
        perfilTurma: document.getElementById('iaPerfilTurma').value.trim(),
        material: document.getElementById('iaMaterial').value.trim(),
        observacoes: document.getElementById('iaObservacoes').value.trim(),
        habilidades: habilidadesSelecionadas
    };
    
    const btn = document.getElementById('btnPlanejarIA');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '⏳ Gerando plano...';
    btn.disabled = true;
    
    const areaResultado = document.getElementById('iaResultadoPlanejar');
    areaResultado.innerHTML = '<div style="text-align:center; padding: 20px; color: #4f46e5;"><div class="spinner" style="margin: 0 auto 10px;"></div>🤖 A IA está montando seu plano de aula...</div>';
    
    try {
        // Monta o prompt estruturado
        const prompt = montarPromptPlanoAula(dados);
        
        const response = await fetch(API_BASE_URL + '/api/ia_geral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
    // 1. Renderiza o plano formatado na tela
    areaResultado.innerHTML = renderizarPlanoAula(dados, data.texto);
    
    // 2. 🚨 O TRUQUE MÁGICO: ADICIONAR O BOTÃO DE PDF AUTOMATICAMENTE 🚨
    // O código abaixo procura o plano que acabou de ser criado e cola o botão nele
    const containerPlano = areaResultado.querySelector('.plano-aula-container');
    
    if (containerPlano) {
        // Cria a barra de botões
        const divBotoes = document.createElement('div');
        divBotoes.className = 'plano-acoes';
        divBotoes.style.marginTop = '30px';
        divBotoes.style.paddingTop = '20px';
        divBotoes.style.borderTop = '2px dashed #e5e7eb';
        divBotoes.style.display = 'flex';
        divBotoes.style.gap = '10px';
        divBotoes.style.justifyContent = 'center';
        divBotoes.style.flexWrap = 'wrap';

        // Coloca o HTML dos botões
        divBotoes.innerHTML = `
            <button class="btn btn-primary" onclick="baixarPlanoComoPDF()" style="background-color: #dc2626;">
                📄 BAIXAR PDF PERFEITO (SEM SOBREPOSIÇÃO)
            </button>
            <button class="btn btn-secondary" onclick="window.print()">
                🖨️ IMPRIMIR PELO NAVEGADOR
            </button>
        `;
        
        // Adiciona a barra de botões no final do plano
        containerPlano.appendChild(divBotoes);
    }

    // 3. Renderiza a matemática (KaTeX) para as frações ficarem bonitas
    setTimeout(() => {
        if (typeof renderizarMatematicaNaTela === 'function') {
            renderizarMatematicaNaTela();
        }
    }, 100);
    
} else {
    areaResultado.innerHTML = `<div style="background:#fee2e2; padding:16px; border-radius:8px; color:#991b1b;">❌ Erro: ${data.erro}</div>`;
}
    } catch (e) {
        console.error('Erro ao gerar plano:', e);
        areaResultado.innerHTML = `<div style="background:#fee2e2; padding:16px; border-radius:8px; color:#991b1b;">❌ Erro de conexão: ${e.message}</div>`;
    } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

// Monta o prompt rico para a IA
// Monta o prompt rico para a IA (VERSÃO COM REGRA DE LATEX)
function montarPromptPlanoAula(dados) {
    const sb = [];
    sb.push('Você é um professor especialista em elaboração de planos de aula e atividades didáticas.');
    sb.push('Elabore um conteúdo COMPLETO, DIDÁTICO E PRÁTICO seguindo rigorosamente a estrutura solicitada.');
    sb.push('Use linguagem clara, objetiva e adequada ao ano/série informado.');
    sb.push('');
    sb.push('=== DADOS DA AULA ===');
    if (dados.escola) sb.push(`Escola: ${dados.escola}`);
    sb.push(`Disciplina: ${dados.disciplina}`);
    sb.push(`Ano/Série: ${dados.anoSerie}`);
    if (dados.turmaNome) sb.push(`Turma: ${dados.turmaNome}`);
    sb.push(`Bimestre: ${dados.bimestre}`);
    sb.push(`Duração: ${dados.duracao}`);
    sb.push(`Tema: ${dados.tema}`);
    if (dados.perfilTurma) sb.push(`Perfil da Turma: ${dados.perfilTurma}`);
    if (dados.material) sb.push(`Material Disponível: ${dados.material}`);
    if (dados.observacoes) sb.push(`Observações: ${dados.observacoes}`);
    sb.push('');
    
    sb.push('=== HABILIDADES DA MATRIZ CURRICULAR A TRABALHAR ===');
    if (dados.habilidades && dados.habilidades.length > 0) {
        dados.habilidades.forEach(h => {
            sb.push(`- [${h.fonte}] ${h.codigo}: ${h.descricao}`);
            if (h.tema) sb.push(`  Tema: ${h.tema}`);
            if (h.objetos) sb.push(`  Objetos de conhecimento: ${h.objetos}`);
        });
    } else {
        sb.push('(Nenhuma habilidade específica informada - escolha as mais adequadas ao tema)');
    }
    sb.push('');

    // 🚨 AQUI ESTÁ A REGRA MÁGICA QUE FALTAVA 🚨
    sb.push('📐 REGRA DE FORMATAÇÃO MATEMÁTICA (CRÍTICA):');
    sb.push('Para frações, equações ou qualquer símbolo matemático, use EXCLUSIVAMENTE a sintaxe LaTeX.');
    sb.push('Use $ para matemática no meio do texto (ex: A fração $\\frac{1}{3}$ é igual a...)');
    sb.push('Use $$ para fórmulas isoladas em uma linha própria.');
    sb.push('NUNCA use formato de texto simples como 1/3 ou 12/20 quando puder usar LaTeX.');
    sb.push('');

    sb.push('=== ESTRUTURA OBRIGATÓRIA DA RESPOSTA ===');
    sb.push('Use EXATAMENTE estes títulos de seção (com ## na frente):');
    sb.push('');
    sb.push('## 1. OBJETIVOS DE APRENDIZAGEM');
    sb.push('(liste 3 a 5 objetivos claros, começando com verbos no infinitivo)');
    sb.push('');
    sb.push('## 2. DESENVOLVIMENTO METODOLÓGICO');
    sb.push('### Introdução (10-15 min)');
    sb.push('### Desenvolvimento (atividade principal)');
    sb.push('### Fechamento (síntese e consolidação)');
    sb.push('');
    sb.push('## 3. RECURSOS DIDÁTICOS');
    sb.push('');
    sb.push('## 4. AVALIAÇÃO');
    sb.push('');
    sb.push('## 5. ADAPTAÇÕES (se aplicável)');
    sb.push('');
    sb.push('Responda APENAS o conteúdo solicitado, sem conversas ou introduções extras. Use formatação Markdown clara.');
    
    return sb.join('\n');
}

// Renderiza o plano em HTML formatado para impressão
function renderizarPlanoAula(dados, textoIA) {
    // Converte markdown simples para HTML
    let html = textoIA
        .replace(/^## (.+)$/gm, '<h2 class="secao-titulo">$1</h2>')
        .replace(/^### (.+)$/gm, '<h3 style="color:#4f46e5; margin: 12px 0 6px 0; font-size: 15px;">$1</h3>')
        .replace(/^\- (.+)$/gm, '<li>$1</li>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    // Agrupa listas
    html = html.replace(/(<li>.*?<\/li>)+/gs, match => `<ul>${match}</ul>`);
    
    // Monta cabeçalho
    let cabecalho = '';
    if (dados.escola) {
        cabecalho += `<div class="escola-nome">${dados.escola}</div>`;
    }
    cabecalho += `<h1>📚 PLANO DE AULA</h1>`;
    
    // Monta grid de identificação
    const infoGrid = `
        <div class="secao">
            <div class="secao-titulo">📋 IDENTIFICAÇÃO</div>
            <div class="info-grid">
                <div class="info-item"><strong>Disciplina:</strong> ${dados.disciplina}</div>
                <div class="info-item"><strong>Ano/Série:</strong> ${dados.anoSerie}</div>
                <div class="info-item"><strong>Turma:</strong> ${dados.turmaNome || '-'}</div>
                <div class="info-item"><strong>Bimestre:</strong> ${dados.bimestre}</div>
                <div class="info-item"><strong>Duração:</strong> ${dados.duracao}</div>
                <div class="info-item"><strong>Tema:</strong> ${dados.tema}</div>
                <div class="info-item"><strong>Professor:</strong> ${userEmail || '-'}</div>
                <div class="info-item"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>
        </div>
    `;
    
    // Monta tags de habilidades
    let habilidadesHTML = '';
    if (dados.habilidades.length > 0) {
        habilidadesHTML = `
            <div class="secao">
                <div class="secao-titulo">🎯 HABILIDADES TRABALHADAS</div>
                <div style="padding: 10px;">
                    ${dados.habilidades.map(h => `<span class="habilidade-tag">[${h.tipo}] ${h.codigo}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // Monta o HTML final
    const htmlFinal = `
        <div class="plano-aula-container" id="planoAulaImpressao">
            ${cabecalho}
            ${infoGrid}
            ${habilidadesHTML}
            <div class="secao">
                <div class="secao-titulo">📖 CONTEÚDO DO PLANO</div>
                <div style="padding: 10px;">${html}</div>
            </div>
        </div>
        
        <div class="plano-acoes">
            <button class="btn btn-primary" onclick="window.print()">🖨️ IMPRIMIR PLANO</button>
            <button class="btn btn-success" onclick="gerarAtividadesDaAula()">📝 GERAR ATIVIDADES DESTA AULA</button>
            <button class="btn btn-secondary" onclick="document.getElementById('iaResultadoPlanejar').innerHTML = ''">🗑️ LIMPAR</button>
        </div>
    `;
    
    // Guarda os dados para uso posterior (gerar atividades)
    window._planoAtual = { dados, textoIA };
    
    return htmlFinal;
}

// ========================================================================
// 📝 GERAR ATIVIDADES DA AULA (BASEADO NO PLANO GERADO)
// ========================================================================
function gerarAtividadesDaAula() {
    if (!window._planoAtual) {
        alert('⚠️ Gere um plano de aula primeiro!');
        return;
    }
    
    const dados = window._planoAtual.dados;
    const areaResultado = document.getElementById('iaResultadoPlanejar');
    const idLoading = 'loadingAtividades';
    
    // 1. Mostra indicador de carregamento
    areaResultado.innerHTML += `
        <div id="${idLoading}" style="text-align:center; padding: 30px; color: #4f46e5; margin-top: 20px; border-top: 2px dashed #e5e7eb;">
            <div class="spinner" style="margin: 0 auto 10px;"></div>
            🤖 A IA está criando as atividades personalizadas baseadas no plano...
        </div>
    `;
    
    // 2. Monta o prompt específico para atividades
    const promptAtividades = montarPromptAtividades(dados);
    
    // 3. Chama a API
    fetch(API_BASE_URL + '/api/ia_geral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptAtividades })
    })
    .then(response => response.json())
    .then(data => {
        // Remove o loading
        const loadingEl = document.getElementById(idLoading);
        if (loadingEl) loadingEl.remove();
        
        if (data.sucesso) {
            // Cria um container bonito e distinto para as atividades
            const divAtividades = document.createElement('div');
            divAtividades.className = 'plano-aula-container';
            divAtividades.style.marginTop = '30px';
            divAtividades.style.borderTop = '4px solid #10b981'; // Verde para diferenciar do plano
            
            // Formata o texto Markdown em HTML
            let htmlAtividades = formatarMarkdownParaHTML(data.texto);
            
            divAtividades.innerHTML = `
                <h2 style="color: #10b981; text-align: center; margin-bottom: 20px;">📝 ATIVIDADES PRÁTICAS DA AULA</h2>
                <div style="padding: 10px; font-size: 15px; line-height: 1.7;">${htmlAtividades}</div>
                
                <div class="plano-acoes" style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <!-- 🚨 AQUI ESTÁ O NOVO BOTÃO DE PDF 🚨 -->
                    <button class="btn btn-primary" onclick="baixarPlanoComoPDF()">
                        📄 BAIXAR PDF PERFEITO
                    </button>
                    <button class="btn btn-secondary" onclick="imprimirApenasAtividades()">
                        🖨️ IMPRIMIR PELO NAVEGADOR
                    </button>
                    <button class="btn btn-danger" onclick="this.closest('.plano-aula-container').remove()">
                        🗑️ REMOVER
                    </button>
                </div>
            `;
            
            areaResultado.appendChild(divAtividades);
            
            // 🚨 CHAMA A RENDERIZAÇÃO DA MATEMÁTICA (KATEX) NAS NOVAS ATIVIDADES
            setTimeout(() => {
                if (typeof renderizarMatematicaNaTela === 'function') {
                    renderizarMatematicaNaTela();
                }
            }, 100);
            
        } else {
            areaResultado.innerHTML += `<div style="background:#fee2e2; padding:16px; border-radius:8px; color:#991b1b; margin-top:20px;">❌ Erro ao gerar atividades: ${data.erro}</div>`;
        }
    })
    .catch(e => {
        const loadingEl = document.getElementById(idLoading);
        if (loadingEl) loadingEl.remove();
        console.error('Erro ao gerar atividades:', e);
        areaResultado.innerHTML += `<div style="background:#fee2e2; padding:16px; border-radius:8px; color:#991b1b; margin-top:20px;">❌ Erro de conexão: ${e.message}</div>`;
    });
}

// ========================================================================
// 🧠 FUNÇÃO AUXILIAR: MONTAR PROMPT DE ATIVIDADES
// ========================================================================
function montarPromptAtividades(dados) {
    const sb = [];
    sb.push('Você é um professor especialista em criar atividades práticas, lúdicas e engajadoras.');
    sb.push('Crie uma lista de EXERCÍCIOS/ATIVIDADES baseada EXATAMENTE no contexto da aula abaixo.');
    sb.push('');
    sb.push('=== CONTEXTO DA AULA ===');
    sb.push(`Disciplina: ${dados.disciplina}`);
    sb.push(`Ano/Série: ${dados.anoSerie}`);
    sb.push(`Tema: ${dados.tema}`);
    if (dados.habilidades && dados.habilidades.length > 0) {
        sb.push('Habilidades focadas: ' + dados.habilidades.map(h => h.codigo).join(', '));
    }
    if (dados.perfilTurma) sb.push(`Perfil da Turma: ${dados.perfilTurma}`);
    sb.push('');
    sb.push('=== REGRAS DE FORMATAÇÃO CRÍTICA ===');
    sb.push('1. Crie entre 5 a 7 questões progressivas (da mais fácil para a mais desafiadora).');
    sb.push('2. Para matemática e frações, USE EXCLUSIVAMENTE a sintaxe LaTeX: use $ para inline (ex: A fração $\\frac{1}{3}$) e $$ para fórmulas isoladas.');
    sb.push('3. Para séries iniciais (1º ao 5º ano), USE EMOJIS (🍎, 🚗, ⭐, 🍕) para representar quantidades e tornar visual.');
    sb.push('4. No final da resposta, inclua uma seção "## GABARITO" com as respostas corretas e uma breve explicação.');
    sb.push('5. Responda APENAS com o conteúdo das atividades em formato Markdown, sem conversas ou introduções extras.');
    
    return sb.join('\n');
}

// ========================================================================
// 🛠️ FUNÇÃO AUXILIAR: FORMATAR MARKDOWN SIMPLES EM HTML
// ========================================================================
function formatarMarkdownParaHTML(texto) {
    return texto
        .replace(/^### (.+)$/gm, '<h4 style="color:#4f46e5; margin: 16px 0 8px 0;">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="color:#10b981; margin: 20px 0 10px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">$1</h3>')
        .replace(/^\- (.+)$/gm, '<li style="margin-bottom: 6px;">$1</li>')
        .replace(/^\d+\.\s(.+)$/gm, '<li style="margin-bottom: 8px; font-weight: 500;">$1</li>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

// ========================================================================
// 🖨️ FUNÇÃO AUXILIAR: IMPRIMIR APENAS AS ATIVIDADES
// ========================================================================
function imprimirApenasAtividades() {
    // Esconde temporariamente o plano de aula e os botões para imprimir limpo
    const plano = document.querySelector('#iaResultadoPlanejar > .plano-aula-container:not([style*="border-top"])');
    const acoes = document.querySelectorAll('.plano-acoes');
    
    if (plano) plano.style.display = 'none';
    acoes.forEach(a => a.style.display = 'none');
    
    // Aciona a impressão do navegador (que já está configurada no CSS para imprimir só o conteúdo visível)
    window.print();
    
    // Restaura a visualização
    if (plano) plano.style.display = 'block';
    acoes.forEach(a => a.style.display = 'flex');
}

// ========================================================================
// 🚀 INICIALIZAÇÃO - Chamar quando o modal de IA abrir
// ========================================================================

// Modifique sua função abrirModalIA() para incluir estas chamadas:
// (adicione estas linhas dentro da função abrirModalIA existente)
/*
    carregarTurmasPlanejamento();
    carregarHabilidadesPlanejamento();
*/

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
// ========================================================================
// 📐 FUNÇÃO PARA RENDERIZAR MATEMÁTICA (KATEX)
// ========================================================================
function renderizarMatematicaNaTela() {
    // Verifica se o KaTeX já carregou
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},   // Fórmulas em bloco
                {left: '$', right: '$', display: false},     // Fórmulas no meio do texto
                {left: '\\(', right: '\\)', display: false}, // Alternativa inline
                {left: '\\[', right: '\\]', display: true}   // Alternativa bloco
            ],
            throwOnError: false // Se houver um erro de sintaxe na fórmula, não quebra a página
        });
    }
}
// ========================================================================
// 📄 FUNÇÃO PARA BAIXAR O PLANO/ATIVIDADES COMO PDF PERFEITO
// ========================================================================
function baixarPlanoComoPDF() {
    // Pega o container do plano de aula ou atividades
    const elemento = document.querySelector('.plano-aula-container');
    
    if (!elemento) {
        alert('⚠️ Nenhum plano ou atividade gerado ainda!');
        return;
    }
    
    // Configurações do PDF para ficar lindo e sem sobreposição
    const opt = {
        margin: [15, 15, 15, 15], // Margens em mm (topo, esquerda, baixo, direita)
        filename: 'plano_de_aula_com_atividades.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, // Melhora a resolução
            useCORS: true,
            letterRendering: true,
            scrollY: 0 // Evita bugs de rolagem na captura
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        },
        // Garante que o KaTeX seja renderizado antes de tirar o "print"
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    // Mostra um aviso visual
    const btn = event.target;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '⏳ Gerando PDF...';
    btn.disabled = true;
    
    // Gera e baixa o PDF
    html2pdf().set(opt).from(elemento).save().then(() => {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        alert("❌ Erro ao gerar PDF. Tente novamente.");
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    });
}