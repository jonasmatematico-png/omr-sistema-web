// ========================================================================
// 🔐 GESTÃO & PERMISSÕES V2 — OMR Sistema 2.0
// Catálogo único de módulos (igual ao menu), edição agrupada, presets,
// turmas, e aplicação das permissões no menu lateral.
// Carregar DEPOIS de gestao.js e menu.js
// ========================================================================
(function () {
    'use strict';

    var API_GESTAO = 'https://omr-backend-laboratorio.onrender.com';

    var CATALOGO = [
        {
            id: 'abertas', nome: 'Provas Abertas', icone: '📝', cor: '0,191,165',
            itens: [
                { chave: 'dissertativa', nome: 'Criar Prova Aberta', desc: 'Elaborar provas dissertativas e gerar PDF', icone: '✏️' },
                { chave: 'correcao_dissertativa', nome: 'Correção Dissertativa', desc: 'Corrigir provas abertas por foto com IA', icone: '✍️' }
            ]
        },
        {
            id: 'objetivas', nome: 'Provas Objetivas', icone: '✅', cor: '41,121,255',
            itens: [
                { chave: 'objetiva', nome: 'Criar Prova Objetiva', desc: 'Elaborar múltipla escolha e gabaritos', icone: '🎯' },
                { chave: 'omr', nome: 'Correção Objetiva (OMR)', desc: 'Ler cartões-resposta pela câmera', icone: '🔍' }
            ]
        },
        {
            id: 'inclusao', nome: 'Inclusão', icone: '🧩', cor: '179,136,255',
            itens: [
                { chave: 'inclusao_perfis', nome: 'Perfis de Alunos', desc: 'Cadastrar perfis NEE (TEA / TDAH)', icone: '👤' },
                { chave: 'inclusao_gerar', nome: 'Gerar Atividade Adaptada', desc: 'Adaptar com IA, co-piloto e PDF', icone: '🎯' },
                { chave: 'inclusao_colaboracao', nome: 'Colaboração AEE', desc: 'Revisar e aprovar adaptações', icone: '🤝' },
                { chave: 'inclusao_relatorios', nome: 'Relatórios de Inclusão', desc: 'Indicadores e memória do sistema', icone: '📈' }
            ]
        },
        {
            id: 'resultados', nome: 'Resultados', icone: '📊', cor: '255,179,0',
            itens: [
                { chave: 'diagnostico', nome: 'Diagnóstico', desc: 'Classificar turma e analisar desempenho', icone: '📊' },
                { chave: 'planilha', nome: 'Planilha', desc: 'Matriz de respostas e exportação', icone: '📋' },
                { chave: 'corretor', nome: 'Corretor Manual', desc: 'Lançar respostas manualmente', icone: '✏️' },
                { chave: 'qr', nome: 'QR Codes', desc: 'Gerar QR e cartões dos alunos', icone: '🔲' }
            ]
        },
        {
            id: 'admin', nome: 'Administração', icone: '👥', cor: '0,200,83',
            itens: [
                { chave: 'gestao', nome: 'Gestão de Usuários', desc: 'Cadastrar professores e definir permissões', icone: '⚙️', sensivel: true }
            ]
        }
    ];

    var TODAS_CHAVES = CATALOGO.reduce(function (acc, g) { return acc.concat(g.itens.map(function (i) { return i.chave; })); }, []);

    var PRESETS = [
        { id: '', nome: '— Escolher perfil pronto —', chaves: null },
        { id: 'professor', nome: '👨‍🏫 Professor (provas e resultados)', chaves: ['dissertativa', 'correcao_dissertativa', 'objetiva', 'omr', 'diagnostico', 'planilha', 'corretor', 'qr'] },
        { id: 'professor_inclusao', nome: '🧩 Professor + Inclusão', chaves: ['dissertativa', 'correcao_dissertativa', 'objetiva', 'omr', 'diagnostico', 'planilha', 'corretor', 'qr', 'inclusao_perfis', 'inclusao_gerar', 'inclusao_colaboracao', 'inclusao_relatorios'] },
        { id: 'aee', nome: '🤝 Professor de AEE', chaves: ['inclusao_perfis', 'inclusao_gerar', 'inclusao_colaboracao', 'inclusao_relatorios', 'diagnostico'] },
        { id: 'coordenacao', nome: '📊 Coordenação (tudo, menos Gestão)', chaves: TODAS_CHAVES.filter(function (c) { return c !== 'gestao'; }) },
        { id: 'gestor', nome: '👑 Gestor total', chaves: TODAS_CHAVES.slice() }
    ];

    var usuarios = [];
    var turmasDisponiveis = [];
    var edicao = null;
    var snapshot = '';
    var permitidosCache = null;
    var ehMasterCache = false;
    var filtroTipo = '';
    var filtroBusca = '';
    var filtroSemAcesso = false;

    function $s(s, c) { return (c || document).querySelector(s); }
    function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
    function emailAtual() { return (localStorage.getItem('sb_email') || '').toLowerCase().trim(); }
    function ehMaster(email) {
        var m = (typeof EMAIL_ADMIN_MASTER !== 'undefined') ? String(EMAIL_ADMIN_MASTER).toLowerCase().trim() : '';
        return !!m && (email || emailAtual()) === m;
    }
    function normalizarLista(v) {
        if (!v) return [];
        if (Array.isArray(v)) return v.filter(Boolean).map(function (x) { return typeof x === 'string' ? x.trim() : x; });
        if (typeof v === 'string') {
            var t = v.trim().replace(/^\{/, '').replace(/\}$/, '');
            if (!t) return [];
            return t.split(',').map(function (x) { return x.replace(/^"|"$/g, '').trim(); }).filter(Boolean);
        }
        return [];
    }
    function iniciais(nome, email) {
        var base = (nome || email || '?').trim();
        var partes = base.split(/\s+/).filter(Boolean);
        if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
        return base.substring(0, 2).toUpperCase();
    }
    function chaveParaGrupo(chave) {
        for (var i = 0; i < CATALOGO.length; i++) {
            if (CATALOGO[i].itens.some(function (it) { return it.chave === chave; })) return CATALOGO[i];
        }
        return null;
    }

    // ------------------------------------------------------------------------
    // Estilos
    // ------------------------------------------------------------------------
    (function estilos() {
        if (document.getElementById('estilos-permissoes')) return;
        var s = document.createElement('style');
        s.id = 'estilos-permissoes';
        s.textContent = '' +
            '.pm-hero{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;background:linear-gradient(120deg,#0f1528,#1d2a4d 55%,#00695c);color:#fff;border-radius:16px;padding:20px 24px;margin-bottom:18px;box-shadow:0 10px 30px rgba(15,21,40,.28)}' +
            '.pm-hero strong{font-size:17px;display:block;margin-bottom:4px}' +
            '.pm-hero p{margin:0;font-size:13px;opacity:.9;max-width:640px}' +
            '.pm-hero-acoes{display:flex;gap:8px;flex-wrap:wrap}' +
            '.pm-btn-clara{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35);color:#fff;padding:10px 16px;border-radius:11px;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px;transition:background .2s,transform .18s}' +
            '.pm-btn-clara:hover{background:rgba(255,255,255,.3);transform:translateY(-2px)}' +
            '.pm-chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}' +
            '.pm-chip{background:#fff;border:1px solid #e6e9f2;border-left:5px solid #6a1b9a;border-radius:12px;padding:12px 14px;box-shadow:0 3px 12px rgba(20,25,45,.06)}' +
            '.pm-chip .n{font-size:24px;font-weight:800;color:#1d2a4d;line-height:1.1}' +
            '.pm-chip .l{font-size:11px;color:#667;font-weight:700;margin-top:3px}' +
            '.pm-toolbar{display:grid;grid-template-columns:2fr 1fr auto;gap:10px;align-items:end;margin-bottom:14px}' +
            '@media(max-width:760px){.pm-toolbar{grid-template-columns:1fr}}' +
            '.pm-lista{max-height:600px;overflow-y:auto;padding-right:6px}' +
            '.pm-lista::-webkit-scrollbar,.pm-scroll::-webkit-scrollbar{width:10px}' +
            '.pm-lista::-webkit-scrollbar-track,.pm-scroll::-webkit-scrollbar-track{background:#f1ecf8;border-radius:8px}' +
            '.pm-lista::-webkit-scrollbar-thumb,.pm-scroll::-webkit-scrollbar-thumb{background:linear-gradient(#6a1b9a,#008080);border-radius:8px}' +
            '.pm-user{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;background:#fff;border:1px solid #e6e9f2;border-radius:14px;padding:14px 16px;margin-bottom:10px;transition:transform .15s,box-shadow .15s}' +
            '.pm-user:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(20,25,45,.12)}' +
            '.pm-user-id{display:flex;gap:12px;align-items:flex-start;min-width:240px;flex:1}' +
            '.pm-avatar{width:44px;height:44px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:linear-gradient(135deg,#6a1b9a,#008080);box-shadow:0 4px 12px rgba(106,27,154,.28)}' +
            '.pm-user-nome{font-weight:800;color:#1d2a4d;font-size:15px}' +
            '.pm-user-email{font-size:12px;color:#667;word-break:break-all}' +
            '.pm-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}' +
            '.pm-tag{font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;background:#f1ecf8;color:#4a148c;border:1px solid #e0d4f0}' +
            '.pm-tag.adm{background:#e8f5e9;color:#1b7f3b;border-color:#c8e6c9}' +
            '.pm-tag.alerta{background:#fff3e0;color:#e65100;border-color:#ffe0b2}' +
            '.pm-tag.master{background:linear-gradient(90deg,#6a1b9a,#008080);color:#fff;border:none}' +
            '.pm-grupos-mini{display:flex;gap:4px;margin-top:8px;flex-wrap:wrap}' +
            '.pm-mini{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(var(--c),.14);border:1px solid rgba(var(--c),.35)}' +
            '.pm-mini.off{opacity:.28;filter:grayscale(1)}' +
            '.pm-modal-topo{display:flex;gap:12px;align-items:center;background:#f7f4fc;border:1px solid #e6dcf5;border-radius:12px;padding:12px 14px;margin-bottom:14px}' +
            '.pm-secao-titulo{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:16px 0 8px}' +
            '.pm-secao-titulo h4{margin:0;color:#4a148c;font-size:15px}' +
            '.pm-acoes-linha{display:flex;gap:6px;flex-wrap:wrap;align-items:center}' +
            '.pm-mini-btn{background:#fff;border:1px solid #d9d2e9;color:#4a148c;padding:6px 11px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .18s,border-color .18s}' +
            '.pm-mini-btn:hover{background:#f3e5f5;border-color:#6a1b9a}' +
            '.pm-scroll{max-height:340px;overflow-y:auto;border:1px solid #e6e9f2;border-radius:12px;padding:10px;background:#fbfaff}' +
            '.pm-grupo{border:1px solid rgba(var(--c),.35);border-left:5px solid rgb(var(--c));border-radius:12px;background:#fff;margin-bottom:10px;overflow:hidden}' +
            '.pm-grupo-cab{display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(var(--c),.08)}' +
            '.pm-grupo-cab .ic{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(var(--c),.2);font-size:15px}' +
            '.pm-grupo-cab .nm{flex:1;font-weight:800;color:#1d2a4d;font-size:14px}' +
            '.pm-grupo-cab .ct{font-size:11px;font-weight:800;color:rgb(var(--c));background:rgba(var(--c),.14);padding:2px 8px;border-radius:20px}' +
            '.pm-item{display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border-top:1px solid #f2f0f7;cursor:pointer;transition:background .15s}' +
            '.pm-item:hover{background:#faf7ff}' +
            '.pm-item input{margin-top:3px;width:auto;accent-color:#6a1b9a;flex-shrink:0}' +
            '.pm-item .tx{flex:1}' +
            '.pm-item .t1{font-size:13px;font-weight:700;color:#22304d}' +
            '.pm-item .t2{font-size:11px;color:#778;line-height:1.45}' +
            '.pm-item .key{font-size:10px;color:#9a93b5;font-family:monospace}' +
            '.pm-sensivel{font-size:10px;font-weight:800;color:#c62828;background:#ffebee;border:1px solid #ffcdd2;padding:1px 7px;border-radius:20px;margin-left:6px}' +
            '.pm-turma{display:flex;gap:9px;align-items:center;padding:8px 10px;border-radius:9px;cursor:pointer;transition:background .15s}' +
            '.pm-turma:hover{background:#f3e5f5}' +
            '.pm-turma input{width:auto;accent-color:#008080}' +
            '.pm-turma span{font-size:13px;font-weight:600;color:#22304d}' +
            '.pm-rodape{position:sticky;bottom:0;background:#fff;border-top:1px solid #e6e9f2;padding:12px 0 0;margin-top:16px;display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap}' +
            '.pm-sujo{font-size:12px;font-weight:700;color:#e65100}' +
            '.pm-limpo{font-size:12px;color:#889}' +
            '.pm-vazio{text-align:center;color:#889;padding:26px;font-size:14px}' +
            '.pm-aviso{background:#fff3e0;border:1px solid #ffe0b2;border-left:5px solid #f0b429;color:#8a5a00;border-radius:12px;padding:12px 16px;margin-bottom:14px;font-size:13px;font-weight:600}' +
            '';
        document.head.appendChild(s);
    })();

    // ========================================================================
    // TELA DE GESTÃO
    // ========================================================================
    function montarTelaGestao() {
        var view = document.getElementById('view-gestao');
        if (!view || view.getAttribute('data-pm-v2') === '1') return;
        view.setAttribute('data-pm-v2', '1');
        view.innerHTML = '' +
            '<h2>👥 Gestão de Usuários</h2>' +
            '<div class="pm-hero">' +
                '<div><strong>Quem acessa o quê, e em quais turmas.</strong>' +
                '<p>Os módulos abaixo são exatamente os grupos do menu lateral. O que você marcar aqui aparece para o professor; o que desmarcar, desaparece.</p></div>' +
                '<div class="pm-hero-acoes">' +
                    '<button type="button" class="pm-btn-clara" onclick="pmRecarregarTudo()">🔄 Atualizar</button>' +
                    '<button type="button" class="pm-btn-clara" onclick="pmAlternarFormulario()">➕ Novo professor</button>' +
                '</div>' +
            '</div>' +
            '<div id="pmChips" class="pm-chips"></div>' +
            '<div class="card" id="pmCardNovo" style="display:none;">' +
                '<h3>➕ Cadastrar Novo Professor</h3>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label>Nome Completo</label><input type="text" id="gestaoNome" placeholder="Ex: Maria Silva"></div>' +
                    '<div class="form-group"><label>E-mail</label><input type="email" id="gestaoEmail" placeholder="maria@escola.com"></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label>Senha Temporária</label><input type="password" id="gestaoSenha" placeholder="Mínimo 6 caracteres"></div>' +
                    '<div class="form-group"><label>Tipo de Acesso</label><select id="gestaoTipo"><option value="professor">Professor</option><option value="admin">Administrador</option></select></div>' +
                '</div>' +
                '<button class="btn btn-success" style="width:100%;" onclick="cadastrarProfessorViaAPI()">🚀 CADASTRAR PROFESSOR</button>' +
            '</div>' +
            '<div class="card">' +
                '<div class="pm-toolbar">' +
                    '<div class="form-group" style="margin:0;"><label>🔍 Buscar por nome ou e-mail</label><input type="text" id="pmBusca" placeholder="Digite para filtrar..." oninput="pmFiltrar()"></div>' +
                    '<div class="form-group" style="margin:0;"><label>Tipo</label><select id="pmTipo" onchange="pmFiltrar()"><option value="">Todos</option><option value="professor">Professores</option><option value="admin">Administradores</option></select></div>' +
                    '<div class="form-group" style="margin:0;"><label>&nbsp;</label><button type="button" class="pm-mini-btn" style="width:100%;padding:11px;" onclick="pmAlternarSemAcesso()" id="pmBtnSemAcesso">⚠️ Sem acesso</button></div>' +
                '</div>' +
                '<div id="listaUsuariosGestao" class="pm-lista"></div>' +
            '</div>';
    }

    function pmAlternarFormulario() {
        var c = document.getElementById('pmCardNovo');
        if (!c) return;
        var abrir = c.style.display === 'none';
        c.style.display = abrir ? '' : 'none';
        if (abrir) { var n = document.getElementById('gestaoNome'); if (n) n.focus(); }
    }
    function pmFiltrar() {
        filtroBusca = ((document.getElementById('pmBusca') || {}).value || '').toLowerCase().trim();
        filtroTipo = ((document.getElementById('pmTipo') || {}).value || '');
        renderizarUsuarios();
    }
    function pmAlternarSemAcesso() {
        filtroSemAcesso = !filtroSemAcesso;
        var b = document.getElementById('pmBtnSemAcesso');
        if (b) { b.style.background = filtroSemAcesso ? '#fff3e0' : '#fff'; b.style.borderColor = filtroSemAcesso ? '#f0b429' : '#d9d2e9'; }
        renderizarUsuarios();
    }

    async function pmRecarregarTudo() {
        montarTelaGestao();
        var lista = document.getElementById('listaUsuariosGestao');
        if (lista) lista.innerHTML = '<div class="pm-vazio">⏳ Carregando usuários e turmas...</div>';
        try {
            var ru = await sbFetch('GET', '/rest/v1/perfis?select=*&order=nome_completo.asc');
            usuarios = ru.ok ? await ru.json() : [];
            var rt = await sbFetch('GET', '/rest/v1/turmas?select=id,nome&order=nome.asc');
            turmasDisponiveis = rt.ok ? await rt.json() : [];
            renderizarUsuarios();
        } catch (e) {
            if (lista) lista.innerHTML = '<div class="pm-vazio" style="color:#c62828;">❌ Erro ao carregar usuários.</div>';
        }
    }

    function modulosDe(u) { return normalizarLista(u.modulos_ativos); }
    function turmasDe(u) {
        var a = normalizarLista(u.turmas_id);
        var b = normalizarLista(u.turmas_ids);
        var unicos = [];
        a.concat(b).forEach(function (x) { var n = Number(x); if (!isNaN(n) && unicos.indexOf(n) < 0) unicos.push(n); });
        return unicos;
    }

    function renderizarUsuarios() {
        var lista = document.getElementById('listaUsuariosGestao');
        if (!lista) return;
        var chips = document.getElementById('pmChips');
        var semModulos = usuarios.filter(function (u) { return modulosDe(u).length === 0 && !ehMaster(u.email); }).length;
        var semTurmas = usuarios.filter(function (u) { return turmasDe(u).length === 0 && !ehMaster(u.email); }).length;
        var admins = usuarios.filter(function (u) { return (u.tipo_usuario || '') === 'admin'; }).length;
        if (chips) chips.innerHTML = '' +
            '<div class="pm-chip" style="border-left-color:#6a1b9a;"><div class="n">' + usuarios.length + '</div><div class="l">👥 USUÁRIOS</div></div>' +
            '<div class="pm-chip" style="border-left-color:#008080;"><div class="n">' + admins + '</div><div class="l">👑 ADMINISTRADORES</div></div>' +
            '<div class="pm-chip" style="border-left-color:#f0b429;"><div class="n">' + semModulos + '</div><div class="l">⚠️ SEM MÓDULOS</div></div>' +
            '<div class="pm-chip" style="border-left-color:#1565c0;"><div class="n">' + semTurmas + '</div><div class="l">🏫 SEM TURMAS</div></div>' +
            '<div class="pm-chip" style="border-left-color:#1b7f3b;"><div class="n">' + TODAS_CHAVES.length + '</div><div class="l">🧩 MÓDULOS DISPONÍVEIS</div></div>';

        var itens = usuarios.filter(function (u) {
            var nome = (u.nome_completo || '').toLowerCase();
            var mail = (u.email || '').toLowerCase();
            var okBusca = !filtroBusca || nome.indexOf(filtroBusca) >= 0 || mail.indexOf(filtroBusca) >= 0;
            var okTipo = !filtroTipo || (u.tipo_usuario || 'professor') === filtroTipo;
            var okSem = !filtroSemAcesso || (modulosDe(u).length === 0 && !ehMaster(u.email));
            return okBusca && okTipo && okSem;
        });

        if (!itens.length) { lista.innerHTML = '<div class="pm-vazio">📭 Nenhum usuário encontrado com esses filtros.</div>'; return; }

        lista.innerHTML = itens.map(function (u) {
            var mail = (u.email || '').toLowerCase();
            var master = ehMaster(mail);
            var mods = master ? TODAS_CHAVES : modulosDe(u);
            var tms = turmasDe(u);
            var mini = CATALOGO.map(function (g) {
                var total = g.itens.length;
                var ativos = g.itens.filter(function (i) { return mods.indexOf(i.chave) >= 0; }).length;
                return '<span class="pm-mini' + (ativos ? '' : ' off') + '" style="--c:' + g.cor + ';" title="' + g.nome + ': ' + ativos + '/' + total + '">' + g.icone + '</span>';
            }).join('');
            var tags = '<span class="pm-tag ' + ((u.tipo_usuario || '') === 'admin' ? 'adm' : '') + '">' + ((u.tipo_usuario || 'professor') === 'admin' ? '👑 Administrador' : '👨‍🏫 Professor') + '</span>';
            if (master) tags += '<span class="pm-tag master">GESTOR MASTER</span>';
            tags += '<span class="pm-tag">' + mods.length + '/' + TODAS_CHAVES.length + ' módulos</span>';
            tags += '<span class="pm-tag' + (tms.length ? '' : ' alerta') + '">' + tms.length + ' turma(s)</span>';
            if (!mods.length && !master) tags += '<span class="pm-tag alerta">⚠️ sem acesso</span>';
            return '' +
                '<div class="pm-user">' +
                    '<div class="pm-user-id">' +
                        '<div class="pm-avatar">' + iniciais(u.nome_completo, mail) + '</div>' +
                        '<div style="flex:1;">' +
                            '<div class="pm-user-nome">' + escaparHTML(u.nome_completo || 'Sem nome') + '</div>' +
                            '<div class="pm-user-email">' + escaparHTML(mail) + '</div>' +
                            '<div class="pm-tags">' + tags + '</div>' +
                            '<div class="pm-grupos-mini">' + mini + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button type="button" class="btn btn-primary btn-sm" onclick="pmEditar(\'' + encodeURIComponent(mail) + '\')">⚙️ Permissões</button>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    async function cadastrarProfessorViaAPI() {
        var nome = (document.getElementById('gestaoNome') || {}).value || '';
        var email = (document.getElementById('gestaoEmail') || {}).value || '';
        var senha = (document.getElementById('gestaoSenha') || {}).value || '';
        var tipo = (document.getElementById('gestaoTipo') || {}).value || 'professor';
        nome = nome.trim(); email = email.trim().toLowerCase();
        if (!nome || !email || !senha) { toast('❌ Preencha nome, e-mail e senha.', 'error'); return; }
        if (senha.length < 6) { toast('❌ A senha precisa de ao menos 6 caracteres.', 'error'); return; }
        try {
            toast('🚀 Cadastrando professor...', 'info');
            var r = await fetch(API_GESTAO + '/api/criar-professor', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome, email: email, senha: senha, tipo_usuario: tipo })
            });
            var d = await r.json();
            if (!r.ok || !d.sucesso) throw new Error(d.erro || 'Falha ao cadastrar');
            toast('✅ Professor cadastrado! Agora defina as permissões.', 'success');
            ['gestaoNome', 'gestaoEmail', 'gestaoSenha'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
            await pmRecarregarTudo();
            pmEditar(encodeURIComponent(email));
        } catch (e) { toast('❌ ' + e.message, 'error'); }
    }

    // ========================================================================
    // EDITOR DE PERMISSÕES
    // ========================================================================
    function pmEditar(emailCod) {
        var mail = decodeURIComponent(emailCod || '').toLowerCase();
        var u = usuarios.find(function (x) { return (x.email || '').toLowerCase() === mail; });
        if (!u) { toast('❌ Usuário não encontrado. Atualize a lista.', 'error'); return; }
        edicao = {
            id: u.id || null,
            email: mail,
            nome: u.nome_completo || mail,
            tipo: u.tipo_usuario || 'professor',
            modulos: (ehMaster(mail) ? TODAS_CHAVES.slice() : modulosDe(u).slice()),
            turmas: turmasDe(u)
        };
        snapshot = JSON.stringify([edicao.modulos.slice().sort(), edicao.turmas.slice().sort(), edicao.tipo]);
        var n = document.getElementById('nomeUsuarioEditando'); if (n) n.textContent = edicao.nome;
        var m = document.getElementById('emailUsuarioEditando'); if (m) m.textContent = edicao.email;
        var t = document.getElementById('permTipoUsuario'); if (t) t.value = edicao.tipo;
        var av = document.getElementById('permAvatar'); if (av) av.textContent = iniciais(edicao.nome, edicao.email);
        var sm = document.getElementById('permBuscaModulos'); if (sm) sm.value = '';
        var st = document.getElementById('permBuscaTurmas'); if (st) st.value = '';
        var pr = document.getElementById('permPreset'); if (pr) pr.value = '';
        renderizarModulos();
        renderizarTurmas();
        atualizarEstado();
        var modal = document.getElementById('modalEditPerfil');
        if (modal) modal.classList.add('active');
    }

    function renderizarModulos() {
        var box = document.getElementById('listaModulosCheckbox');
        if (!box || !edicao) return;
        var busca = ((document.getElementById('permBuscaModulos') || {}).value || '').toLowerCase().trim();
        var html = CATALOGO.map(function (g) {
            var visiveis = g.itens.filter(function (i) {
                return !busca || i.nome.toLowerCase().indexOf(busca) >= 0 || i.desc.toLowerCase().indexOf(busca) >= 0 || i.chave.indexOf(busca) >= 0;
            });
            if (!visiveis.length) return '';
            var ativos = g.itens.filter(function (i) { return edicao.modulos.indexOf(i.chave) >= 0; }).length;
            var linhas = visiveis.map(function (i) {
                var marcado = edicao.modulos.indexOf(i.chave) >= 0;
                return '<label class="pm-item">' +
                    '<input type="checkbox" ' + (marcado ? 'checked' : '') + ' onchange="pmToggleModulo(\'' + i.chave + '\', this.checked)">' +
                    '<span class="tx"><span class="t1">' + i.icone + ' ' + escaparHTML(i.nome) + (i.sensivel ? '<span class="pm-sensivel">sensível</span>' : '') + '</span>' +
                    '<span class="t2">' + escaparHTML(i.desc) + '</span><br><span class="key">' + i.chave + '</span></span>' +
                    '</label>';
            }).join('');
            return '<div class="pm-grupo" style="--c:' + g.cor + ';">' +
                '<div class="pm-grupo-cab">' +
                    '<span class="ic">' + g.icone + '</span>' +
                    '<span class="nm">' + g.nome + '</span>' +
                    '<span class="ct">' + ativos + '/' + g.itens.length + '</span>' +
                    '<button type="button" class="pm-mini-btn" onclick="pmToggleGrupo(\'' + g.id + '\')">' + (ativos === g.itens.length ? 'Desmarcar' : 'Marcar todos') + '</button>' +
                '</div>' + linhas + '</div>';
        }).join('');
        box.innerHTML = html || '<div class="pm-vazio">🔍 Nenhum módulo corresponde à busca.</div>';
        var c = document.getElementById('permContadorModulos');
        if (c) c.textContent = edicao.modulos.length + ' de ' + TODAS_CHAVES.length + ' módulos';
    }

    function renderizarTurmas() {
        var box = document.getElementById('listaTurmasCheckbox');
        if (!box || !edicao) return;
        var busca = ((document.getElementById('permBuscaTurmas') || {}).value || '').toLowerCase().trim();
        var lista = turmasDisponiveis.filter(function (t) { return !busca || (t.nome || '').toLowerCase().indexOf(busca) >= 0; });
        if (!lista.length) { box.innerHTML = '<div class="pm-vazio">🏫 Nenhuma turma encontrada.</div>'; return; }
        box.innerHTML = lista.map(function (t) {
            var marcado = edicao.turmas.indexOf(Number(t.id)) >= 0;
            return '<label class="pm-turma"><input type="checkbox" ' + (marcado ? 'checked' : '') + ' onchange="pmToggleTurma(' + t.id + ', this.checked)"><span>' + escaparHTML(t.nome || ('Turma ' + t.id)) + '</span></label>';
        }).join('');
        var c = document.getElementById('permContadorTurmas');
        if (c) c.textContent = edicao.turmas.length + ' de ' + turmasDisponiveis.length + ' turmas';
    }

    function pmToggleModulo(chave, on) {
        if (!edicao) return;
        var i = edicao.modulos.indexOf(chave);
        if (on && i < 0) edicao.modulos.push(chave);
        if (!on && i >= 0) edicao.modulos.splice(i, 1);
        renderizarModulos(); atualizarEstado();
    }
    function pmToggleGrupo(gid) {
        if (!edicao) return;
        var g = CATALOGO.find(function (x) { return x.id === gid; });
        if (!g) return;
        var todos = g.itens.every(function (i) { return edicao.modulos.indexOf(i.chave) >= 0; });
        g.itens.forEach(function (i) {
            var idx = edicao.modulos.indexOf(i.chave);
            if (todos && idx >= 0) edicao.modulos.splice(idx, 1);
            if (!todos && idx < 0) edicao.modulos.push(i.chave);
        });
        renderizarModulos(); atualizarEstado();
    }
    function pmToggleTurma(id, on) {
        if (!edicao) return;
        var n = Number(id);
        var i = edicao.turmas.indexOf(n);
        if (on && i < 0) edicao.turmas.push(n);
        if (!on && i >= 0) edicao.turmas.splice(i, 1);
        renderizarTurmas(); atualizarEstado();
    }
    function pmTodasTurmas(on) {
        if (!edicao) return;
        edicao.turmas = on ? turmasDisponiveis.map(function (t) { return Number(t.id); }) : [];
        renderizarTurmas(); atualizarEstado();
    }
    function pmTodosModulos(on) {
        if (!edicao) return;
        edicao.modulos = on ? TODAS_CHAVES.slice() : [];
        renderizarModulos(); atualizarEstado();
    }
    function pmAplicarPreset() {
        var sel = document.getElementById('permPreset');
        if (!sel || !edicao) return;
        var p = PRESETS.find(function (x) { return x.id === sel.value; });
        if (!p || !p.chaves) return;
        edicao.modulos = p.chaves.slice();
        renderizarModulos(); atualizarEstado();
        toast('Perfil aplicado: ' + p.nome + '. Revise e salve.', 'info');
    }
    function pmMudarTipo() {
        var t = document.getElementById('permTipoUsuario');
        if (!t || !edicao) return;
        edicao.tipo = t.value;
        atualizarEstado();
    }
    function atualizarEstado() {
        if (!edicao) return;
        var atual = JSON.stringify([edicao.modulos.slice().sort(), edicao.turmas.slice().sort(), edicao.tipo]);
        var sujo = atual !== snapshot;
        var st = document.getElementById('permStatusAlteracoes');
        if (st) { st.className = sujo ? 'pm-sujo' : 'pm-limpo'; st.textContent = sujo ? '● Alterações não salvas' : 'Nenhuma alteração pendente'; }
        var b = document.getElementById('btnSalvarPerfil');
        if (b) { b.disabled = !sujo; b.style.opacity = sujo ? '1' : '.6'; }
    }
    function pmCancelar() {
        if (!edicao) { fecharModal('modalEditPerfil'); return; }
        var atual = JSON.stringify([edicao.modulos.slice().sort(), edicao.turmas.slice().sort(), edicao.tipo]);
        if (atual !== snapshot && !confirm('Há alterações não salvas. Deseja descartar?')) return;
        fecharModal('modalEditPerfil');
    }

    async function patchPerfil(payload) {
        var alvo = edicao.id ? ('id=eq.' + edicao.id) : ('email=eq.' + encodeURIComponent(edicao.email));
        var corpo = Object.assign({}, payload);
        for (var tentativa = 0; tentativa < 4; tentativa++) {
            var r = await sbFetch('PATCH', '/rest/v1/perfis?' + alvo, corpo);
            if (r.ok) return true;
            var txt = await r.text();
            var m = txt.match(/Could not find the '([a-zA-Z_]+)' column/i) || txt.match(/column "([a-zA-Z_]+)" does not exist/i) || txt.match(/'([a-zA-Z_]+)' column of/i);
            if (m && corpo.hasOwnProperty(m[1])) { delete corpo[m[1]]; continue; }
            throw new Error(txt.substring(0, 220));
        }
        throw new Error('Não foi possível gravar as permissões.');
    }

    async function salvarPerfilCompleto() {
        if (!edicao) return;
        var btn = document.getElementById('btnSalvarPerfil');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Salvando...'; }
        try {
            await patchPerfil({
                modulos_ativos: edicao.modulos,
                turmas_id: edicao.turmas,
                turmas_ids: edicao.turmas,
                tipo_usuario: edicao.tipo
            });
            snapshot = JSON.stringify([edicao.modulos.slice().sort(), edicao.turmas.slice().sort(), edicao.tipo]);
            toast('✅ Permissões salvas para ' + edicao.nome + '!', 'success');
            var editado = edicao.email;
            fecharModal('modalEditPerfil');
            await pmRecarregarTudo();
            if (editado === emailAtual()) { permitidosCache = null; await aplicarPermissoesMenu(); }
        } catch (e) {
            toast('❌ ' + e.message, 'error');
        } finally {
            if (btn) { btn.textContent = '💾 SALVAR ALTERAÇÕES'; }
            atualizarEstado();
        }
    }

    // ========================================================================
    // APLICAÇÃO NO MENU
    // ========================================================================
    async function carregarPermitidos() {
        var mail = emailAtual();
        if (!mail) return;
        ehMasterCache = ehMaster(mail);
        if (ehMasterCache) { permitidosCache = TODAS_CHAVES.slice(); return; }
        try {
            var r = await sbFetch('GET', '/rest/v1/perfis?email=eq.' + encodeURIComponent(mail) + '&select=modulos_ativos');
            var d = r.ok ? await r.json() : [];
            permitidosCache = normalizarLista(d[0] && d[0].modulos_ativos);
        } catch (e) { /* mantém cache anterior */ }
    }

    async function aplicarPermissoesMenu() {
        if (permitidosCache === null) await carregarPermitidos();
        if (permitidosCache === null) return;
        $all('[data-modulo]').forEach(function (el) {
            var chave = el.getAttribute('data-modulo');
            if (TODAS_CHAVES.indexOf(chave) < 0) return;
            el.style.display = (ehMasterCache || permitidosCache.indexOf(chave) >= 0) ? '' : 'none';
        });
        if (typeof window.omrMenuAtualizarGrupos === 'function') window.omrMenuAtualizarGrupos();
        var aviso = document.getElementById('pmAvisoSemAcesso');
        var semNada = !ehMasterCache && permitidosCache.length === 0;
        var conteudo = document.querySelector('.content');
        if (semNada && conteudo && !aviso) {
            var d = document.createElement('div');
            d.id = 'pmAvisoSemAcesso';
            d.className = 'pm-aviso';
            d.innerHTML = '⚠️ Seu acesso ainda não foi configurado. Peça ao gestor para liberar os módulos em <strong>Gestão → Permissões</strong>.';
            conteudo.insertBefore(d, conteudo.firstChild);
        } else if (!semNada && aviso) { aviso.remove(); }
    }

    function moduloDaView(viewId) {
        var el = document.querySelector('[data-view="' + viewId + '"]');
        return el ? el.getAttribute('data-modulo') : null;
    }

    function instalarGuarda() {
        var anterior = window.navegarPara;
        window.navegarPara = function (viewId) {
            var chave = moduloDaView(viewId);
            if (chave && !ehMasterCache && permitidosCache && permitidosCache.indexOf(chave) < 0) {
                toast('🔒 Você não tem acesso a este módulo.', 'error');
                return;
            }
            if (typeof anterior === 'function') anterior.apply(this, arguments);
            if (viewId === 'view-gestao') { montarTelaGestao(); pmRecarregarTudo(); }
        };
    }

    function init() {
        montarTelaGestao();
        instalarGuarda();
        aplicarPermissoesMenu();
        [1200, 3500, 7000].forEach(function (t) { setTimeout(aplicarPermissoesMenu, t); });
        window.addEventListener('focus', function () { aplicarPermissoesMenu(); });
        var modal = document.getElementById('modalEditPerfil');
        if (modal) {
            modal.addEventListener('click', function (e) { if (e.target === modal) pmCancelar(); });
        }
    }

    // Exposição global
    window.pmEditar = pmEditar;
    window.pmFiltrar = pmFiltrar;
    window.pmAlternarFormulario = pmAlternarFormulario;
    window.pmAlternarSemAcesso = pmAlternarSemAcesso;
    window.pmRecarregarTudo = pmRecarregarTudo;
    window.pmToggleModulo = pmToggleModulo;
    window.pmToggleGrupo = pmToggleGrupo;
    window.pmToggleTurma = pmToggleTurma;
    window.pmTodasTurmas = pmTodasTurmas;
    window.pmTodosModulos = pmTodosModulos;
    window.pmAplicarPreset = pmAplicarPreset;
    window.pmMudarTipo = pmMudarTipo;
    window.pmCancelar = pmCancelar;
    window.salvarPerfilCompleto = salvarPerfilCompleto;
    window.cadastrarProfessorViaAPI = cadastrarProfessorViaAPI;
    window.carregarUsuariosGestao = pmRecarregarTudo;
    window.carregarUsuarios = pmRecarregarTudo;
    window.editarPerfilCompleto = function (email) { pmEditar(encodeURIComponent(String(email || '').toLowerCase())); };
    window.editarPermissoes = window.editarPerfilCompleto;
    window.editarPermissoesUsuario = window.editarPerfilCompleto;
    window.aplicarPermissoesMenu = aplicarPermissoesMenu;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

window.renderizarModulosPublico = function () {
    var evt = new Event('pm-render-modulos');
    document.dispatchEvent(evt);
};
window.renderizarTurmasPublico = function () {
    var evt = new Event('pm-render-turmas');
    document.dispatchEvent(evt);
};