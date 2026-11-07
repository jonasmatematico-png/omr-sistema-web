// ========================================================================
// CONFIGURAÇÕES GERAIS DO SISTEMA (LABORATÓRIO 2027)
// ========================================================================
var SUPABASE_URL = 'https://mkqnaiuplkqiitwxltli.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcW5haXVwbGtxaWl0d3hsdGxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTg5MzMsImV4cCI6MjA5OTk3NDkzM30.65MoDC1gMNpNs6bCKZlCTyCn2ijaaA6y9DOnQgNxacA';

// ATENÇÃO: Esta é a URL do NOSSO BACKEND DE LABORATÓRIO!
var API_BASE_URL = 'https://omr-backend-laboratorio.onrender.com';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var token = localStorage.getItem('sb_token');
var refreshToken = localStorage.getItem('sb_refresh');
var userEmail = localStorage.getItem('sb_email') || '';

var COLUNAS = {
    ABERTAS: { tabela: 'questoes_abertas', descritor: 'descritor_codigo', habilidade: 'habilidade_codigo' },
    OBJETIVAS: { tabela: 'questoes', descritor: 'descritor', habilidade: 'habilidade' }
};

var EMAIL_ADMIN_MASTER = 'jonasmatematico@yahoo.com.br';

var questoes = [];
var questoesObj = [];
var editandoId = null;
var editandoIdObj = null;
var matrizHabilidades = [];