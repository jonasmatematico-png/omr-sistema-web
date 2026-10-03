import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ConciliacaoBancaria() {
  const [arquivo, setArquivo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [processando, setProcessando] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setArquivo(file);
    setProcessando(true);

    try {
      const texto = await file.text();
      const transacoes = parseOFXSantander(texto);
      
      // Buscar lançamentos do mesmo período
      const datas = transacoes.map(t => t.data);
      const minData = Math.min(...datas);
      const maxData = Math.max(...datas);
      
      const { data: lancamentos } = await supabase
        .from('lancamentos')
        .select('*')
        .gte('data', new Date(minData).toISOString().split('T')[0])
        .lte('data', new Date(maxData).toISOString().split('T')[0]);

      // Cruzar dados
      const conciliacao = transacoes.map(ext => {
        const match = lancamentos?.find(l => 
          Math.abs(new Date(l.data) - new Date(ext.data)) < 3 * 24 * 60 * 60 * 1000 &&
          Math.abs(parseFloat(l.valor) - Math.abs(ext.valor)) < 0.01
        );
        return {
          extrato: ext,
          sistema: match || null,
          status: match ? 'conciliado' : 'pendente'
        };
      });

      setResultado(conciliacao);
    } catch (err) {
      alert('Erro ao processar OFX: ' + err.message);
    } finally {
      setProcessando(false);
    }
  }

  // Parser simplificado para Santander OFX
  function parseOFXSantander(texto) {
    const transacoes = [];
    const linhas = texto.split('\n');
    
    let atual = {};
    for (const linha of linhas) {
      const trim = linha.trim();
      if (trim.startsWith('<DTPOSTED>')) atual.data = trim.replace(/<[^>]+>/g, '');
      if (trim.startsWith('<TRNAMT>')) atual.valor = parseFloat(trim.replace(/<[^>]+>/g, ''));
      if (trim.startsWith('<MEMO>') || trim.startsWith('<NAME>')) atual.descricao = trim.replace(/<[^>]+>/g, '');
      if (trim === '</STMTTRN>') {
        if (atual.data && atual.valor !== undefined) {
          transacoes.push({ ...atual });
        }
        atual = {};
      }
    }
    return transacoes;
  }

  return (
    <div className="card">
      <h2>Conciliação Bancária - Santander</h2>
      <input type="file" accept=".ofx" onChange={handleUpload} disabled={processando} />
      
      {processando && <p>Processando extrato...</p>}
      
      {resultado && (
        <div style={{ marginTop: '20px' }}>
          <h3>Resultado da Conciliação</h3>
          <table>
            <thead>
              <tr>
                <th>Data Extrato</th>
                <th>Valor Extrato</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Lançamento Sistema</th>
              </tr>
            </thead>
            <tbody>
              {resultado.map((item, idx) => (
                <tr key={idx} style={{ background: item.status === 'pendente' ? '#fff3cd' : 'transparent' }}>
                  <td>{new Date(item.extrato.data).toLocaleDateString('pt-BR')}</td>
                  <td>R$ {Math.abs(item.extrato.valor).toFixed(2)}</td>
                  <td>{item.extrato.descricao}</td>
                  <td>{item.status === 'conciliado' ? '✅' : '️ Pendente'}</td>
                  <td>{item.sistema ? `R$ ${item.sistema.valor.toFixed(2)} - ${item.sistema.descricao}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}