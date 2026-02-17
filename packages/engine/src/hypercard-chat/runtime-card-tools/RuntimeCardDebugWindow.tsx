import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getPendingRuntimeCards,
  onRegistryChange,
  type RuntimeCardDefinition,
} from '../../plugin-runtime';
import type { ArtifactRecord } from '../artifacts/artifactsSlice';
import { SyntaxHighlight } from '../utils/syntaxHighlight';

interface StoreSlice {
  artifacts?: { byId: Record<string, ArtifactRecord> };
  pluginCardRuntime?: {
    sessions: Record<
      string,
      {
        stackId: string;
        status: string;
        error?: string;
        cardState: Record<string, Record<string, unknown>>;
      }
    >;
  };
}

export interface RuntimeDebugStackCard {
  id: string;
  title?: string;
  icon?: string;
  type?: string;
}

export interface RuntimeDebugStackInfo {
  id: string;
  name: string;
  homeCard: string;
  cards: RuntimeDebugStackCard[];
}

export interface RuntimeCardDebugWindowProps {
  stack: RuntimeDebugStackInfo;
  onOpenCodeEditor?: (cardId: string, code: string) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: 13,
          borderBottom: '1px solid #999',
          paddingBottom: 4,
          marginBottom: 8,
          color: '#111',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function CodePreview({ code, maxLines = 8 }: { code: string; maxLines?: number }) {
  return <SyntaxHighlight code={code} language="javascript" maxLines={maxLines} />;
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 600,
        padding: '1px 6px',
        borderRadius: 3,
        background: color,
        color: '#fff',
        marginLeft: 6,
      }}
    >
      {text}
    </span>
  );
}

