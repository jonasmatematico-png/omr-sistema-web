
    // ========================================================================
    // 🚀 INICIALIZAÇÃO SEGURA
    // ========================================================================
    document.addEventListener('DOMContentLoaded', function() {
        console.log("🟢 Página carregada. Iniciando sistema...");
        if (token && userEmail) { 
            refrescarSessao().then(() => mostrarPrincipal(userEmail)); 
        }
    });