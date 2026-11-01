// ========================================================================
// 📋 GESTÃO
// ========================================================================
async function carregarListaUsuarios() {
    const container = document.getElementById('listaUsuariosGestao');
    if (!token || !userEmail) { container.innerHTML = '<p style="text-align:center; color:#999;">Faça login para acessar.</p>'; return; }
    const EMAIL_ADMIN_MASTER = 'jonasmatematico@yahoo.com.br';
    if (userEmail !== EMAIL_ADMIN_MASTER) { container.innerHTML = '<div style="padding:20px; background:#ffe6e6; border:1px solid #dc3545; border-radius:8px; text-align:center;"><strong>🚫 Acesso Negado</strong><br>Você não é administrador deste sistema.</div>'; return; }
    container.innerHTML = '<p style="text-align:center; color:#666;">⏳ Carregando lista de usuários...</p>';
    try {
        var r = await sbFetch('GET', '/rest/v1/perfis?select=id,nome_completo,email,tipo_usuario,turmas_id&order=created_at.desc');
        if (!r.ok) throw new Error('Erro no servidor (' + r.status + ').');
        var usuarios = await r.json();
        if (!Array.isArray(usuarios)) throw new Error('Formato de dados inválido.');
        if (usuarios.length === 0) { container.innerHTML = '<p style="text-align:center; color:#888;">Nenhum usuário cadastrado além do Admin.</p>'; return; }
        var html = '<table style="width:100%; border-collapse: collapse; font-size: 13px; margin-top:10px;"><thead><tr style="background:#f5f5f5; border-bottom:2px solid #ddd;"><th style="padding:10px; text-align:left;">Nome</th><th style="padding:10px; text-align:left;">E-mail</th><th style="padding:10px; text-align:center;">Tipo</th><th style="padding:10px; text-align:center;">Turmas</th><th style="padding:10px; text-align:center;">Ações</th></tr></thead><tbody>';
        usuarios.forEach(function(u) {
            var corBadge = u.tipo_usuario === 'admin' ? '#dc3545' : '#28a745';
            var qtdTurmas = Array.isArray(u.turmas_id) ? u.turmas_id.length : 0;
            html += '<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;"><strong>' + (u.nome_completo || 'Sem Nome') + '</strong></td><td style="padding:10px;">' + u.email + '</td><td style="padding:10px; text-align:center;"><span style="background:' + corBadge + '; color:white; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold;">' + u.tipo_usuario.toUpperCase() + '</span></td><td style="padding:10px; text-align:center;">' + qtdTurmas + '</td>';
            if (u.tipo_usuario !== 'admin') html += '<td style="padding:10px; text-align:center;"><button class="btn btn-sm btn-warn" onclick="abrirEditorTurmas(\'' + u.id + '\', \'' + u.email + '\', ' + JSON.stringify(u.turmas_id || []) + ')">✏️ Editar Turmas</button></td>';
            else html += '<td style="padding:10px; text-align:center;"><small style="color:#999;">Full Access</small></td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<div style="padding:15px; background:#fff3cd; border:1px solid #ffc107; border-radius:6px; color:#856404;"><strong>⚠️ Atenção:</strong><br>' + e.message + '</div>'; }
}

var usuarioEmEdicaoId = null;
async function abrirEditorTurmas(userId, userEmail, currentTurmasIds) {
    usuarioEmEdicaoId = userId;
    var container = document.getElementById('listaTurmasCheckbox');
    container.innerHTML = '<p style="text-align:center; color:#666;">⏳ Carregando lista de turmas...</p>';
    try {
        var r = await sbFetch('GET', '/rest/v1/turmas?select=id,nome&order=nome.asc');
        var todasAsTurmas = await r.json();
        if (!Array.isArray(todasAsTurmas)) throw new Error("Erro ao buscar turmas");
        var html = '';
        todasAsTurmas.forEach(function(turma) {
            var isChecked = currentTurmasIds.includes(turma.id) ? 'checked' : '';
            html += '<label style="display:flex; align-items:center; gap:8px; padding:8px; border-bottom:1px solid #eee; cursor:pointer;"><input type="checkbox" class="chk-turma" value="' + turma.id + '" ' + isChecked + ' style="width:auto; accent-color:#008080;"><span style="font-weight:500;">' + turma.nome + '</span><small style="color:#999; margin-left:auto;">ID: ' + turma.id + '</small></label>';
        });
        container.innerHTML = html;
        document.getElementById('modalEditTurmas').classList.add('active');
    } catch(e) { container.innerHTML = '<p style="color:red; text-align:center;">Erro: ' + e.message + '</p>'; }
}

async function salvarEdicaoTurmas() {
    if (!usuarioEmEdicaoId) { toast('Nenhum usuário selecionado!', 'error'); return; }
    var btn = document.getElementById('btnSalvarTurmas');
    btn.textContent = '⏳ Salvando...'; btn.disabled = true;
    var checkboxes = document.querySelectorAll('.chk-turma:checked');
    var novosIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    try {
        var payload = { turmas_id: novosIds };
        var r = await sbFetch('PATCH', '/rest/v1/perfis?id=eq.' + usuarioEmEdicaoId, payload);
        if (!r.ok) { var erro = await r.json(); throw new Error(erro.message || 'Falha ao salvar'); }
        toast('✅ Acesso às turmas atualizado com sucesso!', 'success');
        fecharModal('modalEditTurmas');
        carregarListaUsuarios();
    } catch(e) { toast('❌ Erro: ' + e.message, 'error'); }
    finally { btn.textContent = '💾 SALVAR ALTERAÇÕES'; btn.disabled = false; }
}

async function cadastrarProfessorViaAPI() {
    var nome = document.getElementById('gestaoNome').value.trim();
    var email = document.getElementById('gestaoEmail').value.trim();
    var senha = document.getElementById('gestaoSenha').value.trim();
    var tipo = document.getElementById('gestaoTipo').value;
    if (!nome || !email || !senha) { toast('❌ Preencha Nome, E-mail e Senha!', 'error'); return; }
    if (senha.length < 6) { toast('❌ A senha deve ter no mínimo 6 caracteres.', 'error'); return; }
    var btn = event.target;
    var textoOriginal = btn.innerHTML;
    btn.innerHTML = '⏳ Cadastrando...'; btn.disabled = true;
    try {
        const response = await fetch(API_BASE_URL + '/api/criar-professor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nome, email: email, senha: senha, tipo_usuario: tipo }) });
        const data = await response.json();
        if (response.ok && data.sucesso) {
            toast('✅ ' + data.message, 'success');
            document.getElementById('gestaoNome').value = '';
            document.getElementById('gestaoEmail').value = '';
            document.getElementById('gestaoSenha').value = '';
            await carregarListaUsuarios();
        } else { throw new Error(data.erro || 'Erro desconhecido ao cadastrar.'); }
    } catch(e) { toast('❌ Erro: ' + e.message, 'error'); }
    finally { btn.innerHTML = textoOriginal; btn.disabled = false; }
}