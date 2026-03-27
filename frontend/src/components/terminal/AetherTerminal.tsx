'use client';

import { useEffect, useRef, useState } from 'react';
import type { Terminal as XtermType } from 'xterm';
import type { FitAddon as FitAddonType } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import { useAuth } from '../../context/AuthContext';

interface AetherTerminalProps {
  deploymentId: string | null;
}

export default function AetherTerminal({ deploymentId }: AetherTerminalProps) {
  const { getToken } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstanceRef = useRef<XtermType | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !terminalRef.current || isInitialized.current) return;

    let term: XtermType;
    let fitAddon: FitAddonType;

    const initTerminal = async () => {
      // Dynamic import to avoid SSR issues
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');

      if (!terminalRef.current || isInitialized.current) return;

      term = new Terminal({
        theme: {
          background: '#09090b',
          foreground: '#a78bfa',
          cursor: '#6d28d9',
          black: '#09090b',
          blue: '#3b82f6',
          green: '#22c55e',
          red: '#ef4444',
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 13,
        cursorBlink: true,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      term.open(terminalRef.current);
      xtermInstanceRef.current = term;
      isInitialized.current = true;

      const handleResize = () => {
        try {
          fitAddon.fit();
        } catch (e) {}
      };

      window.addEventListener('resize', handleResize);
      
      // Delay initial fit
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {}
      }, 200);

      term.writeln('\x1b[1;35m[aether]\x1b[0m Waiting for secure deployment log stream...');
    };

    initTerminal();

    return () => {
      isInitialized.current = false;
      if (xtermInstanceRef.current) {
        try {
            xtermInstanceRef.current.dispose();
            xtermInstanceRef.current = null;
        } catch (e) {}
      }
    };
  }, []);

  // SSE Effect
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isCancelled = false;
    
    const connect = async () => {
      if (!deploymentId) return;

      // Small delay to ensure terminal instance is ready from the first effect
      await new Promise(r => setTimeout(r, 300));
      
      if (isCancelled || !xtermInstanceRef.current) return;
      
      const term = xtermInstanceRef.current;
      const token = await getToken();
      if (isCancelled || !term || !token) return;

      term.clear();
      term.writeln(`\x1b[1;36m[info]\x1b[0m Log-Room Secured for deployment: ${deploymentId}`);
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      eventSource = new EventSource(`${backendUrl}/api/deployments/${deploymentId}/logs?token=${token}`);

      eventSource.onmessage = (event) => {
        if (isCancelled || !xtermInstanceRef.current) return;
        const data = JSON.parse(event.data);
        if (data.message) {
          xtermInstanceRef.current.writeln(`\x1b[1;32m>\x1b[0m ${data.message}`);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    };

    connect();

    return () => {
      isCancelled = true;
      eventSource?.close();
    };
  }, [deploymentId, getToken]);

  return (
    <div className="w-full h-full bg-[#09090b] rounded-xl overflow-hidden border border-white/5">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
