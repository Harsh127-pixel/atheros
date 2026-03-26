'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import { useAuth } from '../../context/AuthContext';

interface AetherTerminalProps {
  deploymentId: string | null;
}

export default function AetherTerminal({ deploymentId }: AetherTerminalProps) {
  const { getToken } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize Xterm
    const term = new Terminal({
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

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    
    term.writeln('\x1b[1;35m[aether]\x1b[0m Waiting for AetherOS deployment logs...');
    xtermRef.current = term;

    return () => {
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!deploymentId || !xtermRef.current) return;

    let eventSource: EventSource | null = null;
    const term = xtermRef.current;
    
    const connect = async () => {
      const token = await getToken();
      if (!token) return;

      term.clear();
      term.writeln(`\x1b[1;36m[info]\x1b[0m Connected to Log-Room for deployment: ${deploymentId}`);
      
      // Connect to SSE Log-Room
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      eventSource = new EventSource(`${backendUrl}/api/deployments/${deploymentId}/logs?token=${token}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.message) {
          term.writeln(`\x1b[1;32m>\x1b[0m ${data.message}`);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        eventSource?.close();
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, [deploymentId]);

  return (
    <div className="w-full h-full bg-[#09090b] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
