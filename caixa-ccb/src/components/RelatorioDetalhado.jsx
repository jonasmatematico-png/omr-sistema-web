import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const RelatorioDetalhado = () => {
  const [mesSelecionado, setMesSelecionado] = useState(new Date().toISOString().slice(0, 7));
  const [cidadeBaseId, setCidadeBaseId] = useState('');
  const [linhasTabela, setLinhasTabela] = useState([]);
  const [colunasCidades, setColunasCidades] = useState([]);
  const [todasCidades, setTodasCidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarListaCidades, setMostrarListaCidades] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [mesSelecionado, cidadeBaseId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: cidadesData } = await supabase.from('cidades').select('*').order('nome');
      if (!cidadesData) return;

      setTodasCidades(cidadesData);

      if (!cidadeBaseId && cidadesData.length > 0) {
        const mesaAuto = cidadesData.find(c => 
          c.nome.toLowerCase().includes('mesa') || 
          c.nome.toLowerCase().includes('matriz')
        );
        setCidadeBaseId(mesaAuto ? mesaAuto.id : cidadesData[0].id);
      }

      const filhas = cidadesData.filter(c => c.id !== cidadeBaseId);
      setColunasCidades(filhas);

      const dataInicio = `${mesSelecionado}-01`;
      const [ano, mes] = mesSelecionado.split('-').map(Number);
      const proximoMes = mes === 12 
        ? `${ano + 1}-01-01` 
        : `${ano}-${String(mes + 1).padStart(2, '0')}-01`;

      const { data: lancamentos } = await supabase
        .from('lancamentos')
        .select(`*, cidades(nome), tipos_gasto(nome)`)
        .gte('data', dataInicio)
        .lt('data', proximoMes);

      if (!lancamentos) {
        setLoading(false);
        return;
      }

      const mesaObj = cidadesData.find(c => c.id === cidadeBaseId);
      processarMatriz(lancamentos, filhas, mesaObj);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const processarMatriz = (lancamentos, filhas, mesa) => {
    const divisor = filhas.length || 1;
    const matrizTemp = {};

    lancamentos.forEach(item => {
      if (item.tipo !== 'saida' || !item.tipos_gasto) return;

      const nomeTipo = item.tipos_gasto.nome.trim(); 
      
      if (!matrizTemp[nomeTipo]) {
        matrizTemp[nomeTipo] = { 
          id: nomeTipo, 
          nomeExibicao: nomeTipo, 
          total: 0,
          valores: {} 
        };
        filhas.forEach(f => matrizTemp[nomeTipo].valores[f.id] = 0);
      }

      const isMesa = mesa && item.cidade_id === mesa.id;
      const cidadeId = item.cidade_id;
      const valor = item.valor;

      if (isMesa && item.metodo_rateio === 'igualitario') {
        const valDiv = valor / divisor;
        filhas.forEach(f => {
          if (matrizTemp[nomeTipo].valores[f.id] !== undefined) {
            matrizTemp[nomeTipo].valores[f.id] += valDiv;
          }
        });
        matrizTemp[nomeTipo].total += valor;
        
      } else if (!isMesa && cidadeId) {
        if (matrizTemp[nomeTipo].valores[cidadeId] !== undefined) {
          matrizTemp[nomeTipo].valores[cidadeId] += valor;
        }
        matrizTemp[nomeTipo].total += valor;

      } else if (isMesa) {
        matrizTemp[nomeTipo].total += valor;
      }
    });

    const resultadoFinal = Object.values(matrizTemp)
      .filter(linha => linha.total > 0)
      .sort((a, b) => a.nomeExibicao.localeCompare(b.nomeExibicao));

    setLinhasTabela(resultadoFinal);
  };

  const fmt = (val) => new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(val || 0);

  const baixarPDF = async () => {
    const element = document.getElementById('relatorio-container');
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff' 
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      const pdfRatio = pdfWidth / pdfHeight;
      
      let finalWidth, finalHeight, xPosition, yPosition;

      if (imgRatio > pdfRatio) {
        finalWidth = pdfWidth;
        finalHeight = finalWidth / imgRatio;
        xPosition = 0;
        yPosition = (pdfHeight - finalHeight) / 2;
      } else {
        finalHeight = pdfHeight - 10;
        finalWidth = finalHeight * imgRatio;
        xPosition = (pdfWidth - finalWidth) / 2;
        yPosition = 5;
      }
      
      pdf.addImage(imgData, 'PNG', xPosition, yPosition, finalWidth, finalHeight);
      pdf.save(`Relatorio-Mesa-${mesSelecionado}.pdf`);
      
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-blue-600 font-bold">Carregando dados da Mesa...</div>;
  }

  const cidadeBaseNome = todasCidades.find(c => c.id === cidadeBaseId)?.nome || 'Selecione...';

  return (
    <div id="relatorio-container" className="max-w-7xl mx-auto bg-white p-10 shadow-xl print:shadow-none font-sans rounded-xl">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-wide text-gray-900">Obra da Piedade</h1>
          <h2 className="text-lg font-medium mt-2 text-gray-500 tracking-widest uppercase">Resumo Consolidado de Gastos</h2>
        </div>
        
        <div className="flex flex-col items-end gap-4 print:hidden">
          
          <div className="flex gap-4">
            {/* SELETOR DE CIDADE BASE - BOTÃO COM LISTA FLUTUANTE */}
            <div className="relative z-50">
              <label className="text-xs font-bold text-blue-600 uppercase mb-1 block"> Cidade Base</label>
              <button 
                onClick={() => setMostrarListaCidades(!mostrarListaCidades)}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm font-bold text-gray-700 hover:border-blue-400 focus:outline-none flex justify-between items-center min-w-[180px]"
              >
                <span className="truncate">{cidadeBaseNome}</span>
                <span className="ml-2 text-xs shrink-0">▼</span>
              </button>
              
              {mostrarListaCidades && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl rounded mt-1 max-h-60 overflow-y-auto z-50">
                  {todasCidades.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { 
                        setCidadeBaseId(c.id); 
                        setMostrarListaCidades(false); 
                      }}
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm ${cidadeBaseId === c.id ? 'bg-blue-100 font-bold text-blue-700' : ''}`}
                    >
                      {c.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SELETOR DE MÊS */}
            <div className="flex flex-col z-50 relative bg-white p-2 rounded-lg shadow-sm border border-gray-200">
              <label className="text-xs font-bold text-blue-600 uppercase mb-1 cursor-pointer">📅 Período</label>
              <input 
                type="month" 
                value={mesSelecionado} 
                onChange={(e) => setMesSelecionado(e.target.value)}
                className="w-full text-center font-bold text-gray-700 outline-none cursor-pointer bg-transparent"
              />
            </div>
          </div>

          <button 
            onClick={baixarPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all flex items-center gap-2 text-sm"
          >
            📥 Exportar PDF
          </button>
        </div>
      </div>

      {linhasTabela.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-lg font-medium">Nenhum gasto registrado neste período.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr className="bg-gray-900 text-white text-sm uppercase tracking-wider">
                <th className="border-r border-gray-700 px-10 py-6 text-left w-1/3 font-semibold">Tipo de Gasto</th>
                {colunasCidades.map(c => (
                  <th key={c.id} className="border-r border-gray-700 px-10 py-6 text-right min-w-[160px] font-semibold">{c.nome}</th>
                ))}
                <th className="px-10 py-6 text-right bg-gray-800 min-w-[200px] font-bold">Total Mesa</th>
              </tr>
            </thead>
            <tbody>
              {linhasTabela.map((linha, idx) => (
                <tr 
                  key={linha.id} 
                  className={`even:bg-blue-50 odd:bg-white hover:bg-blue-100 transition-colors duration-200 border-b border-gray-100 last:border-0`}
                >
                  <td className="border-r border-gray-200 px-10 py-6 font-medium text-gray-700">{linha.nomeExibicao}</td>
                  
                  {colunasCidades.map(c => (
                    <td key={c.id} className="border-r border-gray-200 px-10 py-6 text-right font-mono text-gray-600">
                      {fmt(linha.valores?.[c.id] || 0)}
                    </td>
                  ))}
                  
                  <td className="px-10 py-6 text-right font-bold text-xl text-gray-900 bg-white bg-opacity-60">
                    {fmt(linha.total)}
                  </td>
                </tr>
              ))}
              
              {/* TOTALIZAÇÃO FINAL */}
              <tr className="bg-gray-900 text-white font-bold text-lg">
                <td className="border-r border-gray-700 px-10 py-6 uppercase tracking-wide">Total Geral de Saídas</td>
                {colunasCidades.map(c => {
                  const totalCidade = linhasTabela.reduce((acc, curr) => acc + (curr.valores?.[c.id] || 0), 0);
                  return (
                    <td key={c.id} className="border-r border-gray-700 px-10 py-6 text-right font-mono">
                      {fmt(totalCidade)}
                    </td>
                  );
                })}
                <td className="px-10 py-6 text-right bg-gray-800 font-mono">
                   {fmt(linhasTabela.reduce((acc, curr) => acc + (curr.total || 0), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* RODAPÉ */}
      <div className="mt-20 pt-10 border-t border-gray-200 grid grid-cols-2 gap-20 text-center text-xs uppercase tracking-widest text-gray-500">
        <div>
          <div className="border-t border-gray-400 w-1/2 mx-auto mb-3"></div>
          <p className="font-bold text-gray-700">Tesoureiro(a) Regional</p>
        </div>
        <div>
          <div className="border-t border-gray-400 w-1/2 mx-auto mb-3"></div>
          <p className="font-bold text-gray-700">Presidente da Mesa</p>
        </div>
      </div>
    </div>
  );
};

export default RelatorioDetalhado;