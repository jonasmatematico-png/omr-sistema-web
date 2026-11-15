// ========================================================================
// 🔗 ATALHOS DE SISTEMAS — OMR Sistema 2.0
// Restaura o atalho de login do projeto paralelo (Caixa CCB) e permite
// gerenciar vários atalhos. Fica em arquivo separado para NÃO sumir em
// futuras atualizações do index.html. Configuração salva no navegador.
// ========================================================================
(function () {
    'use strict';

    var CHAVE = 'omr_atalhos_sistemas_v1';
    var PADRAO = [
        { id: 'ccb', nome: 'Caixa CCB', url: 'https://jonasmatematico-png.github.io/caixa-ccb/', icone: '💰', cor: '#f0b429' }
    ];

    function esc(t) {
        if (window.escaparHTML) return window.escaparHTML(String(t == null ? '' : t));
        return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function aviso(msg, tipo) { if (window.toast) window.toast(msg, tipo || 'info'); else alert(msg); }

    function carregar() {
        try {
            var raw = localStorage.getItem(CHAVE);
            if (!raw) return PADRAO.slice();
            var arr = JSON.parse(raw);
            if (!Array.isArray(arr) || !arr.length) return PADRAO.slice();
            return arr;
        } catch (e) { return PADRAO.slice(); }
    }
    function salvar(lista) { try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch (e) {} }
    function normalizarUrl(u) {
        u = String(u || '').trim();
        if (!u) return '';
        if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
        return u;
    }

    // ------------------------------------------------------------------
    // Estilos
    // ------------------------------------------------------------------
    (function estilos() {
        if (document.getElementById('estilos-atalhos')) return;
        var s = document.createElement('style');
        s.id = 'estilos-atalhos';
        s.textContent = '' +
            '.omr-atalhos-bloco{margin-top:18px;padding-top:16px;border-top:1px solid rgba(0,0,0,.08);}' +
            '.omr-atalhos-titulo{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8a93a6;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;}' +
            '.omr-atalhos-gerir{background:none;border:none;color:#008080;font-size:11px;font-weight:700;cursor:pointer;text-decoration:underline;padding:0;font-family:inherit;}' +
            '.omr-atalhos-lista{display:flex;flex-direction:column;gap:8px;}' +
            '.omr-atalho-link{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;text-decoration:none;color:#fff;font-weight:700;font-size:14px;background:linear-gradient(135deg,#0f1528,#1d2a4d 55%,#00695c);border:1px solid rgba(0,229,199,.3);box-shadow:0 5px 18px rgba(9,14,30,.25);transition:transform .18s ease,box-shadow .2s ease,border-color .2s ease;}' +
            '.omr-atalho-link:hover{transform:translateY(-2px);border-color:rgba(0,229,199,.75);box-shadow:0 9px 26px rgba(9,14,30,.4),0 0 16px rgba(0,229,199,.2);}' +
            '.omr-atalho-icone{width:34px;height:34px;flex-shrink:0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);}' +
            '.omr-atalho-txt{flex:1;line-height:1.2;}' +
            '.omr-atalho-txt small{display:block;font-weight:600;font-size:10px;opacity:.75;word-break:break-all;}' +
            '.omr-atalho-seta{font-size:15px;opacity:.85;}' +
            '.omr-drawer-rodape .omr-atalhos-bloco{margin-top:0;padding-top:0;border-top:none;margin-bottom:12px;}' +
            '.omr-drawer-rodape .omr-atalhos-titulo{color:#8fa0c8;}' +
            '.omr-drawer-rodape .omr-atalhos-gerir{color:#00e5c7;}' +
            '.omr-at-modal{position:fixed;inset:0;z-index:100050;display:none;align-items:center;justify-content:center;background:rgba(8,12,24,.6);backdrop-filter:blur(3px);padding:18px;}' +
            '.omr-at-modal.aberto{display:flex;}' +
            '.omr-at-caixa{background:#fff;border-radius:16px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;box-shadow:0 20px 60px rgba(5,8,18,.5);}' +
            '.omr-at-caixa::-webkit-scrollbar{width:9px;}.omr-at-caixa::-webkit-scrollbar-thumb{background:linear-gradient(#6a1b9a,#008080);border-radius:8px;}' +
            '.omr-at-cab{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}' +
            '.omr-at-cab h3{margin:0;color:#1d2a4d;font-size:18px;}' +
            '.omr-at-fechar{background:#f1ecf8;border:none;width:32px;height:32px;border-radius:9px;cursor:pointer;font-size:15px;color:#4a148c;}' +
            '.omr-at-sub{font-size:12px;color:#667;margin-bottom:16px;line-height:1.5;}' +
            '.omr-at-item{border:1px solid #e6e0f2;border-left:4px solid #6a1b9a;border-radius:11px;padding:12px;margin-bottom:10px;background:#fbfaff;}' +
            '.omr-at-linha{display:grid;grid-template-columns:64px 1fr;gap:8px;margin-bottom:8px;}' +
            '.omr-at-linha input{width:100%;padding:9px 10px;border:1px solid #d9d2e9;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box;}' +
            '.omr-at-linha input:focus{outline:none;border-color:#6a1b9a;box-shadow:0 0 0 3px rgba(106,27,154,.12);}' +
            '.omr-at-acoes{display:flex;justify-content:space-between;gap:8px;align-items:center;}' +
            '.omr-at-mini{background:#fff;border:1px solid #d9d2e9;color:#4a148c;padding:6px 11px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}' +
            '.omr-at-mini:hover{background:#f3e5f5;}' +
            '.omr-at-mini.perigo{color:#c62828;border-color:#ffcdd2;}.omr-at-mini.perigo:hover{background:#ffebee;}' +
            '.omr-at-rodape{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:14px;padding-top:14px;border-top:1px solid #eee;}' +
            '.omr-at-btn{padding:11px 16px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;border:none;font-family:inherit;}' +
            '.omr-at-btn.primario{background:linear-gradient(135deg,#6a1b9a,#008080);color:#fff;}' +
            '.omr-at-btn.secundario{background:#f1ecf8;color:#4a148c;}' +
            '.omr-at-vazio{text-align:center;color:#889;font-size:13px;padding:16px;}';
        document.head.appendChild(s);
    })();

    // ------------------------------------------------------------------
    // Render dos atalhos (login + menu)
    // ------------------------------------------------------------------
    function htmlLista(lista, comDominio) {
        if (!lista.length) return '<div class="omr-at-vazio">Nenhum atalho configurado.</div>';
        return '<div class="omr-atalhos-lista">' + lista.map(function (a) {
            var url = normalizarUrl(a.url);
            var dom = '';
            try { dom = new URL(url).hostname; } catch (e) { dom = url; }
            return '<a class="omr-atalho-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" title="' + esc(url) + '">' +
                '<span class="omr-atalho-icone">' + esc(a.icone || '🔗') + '</span>' +
                '<span class="omr-atalho-txt">' + esc(a.nome || 'Sistema') + (comDominio ? '<small>' + esc(dom) + '</small>' : '') + '</span>' +
                '<span class="omr-atalho-seta">↗</span></a>';
        }).join('') + '</div>';
    }

    function garantir() {
        var lista = carregar();

        // Tela de login
        var box = document.querySelector('#authScreen .auth-box');
        if (box) {
            var bl = document.getElementById('omrAtalhosLogin');
            if (!bl) { bl = document.createElement('div'); bl.id = 'omrAtalhosLogin'; bl.className = 'omr-atalhos-bloco'; box.appendChild(bl); }
            bl.innerHTML = '<div class="omr-atalhos-titulo"><span>🔗 Acessar outro sistema</span>' +
                '<button type="button" class="omr-atalhos-gerir" onclick="omrAtalhosGerir()">gerenciar</button></div>' +
                htmlLista(lista, true);
        }

        // Rodapé do menu lateral
        var rodape = document.querySelector('.omr-drawer-rodape');
        if (rodape) {
            var bd = document.getElementById('omrAtalhosDrawer');
            if (!bd) {
                bd = document.createElement('div'); bd.id = 'omrAtalhosDrawer'; bd.className = 'omr-atalhos-bloco';
                var sair = rodape.querySelector('.omr-sair');
                if (sair) rodape.insertBefore(bd, sair); else rodape.appendChild(bd);
            }
            bd.innerHTML = '<div class="omr-atalhos-titulo"><span>🔗 Outros sistemas</span>' +
                '<button type="button" class="omr-atalhos-gerir" onclick="omrAtalhosGerir()">⚙️</button></div>' +
                htmlLista(lista, false);
        }
    }

    // ------------------------------------------------------------------
    // Modal de gerenciamento
    // ------------------------------------------------------------------
    var rascunho = [];
    function abrirModal() {
        rascunho = carregar().map(function (a) { return Object.assign({}, a); });
        var m = document.getElementById('omrAtalhosModal');
        if (!m) {
            m = document.createElement('div'); m.id = 'omrAtalhosModal'; m.className = 'omr-at-modal';
            m.innerHTML = '<div class="omr-at-caixa">' +
                '<div class="omr-at-cab"><h3>🔗 Atalhos de Sistemas</h3><button type="button" class="omr-at-fechar" onclick="omrAtalhosFechar()">✕</button></div>' +
                '<div class="omr-at-sub">Estes atalhos aparecem na <strong>tela de login</strong> e no <strong>menu lateral</strong>. Use o link do seu outro projeto (ex.: <em>jonasmatematico.com.br/...</em> ou o endereço atual dele). Eles ficam salvos neste navegador e não somem nas atualizações.</div>' +
                '<div id="omrAtalhosItens"></div>' +
                '<div class="omr-at-rodape">' +
                    '<button type="button" class="omr-at-btn secundario" onclick="omrAtalhosAdd()">➕ Adicionar</button>' +
                    '<button type="button" class="omr-at-btn secundario" onclick="omrAtalhosReset()">↩️ Padrão</button>' +
                    '<button type="button" class="omr-at-btn secundario" onclick="omrAtalhosFechar()">Cancelar</button>' +
                    '<button type="button" class="omr-at-btn primario" onclick="omrAtalhosSalvar()">💾 Salvar</button>' +
                '</div></div>';
            document.body.appendChild(m);
            m.addEventListener('click', function (e) { if (e.target === m) omrAtalhosFechar(); });
        }
        renderItens();
        m.classList.add('aberto');
    }
    function renderItens() {
        var box = document.getElementById('omrAtalhosItens');
        if (!box) return;
        if (!rascunho.length) { box.innerHTML = '<div class="omr-at-vazio">Nenhum atalho. Clique em ➕ Adicionar.</div>'; return; }
        box.innerHTML = rascunho.map(function (a, i) {
            return '<div class="omr-at-item">' +
                '<div class="omr-at-linha"><input value="' + esc(a.icone || '🔗') + '" maxlength="4" placeholder="Ícone" oninput="omrAtalhosEdit(' + i + ',\'icone\',this.value)">' +
                '<input value="' + esc(a.nome || '') + '" placeholder="Nome do sistema (ex.: Caixa CCB)" oninput="omrAtalhosEdit(' + i + ',\'nome\',this.value)"></div>' +
                '<div class="omr-at-linha" style="grid-template-columns:1fr;"><input value="' + esc(a.url || '') + '" placeholder="https://jonasmatematico.com.br/..." oninput="omrAtalhosEdit(' + i + ',\'url\',this.value)"></div>' +
                '<div class="omr-at-acoes"><span style="font-size:11px;color:#889;">Atalho ' + (i + 1) + '</span>' +
                '<button type="button" class="omr-at-mini perigo" onclick="omrAtalhosRemover(' + i + ')">🗑️ Remover</button></div>' +
                '</div>';
        }).join('');
    }

    window.omrAtalhosGerir = abrirModal;
    window.omrAtalhosFechar = function () { var m = document.getElementById('omrAtalhosModal'); if (m) m.classList.remove('aberto'); };
    window.omrAtalhosEdit = function (i, campo, val) { if (rascunho[i]) rascunho[i][campo] = val; };
    window.omrAtalhosAdd = function () { rascunho.push({ id: 's' + Date.now(), nome: '', url: '', icone: '🔗' }); renderItens(); };
    window.omrAtalhosRemover = function (i) { rascunho.splice(i, 1); renderItens(); };
    window.omrAtalhosReset = function () { rascunho = PADRAO.map(function (a) { return Object.assign({}, a); }); renderItens(); };
    window.omrAtalhosSalvar = function () {
        var limpos = [];
        for (var i = 0; i < rascunho.length; i++) {
            var a = rascunho[i];
            var url = normalizarUrl(a.url);
            var nome = String(a.nome || '').trim();
            if (!nome && !url) continue;
            if (!url) { aviso('❌ Informe o link do atalho "' + (nome || i + 1) + '".', 'error'); return; }
            try { new URL(url); } catch (e) { aviso('❌ Link inválido: ' + url, 'error'); return; }
            limpos.push({ id: a.id || 's' + Date.now() + i, nome: nome || 'Sistema', url: url, icone: String(a.icone || '🔗').trim() || '🔗' });
        }
        salvar(limpos.length ? limpos : PADRAO.slice());
        omrAtalhosFechar();
        garantir();
        aviso('✅ Atalhos salvos!', 'success');
    };

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') omrAtalhosFechar(); });

    function init() { garantir(); [400, 1200, 3000].forEach(function (t) { setTimeout(garantir, t); }); setInterval(garantir, 2000); window.addEventListener('focus', garantir); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();