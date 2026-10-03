import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const LancamentoForm = () => {
  const [cidades, setCidades] = useState([]);
  const [igrejas, setIgrejas] = useState([]);
  const [tiposGasto, setTiposGasto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    tipo: 'saida',
    data: new Date().toISOString().split('T')[0],
    cidade_id: '',
    igreja_id: '',
    tipo_gasto_id: '',
    descricao: '',
    valor: '',
    numero_reuniao: '',
    grupo_atendimento: '',
    metodo_rateio: 'fixo',
    percentual_rateio: ''
  });

  // Carregar Cidades e Tipos de Gasto ao iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: cidadesData } = await supabase.from('cidades').select('*').order('nome');
        const { data: tiposData } = await supabase.from('tipos_gasto').select('*').order('nome');
        
        if (cidadesData) setCidades(cidadesData);
        if (tiposData) setTiposGasto(tiposData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMessage('Erro ao carregar listas.');
      }
    };
    fetchData();
  }, []);

  // Carregar Igrejas conforme a Cidade selecionada
  useEffect(() => {
    const fetchIgrejas = async () => {
      if (!formData.cidade_id) {
        setIgrejas([]);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('igrejas')
          .select('*')
          .eq('cidade_id', formData.cidade_id)
          .eq('ativa', true)
          .order('nome');
          
        setIgrejas(data || []);
        setFormData(prev => ({ ...prev, igreja_id: '' }));
      } catch (error) {
        console.error('Erro ao buscar igrejas:', error);
      }
    };
    fetchIgrejas();
  }, [formData.cidade_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        tipo: formData.tipo, 
        data: formData.data,
        cidade_id: formData.cidade_id || null,
        igreja_id: formData.igreja_id === '' ? null : formData.igreja_id,
        tipo_gasto_id: formData.tipo_gasto_id || null,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        numero_reuniao: formData.numero_reuniao ? parseInt(formData.numero_reuniao) : null,
        grupo_atendimento: formData.grupo_atendimento || null,
        metodo_rateio: formData.metodo_rateio || 'fixo',
        percentual_rateio: formData.percentual_rateio ? parseFloat(formData.percentual_rateio) : null,
      };

      const { error } = await supabase.from('lancamentos').insert([payload]);

      if (error) throw error;

      setMessage('✅ Lançamento salvo com sucesso!');
      setFormData(prev => ({
        ...prev,
        descricao: '',
        valor: '',
        numero_reuniao: '',
        percentual_rateio: '',
        metodo_rateio: 'fixo'
      }));

    } catch (error) {
      console.error(error);
      setMessage(`❌ Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para calcular o rateio igualitário
  const getRateioPreview = () => {
    if (formData.metodo_rateio !== 'igualitario' || !formData.valor) return null;
    const total = parseFloat(formData.valor);
    const porCidade = total / 3; // Total fixo de 3 cidades
    return { total, porCidade };
  };

  const rateioPreview = getRateioPreview();

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Novo Lançamento</h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded text-center ${message.includes('sucesso') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Tipo de Movimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimento:</label>
          <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full border rounded p-2">
            <option value="saida">Saída (Gasto)</option>
            <option value="entrada">Entrada (Recurso)</option>
          </select>
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data:</label>
          <input type="date" name="data" value={formData.data} onChange={handleChange} required className="w-full border rounded p-2" />
        </div>

        {/* Cidade Base */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade Base:</label>
          <select name="cidade_id" value={formData.cidade_id} onChange={handleChange} required className="w-full border rounded p-2">
            <option value="">Selecione a Cidade...</option>
            {cidades.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Igreja / Bairro */}
        {formData.cidade_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Igreja / Bairro:</label>
            <select name="igreja_id" value={formData.igreja_id} onChange={handleChange} className="w-full border rounded p-2">
              <option value="">-- Gasto Central (Sem Bairro) --</option>
              {igrejas.map(i => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Deixe vazio para gastos institucionais da Mesa.</p>
          </div>
        )}

        {/* Tipo de Gasto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gasto:</label>
          <select name="tipo_gasto_id" value={formData.tipo_gasto_id} onChange={handleChange} required className="w-full border rounded p-2">
            <option value="">Selecione...</option>
            {tiposGasto.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>

        {/* CAMPOS DE RATEIO - Apenas para Saídas */}
        {formData.tipo === 'saida' && (
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200 space-y-3">
            <h3 className="font-semibold text-yellow-800 text-sm">Opções de Rateio (Opcional)</h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Método de Rateio:</label>
              <select name="metodo_rateio" value={formData.metodo_rateio} onChange={handleChange} className="w-full border rounded p-2 text-sm">
                <option value="fixo">Fixo (Sem rateio)</option>
                <option value="percentual">Percentual (%)</option>
                <option value="igualitario">Igualitário (Dividir entre cidades)</option>
              </select>
            </div>

            {formData.metodo_rateio === 'percentual' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Percentual (%):</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="percentual_rateio" 
                  value={formData.percentual_rateio} 
                  onChange={handleChange} 
                  placeholder="Ex: 33.33" 
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            )}

            {/* FEEDBACK VISUAL DO RATEIO IGUALITÁRIO */}
            {rateioPreview && (
              <div className="mt-2 p-3 bg-white rounded border border-green-200">
                <p className="text-xs font-semibold text-green-800 mb-1">💰 Previsão de Rateio:</p>
                <p className="text-sm text-gray-700">
                  Valor total: R$ {rateioPreview.total.toFixed(2)}<br/>
                  Dividido entre 3 cidades = <strong>R$ {rateioPreview.porCidade.toFixed(2)}</strong> para cada uma.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição:</label>
          <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} required placeholder="Detalhes..." className="w-full border rounded p-2" />
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$):</label>
          <input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} required placeholder="0.00" className="w-full border rounded p-2" />
        </div>

        {/* Campos de Reunião - SOMENTE SE HOUVER IGREJA SELECIONADA */}
        {formData.igreja_id && formData.tipo === 'saida' && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nº Reunião:</label>
              <input type="number" name="numero_reuniao" value={formData.numero_reuniao} onChange={handleChange} placeholder="Ex: 5" className="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Grupo Atendimento:</label>
              <select name="grupo_atendimento" value={formData.grupo_atendimento} onChange={handleChange} className="w-full border rounded p-2 text-sm">
                <option value="">Nenhum</option>
                <option value="irmaos">Irmãos</option>
                <option value="irmas">Irmãs</option>
                <option value="casais">Casais</option>
              </select>
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-3 px-4 rounded text-white font-bold mt-4 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Salvando...' : 'Salvar Lançamento'}
        </button>

      </form>
    </div>
  );
};

export default LancamentoForm;