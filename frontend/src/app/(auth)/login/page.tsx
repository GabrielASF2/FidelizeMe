/* eslint-disable @next/next/no-img-element */
'use client';

import { createClient } from '@supabase/supabase-js';
// 1. REMOVA O 'Link' DAQUI
import { QrCode, ArrowRight, Store } from 'lucide-react'; 
// 2. ADICIONE ELE AQUI
import Link from 'next/link'; 
import { useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
  
    const handleLogin = async () => {
      setLoading(true);
      
      // 1. DEFINE A INTENÇÃO: CLIENTE
      localStorage.setItem('user_role_intent', 'CUSTOMER');
  
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
          
          <div className="mb-12 flex flex-col items-center animate-fade-in-up">
            <div className="bg-emerald-500 p-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-6 transform rotate-3">
              <QrCode size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-center">
              Fidelize<span className="text-emerald-400">.Me</span>
            </h1>
            <p className="text-slate-400 mt-3 text-center max-w-xs text-lg">
              Cliente
            </p>
          </div>
    
          {/* Botão de Login */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full max-w-sm bg-white text-slate-900 font-bold py-4 px-6 rounded-xl 
                       flex items-center justify-center gap-3 hover:bg-slate-200 transition-all 
                       active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl mb-8"
          >
            {loading ? (
              <span>Indo para o Google...</span>
            ) : (
              <>
                <img 
                  src="https://www.svgrepo.com/show/475656/google-color.svg" 
                  alt="Google" 
                  className="w-6 h-6" 
                />
                <span>Entrar como Cliente</span>
                <ArrowRight size={20} className="text-slate-400" />
              </>
            )}
          </button>
    
          {/* AGORA VAI FUNCIONAR: Link do Next.js */}
          <Link 
            href="/partner/login"
            className="text-slate-500 hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors border border-slate-800 px-4 py-2 rounded-full cursor-pointer"
          >
            <Store size={16} />
            Você é dono de estabelecimento?
          </Link>
    
        </div>
      );
}