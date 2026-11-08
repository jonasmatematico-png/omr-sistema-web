// ========================================================================
// 🔐 SEÇÃO: AUTENTICAÇÃO E SESSÃO (auth.js)
// ========================================================================

function trocarTab(tab) {
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function (t) { t.classList.remove('active'); });
    if (tab === 'login') { 
        tabs[0].classList.add('active'); 
        document.getElementById('loginForm').classList.remove('hidden'); 
        document.getElementById('signupForm').classList.add('hidden'); 
    } else { 
        tabs[1].classList.add('active'); 
        document.getElementById('loginForm').classList.add('hidden'); 
        document.getElementById('signupForm').classList.remove('hidden'); 
    }
}

function guardarSessao(j) {
    token = j.access_token;
    refreshToken = j.refresh_token;
    userEmail = j.user.email;
    localStorage.setItem('sb_token', token);
    localStorage.setItem('sb_refresh', refreshToken);
    localStorage.setItem('sb_email', userEmail);
    if (j.user && j.user.id) {
        localStorage.setItem('sb_uid', j.user.id);
    }
}

async function refrescarSessao() {
    if (!refreshToken) return false;
    try {
        var r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', { 
            method: 'POST', 
            headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ refresh_token: refreshToken }) 
        });
        if (!r.ok) return false;
        var j = await r.json();
        if (j.access_token) { guardarSessao(j); return true; }
        return false;
    } catch (e) { return false; }
}

async function fazerLogin() {
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    if (!email || !password) { toast('Preencha e-mail e senha', 'error'); return; }
    try {
        var r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', { 
            method: 'POST', 
            headers: headersCom(null), 
            body: JSON.stringify({ email: email, password: password }) 
        });
        var j = await r.json();
        if (!r.ok) { toast('Erro: ' + msgErro(j), 'error'); return; }
        guardarSessao(j); 
        toast('Bem-vindo!', 'success'); 
        mostrarPrincipal(userEmail);
    } catch (e) { toast('Falha de conexão: ' + e.message, 'error'); }
}

async function criarConta() {
    var email = document.getElementById('signupEmail').value.trim();
    var password = document.getElementById('signupPassword').value;
    if (!email || !password) { toast('Preencha e-mail e senha', 'error'); return; }
    if (password.length < 6) { toast('Senha mínima: 6 caracteres', 'error'); return; }
    try {
        var r = await fetch(SUPABASE_URL + '/auth/v1/signup', { 
            method: 'POST', 
            headers: headersCom(null), 
            body: JSON.stringify({ email: email, password: password }) 
        });
        var j = await r.json();
        if (!r.ok) { toast('Erro: ' + msgErro(j), 'error'); return; }
        if (j.access_token) { 
            guardarSessao(j); 
            toast('Conta criada e logada!', 'success'); 
            mostrarPrincipal(userEmail); 
        } else { 
            toast('Conta criada! Verifique seu e-mail.', 'info'); 
        }
    } catch (e) { toast('Falha de conexão: ' + e.message, 'error'); }
}

function sair() { 
    localStorage.removeItem('sb_token'); 
    localStorage.removeItem('sb_refresh'); 
    localStorage.removeItem('sb_email'); 
    location.reload(); 
}

async function mostrarPrincipal(email) {
    // ✅ ALERTA REMOVIDO PARA UMA EXPERIÊNCIA MAIS LIMPA!
    
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userAvatar').textContent = email.charAt(0).toUpperCase();
    
    let modulosAtivos = [];

    try {
        // Tenta buscar do backend, mas se falhar (erro 500), não quebra o sistema
        const response = await fetch(`${API_BASE_URL}/api/perfil?email=${encodeURIComponent(emailFinal)}`);
        
        if (response.ok) {
            const resultado = await response.json();
            if (resultado.sucesso && resultado.perfil && resultado.perfil.modulos_ativos) {
                modulosAtivos = resultado.perfil.modulos_ativos;
            }
        } else {
            console.warn("⚠️ Backend retornou erro ao buscar perfil. Usando modo de fallback.");
        }
    } catch (e) {
        console.error("Erro na comunicação com o backend de perfil:", e);
    }

    // Aplica as permissões passando o emailFinal garantido
    aplicarPermissoesNoMenu(modulosAtivos, emailFinal);

    // Carrega o resto do sistema
    navegarPara('view-provas', document.querySelector('.menu-item'));
    novoForm();
    carregarProvas();
    carregarSelectsQR();
    carregarTurmasDiagnostico();
    carregarSelectsPlanilha();
    carregarSelectsCorretor();
    carregarProvasObj();
    carregarSelectsDiagnosticoDireto(); 
}

