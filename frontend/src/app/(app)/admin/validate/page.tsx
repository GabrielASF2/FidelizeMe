'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ValidatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultStatus, setResultStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');

  const handleScan = async (result: { rawValue?: string; text?: string } | null) => {
    if (loading || !result || resultStatus !== 'IDLE') return;
    
    // Tenta ler o texto do QR Code
    const text = result?.rawValue || result?.text;
    if (!text) return;

    try {
      // O QR do voucher é um JSON: { "card_id": "..." }
      const data = JSON.parse(text);
      if (!data.card_id) return;

      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      // Chama o endpoint de RESGATE
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ card_id: data.card_id })
      });

      const respData = await res.json();

      if (!res.ok) throw new Error(respData.message);

      // Sucesso!
      setMessage(respData.message); // "Resgate efetuado!"
      setResultStatus('SUCCESS');

      // Volta pro dashboard depois de 3 seg
      setTimeout(() => router.push('/admin/dashboard'), 3000);

    } catch (err) {
      console.error(err);
      setMessage(err instanceof Error ? err.message : 'QR Code inválido');
      setResultStatus('ERROR');
      
      // Reseta pra tentar de novo em 3 seg
      setTimeout(() => {
        setResultStatus('IDLE');
        setLoading(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
       <div className="p-4 flex items-center gap-4 text-white z-10">
        <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full">
            <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg">Validar Voucher</h1>
      </div>

      <div className="flex-1 bg-black relative flex flex-col justify-center overflow-hidden">
        
        {/* Camada de Feedback (Sucesso/Erro) */}
        {resultStatus !== 'IDLE' && (
             <div className="absolute inset-0 z-30 bg-black/90 flex items-center justify-center flex-col animate-fade-in p-6 text-center">
                {resultStatus === 'SUCCESS' ? (
                    <>
                        <CheckCircle className="w-24 h-24 text-emerald-500 mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">Resgate Sucesso!</h2>
                        <p className="text-emerald-400">{message}</p>
                    </>
                ) : (
                    <>
                        <XCircle className="w-24 h-24 text-red-500 mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">Erro</h2>
                        <p className="text-red-400">{message}</p>
                    </>
                )}
             </div>
        )}

        {/* Câmera */}
        <div className="relative w-full aspect-square max-w-md mx-auto">
            {loading && resultStatus === 'IDLE' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center text-emerald-400 bg-black/50">
                    <Loader2 className="w-12 h-12 animate-spin" />
                </div>
            )}
            
            <Scanner
                onScan={(result) => handleScan(result[0])}
                constraints={{ facingMode: 'environment' }}
                scanDelay={500}
                styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
            />
            
            {/* Mira Visual */}
            <div className="absolute inset-0 border-[50px] border-black/60 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-emerald-500/50 w-64 h-64 rounded-xl animate-pulse"></div>
            </div>
        </div>

        <p className="text-center text-slate-500 mt-8 mb-8">
            Aponte para o QR Code do cliente
        </p>
      </div>
    </div>
  );
}