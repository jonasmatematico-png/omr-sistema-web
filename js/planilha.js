async function carregarSelectsPlanilha() {
    await carregarTurmasPermitidas('selTurmaPlanilha');
    try {
        var rp = await sbFetch('GET', '/rest/v1/avaliacoes?select=id,nome,modo_correcao&order=id.desc');
        var provas = await rp.json();
        var selProva = document.getElementById('selProvaPlanilha');
        if(selProva) {
            selProva.innerHTML = '<option value="">Selecione...</option>' + provas.map(function(p) {
                var tag = p.modo_correcao === 'aberta' ? ' (aberta)' : ' (objetiva)';
                return '<option value="' + p.id + '">' + p.nome + tag + '</option>';
            }).join('');
        }
    } catch(e) { console.error(e); }
}