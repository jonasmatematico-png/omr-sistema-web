// ========================================================================
// 🔄 NAVEGAÇÃO GLOBAL DO SISTEMA
// ========================================================================
function navegarPara(viewId, btn) {
    // 1. Esconde todas as views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // 2. Mostra a view selecionada
    document.getElementById(viewId).classList.add('active');
    
    // 3. Atualiza o menu lateral
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    // 4. Se for a aba de gestão, carrega a lista de usuários (com verificação de segurança)
    if (viewId === 'view-gestao' && typeof carregarListaUsuarios === 'function') {
        carregarListaUsuarios();
    }
} // <-- AQUI ESTAVA FALTANDO ESTA CHAVE DE FECHAMENTO!

// ========================================================================
// 🚀 INICIALIZAÇÃO SEGURA (DEVE FICAR FORA DE QUALQUER FUNÇÃO)
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("🟢 Página carregada. Iniciando sistema...");
    
    // Verifica se as variáveis existem antes de usá-las para evitar erros
    if (typeof token !== 'undefined' && token && typeof userEmail !== 'undefined' && userEmail) { 
        if (typeof refrescarSessao === 'function') {
            refrescarSessao().then(() => {
                if (typeof mostrarPrincipal === 'function') {
                    mostrarPrincipal(userEmail); 
                }
            });
        }
    }
});
    