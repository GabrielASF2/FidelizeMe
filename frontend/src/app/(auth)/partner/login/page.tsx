'use client';

import { createClient } from '@supabase/supabase-js';
import { Store, ArrowRight, User } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export default function PartnerLoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    // 1. DEFINE A INTENÇÃO: DONO (OWNER)
    // Isso é o segredo. Salvamos no navegador que quem clicar aqui quer ser CHEFE.
    localStorage.setItem('user_role_intent', 'OWNER');

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
      
      {/* Branding Diferente (Corporativo) */}
      <div className="mb-12 flex flex-col items-center">
        <div className="bg-slate-900 p-4 rounded-2xl shadow-xl mb-6">
          <Store size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-center text-slate-900">
          Painel do Parceiro
        </h1>
        <p className="text-slate-500 mt-2 text-center max-w-xs">
          Gerencie sua loja e fidelize clientes.
        </p>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full max-w-sm bg-slate-900 text-white font-bold py-4 px-6 rounded-xl 
                   flex items-center justify-center gap-3 hover:bg-slate-800 transition-all 
                   active:scale-95 disabled:opacity-70 shadow-lg mb-8"
      >
        {loading ? (
           <span>Carregando...</span>
        ) : (
          <>
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="w-6 h-6" 
            />
            <span>Entrar como Parceiro</span>
            <ArrowRight size={20} className="text-slate-400" />
          </>
        )}
      </button>

      <Link 
        href="/login"
        className="text-slate-400 hover:text-slate-900 text-sm flex items-center gap-2 transition-colors"
      >
        <User size={16} />
        Sou cliente e quero ver meus pontos
      </Link>
    </div>
  );
}