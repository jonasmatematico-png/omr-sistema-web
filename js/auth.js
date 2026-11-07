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
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userAvatar').textContent = email.charAt(0).toUpperCase();
    
    try {
        // 1. CONSULTAR O BACKEND PARA SABER OS MÓDULOS ATIVOS DESTE USUÁRIO
        const response = await fetch(`${API_BASE_URL}/api/perfil?email=${encodeURIComponent(email)}`);
        const resultado = await response.json();
        
        let modulosAtivos = [];
        
        if (resultado.sucesso && resultado.perfil && resultado.perfil.modulos_ativos) {
            modulosAtivos = resultado.perfil.modulos_ativos;
            // Salva no localStorage para o sistema todo saber
            localStorage.setItem('modulos_ativos', JSON.stringify(modulosAtivos));
            console.log("✅ Módulos carregados:", modulosAtivos);
        }

        // 2. APLICAR AS PERMISSÕES NO MENU (MÁGICA ACONTECE AQUI!)
        aplicarPermissoesNoMenu(modulosAtivos);

    } catch (e) {
        console.error("Erro ao buscar permissões do perfil:", e);
        // Em caso de erro, libera tudo para não travar o sistema, mas avisa no console
    }

    // 3. CARREGAR AS FUNCIONALIDADES INICIAIS
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

// ========================================================================
// 🔒 FUNÇÃO: ESCONDE/MOSTRA BOTÕES COM BASE NOS MÓDULOS ATIVOS (VERSÃO DEBUG)
// ========================================================================
function aplicarPermissoesNoMenu(modulosRaw, emailUsuario) {
    console.log("🔍 DEBUG 1 - Email recebido:", emailUsuario);
    console.log("🔍 DEBUG 2 - Módulos brutos do backend:", modulosRaw);

    // 1. NORMALIZAR OS DADOS: Garantir que seja um Array, mesmo que o Supabase mande como String
    let modulos = [];
    if (Array.isArray(modulosRaw)) {
        modulos = modulosRaw;
    } else if (typeof modulosRaw === 'string') {
        // Se vier como string "{a, b}", converte para array ["a", "b"]
        modulos = modulosRaw.replace(/[{}]/g, '').split(',').map(s => s.trim().toLowerCase());
    }

    console.log("🔍 DEBUG 3 - Módulos normalizados (Array final):", modulos);

    // 2. REGRA DE OURO: Backdoor do Gestor
    const emailGestorMaster = 'jonasmatematico@yahoo.com.br';
    if (emailUsuario && emailUsuario.toLowerCase().trim() === emailGestorMaster.toLowerCase().trim()) {
        console.log("🔓 MODO GESTOR ATIVADO: Acesso total garantido para " + emailUsuario);
        return; // Sai da função, não esconde nada
    }

    // 3. REGRA DE ADMIN
    if (modulos.includes('admin') || modulos.includes('todos')) {
        console.log("🔓 MODO ADMIN/TODOS ATIVADO: Acesso total garantido.");
        return;
    }

    // 4. APLICAR O BLOQUEIO NO MENU
    console.log("🔒 Iniciando varredura do menu...");
    const itensMenu = document.querySelectorAll('.menu-item[data-modulo]');
    
    itensMenu.forEach(item => {
        const moduloDoBotao = item.getAttribute('data-modulo').toLowerCase();
        const temPermissao = modulos.includes(moduloDoBotao);
        
        console.log(`   -> Botão "${moduloDoBotao}": Tem permissão?`, temPermissao);

        if (!temPermissao) {
            item.style.display = 'none';
            console.log(`      ❌ ESCONDIDO: ${moduloDoBotao}`);
        } else {
            console.log(`      ✅ VISÍVEL: ${moduloDoBotao}`);
        }
    });

    // 5. CONTROLE DO ROBÔ DA IA (FAB)
    const fabIa = document.querySelector('.fab-ia');
    if (fabIa && !modulos.includes('ia_geral') && !modulos.includes('ia')) {
        fabIa.style.display = 'none';
        console.log("      ❌ Robô da IA escondido.");
    }
}

// 🆕 NOVA FUNÇÃO: Carrega Provas e Turmas de forma SEGURA
async function carregarSelectsDiagnosticoDireto() {
    // 1. Carregar Provas (Continua direto do Supabase)
    const selProva = document.getElementById('selectAvaliacao');
    if (selProva) {
        const { data: provas, error } = await supabase.from('avaliacoes').select('id, nome').order('id', { ascending: false });
        selProva.innerHTML = '<option value="">-- Escolha uma prova --</option>';
        if (!error && provas) {
            provas.forEach(av => { selProva.innerHTML += `<option value="${av.id}">${av.nome}</option>`; });
        }
    }
    
    // 2. Carregar Turmas AGORA PELO BACKEND SEGURO (FILTRADO POR EMAIL)
    const selTurma = document.getElementById('selectTurma');
    if (selTurma) {
        selTurma.innerHTML = '<option value="">⏳ Carregando turmas...</option>';
        
        const emailLogado = localStorage.getItem('sb_email') || userEmail;
        const BACKEND_URL = "https://omr-backend-laboratorio.onrender.com"; 
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/turmas?email=${encodeURIComponent(emailLogado)}`);
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
            selTurma.innerHTML = '<option value="">❌ Erro ao carregar turmas</option>';
            console.error("Erro ao buscar turmas:", e);
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