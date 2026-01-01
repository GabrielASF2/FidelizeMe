'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ScanLine, Coffee, Gift, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

// Inicializando Supabase (mantendo sua estrutura)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function WalletPage() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar qual cartão está sendo resgatado (Modal)
  const [voucherCard, setVoucherCard] = useState<any>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // JOIN Mágico do Supabase: Cards -> Campaigns -> Establishments
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select(`
          id,
          current_balance,
          campaigns (
            name,
            goal_count,
            establishments ( name, slug )
          )
        `)
        .eq('user_id', session.user.id);

      if (data) setCards(data);
      setLoading(false);
    };

    fetchWallet();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Minha Carteira 👜</h1>
        <p className="text-slate-500">Seus pontos e recompensas</p>
      </header>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Carregando cartões...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-400 mb-4">Você ainda não tem pontos.</p>
          <button 
             onClick={() => router.push('/customer/scan')}
             className="text-emerald-600 font-bold underline"
          >
            Escanear meu primeiro ponto
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => {
            const campaign = card.campaigns; // Dados da campanha
            const establishment = campaign.establishments; // Dados da loja
            const progress = (card.current_balance / campaign.goal_count) * 100;
            const isFull = card.current_balance >= campaign.goal_count;

            return (
              <div key={card.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <Coffee size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{establishment.name}</h3>
                            <p className="text-xs text-slate-500">{campaign.name}</p>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                        {card.current_balance} <span className="text-slate-400 text-sm font-normal">/ {campaign.goal_count}</span>
                    </div>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                </div>

                {/* AÇÃO: Se estiver cheio, mostra botão de Resgate. Se não, mostra quanto falta. */}
                {isFull ? (
                    <button 
                        onClick={() => setVoucherCard(card)}
                        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold p-3 rounded-xl shadow-lg animate-pulse hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                        <Gift size={20} /> 
                        RESGATAR PRÊMIO
                    </button>
                ) : (
                    <p className="text-xs text-slate-400 text-right">
                        Faltam {campaign.goal_count - card.current_balance} para o prêmio
                    </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Botão Flutuante de Scan (FAB) */}
      <button
        onClick={() => router.push('/customer/scan')}
        className="fixed bottom-6 right-6 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-90 z-10"
      >
        <ScanLine size={28} />
      </button>

      {/* MODAL DE VOUCHER (Resgate) */}
      {voucherCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative">
            <button 
                onClick={() => setVoucherCard(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
            >
                <X size={24} />
            </button>

            <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">Vale-Prêmio! 🎁</h3>
                <p className="text-slate-500 text-sm mb-6">Mostre este código ao atendente.</p>
                
                <div className="bg-slate-100 p-6 rounded-2xl mb-4 flex justify-center border-2 border-dashed border-slate-300">
                    {/* O QR Code contém o ID do cartão em formato JSON */}
                    <QRCodeSVG value={JSON.stringify({ card_id: voucherCard.id })} size={200} />
                </div>

                <p className="text-xs text-slate-400">ID: {voucherCard.id.slice(0,8)}...</p>
            </div>
            </div>
        </div>
       )}

    </div>
  );
}