import { useState, useEffect } from 'react';
// Imports dos componentes na mesma pasta
import LancamentoForm from './LancamentoForm';
import ConciliacaoBancaria from './ConciliacaoBancaria';
import RelatorioMensal from './RelatorioMensal';
import RelatorioDetalhado from './RelatorioDetalhado';

// Imports de utils e lib (subindo um nível)
import { gerarPDFComTemplate, baixarPDF } from '../utils/pdfGenerator';
import { supabase } from '../lib/supabaseClient';
import '../App.css';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('lancamentos');
  const [cidadeSelecionada, setCidadeSelecionada] = useState('');
  const [cidades, setCidades] = useState([]);
  const [mostrarListaCidades, setMostrarListaCidades] = useState(false);

  useEffect(() => {
    async function carregarCidades() {
      const { data } = await supabase.from('cidades').select('*').order('nome');
      setCidades(data || []);
    }
    carregarCidades();
  }, []);

  async function handleGerarPDF(tipoDoc) {
    if (!cidadeSelecionada) {
      alert('Selecione uma cidade primeiro!');
      return;
    }
    
    try {
      const { data: lancamentos, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('cidade_id', cidadeSelecionada)
        .order('data', { ascending: false })
        .limit(5);

      if (error) throw error;

      const ultimoLancamento = lancamentos && lancamentos.length > 0 ? lancamentos[0] : null;

      const dadosReais = {
        data: ultimoLancamento?.data || new Date(),
        valor: ultimoLancamento?.valor || 0,
        descricao: ultimoLancamento?.descricao || 'Sem lançamentos recentes',
        igreja: ultimoLancamento?.igreja_id ? 'Ver detalhes' : 'Geral',
        local: 'Sede',
        km: 0,
        saldoInicial: 0,
        entradas: 0,
        saidas: 0,
        saldoFinal: 0
      };
      
      const doc = await gerarPDFComTemplate(tipoDoc, dadosReais, cidadeSelecionada);
      baixarPDF(doc, `${tipoDoc}-${new Date().toISOString().split('T')[0]}`);
      
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF: ' + err.message);
    }
  }

  // Pega o nome da cidade selecionada para exibir no botão
  const cidadeNome = cidades.find(c => c.id === cidadeSelecionada)?.nome || 'Selecione...';

  return (
    <div className="container">
      <h1>📊 Sistema de Caixa - Mesa da Piedade</h1>
      
      {/* FILTRO DE CIDADE COM BOTÃO E LISTA FLUTUANTE */}
      <div className="card filtro-cidade relative z-50 inline-block">
        <label className="text-sm font-bold text-gray-700 mr-2">Cidade Base:</label>
        
        <button 
          onClick={() => setMostrarListaCidades(!mostrarListaCidades)}
          className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none flex items-center gap-2 min-w-[160px] justify-between"
        >
          <span className="truncate">{cidadeNome}</span>
          <span className="text-xs shrink-0">▼</span>
        </button>
        
        {mostrarListaCidades && (
          <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl rounded mt-1 max-h-60 overflow-y-auto z-50">
            {cidades.map(c => (
              <div 
                key={c.id} 
                onClick={() => { 
                  setCidadeSelecionada(c.id); 
                  setMostrarListaCidades(false); 
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm ${cidadeSelecionada === c.id ? 'bg-blue-100 font-bold text-blue-700' : ''}`}
              >
                {c.nome}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BARRA DE ABAS PRINCIPAL */}
      <div className="abas">
        <button className={abaAtiva === 'lancamentos' ? 'ativa' : ''} onClick={() => setAbaAtiva('lancamentos')}> Lançamentos</button>
        <button className={abaAtiva === 'conciliacao' ? 'ativa' : ''} onClick={() => setAbaAtiva('conciliacao')}>🏦 Conciliação Bancária</button>
        <button className={abaAtiva === 'documentos' ? 'ativa' : ''} onClick={() => setAbaAtiva('documentos')}> Documentos Oficiais</button>
        <button className={abaAtiva === 'relatorio' ? 'ativa' : ''} onClick={() => setAbaAtiva('relatorio')}>📈 Relatório Mensal</button>
        <button className={abaAtiva === 'detalhado' ? 'ativa' : ''} onClick={() => setAbaAtiva('detalhado')}>📋 Relatório Detalhado</button>
      </div>

      <div className="conteudo-aba">
        {abaAtiva === 'lancamentos' && <LancamentoForm onSucesso={() => console.log('Lançamento salvo!')} />}
        {abaAtiva === 'conciliacao' && <ConciliacaoBancaria />}
        
        {/* Passamos a cidade selecionada para os relatórios filtrarem automaticamente */}
        {abaAtiva === 'relatorio' && <RelatorioMensal cidadeId={cidadeSelecionada} />}
        {abaAtiva === 'detalhado' && <RelatorioDetalhado cidadeId={cidadeSelecionada} />}
        
        {abaAtiva === 'documentos' && (
          <div className="card documentos-grid">
            <h2>Gerar Documentos Oficiais</h2>
            <p className="aviso">Selecione a cidade acima antes de gerar</p>
            <div className="botoes-documentos">
              <button onClick={() => handleGerarPDF('irmas')}>Exclusivo Irmãs & Colaboradores</button>
              <button onClick={() => handleGerarPDF('verificacaoCaixa')}>Termo de Verificação de Caixa</button>
              <button onClick={() => handleGerarPDF('conciliacao')}>Conciliação Bancária</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}