export function RuntimeCardDebugWindow({
  stack,
  onOpenCodeEditor,
}: RuntimeCardDebugWindowProps) {
  const [registryCards, setRegistryCards] = useState<RuntimeCardDefinition[]>(
    getPendingRuntimeCards(),
  );

  useEffect(() => {
    const update = () => setRegistryCards(getPendingRuntimeCards());
    return onRegistryChange(update);
  }, []);

  const artifacts = useSelector((s: StoreSlice) => s.artifacts?.byId ?? {});
  const sessions = useSelector((s: StoreSlice) => s.pluginCardRuntime?.sessions ?? {});

  const runtimeArtifacts = Object.values(artifacts).filter((a) => a.runtimeCardId);

  const td: React.CSSProperties = {
    padding: '3px 8px',
    fontSize: 11,
    borderBottom: '1px solid #ccc',
    verticalAlign: 'top',
    color: '#111',
  };
  const th: React.CSSProperties = {
    ...td,
    fontWeight: 700,
    background: '#e8e8f0',
    position: 'sticky',
    top: 0,
    color: '#111',
  };

  return (
    <div
      style={{
        padding: 12,
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#111',
        overflow: 'auto',
        height: '100%',
      }}
    >
      <Section title={`📇 Stack: ${stack.name} (${stack.id})`}>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
          homeCard: <code>{stack.homeCard}</code> · {stack.cards.length} predefined cards
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Icon</th>
              <th style={th}>ID</th>
              <th style={th}>Title</th>
              <th style={th}>Type</th>
            </tr>
          </thead>
          <tbody>
            {stack.cards.map((card) => (
              <tr key={card.id}>
                <td style={td}>{card.icon}</td>
                <td style={td}>
                  <code>{card.id}</code>
                </td>
                <td style={td}>{card.title ?? card.id}</td>
                <td style={td}>{card.type ?? 'plugin'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title={`🃏 Runtime Card Registry (${registryCards.length})`}>
        {registryCards.length === 0 ? (
          <div style={{ fontSize: 11, color: '#555' }}>No runtime cards registered yet.</div>
        ) : (
          registryCards.map((card) => (
            <div
              key={card.cardId}
              style={{ marginBottom: 12, border: '1px solid #ccc', borderRadius: 4, padding: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <code style={{ fontWeight: 700 }}>{card.cardId}</code>
                <Badge text="registered" color="#2d6a4f" />
                <span style={{ fontSize: 10, color: '#555' }}>
                  {new Date(card.registeredAt).toLocaleTimeString()}
                </span>
                {onOpenCodeEditor ? (
                  <button
                    onClick={() => onOpenCodeEditor(card.cardId, card.code)}
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 3,
                      border: '1px solid #999',
                      background: '#f0f0f0',
                      cursor: 'pointer',
                      marginLeft: 'auto',
                    }}
                  >
                    ✏️ Edit
                  </button>
                ) : null}
              </div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                code: {card.code.length} chars, {card.code.split('\n').length} lines
              </div>
              <CodePreview code={card.code} />
            </div>
          ))
        )}
      </Section>

      <Section title={`🗃 Artifacts with Runtime Cards (${runtimeArtifacts.length})`}>
        {runtimeArtifacts.length === 0 ? (
          <div style={{ fontSize: 11, color: '#555' }}>No artifacts with runtime card code.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Artifact ID</th>
                <th style={th}>Card ID</th>
                <th style={th}>Title</th>
                <th style={th}>Injection</th>
                <th style={th}>Code</th>
              </tr>
            </thead>
            <tbody>
              {runtimeArtifacts.map((artifact) => (
                <tr key={artifact.id}>
                  <td style={td}>
                    <code>{artifact.id}</code>
                  </td>
                  <td style={td}>
                    <code>{artifact.runtimeCardId}</code>
                  </td>
                  <td style={td}>{artifact.title}</td>
                  <td style={td}>
                    {artifact.injectionStatus === 'injected' && (
                      <Badge text="injected" color="#2d6a4f" />
                    )}
                    {artifact.injectionStatus === 'pending' && (
                      <Badge text="pending" color="#e67e22" />
                    )}
                    {artifact.injectionStatus === 'failed' && (
                      <Badge text="failed" color="#c0392b" />
                    )}
                    {!artifact.injectionStatus && <Badge text="unknown" color="#666" />}
                    {artifact.injectionError ? (
                      <div style={{ fontSize: 10, color: '#c0392b', marginTop: 2 }}>
                        {artifact.injectionError}
                      </div>
                    ) : null}
                  </td>
                  <td style={td}>
                    {artifact.runtimeCardCode
                      ? `${artifact.runtimeCardCode.length} chars`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={`⚙️ Plugin Sessions (${Object.keys(sessions).length})`}>
        {Object.keys(sessions).length === 0 ? (
          <div style={{ fontSize: 11, color: '#555' }}>No active plugin sessions.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Session ID</th>
                <th style={th}>Stack</th>
                <th style={th}>Status</th>
                <th style={th}>Card States</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sessions).map(([sessionId, session]) => (
                <tr key={sessionId}>
                  <td style={td}>
                    <code>{sessionId}</code>
                  </td>
                  <td style={td}>{session.stackId}</td>
                  <td style={td}>
                    {session.status === 'ready' && <Badge text="ready" color="#2d6a4f" />}
                    {session.status === 'loading' && (
                      <Badge text="loading" color="#e67e22" />
                    )}
                    {session.status === 'error' && <Badge text="error" color="#c0392b" />}
                    {session.error ? (
                      <div style={{ fontSize: 10, color: '#c0392b', marginTop: 2 }}>
                        {session.error}
                      </div>
                    ) : null}
                  </td>
                  <td style={td}>
                    {Object.keys(session.cardState ?? {}).map((cardId) => (
                      <div key={cardId}>
                        <code style={{ fontSize: 10 }}>{cardId}</code>
                      </div>
                    ))}
                    {Object.keys(session.cardState ?? {}).length === 0 ? (
                      <span style={{ color: '#555' }}>—</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
