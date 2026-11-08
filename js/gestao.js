// ========================================================================
// 📋 GESTÃO DE USUÁRIOS E PERMISSÕES (TURMAS + MÓDULOS)
// ========================================================================

var usuarioEmEdicaoId = null;

// Lista oficial de todos os módulos que o sistema possui
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

// 1. CARREGA A LISTA DE USUÁRIOS NA TELA
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
        // Busca apenas o básico para montar a tabela. Os detalhes são buscados ao clicar em "Editar"
        var r = await sbFetch('GET', '/rest/v1/perfis?select=id,nome_completo,email,tipo_usuario&order=created_at.desc');
        if (!r.ok) throw new Error('Erro no servidor (' + r.status + ').');
        var usuarios = await r.json();
        
        if (!Array.isArray(usuarios)) throw new Error('Formato de dados inválido.');
        if (usuarios.length === 0) { container.innerHTML = '<p style="text-align:center; color:#888;">Nenhum usuário cadastrado além do Admin.</p>'; return; }
        
        var html = '<table style="width:100%; border-collapse: collapse; font-size: 13px; margin-top:10px;"><thead><tr style="background:#f5f5f5; border-bottom:2px solid #ddd;"><th style="padding:10px; text-align:left;">Nome</th><th style="padding:10px; text-align:left;">E-mail</th><th style="padding:10px; text-align:center;">Tipo</th><th style="padding:10px; text-align:center;">Ações</th></tr></thead><tbody>';
        
        usuarios.forEach(function(u) {
            var corBadge = u.tipo_usuario === 'admin' ? '#dc3545' : '#28a745';
            
            html += '<tr style="border-bottom:1px solid #eee;">';
            html += '<td style="padding:10px;"><strong>' + (u.nome_completo || 'Sem Nome') + '</strong></td>';
            html += '<td style="padding:10px;">' + u.email + '</td>';
            html += '<td style="padding:10px; text-align:center;"><span style="background:' + corBadge + '; color:white; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold;">' + u.tipo_usuario.toUpperCase() + '</span></td>';
            
            if (u.tipo_usuario !== 'admin') {
                // 🚨 SEGREDO: Passa apenas ID e Email. A função abrirEditorPerfil busca os dados frescos no Supabase.
                html += '<td style="padding:10px; text-align:center;">';
                html += '<button class="btn btn-sm btn-warn" onclick="abrirEditorPerfil(\'' + u.id + '\', \'' + u.email + '\')">⚙️ Editar Permissões</button>';
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

// 2. ABRE O MODAL E BUSCA OS DADOS FRESCOS (TURMAS + MÓDULOS)
async function abrirEditorPerfil(userId, userEmail) {
    usuarioEmEdicaoId = userId;
    document.getElementById('nomeUsuarioEditando').textContent = userEmail.split('@')[0];
    document.getElementById('emailUsuarioEditando').textContent = userEmail;

    // Busca direta e segura no Supabase
    const { data: perfilData, error: fetchError } = await supabase
        .from('perfis')
        .select('turmas_ids, modulos_ativos')
        .eq('id', userId)
        .single();

    if (fetchError) {
        console.error("Erro ao buscar perfil:", fetchError);
        toast('Erro ao carregar dados do usuário', 'error');
        return;
    }

    // Normaliza Módulos (lida com null, string "{a,b}" ou array ["a","b"])
    let modulosArray = [];
    if (perfilData && perfilData.modulos_ativos) {
        if (Array.isArray(perfilData.modulos_ativos)) modulosArray = perfilData.modulos_ativos;
        else if (typeof perfilData.modulos_ativos === 'string') modulosArray = perfilData.modulos_ativos.replace(/[{}]/g, '').split(',').map(s => s.trim());
    }

    // Normaliza Turmas
    let turmasArray = [];
    if (perfilData && perfilData.turmas_ids) {
        if (Array.isArray(perfilData.turmas_ids)) turmasArray = perfilData.turmas_ids;
        else if (typeof perfilData.turmas_ids === 'string') turmasArray = perfilData.turmas_ids.replace(/[{}]/g, '').split(',').map(s => parseInt(s.trim()));
    }

    // Renderiza Checkboxes de Módulos
    const containerModulos = document.getElementById('listaModulosCheckbox');
    containerModulos.innerHTML = '';
    TODOS_OS_MODULOS.forEach(mod => {
        const isChecked = modulosArray.includes(mod.id) ? 'checked' : '';
        containerModulos.innerHTML += `
            <label style="display:flex; align-items:center; gap:6px; padding:6px; background:#fff; border:1px solid #eee; border-radius:4px; cursor:pointer; font-size:13px;">
                <input type="checkbox" class="chk-modulo" value="${mod.id}" ${isChecked} style="width:auto; accent-color:#008080;">
                <span>${mod.nome}</span>
            </label>`;
    });

    // Renderiza Checkboxes de Turmas
    const containerTurmas = document.getElementById('listaTurmasCheckbox');
    containerTurmas.innerHTML = '<p style="text-align:center; color:#666;">⏳ Carregando turmas...</p>';
    
    try {
        const r = await supabase.from('turmas').select('id, nome').order('nome');
        const todasAsTurmas = r.data || [];
        
        let htmlTurmas = '';
        todasAsTurmas.forEach(function(turma) {
            const isChecked = turmasArray.includes(turma.id) ? 'checked' : '';
            htmlTurmas += `<label style="display:flex; align-items:center; gap:8px; padding:8px; border-bottom:1px solid #eee; cursor:pointer;">
                <input type="checkbox" class="chk-turma" value="${turma.id}" ${isChecked} style="width:auto; accent-color:#008080;">
                <span style="font-weight:500;">${turma.nome}</span>
                <small style="color:#999; margin-left:auto;">ID: ${turma.id}</small>
            </label>`;
        });
        containerTurmas.innerHTML = htmlTurmas || '<p style="text-align:center; color:#999;">Nenhuma turma no sistema.</p>';
        
        // Abre o modal (ID atualizado para modalEditPerfil)
        document.getElementById('modalEditPerfil').classList.add('active');
        
    } catch(e) { 
        containerTurmas.innerHTML = '<p style="color:red; text-align:center;">Erro: ' + e.message + '</p>'; 
    }
}

// 3. SALVA AS ALTERAÇÕES NO SUPABASE
async function salvarPerfilCompleto() {
    if (!usuarioEmEdicaoId) {
        toast('Erro: Usuário não identificado.', 'error');
        return;
    }

    const btnSalvar = document.getElementById('btnSalvarPerfil');
    btnSalvar.innerText = '⏳ Salvando...';
    btnSalvar.disabled = true;

    try {
        // Coleta Módulos Marcados
        const checkboxesModulos = document.querySelectorAll('.chk-modulo:checked');
        const modulosSelecionados = Array.from(checkboxesModulos).map(cb => cb.value);

        // Coleta Turmas Marcadas
        const checkboxesTurmas = document.querySelectorAll('.chk-turma:checked');
        const turmasSelecionadas = Array.from(checkboxesTurmas).map(cb => parseInt(cb.value));

        console.log("📦 Enviando para o Supabase:", { id: usuarioEmEdicaoId, modulos: modulosSelecionados, turmas: turmasSelecionadas });

        // Atualiza no Supabase
        const { data, error } = await supabase
            .from('perfis')
            .update({ 
                modulos_ativos: modulosSelecionados, 
                turmas_ids: turmasSelecionadas 
            })
            .eq('id', usuarioEmEdicaoId)
            .select();

        if (error) {
            console.error("❌ Erro do Supabase ao salvar:", error);
            throw new Error(error.message);
        }

        console.log("✅ Salvo com sucesso:", data);
        toast('✅ Permissões e turmas atualizadas com sucesso!', 'success');
        fecharModal('modalEditPerfil');
        
        // Recarrega a tabela de usuários
        carregarListaUsuarios();

    } catch (e) {
        console.error('Erro ao salvar perfil:', e);
        toast('❌ Erro ao salvar: ' + e.message, 'error');
    } finally {
        btnSalvar.innerText = '💾 SALVAR ALTERAÇÕES';
        btnSalvar.disabled = false;
        usuarioEmEdicaoId = null;
    }
}

// 4. CADASTRAR NOVO PROFESSOR (MANTIDA INTACTA, POIS JÁ ESTAVA PERFEITA)
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
        const response = await fetch(API_BASE_URL + '/api/criar-professor', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ nome: nome, email: email, senha: senha, tipo_usuario: tipo }) 
        });
        const data = await response.json();
        
        if (response.ok && data.sucesso) {
            toast('✅ ' + data.message, 'success');
            document.getElementById('gestaoNome').value = '';
            document.getElementById('gestaoEmail').value = '';
            document.getElementById('gestaoSenha').value = '';
            await carregarListaUsuarios();
        } else { 
            throw new Error(data.erro || 'Erro desconhecido ao cadastrar.'); 
        }
    } catch(e) { 
        toast('❌ Erro: ' + e.message, 'error'); 
    } finally { 
        btn.innerHTML = textoOriginal; 
        btn.disabled = false; 
    }
}