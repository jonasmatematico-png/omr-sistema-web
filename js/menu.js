// ========================================================================
// 🧭 MENU LATERAL V2 — OMR Sistema 2.0
// Agrupa provas + correções, agrupa Inclusão, e se esconde ao navegar.
// ========================================================================
(function () {
    'use strict';

    var CHAVE = 'omr_menu_grupos_v2';
    var TITULOS = {
        'view-provas': '📝 Criar Prova Aberta',
        'view-objetivas': '✅ Criar Prova Objetiva',
        'view-diagnostico': '📊 Diagnóstico',
        'view-planilha': '📋 Planilha',
        'view-corretor': '✏️ Corretor Manual',
        'view-qr': '🔲 QR Codes',
        'view-gestao': '👥 Gestão',
        'view-inclusao-perfis': '🧩 Perfis de Alunos',
        'view-inclusao-gerar': '🎯 Atividade Adaptada',
        'view-inclusao-colaboracao': '🤝 Colaboração AEE',
        'view-inclusao-relatorios': '📊 Relatórios de Inclusão'
    };

    var estado = {};
    try { estado = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { estado = {}; }
    if (!Object.keys(estado).length) estado = { abertas: true };

    function $s(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    function drawer() { return $s('#omrSidebar'); }

    function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {} }

    function aplicarGrupo(id, aberto) {
        var sec = $s('.omr-grupo[data-grupo="' + id + '"]');
        if (!sec) return;
        sec.classList.toggle('omr-aberto', !!aberto);
        var btn = $s('.omr-grupo-btn', sec);
        if (btn) btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    }

    function sincronizar() {
        $all('.omr-grupo[data-grupo]').forEach(function (sec) {
            var folhas = $all('.omr-folha', sec);
            var visiveis = folhas.filter(function (f) { return getComputedStyle(f).display !== 'none'; });
            sec.style.display = visiveis.length ? '' : 'none';
            var c = $s('[data-count]', sec);
            if (c) c.textContent = visiveis.length;
            aplicarGrupo(sec.getAttribute('data-grupo'), estado[sec.getAttribute('data-grupo')]);
        });
    }

    function abrir() {
        sincronizar();
        document.body.classList.add('omr-drawer-open');
        var b = $s('#omrMenuBtn'); if (b) b.setAttribute('aria-expanded', 'true');
        setTimeout(function () { var f = $s('.omr-fechar'); if (f) f.focus(); }, 280);
    }
    function fechar() {
        document.body.classList.remove('omr-drawer-open');
        var b = $s('#omrMenuBtn'); if (b) b.setAttribute('aria-expanded', 'false');
    }
    function alternar() { document.body.classList.contains('omr-drawer-open') ? fechar() : abrir(); }
    function externo(url) { window.open(url, '_blank', 'noopener'); setTimeout(fechar, 180); }

    function toggleGrupo(id) {
        estado[id] = !estado[id];
        aplicarGrupo(id, estado[id]);
        salvar();
    }

    function marcarAtivo(viewId) {
        $all('.omr-folha').forEach(function (f) { f.classList.remove('omr-ativo', 'active'); });
        $all('.omr-grupo').forEach(function (g) { g.classList.remove('omr-grupo-ativo'); });
        var folha = $s('.omr-folha[data-view="' + viewId + '"]');
        if (folha) {
            folha.classList.add('omr-ativo', 'active');
            var sec = folha.closest('.omr-grupo');
            if (sec && sec.getAttribute('data-grupo')) {
                sec.classList.add('omr-grupo-ativo');
                var gid = sec.getAttribute('data-grupo');
                estado[gid] = true; aplicarGrupo(gid, true); salvar();
            }
        }
        var ctx = $s('#omrMenuContexto');
        if (ctx) ctx.textContent = TITULOS[viewId] || '📊 OMR Sistema';
    }

    function instalarNavegacao() {
        var original = window.navegarPara;
        window.navegarPara = function (viewId, el) {
            if (typeof original === 'function') {
                try { original.apply(this, arguments); } catch (e) { console.error('navegarPara:', e); }
            } else {
                $all('.view').forEach(function (v) { v.classList.remove('active'); });
                var v = document.getElementById(viewId); if (v) v.classList.add('active');
            }
            try { marcarAtivo(viewId); setTimeout(fechar, 240); } catch (e) {}
        };
    }

    function init() {
        if (!drawer()) return;
        document.body.classList.add('omr-menu-v2');
        instalarNavegacao();
        Object.keys(estado).forEach(function (id) { aplicarGrupo(id, estado[id]); });
        sincronizar();
        var ativa = $s('.view.active');
        marcarAtivo(ativa ? ativa.id : 'view-provas');

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') fechar();
        });
        [900, 2600, 6000].forEach(function (t) { setTimeout(sincronizar, t); });
        window.addEventListener('focus', sincronizar);

        var btn = $s('#omrMenuBtn');
        if (btn) { btn.classList.add('omr-pulso'); setTimeout(function () { btn.classList.remove('omr-pulso'); }, 4200); }
    }

    window.omrMenuAbrir = abrir;
    window.omrMenuFechar = fechar;
    window.omrMenuToggle = alternar;
    window.omrMenuToggleGrupo = toggleGrupo;
    window.omrMenuExternal = externo;
    window.omrMenuAtualizarGrupos = sincronizar;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();