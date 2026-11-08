// ========================================================================
// 📋 GESTÃO
// ========================================================================
async function carregarListaUsuarios() {
    const container = document.getElementById('listaUsuariosGestao');
    if (!token || !userEmail) { container.innerHTML = '<p style="text-align:center; color:#999;">Faça login para acessar.</p>'; return; }
    
    const EMAIL_ADMIN_MASTER = 'jonasmatematico@yahoo.com.br';
    if (userEmail !== EMAIL_ADMIN_MASTER) { 
        container.innerHTML = '<div style="padding:20px; background:#ffe6e6; border:1px solid #dc3545; border-radius:8px; text-align:center;"><strong>🚫 Acesso Negado</strong><br>Você não é administrador deste sistema.</div>'; 
        return; 
    }
    
    container.innerHTML = '<p style="text-align:center; color:#666;">⏳ Carregando lista de usuários...</p>';
    
    try {
        // 🚨 ALTERAÇÃO 1: Adicionado 'modulos_ativos' no select para o sistema saber o que o usuário tem
        var r = await sbFetch('GET', '/rest/v1/perfis?select=id,nome_completo,email,tipo_usuario,turmas_ids,modulos_ativos&order=created_at.desc');
        
        if (!r.ok) throw new Error('Erro no servidor (' + r.status + ').');
        var usuarios = await r.json();
        
        if (!Array.isArray(usuarios)) throw new Error('Formato de dados inválido.');
        if (usuarios.length === 0) { container.innerHTML = '<p style="text-align:center; color:#888;">Nenhum usuário cadastrado além do Admin.</p>'; return; }
        
        var html = '<table style="width:100%; border-collapse: collapse; font-size: 13px; margin-top:10px;"><thead><tr style="background:#f5f5f5; border-bottom:2px solid #ddd;"><th style="padding:10px; text-align:left;">Nome</th><th style="padding:10px; text-align:left;">E-mail</th><th style="padding:10px; text-align:center;">Tipo</th><th style="padding:10px; text-align:center;">Turmas</th><th style="padding:10px; text-align:center;">Ações</th></tr></thead><tbody>';
        
        usuarios.forEach(function(u) {
            var corBadge = u.tipo_usuario === 'admin' ? '#dc3545' : '#28a745';
            var qtdTurmas = Array.isArray(u.turmas_ids) ? u.turmas_ids.length : 0;
            
            html += '<tr style="border-bottom:1px solid #eee;">';
            html += '<td style="padding:10px;"><strong>' + (u.nome_completo || 'Sem Nome') + '</strong></td>';
            html += '<td style="padding:10px;">' + u.email + '</td>';
            html += '<td style="padding:10px; text-align:center;"><span style="background:' + corBadge + '; color:white; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold;">' + u.tipo_usuario.toUpperCase() + '</span></td>';
            html += '<td style="padding:10px; text-align:center;">' + qtdTurmas + '</td>';
            
            if (u.tipo_usuario !== 'admin') {
                // 🚨 ALTERAÇÃO 2: Atualizado o onclick para chamar abrirEditorPerfil e passar os dois arrays
                var turmasJson = JSON.stringify(u.turmas_ids || []);
                var modulosJson = JSON.stringify(u.modulos_ativos || []);
                
                html += '<td style="padding:10px; text-align:center;">';
                html += '<button class="btn btn-sm btn-warn" onclick="abrirEditorPerfil(\'' + u.id + '\', \'' + u.email + '\', ' + turmasJson + ', ' + modulosJson + ')">⚙️ Editar Permissões</button>';
                html += '</td>';
            } else {
                html += '<td style="padding:10px; text-align:center;"><small style="color:#999;">Full Access</small></td>';
            }
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch(e) { 
        container.innerHTML = '<div style="padding:15px; background:#fff3cd; border:1px solid #ffc107; border-radius:6px; color:#856404;"><strong>⚠️ Atenção:</strong><br>' + e.message + '</div>'; 
    }
}

var usuarioEmEdicaoId = null;
// ========================================================================
// ⚙️ GERENCIAMENTO DE PERFIL: TURMAS + MÓDULOS
// ========================================================================

var usuarioEmEdicaoId = null;

// Lista oficial de todos os módulos que o sistema possui (usado para gerar os checkboxes)
const TODOS_OS_MODULOS = [
    { id: 'dissertativa', nome: '📝 Provas Abertas' },
    { id: 'objetiva', nome: '✅ Provas Objetivas' },
    { id: 'diagnostico', nome: '📊 Diagnóstico' },
    { id: 'planilha', nome: '📋 Planilha' },
    { id: 'corretor', nome: '✏️ Corretor Manual' },
    { id: 'qr', nome: '🔲 QR Codes' },
    { id: 'omr', nome: '📝 Correção OMR' },
    { id: 'ia_geral', nome: '🤖 Assistente IA' },
    { id: 'gestao', nome: '👥 Gestão (Admin)' }
];

async function abrirEditorPerfil(userId, userEmail, currentTurmasIds, currentModulos) {
    usuarioEmEdicaoId = userId;
    document.getElementById('nomeUsuarioEditando').textContent = userEmail.split('@')[0]; // Pega o nome antes do @
    document.getElementById('emailUsuarioEditando').textContent = userEmail;

    // 1. RENDERIZAR MÓDULOS
    const containerModulos = document.getElementById('listaModulosCheckbox');
    containerModulos.innerHTML = '';
    
    // Garante que currentModulos seja um array (tratando formato do Supabase)
    let modulosArray = [];
    if (Array.isArray(currentModulos)) {
        modulosArray = currentModulos;
    } else if (typeof currentModulos === 'string') {
        modulosArray = currentModulos.replace(/[{}]/g, '').split(',').map(s => s.trim());
    }

    TODOS_OS_MODULOS.forEach(mod => {
        const isChecked = modulosArray.includes(mod.id) ? 'checked' : '';
        containerModulos.innerHTML += `
            <label style="display:flex; align-items:center; gap:6px; padding:6px; background:#fff; border:1px solid #eee; border-radius:4px; cursor:pointer; font-size:13px;">
                <input type="checkbox" class="chk-modulo" value="${mod.id}" ${isChecked} style="width:auto; accent-color:#008080;">
                <span>${mod.nome}</span>
            </label>
        `;
    });

    // 2. RENDERIZAR TURMAS (Reutilizando a lógica segura que já funcionava)
    const containerTurmas = document.getElementById('listaTurmasCheckbox');
    containerTurmas.innerHTML = '<p style="text-align:center; color:#666;">⏳ Carregando lista de turmas...</p>';
    
    try {
        const r = await supabase.from('turmas').select('id, nome').order('nome');
        const todasAsTurmas = r.data || [];
        
        let htmlTurmas = '';
        todasAsTurmas.forEach(function(turma) {
            const isChecked = currentTurmasIds.includes(turma.id) ? 'checked' : '';
            htmlTurmas += `<label style="display:flex; align-items:center; gap:8px; padding:8px; border-bottom:1px solid #eee; cursor:pointer;">
                <input type="checkbox" class="chk-turma" value="${turma.id}" ${isChecked} style="width:auto; accent-color:#008080;">
                <span style="font-weight:500;">${turma.nome}</span>
                <small style="color:#999; margin-left:auto;">ID: ${turma.id}</small>
            </label>`;
        });
        containerTurmas.innerHTML = htmlTurmas || '<p style="text-align:center; color:#999;">Nenhuma turma cadastrada no sistema.</p>';
        
        // Abre o modal (usando o novo ID)
        document.getElementById('modalEditPerfil').classList.add('active');
        
    } catch(e) { 
        containerTurmas.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar turmas: ' + e.message + '</p>'; 
    }
}

async function salvarPerfilCompleto() {
    if (!usuarioEmEdicaoId) {
        toast('Erro: Usuário não identificado.', 'error');
        return;
    }

    const btnSalvar = document.getElementById('btnSalvarPerfil');
    btnSalvar.innerText = '⏳ Salvando...';
    btnSalvar.disabled = true;

    try {
        // 1. Coletar Módulos Marcados (Array de Strings)
        const checkboxesModulos = document.querySelectorAll('.chk-modulo:checked');
        const modulosSelecionados = Array.from(checkboxesModulos).map(cb => cb.value);

        // 2. Coletar Turmas Marcadas (Array de Números Inteiros)
        const checkboxesTurmas = document.querySelectorAll('.chk-turma:checked');
        const turmasSelecionadas = Array.from(checkboxesTurmas).map(cb => parseInt(cb.value));

        // 3. ATUALIZAR NO SUPABASE (As duas colunas de uma vez!)
        const { error } = await supabase
            .from('perfis')
            .update({ 
                modulos_ativos: modulosSelecionados, 
                turmas_ids: turmasSelecionadas 
            })
            .eq('id', usuarioEmEdicaoId);

        if (error) throw new Error(error.message);

        toast('✅ Permissões e turmas atualizadas com sucesso!', 'success');
        fecharModal('modalEditPerfil');
        
        // Recarrega a lista de usuários na tela para refletir mudanças (se houver essa função)
        if (typeof carregarUsuariosGestao === 'function') {
            carregarUsuariosGestao();
        }

    } catch (e) {
        console.error('Erro ao salvar perfil:', e);
        toast('❌ Erro ao salvar: ' + e.message, 'error');
    } finally {
        btnSalvar.innerText = '💾 SALVAR ALTERAÇÕES';
        btnSalvar.disabled = false;
        usuarioEmEdicaoId = null;
    }
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