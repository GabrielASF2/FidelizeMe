'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Loader2, ArrowLeft } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Função disparada quando a câmera detecta algo
  const handleScan = async (result: { rawValue?: string; text?: string } | null) => {
    if (loading || !result) return; // Se já tá processando ou não leu nada, ignora

    // O result vem como objeto, pegamos o .rawValue
    const token = result?.rawValue || result?.text || result; 
    
    if (!token) return;

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      // CHAMA O BACK-END (NestJS)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ token })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao processar código');
      }

      // SUCESSO!
      alert(`Boooora! ${data.message}`); // Ou use um Toast mais bonito
      router.push('/customer/wallet'); // Manda o cliente ver o saldo

    } catch (err) {
      console.error(err);
      // Evita flood de alertas se o QR for inválido, mostra na tela
      setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido');
      // Dá um tempo para tentar de novo
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 z-10">
        <button onClick={() => router.back()} className="text-white p-2 bg-white/10 rounded-full">
          <ArrowLeft />
        </button>
        <h1 className="text-white font-bold text-lg">Escanear Código</h1>
      </div>

      {/* Câmera */}
      <div className="flex-1 flex flex-col justify-center relative overflow-hidden bg-black">
        {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-emerald-500">
                <Loader2 className="w-16 h-16 animate-spin mb-4" />
                <p className="animate-pulse">Validando ponto...</p>
            </div>
        ) : (
            <div className="w-full max-w-md mx-auto aspect-square relative border-2 border-emerald-500 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                 <Scanner
                    onScan={(result) => handleScan(result[0])} // Callback da leitura
                    constraints={{ facingMode: 'environment' }} // Câmera traseira
                    scanDelay={500} // Lê a cada 500ms para não travar
                    styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
                 />
                 {/* Mira visual */}
                 <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
            </div>
        )}
        
        {/* Mensagem de Erro (se houver) */}
        {errorMsg && (
            <div className="mx-6 mt-6 bg-red-500/20 text-red-200 p-4 rounded-xl text-center border border-red-500/50">
                {errorMsg}
            </div>
        )}
      </div>

      <div className="p-6 text-center text-slate-500 text-sm">
        Aponte a câmera para o QR Code do caixa.
      </div>
    </div>
  );
}