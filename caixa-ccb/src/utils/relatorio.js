import { supabase } from '../lib/supabaseClient';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function buscarDadosRelatorio(cidadeId, dataReferencia) {
  // Define o período do mês selecionado
  const inicioMes = format(startOfMonth(new Date(dataReferencia)), 'yyyy-MM-dd');
  const fimMes = format(endOfMonth(new Date(dataReferencia)), 'yyyy-MM-dd');

  // 1. BUSCAR SALDO INICIAL (Saldo final do mês anterior)
  let saldoInicial = 0;
  
  if (cidadeId && dataReferencia) {
    const mesAnteriorFormatado = format(subMonths(new Date(dataReferencia), 1), 'yyyy-MM');
    const inicioMesAnterior = format(startOfMonth(subMonths(new Date(dataReferencia), 1)), 'yyyy-MM-dd');
    const fimMesAnterior = format(endOfMonth(subMonths(new Date(dataReferencia), 1)), 'yyyy-MM-dd');

    const { data: lancamentosAnteriores, error: erroSaldo } = await supabase
      .from('lancamentos')
      .select('valor, tipo')
      .eq('cidade_id', cidadeId)
      .gte('data', inicioMesAnterior)
      .lte('data', fimMesAnterior);

    if (erroSaldo) {
      console.warn('Aviso ao buscar saldo inicial:', erroSaldo.message);
    } else if (lancamentosAnteriores) {
      saldoInicial = lancamentosAnteriores.reduce((acc, l) => {
        // Se não tiver 'tipo' ou for diferente de 'entrada', considera saída (subtrai)
        return l.tipo === 'entrada' 
          ? acc + parseFloat(l.valor || 0) 
          : acc - parseFloat(l.valor || 0);
      }, 0);
    }
  }

  // 2. BUSCAR LANÇAMENTOS DO MÊS ATUAL
  const { data: lancamentos, error } = await supabase
    .from('lancamentos')
    .select(`
      *,
      tipos_gasto (nome, categoria),
      igrejas (nome)
    `)
    .eq('cidade_id', cidadeId)
    .gte('data', inicioMes)
    .lte('data', fimMes)
    .order('data', { ascending: true });

  if (error) {
    console.error('Erro na consulta principal:', error);
    throw new Error(error.message);
  }

  // 3. PROCESSAR ENTRADAS E SAÍDAS
  let totalEntradas = 0;
  let totalSaidas = 0;
  const resumoPorCategoria = {};

  lancamentos.forEach(l => {
    const valor = parseFloat(l.valor) || 0;
    
    // Lógica segura: se 'tipo' for null ou undefined, trata como saída
    const ehEntrada = l.tipo === 'entrada';

    if (ehEntrada) {
      totalEntradas += valor;
    } else {
      totalSaidas += valor;
      
      const categoria = l.tipos_gasto?.categoria || 'Outros';
      
      if (!resumoPorCategoria[categoria]) {
        resumoPorCategoria[categoria] = { total: 0, itens: [] };
      }
      
      resumoPorCategoria[categoria].total += valor;
      
      // Acessamos l.igrejas.nome diretamente aqui
      resumoPorCategoria[categoria].itens.push({
        data: l.data,
        descricao: l.descricao,
        valor: valor,
        igreja: l.igrejas?.nome 
      });
    }
  });

  // 4. CALCULAR SALDO FINAL E RETORNAR DADOS
  const saldoFinal = saldoInicial + totalEntradas - totalSaidas;

  return {
    periodo: `${inicioMes} até ${fimMes}`,
    saldoInicial,
    totalEntradas,
    totalSaidas,
    saldoFinal,
    resumo: resumoPorCategoria,
    detalhes: lancamentos
  };
}