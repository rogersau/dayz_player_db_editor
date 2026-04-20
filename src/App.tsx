import { ChangeEvent, useMemo, useState } from 'react';
import { InventoryTree } from './components/InventoryTree';
import { countAllItems, readPlayers } from './lib/parser';
import { getSqlModule } from './lib/sql';
import { steamIdToUid } from './lib/steam';
import type { PlayerRecord } from './types';

interface ViewState {
  players: PlayerRecord[];
  filteredPlayers: PlayerRecord[];
  selectedUid: string | null;
  statusMessage: string;
  hasError: boolean;
  fileLoaded: boolean;
}

const initialState: ViewState = {
  players: [],
  filteredPlayers: [],
  selectedUid: null,
  statusMessage: 'Select a player database to begin.',
  hasError: false,
  fileLoaded: false
};

function App() {
  const [viewState, setViewState] = useState<ViewState>(initialState);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedPlayer = useMemo(
    () => viewState.filteredPlayers.find((player) => player.uid === viewState.selectedUid) ?? null,
    [viewState.filteredPlayers, viewState.selectedUid]
  );

  const alivePlayers = useMemo(
    () => viewState.players.filter((player) => player.alive).length,
    [viewState.players]
  );

  const handleDatabaseChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsLoading(true);
    setSearchQuery('');
    setViewState({
      ...initialState,
      statusMessage: `Loading ${file.name}...`
    });

    try {
      const sqlModule = await getSqlModule();
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const database = new sqlModule.Database(fileBytes);
      const players = readPlayers(database);
      database.close();

      setViewState({
        players,
        filteredPlayers: players,
        selectedUid: players[0]?.uid ?? null,
        statusMessage: `Loaded ${players.length} player record${players.length === 1 ? '' : 's'} from ${file.name}.`,
        hasError: false,
        fileLoaded: true
      });
    } catch (error) {
      console.error(error);
      setViewState({
        ...initialState,
        statusMessage: error instanceof Error ? error.message : 'Failed to load the database.',
        hasError: true
      });
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleSearchChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    const normalizedQuery = query.trim().toLowerCase();
    const convertedUid = query.trim().length === 17 ? await steamIdToUid(query.trim()) : null;

    setViewState((currentState) => {
      const filteredPlayers = currentState.players.filter((player) => {
        if (!normalizedQuery) {
          return true;
        }

        return player.uid.toLowerCase().includes(normalizedQuery)
          || (convertedUid !== null && player.uid === convertedUid)
          || (player.characterName ?? '').toLowerCase().includes(normalizedQuery);
      });

      const selectedUid = filteredPlayers.some((player) => player.uid === currentState.selectedUid)
        ? currentState.selectedUid
        : filteredPlayers[0]?.uid ?? null;

      return {
        ...currentState,
        filteredPlayers,
        selectedUid
      };
    });
  };

  const selectPlayer = (uid: string) => {
    setViewState((currentState) => ({
      ...currentState,
      selectedUid: uid
    }));
  };

  const totalSelectedItems = selectedPlayer ? countAllItems(selectedPlayer.items) : 0;

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Client-side viewer</p>
          <h1>DayZ Player DB Viewer</h1>
          <p className="subtitle">
            Open a <code>.db</code> file in your browser and inspect player records without uploading it to a server.
          </p>
        </div>

        <section className="upload-card">
          <label className="file-picker" htmlFor="database-file">
            <span>Choose player database</span>
            <input
              id="database-file"
              type="file"
              accept=".db,.sqlite,.sqlite3,application/vnd.sqlite3"
              onChange={handleDatabaseChange}
              disabled={isLoading}
            />
          </label>
          <p className={`status-message${viewState.hasError ? ' error' : ''}`}>{viewState.statusMessage}</p>
        </section>
      </header>

      <section className="toolbar">
        <label className="field">
          <span>Find player by UID / Steam64 / name</span>
          <input
            type="search"
            placeholder="Search players"
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={!viewState.fileLoaded}
          />
        </label>
        <div className="stats">
          <div className="stat">
            <span className="stat-label">Records</span>
            <strong>{viewState.players.length}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Alive</span>
            <strong>{alivePlayers}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Dead</span>
            <strong>{viewState.players.length - alivePlayers}</strong>
          </div>
        </div>
      </section>

      <section className="layout">
        <aside className="panel">
          <div className="panel-header">
            <h2>Players</h2>
          </div>
          {viewState.filteredPlayers.length === 0 ? (
            <div className="empty-state">
              {viewState.players.length === 0
                ? 'Upload a database to load player records.'
                : 'No players match the current search.'}
            </div>
          ) : (
            <div className="players-list" aria-live="polite">
              {viewState.filteredPlayers.map((player) => {
                const parsedItems = countAllItems(player.items);

                return (
                  <button
                    key={player.uid}
                    type="button"
                    className={`player-card${player.uid === viewState.selectedUid ? ' active' : ''}`}
                    onClick={() => selectPlayer(player.uid)}
                  >
                    <div className="player-card-header">
                      <strong>{player.uid}</strong>
                      <span className={`status-pill${player.alive ? '' : ' dead'}`}>{player.alive ? 'Alive' : 'Dead'}</span>
                    </div>
                    <div className="player-meta">
                      DB ID {player.id} • {parsedItems} parsed item{parsedItems === 1 ? '' : 's'}
                    </div>
                    <div className="player-name">{player.characterName || 'Unnamed character'}</div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="panel details-panel">
          <div className="panel-header">
            <h2>Player details</h2>
          </div>
          {selectedPlayer === null ? (
            <div className="empty-state">Choose a player to view the parsed inventory tree.</div>
          ) : (
            <div className="player-details">
              <dl className="details-grid">
                <div>
                  <dt>DB ID</dt>
                  <dd>{selectedPlayer.id}</dd>
                </div>
                <div>
                  <dt>UID</dt>
                  <dd>{selectedPlayer.uid}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{selectedPlayer.characterName || 'Unnamed character'}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selectedPlayer.alive ? 'Alive' : 'Dead'}</dd>
                </div>
                <div>
                  <dt>Top-level items</dt>
                  <dd>{selectedPlayer.items.length}</dd>
                </div>
              </dl>

              <section className="inventory-section">
                <div className="inventory-header">
                  <h3>Inventory</h3>
                  <span className="inventory-summary">
                    {totalSelectedItems} parsed item{totalSelectedItems === 1 ? '' : 's'} ({selectedPlayer.items.length} top-level)
                  </span>
                </div>
                <InventoryTree items={selectedPlayer.items} />
              </section>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
