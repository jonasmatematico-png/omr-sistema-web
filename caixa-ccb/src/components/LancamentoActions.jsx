import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const LancamentoActions = ({ lancamento, onUpdate }) => {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    descricao: lancamento.descricao,
    valor: lancamento.valor,
    metodo_rateio: lancamento.metodo_rateio || 'fixo',
    percentual_rateio: lancamento.percentual_rateio || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('lancamentos')
        .update({
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          metodo_rateio: formData.metodo_rateio,
          percentual_rateio: formData.percentual_rateio ? parseFloat(formData.percentual_rateio) : null
        })
        .eq('id', lancamento.id);

      if (error) throw error;
      
      setEditando(false);
      onUpdate();
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('️ Tem certeza absoluta que deseja EXCLUIR este lançamento?\nEsta ação não pode ser desfeita.')) return;
    
    try {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', lancamento.id);

      if (error) throw error;
      onUpdate();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  if (editando) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mt-2 space-y-2 min-w-[200px]">
        <input 
          name="descricao" 
          value={formData.descricao} 
          onChange={handleChange} 
          className="w-full border rounded p-1 text-sm"
          placeholder="Descrição"
        />
        <input 
          name="valor" 
          type="number" 
          step="0.01"
          value={formData.valor} 
          onChange={handleChange} 
          className="w-full border rounded p-1 text-sm"
          placeholder="Valor"
        />
        <select 
          name="metodo_rateio" 
          value={formData.metodo_rateio} 
          onChange={handleChange}
          className="w-full border rounded p-1 text-sm"
        >
          <option value="fixo">Fixo</option>
          <option value="igualitario">Igualitário</option>
          <option value="percentual">Percentual</option>
        </select>
        {formData.metodo_rateio === 'percentual' && (
          <input 
            name="percentual_rateio" 
            type="number" 
            step="0.01"
            value={formData.percentual_rateio} 
            onChange={handleChange} 
            className="w-full border rounded p-1 text-sm"
            placeholder="%"
          />
        )}
        <div className="flex gap-2">
          <button 
            onClick={handleUpdate} 
            disabled={loading}
            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            {loading ? '...' : 'Salvar'}
          </button>
          <button 
            onClick={() => setEditando(false)} 
            className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1 justify-center">
      <button 
        onClick={() => setEditando(true)}
        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        title="Editar lançamento"
      >
        ️
      </button>
      <button 
        onClick={handleDelete}
        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        title="Excluir lançamento"
      >
        🗑️
      </button>
    </div>
  );
};

export default LancamentoActions;