import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRealtime(
  channelName: string,
  table: string,
  filter: string,
  onEvent: (payload: any) => void
) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        onEvent
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [channelName, table, filter]);
}