function aplicarPermissoesNoMenu(modulosRaw, emailUsuario) {
    console.log("🔍 DEBUG - Email final:", emailUsuario);
    console.log("🔍 DEBUG - Módulos recebidos:", modulosRaw);

    // 🚨 REGRA DE OURO ABSOLUTA: Se for o gestor, libera TUDO e nem pergunta pro backend
    const emailGestorMaster = 'jonasmatematico@yahoo.com.br';
    if (emailUsuario && emailUsuario.toLowerCase().trim() === emailGestorMaster.toLowerCase().trim()) {
        console.log("🔓 MODO GESTOR MASTER ATIVADO! Acesso total garantido.");
        return; // Sai da função, não esconde NADA
    }

    // Normaliza os dados (caso venha como string do Supabase)
    let modulos = [];
    if (Array.isArray(modulosRaw)) {
        modulos = modulosRaw;
    } else if (typeof modulosRaw === 'string') {
        modulos = modulosRaw.replace(/[{}]/g, '').split(',').map(s => s.trim().toLowerCase());
    }

    if (modulos.includes('admin') || modulos.includes('todos')) {
        console.log("🔓 MODO ADMIN/TODOS ATIVADO!");
        return;
    }

    // Aplica o bloqueio para usuários normais
    const itensMenu = document.querySelectorAll('.menu-item[data-modulo]');
    itensMenu.forEach(item => {
        const moduloDoBotao = item.getAttribute('data-modulo').toLowerCase();
        if (!modulos.includes(moduloDoBotao)) {
            item.style.display = 'none';
        }
    });

    const fabIa = document.querySelector('.fab-ia');
    if (fabIa && !modulos.includes('ia_geral') && !modulos.includes('ia')) {
        fabIa.style.display = 'none';
    }
}

// 🆕 NOVA FUNÇÃO: Carrega Provas e Turmas de forma SEGURA (COM TIMEOUT DE 15s)
async function carregarSelectsDiagnosticoDireto() {
    // 1. Carregar Provas (Continua direto do Supabase - é rápido)
    const selProva = document.getElementById('selectAvaliacao');
    if (selProva) {
        try {
            const { data: provas, error } = await supabase.from('avaliacoes').select('id, nome').order('id', { ascending: false });
            selProva.innerHTML = '<option value="">-- Escolha uma prova --</option>';
            if (!error && provas) {
                provas.forEach(av => { selProva.innerHTML += `<option value="${av.id}">${av.nome}</option>`; });
            }
        } catch (e) {
            console.error("Erro ao carregar provas:", e);
        }
    }
    
    // 2. Carregar Turmas PELO BACKEND SEGURO (COM PROTEÇÃO CONTRA TRAVAMENTO)
    const selTurma = document.getElementById('selectTurma');
    if (selTurma) {
        selTurma.innerHTML = '<option value="">⏳ Carregando turmas...</option>';
        
        const emailLogado = localStorage.getItem('sb_email') || userEmail;
        const BACKEND_URL = "https://omr-backend-laboratorio.onrender.com"; 
        const url = `${BACKEND_URL}/api/turmas?email=${encodeURIComponent(emailLogado)}`;
        
        console.log("🔍 Tentando buscar turmas em:", url);

        // Configuração de Timeout (15 segundos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); 

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId); // Se deu certo, cancela o timer
            
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            
            const resultado = await response.json();
            
            selTurma.innerHTML = '<option value="">Todas as turmas liberadas</option>';
            
            if (resultado.sucesso && resultado.turmas && resultado.turmas.length > 0) {
                resultado.turmas.forEach(turma => { 
                    selTurma.innerHTML += `<option value="${turma.id}">${turma.nome}</option>`; 
                });
                console.log(`✅ Carregadas ${resultado.turmas.length} turmas para ${emailLogado}`);
            } else {
                selTurma.innerHTML = '<option value="">⚠️ Nenhuma turma liberada para este perfil</option>';
                console.log("⚠️ Nenhuma turma encontrada para este professor.");
            }
        } catch (e) {
            clearTimeout(timeoutId);
            console.error("❌ Erro ao buscar turmas no backend:", e);
            // Mostra erro na tela em vez de ficar carregando para sempre
            selTurma.innerHTML = '<option value="">❌ Erro de conexão (Tente recarregar a página)</option>';
        }
    }
}

// Inicialização automática se já estiver logado
(async function () { 
    if (token && userEmail) { 
        await refrescarSessao(); 
        mostrarPrincipal(userEmail); 
    } 
})();