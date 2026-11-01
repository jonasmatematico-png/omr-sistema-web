// ========================================================================
// 🔲 QR CODES
// ========================================================================
function mudarAbaQR(aba) {
    ['abaQRProva', 'abaQRAluno', 'abaQRCartoes'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    document.querySelectorAll('#view-qr .ia-tab').forEach(function(btn) { btn.classList.remove('active'); });
    var idAlvo = aba === 'prova' ? 'abaQRProva' : aba === 'aluno' ? 'abaQRAluno' : 'abaQRCartoes';
    var alvo = document.getElementById(idAlvo);
    if (alvo) alvo.classList.remove('hidden');
    if (window.event && window.event.target) window.event.target.classList.add('active');
    var areaQR = document.getElementById('areaQR');
    if (areaQR) areaQR.innerHTML = '';
    var areaCartoes = document.getElementById('areaCartoes');
    if (areaCartoes) areaCartoes.innerHTML = '';
}

async function gerarQRProva() {
    var provaId = document.getElementById('selProvaQR').value;
    var area = document.getElementById('areaQR');
    if (!provaId) { alert('⚠️ Selecione uma prova primeiro!'); return; }
    var r = await sbFetch('GET', '/rest/v1/avaliacoes?id=eq.' + provaId + '&select=nome');
    var dados = await r.json();
    var nomeProva = dados[0] ? dados[0].nome : 'Prova ' + provaId;
    var qrData = 'OMRPROVA:' + provaId;
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qrData);
    area.innerHTML = '<div style="text-align: center; padding: 20px;"><h3 style="color: #333; margin-bottom: 16px;">📋 ' + nomeProva + '</h3><img src="' + qrUrl + '" alt="QR Code da Prova" style="border: 2px solid #008080; border-radius: 8px; padding: 10px; background: white;"><br><br><a href="' + qrUrl + '" download="qr_prova_' + provaId + '.png" class="btn btn-primary">📥 Baixar QR Code</a></div>';
}

async function carregarAlunosQR() {
    var turmaId = document.getElementById('selTurmaQR').value;
    var selAluno = document.getElementById('selAlunoQR');
    if (!selAluno) return;
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

async function gerarQRAluno() {
    var alunoId = document.getElementById('selAlunoQR').value;
    var provaId = document.getElementById('selProvaQRAluno').value;
    var area = document.getElementById('areaQR');
    if (!alunoId) { alert('⚠️ Selecione um aluno primeiro!'); return; }
    var rAluno = await sbFetch('GET', '/rest/v1/alunos?id=eq.' + alunoId + '&select=nome_completo,numero_chamada');
    var dadosAluno = (await rAluno.json())[0];
    var nomeAluno = dadosAluno ? (dadosAluno.numero_chamada + '. ' + dadosAluno.nome_completo) : 'Aluno';
    var qrData = provaId ? 'OMRALUNO:' + provaId + ':' + alunoId : 'OMRCARD:' + alunoId;
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qrData);
    area.innerHTML = '<div style="text-align: center; padding: 20px;"><h3 style="color: #333; margin-bottom: 16px;">👤 ' + nomeAluno + '</h3><p style="color: #666; font-size: 14px;">' + (provaId ? 'Vinculado à Prova' : 'QR Genérico do Aluno') + '</p><img src="' + qrUrl + '" alt="QR Code do Aluno" style="border: 2px solid #667eea; border-radius: 8px; padding: 10px; background: white; margin: 16px 0;"><br><a href="' + qrUrl + '" download="qr_aluno_' + alunoId + '.png" class="btn btn-primary">📥 Baixar QR Code</a></div>';
}

async function gerarCartoes() {
    var turmaId = document.getElementById('selTurmaCartoes').value;
    var provaId = document.getElementById('selProvaCartoes').value;
    var area = document.getElementById('areaCartoes');
    if (!turmaId) { alert('⚠️ Selecione uma turma primeiro!'); return; }
    area.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">⏳ Gerando cartões...</p>';
    try {
        var rTurma = await sbFetch('GET', '/rest/v1/turmas?id=eq.' + turmaId + '&select=nome');
        var dadosTurma = (await rTurma.json())[0];
        var nomeTurma = dadosTurma ? dadosTurma.nome : 'Turma';
        var rAlunos = await sbFetch('GET', '/rest/v1/alunos?id_turma=eq.' + turmaId + '&select=id,nome_completo,numero_chamada&order=numero_chamada.asc');
        var alunos = await rAlunos.json();
        if (!alunos || alunos.length === 0) { area.innerHTML = '<p style="text-align: center; color: #dc3545; grid-column: 1/-1;">⚠️ Nenhum aluno nesta turma.</p>'; return; }
        var html = '';
        alunos.forEach(function(a) {
            var qrData = provaId ? 'OMRALUNO:' + provaId + ':' + a.id : 'OMRCARD:' + a.id;
            var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(qrData);
            html += '<div style="background: white; padding: 16px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #eee;"><img src="' + qrUrl + '" alt="QR" style="width: 120px; height: 120px; margin-bottom: 8px;"><div style="font-size: 14px; font-weight: 600; color: #333;">' + (a.numero_chamada || '') + '. ' + (a.nome_completo || 'Sem nome') + '</div><div style="font-size: 12px; color: #666; margin-top: 4px;">' + nomeTurma + '</div></div>';
        });
        html += '<div style="grid-column: 1/-1; text-align: center; margin-top: 20px;"><button class="btn btn-primary" onclick="window.print()">🖨️ IMPRIMIR CARTÕES</button></div>';
        area.innerHTML = html;
    } catch(e) { area.innerHTML = '<p style="text-align: center; color: #dc3545; grid-column: 1/-1;">❌ Erro: ' + e.message + '</p>'; }
}

async function carregarSelectsQR() {
    await carregarTurmasPermitidas('selTurmaQR');
    await carregarTurmasPermitidas('selTurmaCartoes');
    try {
        var rp = await sbFetch('GET', '/rest/v1/avaliacoes?select=id,nome,modo_correcao&order=id.desc');
        var provas = await rp.json();
        var selProvaQR = document.getElementById('selProvaQR');
        if (selProvaQR) {
            selProvaQR.innerHTML = provas.map(function (p) {
                var tag = p.modo_correcao === 'aberta' ? ' (aberta)' : ' (múltipla escolha)';
                return '<option value="' + p.id + '">' + p.nome + tag + '</option>';
            }).join('');
        }
        var selProvaCartoes = document.getElementById('selProvaCartoes');
        if (selProvaCartoes) {
            selProvaCartoes.innerHTML = '<option value="">Nenhuma (QR genérico)</option>' + provas.map(function (p) { return '<option value="' + p.id + '">' + p.nome + '</option>'; }).join('');
        }
        var selProvaQRAluno = document.getElementById('selProvaQRAluno');
        if (selProvaQRAluno) {
            selProvaQRAluno.innerHTML = '<option value="">Nenhuma (QR genérico)</option>' + provas.map(function (p) { return '<option value="' + p.id + '">' + p.nome + '</option>'; }).join('');
        }
    } catch (e) { console.error("❌ [QR] Erro ao carregar provas:", e); }
}

function mostrarQR(id, nome) {
    var dados = 'OMRPROVA:' + id;
    var url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(dados);
    document.getElementById('qrNome').textContent = 'Prova: ' + nome;
    document.getElementById('qrImg').src = url;
    document.getElementById('qrLink').href = url;
    document.getElementById('modalQR').classList.add('active');
}