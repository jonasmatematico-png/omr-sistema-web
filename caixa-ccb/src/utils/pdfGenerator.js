import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';

// Mapeamento dos templates (nomes seguros sem acento/espaço)
const TEMPLATES = {
  irmas: '/templates/exclusivo-irmas-colaboradores.pdf',
  locomocao: '/templates/relatorio-locomocao-diaconos.pdf',
  verificacaoCaixa: '/templates/termo-verificacao-caixa.pdf',
  conciliacao: '/templates/conciliacao-bancaria.pdf'
};

export async function gerarPDFComTemplate(tipoDocumento, dados, cidadeId) {
  const templatePath = TEMPLATES[tipoDocumento];
  if (!templatePath) throw new Error(`Template não encontrado: ${tipoDocumento}`);

  try {
    // 1. Carregar o PDF template original
    const response = await fetch(templatePath);
    const arrayBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // 2. Obter a primeira página do template
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // 3. Buscar responsáveis ativos para assinaturas
    const { data: responsaveis } = await supabase
      .from('responsaveis')
      .select('nome_completo, cargo')
      .eq('cidade_id', cidadeId)
      .eq('ativo', true);

    // 4. Embutir fonte padrão
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    // Função auxiliar para escrever texto
    const drawText = (text, x, y, size = fontSize) => {
      firstPage.drawText(text, {
        x,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    };

    // 5. Preencher campos dinâmicos conforme o tipo de documento
    // Nota: As coordenadas (x, y) são aproximadas. Você precisará ajustar 
    // os valores abaixo visualmente após o primeiro teste.
    // No pdf-lib, o Y=0 é a parte inferior da página.
    
    switch(tipoDocumento) {
      case 'irmas':
        drawText(format(new Date(dados.data), 'dd/MM/yyyy', { locale: ptBR }), 50, height - 50);
        drawText(`R$ ${parseFloat(dados.valor).toFixed(2)}`, 150, height - 50);
        drawText(dados.igreja || '', 50, height - 80);
        break;
      
      case 'locomocao':
        drawText(format(new Date(dados.data), 'dd/MM/yyyy', { locale: ptBR }), 50, height - 50);
        drawText(dados.local || '', 150, height - 50);
        drawText(`${dados.km || 0} km`, 50, height - 80);
        drawText(`R$ ${parseFloat(dados.valor).toFixed(2)}`, 150, height - 80);
        break;

      case 'verificacaoCaixa':
        drawText(`R$ ${parseFloat(dados.saldoInicial || 0).toFixed(2)}`, 50, height - 50);
        drawText(`R$ ${parseFloat(dados.entradas || 0).toFixed(2)}`, 150, height - 50);
        drawText(`R$ ${parseFloat(dados.saidas || 0).toFixed(2)}`, 50, height - 80);
        drawText(`R$ ${parseFloat(dados.saldoFinal || 0).toFixed(2)}`, 150, height - 80);
        break;

      case 'conciliacao':
        drawText(`R$ ${parseFloat(dados.extrato || 0).toFixed(2)}`, 50, height - 50);
        drawText(`R$ ${parseFloat(dados.sistema || 0).toFixed(2)}`, 150, height - 50);
        break;
    }

    // 6. Adicionar assinaturas automaticamente na parte inferior
    if (responsaveis && responsaveis.length > 0) {
      let yPos = 100; // Começa a 100px do fundo da página
      responsaveis.forEach(resp => {
        drawText(resp.nome_completo, 50, yPos);
        yPos -= 20; // Desce 20px para a próxima assinatura
      });
    }

    // 7. Salvar e retornar o PDF modificado
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;

  } catch (err) {
    throw new Error(`Erro ao processar PDF: ${err.message}`);
  }
}

// Função auxiliar para download (atualizada para receber bytes)
export function baixarPDF(pdfBytes, nomeArquivo) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nomeArquivo}.pdf`;
  link.click();
}