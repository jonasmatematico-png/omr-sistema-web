import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import LancamentoActions from './LancamentoActions';

const RelatorioMensal = () => {
  const [mesSelecionado, setMesSelecionado] = useState(new Date().toISOString().slice(0, 7));
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [lancamentos, setLancamentos] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carrega lista de cidades para filtro e cálculo de rateio
  useEffect(() => {
    const loadCidades = async () => {
      const { data } = await supabase.from('cidades').select('*').order('nome');
      if (data) setCidades(data);
    };
    loadCidades();
  }, []);

  // Busca TODOS os lançamentos do período (filtro de cidade feito no front-end)
  useEffect(() => {
    const fetchRelatorio = async () => {
      setLoading(true);
      try {
        const dataInicio = `${mesSelecionado}-01`;
        const [ano, mes] = mesSelecionado.split('-').map(Number);
        const proximoMes = mes === 12 
          ? `${ano + 1}-01-01` 
          : `${ano}-${String(mes + 1).padStart(2, '0')}-01`;

        // REMOVIDO O FILTRO DE CIDADE DA QUERY - TRAZ TUDO DO MÊS
        const { data, error } = await supabase
          .from('lancamentos')
          .select(`
            *,
            cidades(nome),
            igrejas(nome),
            tipos_gasto(nome)
          `)
          .gte('data', dataInicio)
          .lt('data', proximoMes)
          .order('data', { ascending: true });

        if (error) throw error;
        setLancamentos(data || []);
      } catch (err) {
        console.error('Erro ao buscar relatório:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatorio();
  }, [mesSelecionado]); // Removido cidadeFiltro das dependências

  // LÓGICA DE FILTRAGEM FRONT-END (agora funciona corretamente)
  const deveAparecerNoRelatorio = (item) => {
    // Sem filtro: mostra tudo
    if (!cidadeFiltro) return true;
    
    // Lançamento local da cidade selecionada: mostra sempre
    if (item.cidade_id === cidadeFiltro) return true;
    
    // Gasto da Mesa com rateio igualitário: aparece em TODAS as filhas
    if (
      item.tipo === 'saida' &&
      item.metodo_rateio === 'igualitario' &&
      item.cidades?.nome?.toLowerCase() === 'mesa de batatais'
    ) {
      return true;
    }
    
    // Entradas da Mesa ou outros casos: não aparecem nas filhas
    return false;
  };

  // Cálculo do valor exibido considerando rateio
  const calcularValorExibido = (item) => {
    if (item.tipo === 'entrada') return item.valor;
    
    if (
      item.tipo === 'saida' &&
      item.metodo_rateio === 'igualitario' &&
      item.cidades?.nome?.toLowerCase() === 'mesa de batatais'
    ) {
      const cidadesFilhas = cidades.filter(c => 
        c.nome.toLowerCase() !== 'mesa de batatais' && 
        c.nome.toLowerCase() !== 'matriz'
      );
      return item.valor / (cidadesFilhas.length || 1);
    }
    
    if (item.metodo_rateio === 'percentual' && item.percentual_rateio) {
      return (item.valor * item.percentual_rateio) / 100;
    }
    
    return item.valor;
  };

  // Aplica filtro e calcula totais sobre a lista visível
  const lancamentosVisiveis = lancamentos.filter(deveAparecerNoRelatorio);

  const totalSaidas = lancamentosVisiveis
    .filter(l => l.tipo === 'saida')
    .reduce((acc, curr) => acc + calcularValorExibido(curr), 0);

  const totalEntradas = lancamentosVisiveis
    .filter(l => l.tipo === 'entrada')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const recarregarDados = () => {
    // Re-busca dados após edição/exclusão
    const event = new CustomEvent('reload-relatorio');
    window.dispatchEvent(event);
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Relatório Mensal</h2>

      {/* Filtros */}
      <div className="mb-6 flex justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Cidade:</label>
          <select 
            value={cidadeFiltro} 
            onChange={(e) => setCidadeFiltro(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">Todas as Cidades</option>
            {cidades.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Período:</label>
          <input 
            type="month" 
            value={mesSelecionado} 
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="border rounded p-2"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando dados...</p>
      ) : (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Data</th>
                  <th className="border p-2 text-left">Tipo</th>
                  <th className="border p-2 text-left">Cidade Origem</th>
                  <th className="border p-2 text-left">Destino/Gasto</th>
                  <th className="border p-2 text-left">Descrição</th>
                  <th className="border p-2 text-right">Valor Rateado</th>
                  <th className="border p-2 text-center">Rateio</th>
                  <th className="border p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lancamentosVisiveis.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="border p-4 text-center text-gray-500">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : (
                  lancamentosVisiveis.map((item) => (
                    <tr key={item.id} className={item.tipo === 'saida' ? 'bg-red-50' : 'bg-green-50'}>
                      <td className="border p-2">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                      <td className="border p-2 capitalize">{item.tipo}</td>
                      <td className="border p-2">{item.cidades?.nome || '-'}</td>
                      <td className="border p-2">
                        {item.igrejas?.nome || item.tipos_gasto?.nome || '-'}
                      </td>
                      <td className="border p-2">{item.descricao}</td>
                      <td className="border p-2 text-right font-mono">
                        R$ {calcularValorExibido(item).toFixed(2)}
                      </td>
                      <td className="border p-2 text-center text-xs">
                        {item.metodo_rateio === 'igualitario' && '(÷3)'}
                        {item.metodo_rateio === 'percentual' && `(${item.percentual_rateio}%)`}
                        {item.metodo_rateio === 'fixo' && '-'}
                      </td>
                      <td className="border p-2 text-center">
                        <LancamentoActions 
                          lancamento={item} 
                          onUpdate={recarregarDados} 
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-100 rounded">
              <p className="text-sm text-green-800">Total Entradas</p>
              <p className="text-xl font-bold text-green-900">R$ {totalEntradas.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-red-100 rounded">
              <p className="text-sm text-red-800">Total Saídas (Rateadas)</p>
              <p className="text-xl font-bold text-red-900">R$ {totalSaidas.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded">
              <p className="text-sm text-blue-800">Saldo do Período</p>
              <p className={`text-xl font-bold ${totalEntradas - totalSaidas >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                R$ {(totalEntradas - totalSaidas).toFixed(2)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RelatorioMensal;