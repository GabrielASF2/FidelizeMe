'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { QrCode, Store, Plus, Save, Loader2, Award, Gift } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const router = useRouter();
  
  // Estados de Dados
  const [establishment, setEstablishment] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Formulários
  const [storeForm, setStoreForm] = useState({ name: '', slug: '', address: '' });
  const [campaignForm, setCampaignForm] = useState({ name: '', goal: 10, description: '' });

  // 1. Carregar Dados Iniciais
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Busca Loja
    const { data: storeData } = await supabase
      .from('establishments')
      .select('*')
      .eq('owner_id', session.user.id)
      .single();

    if (storeData) {
      setEstablishment(storeData);
      
      // Se tem loja, busca campanha
      const { data: campData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('establishment_id', storeData.id)
        .eq('active', true)
        .single();
      
      if (campData) setCampaign(campData);
    }
    
    setLoading(false);
  };

  // 2. Ação: Criar Loja
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/establishments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(storeForm)
      });

      if (!res.ok) throw new Error('Erro ao criar loja');
      
      // Recarrega para atualizar estado
      await fetchData();
      
    } catch (error) {
      alert('Erro ao criar loja. Verifique se o Slug já existe.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Ação: Criar Campanha
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          establishment_id: establishment.id, // Vincula à loja que já temos
          name: campaignForm.name,
          description: campaignForm.description,
          goal_count: Number(campaignForm.goal)
        })
      });

      if (!res.ok) throw new Error('Erro ao criar campanha');

      await fetchData();

    } catch (error) {
      alert('Erro ao criar campanha.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      <Loader2 className="animate-spin mr-2" /> Carregando seu império...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel do Parceiro</h1>
          <p className="text-slate-500 text-sm">
             {establishment ? establishment.name : 'Bem-vindo(a)'}
          </p>
        </div>
      </header>

      {/* CASO 1: SEM LOJA -> FORMULÁRIO DE LOJA */}
      {!establishment && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 p-4 rounded-full">
              <Store className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-2">Cadastre sua Loja</h2>
          <p className="text-slate-500 text-center mb-6 text-sm">
            Para começar, precisamos saber onde os clientes vão pontuar.
          </p>

          <form onSubmit={handleCreateStore} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Estabelecimento</label>
              <input 
                required
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                placeholder="Ex: Hamburgueria do João"
                value={storeForm.name}
                onChange={e => setStoreForm({...storeForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slug (URL Única)</label>
              <input 
                required
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                placeholder="Ex: hamburgueria-joao"
                value={storeForm.slug}
                onChange={e => setStoreForm({...storeForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
              />
            </div>
             <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Endereço</label>
              <input 
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                placeholder="Rua das Flores, 123"
                value={storeForm.address}
                onChange={e => setStoreForm({...storeForm, address: e.target.value})}
              />
            </div>
            <button 
              disabled={submitting}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin"/> : <Save size={18} />}
              Salvar Loja
            </button>
          </form>
        </div>
      )}

      {/* CASO 2: TEM LOJA, SEM CAMPANHA -> FORMULÁRIO DE CAMPANHA */}
      {establishment && !campaign && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-fade-in-up">
           <div className="flex justify-center mb-6">
            <div className="bg-orange-100 p-4 rounded-full">
              <Award className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-2">Crie sua Regra</h2>
          <p className="text-slate-500 text-center mb-6 text-sm">
            Como seus clientes ganham prêmios?
          </p>

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Campanha</label>
              <input 
                required
                className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none text-slate-800"
                placeholder="Ex: Cartão Fidelidade Café"
                value={campaignForm.name}
                onChange={e => setCampaignForm({...campaignForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Meta de Selos</label>
              <input 
                type="number"
                min="1"
                required
                className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none text-slate-800"
                placeholder="10"
                value={campaignForm.goal}
                onChange={e => setCampaignForm({...campaignForm, goal: Number(e.target.value)})}
              />
              <p className="text-xs text-slate-400 mt-1">Quantos pontos para ganhar o prêmio?</p>
            </div>
             <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Prêmio</label>
              <input 
                className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none text-slate-800"
                placeholder="Ex: Ganhe 1 Café Expresso"
                value={campaignForm.description}
                onChange={e => setCampaignForm({...campaignForm, description: e.target.value})}
              />
            </div>
            <button 
              disabled={submitting}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex justify-center items-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin"/> : <Plus size={18} />}
              Ativar Campanha
            </button>
          </form>
        </div>
      )}

      {/* CASO 3: TUDO PRONTO -> DASHBOARD REAL */}
      {establishment && campaign && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs text-slate-400 uppercase font-bold">Campanha Ativa</p>
                <p className="font-bold text-slate-800 mt-1 truncate">{campaign.name}</p>
                <p className="text-xs text-emerald-600 mt-1">Meta: {campaign.goal_count} selos</p>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs text-slate-400 uppercase font-bold">ID da Loja</p>
                <p className="font-bold text-slate-800 mt-1 truncate">{establishment.slug}</p>
                <p className="text-xs text-slate-400 mt-1">Sistema Online</p>
             </div>
          </div>

          {/* Botão Principal */}
          <button
            onClick={() => router.push('/admin/terminal')}
            className="w-full bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20 
                       flex flex-col items-center justify-center gap-3 hover:bg-slate-800 transition transform active:scale-95"
          >
            <QrCode size={48} className="text-emerald-400"/>
            <div>
                <span className="text-xl font-bold block">Abrir Terminal</span>
                <span className="text-slate-400 text-sm">Gerar pontos para clientes</span>
            </div>
          </button>
          {/* Botão Validar Resgate */}
          <button
            onClick={() => router.push('/admin/validate')}
            className="w-full bg-white text-slate-900 border-2 border-slate-100 p-6 rounded-3xl shadow-sm
                       flex items-center gap-4 hover:bg-slate-50 transition active:scale-95"
          >
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                <Gift size={24} />
            </div>
            <div className="text-left">
                <span className="text-lg font-bold block text-slate-900">Validar Voucher</span>
                <span className="text-slate-400 text-sm">Dar baixa em prêmios</span>
            </div>
          </button>

           <div className="text-center">
              <button 
                className="text-slate-400 text-xs underline"
                onClick={() => alert('Em breve: Edição de campanha')}
              >
                Editar Configurações
              </button>
           </div>
        </div>
      )}
    </div>
  );
}