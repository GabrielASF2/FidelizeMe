'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState('Verificando sessão...');

  useEffect(() => {
    const checkUser = async () => {
      // 1. Verifica se o navegador acha que tem alguém logado
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      setStatus('Sincronizando perfil...');

      // Recupera a intenção (OWNER ou CUSTOMER) salva no login
      // Se não tiver nada, assume undefined
      const intentRole = typeof window !== 'undefined' ? localStorage.getItem('user_role_intent') : null;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: session.user.email,
            full_name: session.user.user_metadata.full_name,
            avatar_url: session.user.user_metadata.avatar_url,
            role: intentRole || undefined 
          }),
        });

        // --- CORREÇÃO DO LOOP ---
        if (!res.ok) {
            console.error('Erro na API:', res.status);
            // Se o back-end rejeitou (401/403/500), o token é inválido ou o user foi deletado.
            // Forçamos o logout para limpar o navegador.
            await supabase.auth.signOut();
            localStorage.removeItem('sb-access-token'); // Limpeza extra (nome varia conforme config, mas signOut ajuda)
            router.replace('/login');
            return;
        }

        const profile = await res.json();

        localStorage.removeItem('user_role_intent');

        if (profile.role === 'OWNER') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/customer/wallet'); 
        }

      } catch (error) {
        console.error('Erro fatal:', error);
        // Se a rede caiu ou algo grave rolou, chuta pro login pra tentar de novo
        await supabase.auth.signOut();
        router.replace('/login');
      }
    };

    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-500">
      <Loader2 size={48} className="animate-spin mb-4" />
      <p className="text-slate-400 animate-pulse">{status}</p>
    </div>
  );
}