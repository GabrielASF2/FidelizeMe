'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react'; // Biblioteca que instalamos
import { Loader2, CheckCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TerminalPage() {
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null); // { token, establishment_id }
  const [status, setStatus] = useState('WAITING'); // WAITING, GENERATED, SUCCESS

  // Função para chamar o Backend NestJS
  const generateCode = async () => {
    setLoading(true);
    setStatus('WAITING');
    
    // 1. Pegar sessão para o Bearer Token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 2. Descobrir o ID da loja deste dono (Cachear isso seria bom, mas vamos buscar rapidinho)
    const { data: establishment } = await supabase
        .from('establishments')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();
    
    if (!establishment) {
      alert('Você precisa criar uma loja primeiro (via Postman)');
      setLoading(false);
      return;
    }

    // 3. Chamar a API
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qrcodes/generate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ establishment_id: establishment.id })
      });

      if (!res.ok) throw new Error('Erro ao gerar');
      
      const data = await res.json();
      setTokenData(data); // data.token é o que precisamos
      setStatus('GENERATED');

    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com API');
    } finally {
      setLoading(false);
    }
  };

  // Efeito Realtime: Escutar quando o QR for usado
  useEffect(() => {
    if (!tokenData || status !== 'GENERATED') return;

    console.log("Escutando alterações no token:", tokenData.token);

    const channel = supabase
      .channel('qr-confirmation')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qr_tokens',
          filter: `token=eq.${tokenData.token}` // Filtra só este token
        },
        (payload: any) => {
          if (payload.new.used_at) {
            // OPA! ALGUÉM USOU!
            setStatus('SUCCESS');
            // Reseta depois de 3 segundos para gerar outro
            setTimeout(() => {
                setTokenData(null);
                setStatus('WAITING');
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tokenData, status]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      
      {status === 'WAITING' && (
        <button
          onClick={generateCode}
          disabled={loading}
          className="w-full max-w-sm bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-12 rounded-3xl 
                     shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex flex-col items-center gap-4"
        >
           {loading ? <Loader2 className="animate-spin w-12 h-12"/> : <QRCodeSVG value="placeholder" size={48} opacity={0.5} />}
           <span className="text-2xl">GERAR PONTO (+1)</span>
        </button>
      )}

      {status === 'GENERATED' && tokenData && (
        <div className="flex flex-col items-center animate-fade-in">
            <div className="bg-white p-8 rounded-3xl mb-6 shadow-2xl">
                {/* O QR Code Real contém apenas o TOKEN */}
                <QRCodeSVG value={tokenData.token} size={250} />
            </div>
            <h2 className="text-2xl font-bold animate-pulse text-emerald-400">Aguardando cliente...</h2>
            <p className="text-slate-500 mt-2">Expira em 5 minutos</p>
            <button 
                onClick={() => setStatus('WAITING')} 
                className="mt-8 text-slate-500 underline text-sm"
            >
                Cancelar
            </button>
        </div>
      )}

      {status === 'SUCCESS' && (
        <div className="flex flex-col items-center animate-bounce-slow">
            <CheckCircle className="w-32 h-32 text-emerald-500 mb-6" />
            <h2 className="text-4xl font-bold text-white">Sucesso!</h2>
            <p className="text-xl text-emerald-400 mt-2">Ponto computado.</p>
        </div>
      )}
    </div>
  );
}